"""
TrueNAS Fleet Monitor - FastAPI Backend
Receives metrics from n8n workflows and stores them for trending/analysis
"""

from fastapi import FastAPI, HTTPException, Depends, status, Request, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, timedelta, timezone
import sqlite3
import json
import os
import secrets

# Auth imports
import jwt
from jwt.exceptions import InvalidTokenError
import bcrypt

# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# JWT Configuration - REQUIRE secret key, no default
SECRET_KEY = os.environ.get("JWT_SECRET")
if not SECRET_KEY:
    # Generate a random key for development, but warn
    SECRET_KEY = secrets.token_urlsafe(32)
    print("WARNING: JWT_SECRET not set. Using random key - tokens will be invalid after restart!")
    print("Set JWT_SECRET environment variable for production.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 8  # Reduced from 24 to 8 hours

# Webhook API Key - optional but recommended
WEBHOOK_API_KEY = os.environ.get("WEBHOOK_API_KEY")
if not WEBHOOK_API_KEY:
    print("WARNING: WEBHOOK_API_KEY not set. Webhook endpoint is unprotected!")
    print("Set WEBHOOK_API_KEY environment variable for production.")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="TrueNAS Fleet Monitor", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS - configure allowed origins from environment
ALLOWED_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:8501").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Database setup
DB_PATH = os.environ.get("DB_PATH", "truenas_metrics.db")

from contextlib import contextmanager

@contextmanager
def get_db():
    """Context manager for database connections - ensures cleanup on error."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Systems table - tracks each TrueNAS instance
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS systems (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            hostname TEXT,
            version TEXT,
            last_seen TIMESTAMP,
            client_name TEXT
        )
    """)
    
    # Metrics table - time-series data
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            system_id TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metric_type TEXT NOT NULL,
            metric_name TEXT NOT NULL,
            value REAL,
            unit TEXT,
            metadata TEXT,
            FOREIGN KEY (system_id) REFERENCES systems(id)
        )
    """)
    
    # Alerts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            system_id TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            severity TEXT NOT NULL,
            message TEXT NOT NULL,
            acknowledged BOOLEAN DEFAULT FALSE,
            ticket_id TEXT,
            FOREIGN KEY (system_id) REFERENCES systems(id)
        )
    """)

    # Users table for authentication
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            full_name TEXT,
            role TEXT NOT NULL DEFAULT 'viewer',
            is_active BOOLEAN DEFAULT TRUE,
            must_change_password BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER,
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    """)

    # Add must_change_password column if it doesn't exist (migration)
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE")
    except sqlite3.OperationalError:
        pass  # Column already exists

    # Create indexes for performance
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_metrics_system_time ON metrics(system_id, timestamp)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_system ON alerts(system_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
    
    conn.commit()
    conn.close()

init_db()

# Pydantic models
class SystemInfo(BaseModel):
    id: str
    name: str
    hostname: Optional[str] = None
    version: Optional[str] = None
    client_name: Optional[str] = None

class MetricData(BaseModel):
    system_id: str
    metric_type: str  # pool, disk, cpu, memory, network
    metric_name: str  # e.g., "tank", "ada0", "usage"
    value: float
    unit: Optional[str] = None
    metadata: Optional[dict] = None

class AlertData(BaseModel):
    system_id: str
    severity: str  # critical, warning, info
    message: str

class WebhookPayload(BaseModel):
    """Payload expected from n8n webhook"""
    system: SystemInfo
    metrics: Optional[List[MetricData]] = []
    alerts: Optional[List[AlertData]] = []

class TicketCreate(BaseModel):
    alert_id: int
    psa: str  # autotask, halo, connectwise

# Auth Pydantic models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserBase(BaseModel):
    email: str  # Using str instead of EmailStr to allow .local domains
    full_name: Optional[str] = None
    role: str = "viewer"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

# Auth utility functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_user_by_email(email: str) -> Optional[dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    return dict(user) if user else None

def get_user_by_id(user_id: int) -> Optional[dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    return dict(user) if user else None

def authenticate_user(email: str, password: str) -> Optional[dict]:
    user = get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    if not user["is_active"]:
        return None
    return user

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception

    user = get_user_by_email(email)
    if user is None:
        raise credentials_exception
    if not user["is_active"]:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

async def get_current_active_user(current_user: dict = Depends(get_current_user)) -> dict:
    return current_user

def require_role(allowed_roles: List[str]):
    """Dependency factory for role-based access control"""
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

# Seed admin user if no users exist
def seed_admin_user():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users")
    count = cursor.fetchone()[0]
    if count == 0:
        # Create default admin user with must_change_password flag
        hashed = get_password_hash("admin")
        cursor.execute("""
            INSERT INTO users (email, hashed_password, full_name, role, is_active, must_change_password)
            VALUES (?, ?, ?, ?, ?, ?)
        """, ("admin@truenas-mon.local", hashed, "Administrator", "admin", True, True))
        conn.commit()
        print("Created default admin user: admin@truenas-mon.local / admin")
        print("WARNING: Default credentials! User must change password on first login.")
    conn.close()

# Seed admin user on startup
seed_admin_user()

# API Endpoints

@app.get("/health")
def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "ok", "service": "TrueNAS Fleet Monitor"}

# ==================== AUTH ENDPOINTS ====================

@app.post("/auth/login")
@limiter.limit("5/minute")  # Rate limit: 5 login attempts per minute per IP
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    """Login and receive JWT token"""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user["email"], "role": user["role"]}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "must_change_password": user.get("must_change_password", False)
    }

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user info"""
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        is_active=current_user["is_active"],
        created_at=current_user["created_at"]
    )

