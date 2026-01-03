"""
TrueNAS Fleet Monitor - Streamlit Dashboard
Visualization layer for fleet health, trending, and alerts
"""

import streamlit as st
import requests
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta

# Config
API_URL = "http://localhost:8000"

st.set_page_config(
    page_title="TrueNAS Fleet Monitor",
    page_icon="💾",
    layout="wide"
)

# Custom CSS
st.markdown("""
<style>
    .metric-card {
        background-color: #1e1e1e;
        border-radius: 10px;
        padding: 20px;
        text-align: center;
    }
    .alert-critical { border-left: 4px solid #ff4444; padding-left: 10px; }
    .alert-warning { border-left: 4px solid #ffaa00; padding-left: 10px; }
    .alert-info { border-left: 4px solid #4444ff; padding-left: 10px; }
</style>
""", unsafe_allow_html=True)

def get_api(endpoint):
    """Helper to call API"""
    try:
        resp = requests.get(f"{API_URL}{endpoint}", timeout=5)
        resp.raise_for_status()
        return resp.json()
    except:
        return None

def post_api(endpoint, data=None):
    """Helper for POST requests"""
    try:
        resp = requests.post(f"{API_URL}{endpoint}", json=data, timeout=5)
        resp.raise_for_status()
        return resp.json()
    except:
        return None

# Header
st.title("💾 TrueNAS Fleet Monitor")
st.caption("Real-time monitoring for your TrueNAS infrastructure")

# Check API connection
api_status = get_api("/")
if not api_status:
    st.error("⚠️ Cannot connect to backend API. Make sure it's running on localhost:8000")
    st.code("uvicorn backend:app --reload", language="bash")
    st.stop()

# Sidebar
st.sidebar.title("Navigation")
page = st.sidebar.radio("", ["Dashboard", "Systems", "Alerts", "Trending", "Settings"])

if page == "Dashboard":
    # Summary metrics
    summary = get_api("/dashboard/summary")
    
    if summary:
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric(
                "Total Systems",
                summary["total_systems"],
                delta=None
            )
        
        with col2:
            healthy = summary["healthy_systems"]
            total = summary["total_systems"]
            delta_color = "normal" if healthy == total else "inverse"
            st.metric(
                "Healthy",
                healthy,
                delta=f"{summary['stale_systems']} stale" if summary['stale_systems'] > 0 else None,
                delta_color="inverse" if summary['stale_systems'] > 0 else "off"
            )
        
        with col3:
            critical = summary["alerts"]["critical"]
            warning = summary["alerts"]["warning"]
            st.metric(
                "Active Alerts",
                critical + warning,
                delta=f"{critical} critical" if critical > 0 else None,
                delta_color="inverse" if critical > 0 else "off"
            )
        
        with col4:
            st.metric(
                "Total Storage",
                f"{summary['total_storage_tb']} TB"
            )
    
    st.divider()
    
    # Systems overview
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader("Systems Overview")
        systems = get_api("/systems")
        
        if systems:
            for system in systems:
                last_seen = datetime.fromisoformat(system["last_seen"]) if system["last_seen"] else None
                is_stale = False
                if last_seen:
                    is_stale = (datetime.utcnow() - last_seen) > timedelta(hours=1)
                
                status_icon = "🟢" if not is_stale else "🔴"
                
                with st.container():
                    cols = st.columns([0.5, 2, 2, 2, 1])
                    cols[0].write(status_icon)
                    cols[1].write(f"**{system['name']}**")
                    cols[2].write(system['hostname'] or "—")
                    cols[3].write(system['client_name'] or "—")
                    cols[4].write(system['version'] or "—")
        else:
            st.info("No systems registered yet. Send data via the webhook endpoint.")
    
    with col2:
        st.subheader("Recent Alerts")
        alerts = get_api("/alerts?acknowledged=false")
        
        if alerts:
            for alert in alerts[:5]:
                severity_color = {
                    "critical": "🔴",
                    "warning": "🟡",
                    "info": "🔵"
                }.get(alert["severity"], "⚪")
                
                st.markdown(f"{severity_color} **{alert['system_name']}**")
                st.caption(alert["message"][:100])
                st.divider()
        else:
            st.success("No active alerts!")

elif page == "Systems":
    st.subheader("TrueNAS Systems")
    
    systems = get_api("/systems")
    
    if systems:
        # System selector
        system_names = {s["id"]: s["name"] for s in systems}
        selected_id = st.selectbox(
            "Select System",
            options=list(system_names.keys()),
            format_func=lambda x: system_names[x]
        )
        
        if selected_id:
            system = next(s for s in systems if s["id"] == selected_id)
            
            col1, col2, col3 = st.columns(3)
            col1.metric("Hostname", system["hostname"] or "—")
            col2.metric("Version", system["version"] or "—")
            col3.metric("Client", system["client_name"] or "—")
            
            st.divider()
            
            # Metrics for this system
            metrics = get_api(f"/systems/{selected_id}/metrics?hours=24")
            
            if metrics:
                df = pd.DataFrame(metrics)
                
                # Pool metrics
                pool_metrics = df[df["metric_type"] == "pool"]
                if not pool_metrics.empty:
                    st.subheader("Storage Pools")
                    
                    # Get unique pool names
                    pool_names = pool_metrics["metric_name"].str.replace("_used", "").str.replace("_total", "").unique()
                    
                    for pool in pool_names:
                        used = pool_metrics[pool_metrics["metric_name"] == f"{pool}_used"]["value"].iloc[-1] if f"{pool}_used" in pool_metrics["metric_name"].values else 0
                        total = pool_metrics[pool_metrics["metric_name"] == f"{pool}_total"]["value"].iloc[-1] if f"{pool}_total" in pool_metrics["metric_name"].values else 1
                        pct = (used / total * 100) if total > 0 else 0
                        
                        st.write(f"**{pool}**")
                        st.progress(min(pct / 100, 1.0))
                        st.caption(f"{used:.1f} GB / {total:.1f} GB ({pct:.1f}%)")
            else:
                st.info("No metrics available for this system yet.")
    else:
        st.info("No systems registered yet.")