@app.post("/auth/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: dict = Depends(get_current_user)
):
    """Change the current user's password"""
    if not verify_password(password_data.current_password, current_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Validate new password strength
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )

    new_hash = get_password_hash(password_data.new_password)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Clear must_change_password flag when password is changed
    cursor.execute(
        "UPDATE users SET hashed_password = ?, must_change_password = FALSE WHERE id = ?",
        (new_hash, current_user["id"])
    )
    conn.commit()
    conn.close()

    return {"status": "ok", "message": "Password changed successfully"}

@app.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout the current user.

    Note: Since we use stateless JWTs, this endpoint just confirms logout.
    The client should discard the token. For true token revocation,
    implement a token blacklist in a future update.
    """
    return {"status": "ok", "message": "Logged out successfully"}

# ==================== USER MANAGEMENT ENDPOINTS ====================

@app.get("/users", response_model=List[UserResponse])
async def list_users(current_user: dict = Depends(require_role(["admin"]))):
    """List all users (admin only)"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users ORDER BY created_at DESC")
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return [
        UserResponse(
            id=u["id"],
            email=u["email"],
            full_name=u["full_name"],
            role=u["role"],
            is_active=u["is_active"],
            created_at=u["created_at"]
        )
        for u in users
    ]

@app.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Create a new user (admin only)"""
    # Check if email already exists
    existing = get_user_by_email(user_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Validate role
    if user_data.role not in ["admin", "operator", "viewer"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be admin, operator, or viewer"
        )

    hashed_password = get_password_hash(user_data.password)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO users (email, hashed_password, full_name, role, is_active, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        user_data.email,
        hashed_password,
        user_data.full_name,
        user_data.role,
        True,
        current_user["id"]
    ))
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()

    new_user = get_user_by_id(user_id)
    return UserResponse(
        id=new_user["id"],
        email=new_user["email"],
        full_name=new_user["full_name"],
        role=new_user["role"],
        is_active=new_user["is_active"],
        created_at=new_user["created_at"]
    )

@app.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Update a user (admin only)"""
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from deactivating themselves
    if user_id == current_user["id"] and user_data.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )

    # Build update query
    updates = []
    params = []

    if user_data.full_name is not None:
        updates.append("full_name = ?")
        params.append(user_data.full_name)

    if user_data.role is not None:
        if user_data.role not in ["admin", "operator", "viewer"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role"
            )
        # Prevent admin from demoting themselves
        if user_id == current_user["id"] and user_data.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change your own role"
            )
        updates.append("role = ?")
        params.append(user_data.role)

    if user_data.is_active is not None:
        updates.append("is_active = ?")
        params.append(user_data.is_active)

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    params.append(user_id)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
    conn.commit()
    conn.close()

    updated_user = get_user_by_id(user_id)
    return UserResponse(
        id=updated_user["id"],
        email=updated_user["email"],
        full_name=updated_user["full_name"],
        role=updated_user["role"],
        is_active=updated_user["is_active"],
        created_at=updated_user["created_at"]
    )

@app.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Deactivate a user (admin only) - soft delete"""
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_id == current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET is_active = FALSE WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

    return {"status": "ok", "message": "User deactivated"}

@app.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Reset a user's password to a temporary one (admin only)"""
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate a simple temporary password
    import secrets
    temp_password = secrets.token_urlsafe(8)
    hashed = get_password_hash(temp_password)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET hashed_password = ? WHERE id = ?", (hashed, user_id))
    conn.commit()
    conn.close()

    return {
        "status": "ok",
        "message": "Password reset successfully",
        "temporary_password": temp_password
    }

# ==================== WEBHOOK ENDPOINT ====================

def verify_webhook_api_key(x_api_key: Optional[str] = Header(None)):
    """Verify webhook API key if configured"""
    if WEBHOOK_API_KEY:
        if not x_api_key or x_api_key != WEBHOOK_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing API key"
            )
    return True

@app.post("/webhook/metrics")
def receive_metrics(
    payload: WebhookPayload,
    _: bool = Depends(verify_webhook_api_key)
):
    """Webhook endpoint for n8n to push TrueNAS metrics.

    Requires X-API-Key header if WEBHOOK_API_KEY environment variable is set.
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Upsert system
    cursor.execute("""
        INSERT INTO systems (id, name, hostname, version, last_seen, client_name)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            hostname = excluded.hostname,
            version = excluded.version,
            last_seen = excluded.last_seen,
            client_name = excluded.client_name
    """, (
        payload.system.id,
        payload.system.name,
        payload.system.hostname,
        payload.system.version,
        datetime.utcnow().isoformat(),
        payload.system.client_name
    ))
    
    # Insert metrics
    for metric in payload.metrics:
        cursor.execute("""
            INSERT INTO metrics (system_id, metric_type, metric_name, value, unit, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            metric.system_id,
            metric.metric_type,
            metric.metric_name,
            metric.value,
            metric.unit,
            json.dumps(metric.metadata) if metric.metadata else None
        ))
    
    # Insert alerts
    for alert in payload.alerts:
        cursor.execute("""
            INSERT INTO alerts (system_id, severity, message)
            VALUES (?, ?, ?)
        """, (alert.system_id, alert.severity, alert.message))
    
    conn.commit()
    conn.close()
    
    return {
        "status": "ok",
        "metrics_received": len(payload.metrics),
        "alerts_received": len(payload.alerts)
    }

@app.get("/systems")
def get_systems(current_user: dict = Depends(get_current_user)):
    """Get all monitored TrueNAS systems"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM systems ORDER BY name")
    systems = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return systems

@app.get("/systems/{system_id}/metrics")
def get_system_metrics(
    system_id: str,
    metric_type: Optional[str] = None,
    hours: int = Query(default=24, ge=1, le=8760, description="Hours of history (1-8760)"),
    current_user: dict = Depends(get_current_user)
):
    """Get metrics for a specific system"""
    with get_db() as conn:
        cursor = conn.cursor()

        query = """
            SELECT * FROM metrics
            WHERE system_id = ?
            AND timestamp > datetime('now', ?)
        """
        params = [system_id, f'-{hours} hours']

        if metric_type:
            query += " AND metric_type = ?"
            params.append(metric_type)

        query += " ORDER BY timestamp DESC"

        cursor.execute(query, params)
        metrics = [dict(row) for row in cursor.fetchall()]

        return metrics

@app.get("/alerts")
def get_alerts(acknowledged: Optional[bool] = None, current_user: dict = Depends(get_current_user)):
    """Get all alerts, optionally filtered by acknowledgment status"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    query = "SELECT a.*, s.name as system_name FROM alerts a JOIN systems s ON a.system_id = s.id"
    params = []
    
    if acknowledged is not None:
        query += " WHERE a.acknowledged = ?"
        params.append(acknowledged)
    
    query += " ORDER BY a.timestamp DESC"
    
    cursor.execute(query, params)
    alerts = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return alerts

@app.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, current_user: dict = Depends(require_role(["admin", "operator"]))):
    """Acknowledge an alert (admin/operator only)"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("UPDATE alerts SET acknowledged = TRUE WHERE id = ?", (alert_id,))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Alert not found")
    
    conn.commit()
    conn.close()
    return {"status": "ok", "alert_id": alert_id}

@app.post("/alerts/{alert_id}/create-ticket")
def create_ticket(alert_id: int, ticket: TicketCreate, current_user: dict = Depends(require_role(["admin", "operator"]))):
    """Create a PSA ticket for an alert (admin/operator only)"""
    # This is where PSA integration would go
    # For now, just return a mock ticket ID
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    mock_ticket_id = f"{ticket.psa.upper()}-{alert_id}-001"
    
    cursor.execute(
        "UPDATE alerts SET ticket_id = ?, acknowledged = TRUE WHERE id = ?",
        (mock_ticket_id, alert_id)
    )
    
    conn.commit()
    conn.close()
    
    return {
        "status": "ok",
        "ticket_id": mock_ticket_id,
        "psa": ticket.psa,
        "message": f"Ticket created in {ticket.psa} (mock)"
    }

@app.get("/systems/{system_id}/disks")
def get_system_disks(
    system_id: str,
    hours: int = Query(default=24, ge=1, le=8760, description="Hours of history (1-8760)"),
    current_user: dict = Depends(get_current_user)
):
    """Get disk metrics and SMART data for a specific system"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Get all disk metrics for this system
        cursor.execute("""
            SELECT * FROM metrics
            WHERE system_id = ?
            AND metric_type = 'disk'
            AND timestamp > datetime('now', ?)
            ORDER BY metric_name, timestamp DESC
        """, (system_id, f'-{hours} hours'))

        metrics = [dict(row) for row in cursor.fetchall()]

        # Parse metadata JSON
        for m in metrics:
            if m.get('metadata'):
                try:
                    m['metadata'] = json.loads(m['metadata'])
                except (json.JSONDecodeError, TypeError):
                    m['metadata'] = None

    # Group by disk and get latest values
    disks = {}
    for m in metrics:
        # Extract disk ID from metric name (e.g., "ada0_temperature" -> "ada0")
        parts = m['metric_name'].rsplit('_', 1)
        if len(parts) == 2:
            disk_id, attr = parts
        else:
            disk_id = m['metric_name']
            attr = 'value'

        if disk_id not in disks:
            disks[disk_id] = {
                'disk_id': disk_id,
                'system_id': system_id,
                'last_updated': m['timestamp'],
                'metrics': {},
                'history': []
            }

        # Store latest value for each attribute
        if attr not in disks[disk_id]['metrics']:
            disks[disk_id]['metrics'][attr] = {
                'value': m['value'],
                'unit': m['unit'],
                'timestamp': m['timestamp'],
                'metadata': m.get('metadata')
            }

        # Add to history for trending
        disks[disk_id]['history'].append({
            'attribute': attr,
            'value': m['value'],
            'timestamp': m['timestamp']
        })

    conn.close()
    return list(disks.values())