elif page == "Alerts":
    st.subheader("Alert Management")
    
    col1, col2 = st.columns([3, 1])
    with col2:
        show_acked = st.checkbox("Show acknowledged", value=False)
    
    alerts = get_api(f"/alerts?acknowledged={str(show_acked).lower()}")
    
    if alerts:
        for alert in alerts:
            severity_colors = {
                "critical": "#ff4444",
                "warning": "#ffaa00",
                "info": "#4444ff"
            }
            color = severity_colors.get(alert["severity"], "#888888")
            
            with st.container():
                cols = st.columns([0.5, 2, 3, 2, 1.5])
                
                severity_icon = {"critical": "🔴", "warning": "🟡", "info": "🔵"}.get(alert["severity"], "⚪")
                cols[0].write(severity_icon)
                cols[1].write(f"**{alert['system_name']}**")
                cols[2].write(alert["message"])
                cols[3].write(alert["timestamp"][:16] if alert["timestamp"] else "—")
                
                if not alert["acknowledged"]:
                    if cols[4].button("Ack", key=f"ack_{alert['id']}"):
                        post_api(f"/alerts/{alert['id']}/acknowledge")
                        st.rerun()
                else:
                    cols[4].write("✓")
                
                st.divider()
    else:
        st.success("No alerts to show!")

elif page == "Trending":
    st.subheader("Storage Trending & Capacity Planning")
    
    systems = get_api("/systems")
    
    if systems:
        system_names = {s["id"]: s["name"] for s in systems}
        selected_id = st.selectbox(
            "Select System",
            options=list(system_names.keys()),
            format_func=lambda x: system_names[x]
        )
        
        hours = st.slider("Time Range (hours)", 1, 168, 24)
        
        if selected_id:
            metrics = get_api(f"/systems/{selected_id}/metrics?metric_type=pool&hours={hours}")
            
            if metrics:
                df = pd.DataFrame(metrics)
                df["timestamp"] = pd.to_datetime(df["timestamp"])
                
                # Filter to just _used metrics for trending
                used_df = df[df["metric_name"].str.endswith("_used")]
                
                if not used_df.empty:
                    fig = px.line(
                        used_df,
                        x="timestamp",
                        y="value",
                        color="metric_name",
                        title="Storage Usage Over Time",
                        labels={"value": "GB Used", "timestamp": "Time", "metric_name": "Pool"}
                    )
                    fig.update_layout(
                        template="plotly_dark",
                        height=400
                    )
                    st.plotly_chart(fig, use_container_width=True)
                    
                    # Capacity projection
                    st.subheader("Capacity Projection")
                    st.info("📊 With more historical data, this section will show predicted time to full capacity based on growth trends.")
                else:
                    st.info("No storage metrics available for trending.")
            else:
                st.info("No metrics available for the selected time range.")
    else:
        st.info("No systems registered yet.")

elif page == "Settings":
    st.subheader("Settings & Integration")
    
    st.write("### Webhook Endpoint")
    st.code(f"POST {API_URL}/webhook/metrics", language="text")
    st.caption("Configure your n8n workflow to send TrueNAS metrics to this endpoint.")
    
    st.divider()
    
    st.write("### PSA Integration")
    st.info("🔧 PSA integrations coming soon!")
    
    psa = st.selectbox("PSA Platform", ["Autotask", "Halo PSA", "ConnectWise Manage"])
    
    if psa == "Autotask":
        st.text_input("API Username", placeholder="your-api-user@company.com")
        st.text_input("API Secret", type="password")
        st.text_input("Integration Code")
    elif psa == "Halo PSA":
        st.text_input("Client ID")
        st.text_input("Client Secret", type="password")
        st.text_input("Tenant")
    else:
        st.text_input("Company ID")
        st.text_input("Public Key")
        st.text_input("Private Key", type="password")
    
    st.button("Save Configuration", disabled=True)
    
    st.divider()
    
    st.write("### Alert Thresholds")
    col1, col2 = st.columns(2)
    with col1:
        st.slider("Storage Warning (%)", 0, 100, 80)
        st.slider("Storage Critical (%)", 0, 100, 90)
    with col2:
        st.slider("System Stale After (minutes)", 5, 120, 60)

# Footer
st.sidebar.divider()
st.sidebar.caption("TrueNAS Fleet Monitor v0.1.0")
st.sidebar.caption("Built for MSPs • Open Source")