@app.get("/disks")
def get_all_disks(current_user: dict = Depends(get_current_user)):
    """Get latest disk status across all systems"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get latest disk metrics for each disk across all systems
    cursor.execute("""
        SELECT m.*, s.name as system_name, s.client_name
        FROM metrics m
        JOIN systems s ON m.system_id = s.id
        WHERE m.metric_type = 'disk'
        AND m.timestamp > datetime('now', '-24 hours')
        ORDER BY m.system_id, m.metric_name, m.timestamp DESC
    """)

    metrics = [dict(row) for row in cursor.fetchall()]

    # Group by system and disk
    systems_disks = {}
    for m in metrics:
        system_id = m['system_id']
        if system_id not in systems_disks:
            systems_disks[system_id] = {
                'system_id': system_id,
                'system_name': m['system_name'],
                'client_name': m['client_name'],
                'disks': {}
            }

        # Extract disk ID from metric name
        parts = m['metric_name'].rsplit('_', 1)
        if len(parts) == 2:
            disk_id, attr = parts
        else:
            disk_id = m['metric_name']
            attr = 'value'

        if disk_id not in systems_disks[system_id]['disks']:
            systems_disks[system_id]['disks'][disk_id] = {
                'disk_id': disk_id,
                'attributes': {}
            }

        # Store latest value for each attribute
        if attr not in systems_disks[system_id]['disks'][disk_id]['attributes']:
            metadata = None
            if m.get('metadata'):
                try:
                    metadata = json.loads(m['metadata'])
                except:
                    pass

            systems_disks[system_id]['disks'][disk_id]['attributes'][attr] = {
                'value': m['value'],
                'unit': m['unit'],
                'timestamp': m['timestamp'],
                'metadata': metadata
            }

    conn.close()
    return list(systems_disks.values())


@app.get("/disks/summary")
def get_disks_summary(current_user: dict = Depends(get_current_user)):
    """Get summary of disk health across all systems"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Count total disks (unique disk metric names in last 24h)
    cursor.execute("""
        SELECT COUNT(DISTINCT system_id || '_' ||
            SUBSTR(metric_name, 1, INSTR(metric_name || '_', '_') - 1))
        FROM metrics
        WHERE metric_type = 'disk'
        AND timestamp > datetime('now', '-24 hours')
    """)
    total_disks = cursor.fetchone()[0] or 0

    # Count disks with temperature warnings (>45C)
    cursor.execute("""
        SELECT COUNT(DISTINCT system_id || '_' || metric_name)
        FROM metrics
        WHERE metric_type = 'disk'
        AND metric_name LIKE '%_temperature'
        AND value > 45
        AND timestamp > datetime('now', '-1 hour')
    """)
    temp_warnings = cursor.fetchone()[0] or 0

    # Count disks with critical temperature (>55C)
    cursor.execute("""
        SELECT COUNT(DISTINCT system_id || '_' || metric_name)
        FROM metrics
        WHERE metric_type = 'disk'
        AND metric_name LIKE '%_temperature'
        AND value > 55
        AND timestamp > datetime('now', '-1 hour')
    """)
    temp_critical = cursor.fetchone()[0] or 0

    # Count disks with SMART failures (smart_status = 0 or FAIL)
    cursor.execute("""
        SELECT COUNT(DISTINCT system_id || '_' || metric_name)
        FROM metrics
        WHERE metric_type = 'disk'
        AND metric_name LIKE '%_smart_status'
        AND value = 0
        AND timestamp > datetime('now', '-24 hours')
    """)
    smart_failures = cursor.fetchone()[0] or 0

    # Get average temperature
    cursor.execute("""
        SELECT AVG(value)
        FROM metrics m1
        WHERE metric_type = 'disk'
        AND metric_name LIKE '%_temperature'
        AND timestamp = (
            SELECT MAX(timestamp) FROM metrics m2
            WHERE m2.system_id = m1.system_id
            AND m2.metric_name = m1.metric_name
        )
    """)
    avg_temp = cursor.fetchone()[0] or 0

    # Get hottest disk
    cursor.execute("""
        SELECT metric_name, value, system_id
        FROM metrics
        WHERE metric_type = 'disk'
        AND metric_name LIKE '%_temperature'
        AND timestamp > datetime('now', '-1 hour')
        ORDER BY value DESC
        LIMIT 1
    """)
    hottest = cursor.fetchone()
    hottest_disk = None
    if hottest:
        hottest_disk = {
            'disk': hottest[0].replace('_temperature', ''),
            'temperature': hottest[1],
            'system_id': hottest[2]
        }

    conn.close()

    return {
        'total_disks': total_disks,
        'healthy_disks': total_disks - temp_warnings - smart_failures,
        'warnings': temp_warnings,
        'critical': temp_critical + smart_failures,
        'smart_failures': smart_failures,
        'avg_temperature': round(avg_temp, 1) if avg_temp else None,
        'hottest_disk': hottest_disk
    }


@app.get("/systems/{system_id}/replication")
def get_system_replication(
    system_id: str,
    hours: int = Query(default=24, ge=1, le=8760, description="Hours of history (1-8760)"),
    current_user: dict = Depends(get_current_user)
):
    """Get replication task status for a specific system"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Get all replication metrics for this system
        cursor.execute("""
            SELECT * FROM metrics
            WHERE system_id = ?
            AND metric_type = 'replication'
            AND timestamp > datetime('now', ?)
            ORDER BY metric_name, timestamp DESC
        """, (system_id, f'-{hours} hours'))

    metrics = [dict(row) for row in cursor.fetchall()]

    # Parse metadata JSON
    for m in metrics:
        if m.get('metadata'):
            try:
                m['metadata'] = json.loads(m['metadata'])
            except (json.JSONDecodeError, TypeError):
                m['metadata'] = None

    # Group by task and get latest values
    tasks = {}
    for m in metrics:
        # Extract task ID from metric name (e.g., "tank-backup_status" -> "tank-backup")
        parts = m['metric_name'].rsplit('_', 1)
        if len(parts) == 2:
            task_id, attr = parts
        else:
            task_id = m['metric_name']
            attr = 'value'

        if task_id not in tasks:
            tasks[task_id] = {
                'task_id': task_id,
                'system_id': system_id,
                'last_updated': m['timestamp'],
                'metrics': {},
                'history': []
            }

        # Store latest value for each attribute
        if attr not in tasks[task_id]['metrics']:
            tasks[task_id]['metrics'][attr] = {
                'value': m['value'],
                'unit': m['unit'],
                'timestamp': m['timestamp'],
                'metadata': m.get('metadata')
            }

        # Add to history for trending
        tasks[task_id]['history'].append({
            'attribute': attr,
            'value': m['value'],
            'timestamp': m['timestamp']
        })

    conn.close()
    return list(tasks.values())


@app.get("/replication")
def get_all_replication(current_user: dict = Depends(get_current_user)):
    """Get latest replication status across all systems"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get latest replication metrics for each task across all systems
    cursor.execute("""
        SELECT m.*, s.name as system_name, s.client_name
        FROM metrics m
        JOIN systems s ON m.system_id = s.id
        WHERE m.metric_type = 'replication'
        AND m.timestamp > datetime('now', '-24 hours')
        ORDER BY m.system_id, m.metric_name, m.timestamp DESC
    """)

    metrics = [dict(row) for row in cursor.fetchall()]

    # Group by system and task
    systems_replication = {}
    for m in metrics:
        system_id = m['system_id']
        if system_id not in systems_replication:
            systems_replication[system_id] = {
                'system_id': system_id,
                'system_name': m['system_name'],
                'client_name': m['client_name'],
                'tasks': {}
            }

        # Extract task ID from metric name
        parts = m['metric_name'].rsplit('_', 1)
        if len(parts) == 2:
            task_id, attr = parts
        else:
            task_id = m['metric_name']
            attr = 'value'

        if task_id not in systems_replication[system_id]['tasks']:
            systems_replication[system_id]['tasks'][task_id] = {
                'task_id': task_id,
                'attributes': {}
            }

        # Store latest value for each attribute
        if attr not in systems_replication[system_id]['tasks'][task_id]['attributes']:
            metadata = None
            if m.get('metadata'):
                try:
                    metadata = json.loads(m['metadata'])
                except:
                    pass

            systems_replication[system_id]['tasks'][task_id]['attributes'][attr] = {
                'value': m['value'],
                'unit': m['unit'],
                'timestamp': m['timestamp'],
                'metadata': metadata
            }

    conn.close()
    return list(systems_replication.values())


@app.get("/replication/summary")
def get_replication_summary(current_user: dict = Depends(get_current_user)):
    """Get summary of replication health across all systems"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Count total replication tasks (unique task names in last 24h)
    cursor.execute("""
        SELECT COUNT(DISTINCT system_id || '_' ||
            SUBSTR(metric_name, 1, LENGTH(metric_name) - LENGTH('_status')))
        FROM metrics
        WHERE metric_type = 'replication'
        AND metric_name LIKE '%_status'
        AND timestamp > datetime('now', '-24 hours')
    """)
    total_tasks = cursor.fetchone()[0] or 0

    # Count failed tasks (status = 0)
    cursor.execute("""
        SELECT COUNT(DISTINCT system_id || '_' || metric_name)
        FROM metrics
        WHERE metric_type = 'replication'
        AND metric_name LIKE '%_status'
        AND value = 0
        AND timestamp > datetime('now', '-24 hours')
    """)
    failed_tasks = cursor.fetchone()[0] or 0

    # Count stale tasks (last_run older than 24 hours)
    # We check if the latest last_run timestamp is older than 24 hours ago
    cursor.execute("""
        SELECT COUNT(DISTINCT system_id || '_' ||
            SUBSTR(metric_name, 1, LENGTH(metric_name) - LENGTH('_last_run')))
        FROM metrics m1
        WHERE metric_type = 'replication'
        AND metric_name LIKE '%_last_run'
        AND timestamp = (
            SELECT MAX(timestamp) FROM metrics m2
            WHERE m2.system_id = m1.system_id
            AND m2.metric_name = m1.metric_name
        )
        AND value < strftime('%s', 'now', '-24 hours')
    """)
    stale_tasks = cursor.fetchone()[0] or 0

    # Get last successful replication (most recent)
    cursor.execute("""
        SELECT metric_name, value, system_id, timestamp
        FROM metrics
        WHERE metric_type = 'replication'
        AND metric_name LIKE '%_status'
        AND value = 2
        AND timestamp > datetime('now', '-7 days')
        ORDER BY timestamp DESC
        LIMIT 1
    """)
    last_success_row = cursor.fetchone()
    last_success = last_success_row[3] if last_success_row else None

    # Get oldest stale task
    cursor.execute("""
        SELECT metric_name, value, system_id
        FROM metrics m1
        WHERE metric_type = 'replication'
        AND metric_name LIKE '%_last_run'
        AND timestamp = (
            SELECT MAX(timestamp) FROM metrics m2
            WHERE m2.system_id = m1.system_id
            AND m2.metric_name = m1.metric_name
        )
        AND value < strftime('%s', 'now', '-24 hours')
        ORDER BY value ASC
        LIMIT 1
    """)
    oldest_stale_row = cursor.fetchone()
    oldest_stale = None
    if oldest_stale_row:
        import time
        hours_ago = (time.time() - oldest_stale_row[1]) / 3600
        oldest_stale = {
            'task': oldest_stale_row[0].replace('_last_run', ''),
            'system_id': oldest_stale_row[2],
            'hours_ago': round(hours_ago, 1)
        }

    conn.close()

    healthy_tasks = total_tasks - failed_tasks - stale_tasks
    if healthy_tasks < 0:
        healthy_tasks = 0

    return {
        'total_tasks': total_tasks,
        'healthy_tasks': healthy_tasks,
        'failed_tasks': failed_tasks,
        'stale_tasks': stale_tasks,
        'last_success': last_success,
        'oldest_stale': oldest_stale
    }


@app.get("/systems/{system_id}/pools")
def get_system_pools(system_id: str, current_user: dict = Depends(get_current_user)):
    """Get pool health data for a specific system"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get all pool metrics for this system (both 'pool' and 'pool_health' types)
    cursor.execute("""
        SELECT * FROM metrics
        WHERE system_id = ?
        AND metric_type IN ('pool', 'pool_health')
        AND timestamp > datetime('now', '-24 hours')
        ORDER BY metric_name, timestamp DESC
    """, (system_id,))

    metrics = [dict(row) for row in cursor.fetchall()]

    # Parse metadata JSON
    for m in metrics:
        if m.get('metadata'):
            try:
                m['metadata'] = json.loads(m['metadata'])
            except (json.JSONDecodeError, TypeError):
                m['metadata'] = None

    # Group by pool name and get latest values
    pools = {}
    for m in metrics:
        # Extract pool name from metric name (e.g., "tank_used" -> "tank", "tank_scrub_status" -> "tank")
        parts = m['metric_name'].split('_', 1)
        if len(parts) >= 1:
            pool_name = parts[0]
            attr = parts[1] if len(parts) > 1 else 'value'
        else:
            pool_name = m['metric_name']
            attr = 'value'

        if pool_name not in pools:
            pools[pool_name] = {
                'pool_name': pool_name,
                'system_id': system_id,
                'last_updated': m['timestamp'],
                'metrics': {},
                'history': []
            }

        # Store latest value for each attribute
        if attr not in pools[pool_name]['metrics']:
            pools[pool_name]['metrics'][attr] = {
                'value': m['value'],
                'unit': m['unit'],
                'timestamp': m['timestamp'],
                'metadata': m.get('metadata')
            }

        # Add to history for trending
        pools[pool_name]['history'].append({
            'attribute': attr,
            'value': m['value'],
            'timestamp': m['timestamp']
        })

    conn.close()
    return list(pools.values())


@app.get("/pools")
def get_all_pools(current_user: dict = Depends(get_current_user)):
    """Get latest pool health status across all systems"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get latest pool metrics for each pool across all systems
    cursor.execute("""
        SELECT m.*, s.name as system_name, s.client_name
        FROM metrics m
        JOIN systems s ON m.system_id = s.id
        WHERE m.metric_type IN ('pool', 'pool_health')
        AND m.timestamp > datetime('now', '-24 hours')
        ORDER BY m.system_id, m.metric_name, m.timestamp DESC
    """)

    metrics = [dict(row) for row in cursor.fetchall()]

    # Group by system and pool
    systems_pools = {}
    for m in metrics:
        system_id = m['system_id']
        if system_id not in systems_pools:
            systems_pools[system_id] = {
                'system_id': system_id,
                'system_name': m['system_name'],
                'client_name': m['client_name'],
                'pools': {}
            }

        # Extract pool name from metric name
        parts = m['metric_name'].split('_', 1)
        if len(parts) >= 1:
            pool_name = parts[0]
            attr = parts[1] if len(parts) > 1 else 'value'
        else:
            pool_name = m['metric_name']
            attr = 'value'

        if pool_name not in systems_pools[system_id]['pools']:
            systems_pools[system_id]['pools'][pool_name] = {
                'pool_name': pool_name,
                'attributes': {}
            }

        # Store latest value for each attribute
        if attr not in systems_pools[system_id]['pools'][pool_name]['attributes']:
            metadata = None
            if m.get('metadata'):
                try:
                    metadata = json.loads(m['metadata'])
                except:
                    pass

            systems_pools[system_id]['pools'][pool_name]['attributes'][attr] = {
                'value': m['value'],
                'unit': m['unit'],
                'timestamp': m['timestamp'],
                'metadata': metadata
            }

    conn.close()
    return list(systems_pools.values())


@app.get("/pools/summary")
def get_pools_summary(current_user: dict = Depends(get_current_user)):
    """Get summary of pool health across all systems"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Count total unique pools (by pool name prefix in last 24h)
    cursor.execute("""
        SELECT COUNT(DISTINCT system_id || '_' ||
            SUBSTR(metric_name, 1, INSTR(metric_name || '_', '_') - 1))
        FROM metrics
        WHERE metric_type IN ('pool', 'pool_health')
        AND metric_name LIKE '%_total'
        AND timestamp > datetime('now', '-24 hours')
    """)
    total_pools = cursor.fetchone()[0] or 0

    # Count degraded pools (state = 0)
    cursor.execute("""
        SELECT COUNT(DISTINCT system_id || '_' || metric_name)
        FROM metrics
        WHERE metric_type = 'pool_health'
        AND metric_name LIKE '%_state'
        AND value = 0
        AND timestamp > datetime('now', '-24 hours')
    """)
    degraded_pools = cursor.fetchone()[0] or 0

    # Count pools needing scrub (scrub_last older than 7 days)
    import time
    seven_days_ago = time.time() - (7 * 24 * 3600)
    cursor.execute("""
        SELECT COUNT(DISTINCT system_id || '_' ||
            SUBSTR(metric_name, 1, LENGTH(metric_name) - LENGTH('_scrub_last')))
        FROM metrics m1
        WHERE metric_type = 'pool_health'
        AND metric_name LIKE '%_scrub_last'
        AND timestamp = (
            SELECT MAX(timestamp) FROM metrics m2
            WHERE m2.system_id = m1.system_id
            AND m2.metric_name = m1.metric_name
        )
        AND value < ?
    """, (seven_days_ago,))
    needs_scrub = cursor.fetchone()[0] or 0

    # Count active resilvers
    cursor.execute("""
        SELECT COUNT(DISTINCT system_id || '_' || metric_name)
        FROM metrics
        WHERE metric_type = 'pool_health'
        AND metric_name LIKE '%_resilver_status'
        AND value = 1
        AND timestamp > datetime('now', '-1 hour')
    """)
    active_resilvers = cursor.fetchone()[0] or 0

    # Count capacity warnings (>80% used)
    cursor.execute("""
        SELECT COUNT(*)
        FROM (
            SELECT system_id,
                SUBSTR(metric_name, 1, INSTR(metric_name || '_', '_') - 1) as pool_name
            FROM metrics
            WHERE metric_type = 'pool'
            AND metric_name LIKE '%_used'
            AND timestamp > datetime('now', '-1 hour')
            GROUP BY system_id, pool_name
            HAVING (
                SELECT m2.value FROM metrics m2
                WHERE m2.system_id = metrics.system_id
                AND m2.metric_name = pool_name || '_used'
                ORDER BY m2.timestamp DESC LIMIT 1
            ) / (
                SELECT m3.value FROM metrics m3
                WHERE m3.system_id = metrics.system_id
                AND m3.metric_name = pool_name || '_total'
                ORDER BY m3.timestamp DESC LIMIT 1
            ) > 0.8
        )
    """)
    capacity_warnings = cursor.fetchone()[0] or 0

    # Get total capacity
    cursor.execute("""
        SELECT SUM(value) FROM metrics m1
        WHERE metric_type = 'pool' AND metric_name LIKE '%_total'
        AND timestamp = (
            SELECT MAX(timestamp) FROM metrics m2
            WHERE m2.system_id = m1.system_id AND m2.metric_type = 'pool'
        )
    """)
    total_capacity_result = cursor.fetchone()[0]
    total_capacity_tb = (total_capacity_result / 1024) if total_capacity_result else 0

    # Get used capacity
    cursor.execute("""
        SELECT SUM(value) FROM metrics m1
        WHERE metric_type = 'pool' AND metric_name LIKE '%_used'
        AND timestamp = (
            SELECT MAX(timestamp) FROM metrics m2
            WHERE m2.system_id = m1.system_id AND m2.metric_type = 'pool'
        )
    """)
    used_capacity_result = cursor.fetchone()[0]
    used_capacity_tb = (used_capacity_result / 1024) if used_capacity_result else 0

    conn.close()

    healthy_pools = total_pools - degraded_pools - needs_scrub
    if healthy_pools < 0:
        healthy_pools = 0

    return {
        'total_pools': total_pools,
        'healthy_pools': healthy_pools,
        'degraded_pools': degraded_pools,
        'needs_scrub': needs_scrub,
        'active_resilvers': active_resilvers,
        'capacity_warnings': capacity_warnings,
        'total_capacity_tb': round(total_capacity_tb, 2),
        'used_capacity_tb': round(used_capacity_tb, 2)
    }


@app.get("/dashboard/summary")
def get_dashboard_summary(current_user: dict = Depends(get_current_user)):
    """Get summary stats for dashboard"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Total systems
    cursor.execute("SELECT COUNT(*) FROM systems")
    total_systems = cursor.fetchone()[0]
    
    # Systems seen in last hour
    cursor.execute("""
        SELECT COUNT(*) FROM systems 
        WHERE last_seen > datetime('now', '-1 hour')
    """)
    healthy_systems = cursor.fetchone()[0]
    
    # Unacknowledged alerts by severity
    cursor.execute("""
        SELECT severity, COUNT(*) FROM alerts 
        WHERE acknowledged = FALSE 
        GROUP BY severity
    """)
    alerts_by_severity = dict(cursor.fetchall())
    
    # Total storage across all systems (latest reading per system)
    cursor.execute("""
        SELECT SUM(value) FROM metrics m1
        WHERE metric_type = 'pool' AND metric_name LIKE '%_total'
        AND timestamp = (
            SELECT MAX(timestamp) FROM metrics m2 
            WHERE m2.system_id = m1.system_id AND m2.metric_type = 'pool'
        )
    """)
    result = cursor.fetchone()[0]
    total_storage_tb = result / 1024 if result else 0
    
    conn.close()
    
    return {
        "total_systems": total_systems,
        "healthy_systems": healthy_systems,
        "stale_systems": total_systems - healthy_systems,
        "alerts": {
            "critical": alerts_by_severity.get("critical", 0),
            "warning": alerts_by_severity.get("warning", 0),
            "info": alerts_by_severity.get("info", 0)
        },
        "total_storage_tb": round(total_storage_tb, 2)
    }


# Serve static frontend files in production (Docker)
FRONTEND_DIR = Path(__file__).parent / "frontend" / "dist"
if FRONTEND_DIR.exists():
    # Serve static assets
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")

    # Serve index.html for root path
    @app.get("/")
    async def serve_frontend_root():
        index_file = FRONTEND_DIR / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend not found")

    # Serve index.html for all non-API routes (SPA support)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Don't serve frontend for API routes
        if full_path.startswith(("auth/", "users", "systems", "alerts", "disks", "pools", "replication", "dashboard", "webhook", "health")):
            raise HTTPException(status_code=404, detail="Not found")

        # Serve index.html for SPA routing
        index_file = FRONTEND_DIR / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend not found")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
