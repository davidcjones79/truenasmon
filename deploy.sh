#!/bin/bash
#
# TrueNAS Mon - Deployment Script
# Run this on a fresh Ubuntu 22.04/24.04 VM
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/davidcjones79/truenasmon/main/deploy.sh | bash
#   OR
#   wget -qO- https://raw.githubusercontent.com/davidcjones79/truenasmon/main/deploy.sh | bash
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "========================================"
echo "   TrueNAS Mon - Deployment Script"
echo "========================================"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}Warning: Running as root. Consider using a regular user with sudo.${NC}"
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    echo -e "${RED}Cannot detect OS. This script is designed for Ubuntu.${NC}"
    exit 1
fi

echo -e "${GREEN}Detected: $OS $VER${NC}"

# Check if Ubuntu
if [[ "$OS" != *"Ubuntu"* ]]; then
    echo -e "${YELLOW}Warning: This script is designed for Ubuntu. Proceed with caution.${NC}"
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to run command with sudo if needed
run_privileged() {
    if [ "$EUID" -eq 0 ]; then
        "$@"
    elif command_exists sudo; then
        sudo "$@"
    else
        echo -e "${RED}Error: Need root privileges. Run as root or install sudo.${NC}"
        exit 1
    fi
}

# Install Docker if not present
install_docker() {
    if command_exists docker; then
        echo -e "${GREEN}Docker is already installed.${NC}"
        docker --version
    else
        echo -e "${BLUE}Installing Docker...${NC}"
        curl -fsSL https://get.docker.com | run_privileged sh
        # Add user to docker group (skip if root)
        if [ "$EUID" -ne 0 ]; then
            run_privileged usermod -aG docker $USER
        fi
        echo -e "${GREEN}Docker installed successfully.${NC}"
    fi
}

# Install Docker Compose if not present
install_docker_compose() {
    if docker compose version >/dev/null 2>&1; then
        echo -e "${GREEN}Docker Compose is already installed.${NC}"
        docker compose version
    else
        echo -e "${BLUE}Installing Docker Compose...${NC}"
        run_privileged apt-get update
        run_privileged apt-get install -y docker-compose-plugin
        echo -e "${GREEN}Docker Compose installed successfully.${NC}"
    fi
}

# Clone or update repository
setup_repo() {
    INSTALL_DIR="$HOME/truenasmon"

    if [ -d "$INSTALL_DIR" ]; then
        echo -e "${YELLOW}Directory $INSTALL_DIR already exists.${NC}"
        read -p "Update existing installation? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cd "$INSTALL_DIR"
            git pull
        else
            echo -e "${RED}Aborting.${NC}"
            exit 1
        fi
    else
        echo -e "${BLUE}Cloning TrueNAS Mon...${NC}"
        git clone https://github.com/davidcjones79/truenasmon.git "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi

    echo -e "${GREEN}Repository ready at $INSTALL_DIR${NC}"
}

# Setup environment variables
setup_env() {
    cd "$HOME/truenasmon"

    if [ -f .env ]; then
        echo -e "${YELLOW}.env file already exists.${NC}"
        read -p "Overwrite with new secrets? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Keeping existing .env file."
            return
        fi
    fi

    echo -e "${BLUE}Generating secure secrets...${NC}"

    # Generate secrets
    JWT_SECRET=$(openssl rand -base64 32)
    WEBHOOK_API_KEY=$(openssl rand -base64 24)

    # Get server IP
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

    # Create .env file
    cat > .env << EOF
# TrueNAS Mon - Environment Configuration
# Generated on $(date)

# JWT Secret Key (required)
JWT_SECRET=$JWT_SECRET

# Webhook API Key (required for n8n integration)
WEBHOOK_API_KEY=$WEBHOOK_API_KEY

# CORS Origins (add your domain if using a reverse proxy)
CORS_ORIGINS=http://localhost:8000,http://$SERVER_IP:8000

# Database path (inside container)
DB_PATH=/data/truenas_metrics.db
EOF

    echo -e "${GREEN}Environment configured.${NC}"
    echo -e "${YELLOW}Webhook API Key: $WEBHOOK_API_KEY${NC}"
    echo -e "${YELLOW}(Save this - you'll need it for n8n integration)${NC}"
}

# Build and run
deploy_app() {
    cd "$HOME/truenasmon"

    echo -e "${BLUE}Building and starting TrueNAS Mon...${NC}"
    echo "(This may take a few minutes on first run)"

    # Use privileged command if not root and not in docker group
    if [ "$EUID" -eq 0 ] || groups | grep -q docker; then
        docker compose up -d --build
    else
        run_privileged docker compose up -d --build
    fi

    echo -e "${GREEN}TrueNAS Mon is starting...${NC}"

    # Wait for container to be healthy
    echo "Waiting for application to be ready..."
    sleep 10

    # Check if running
    if docker compose ps | grep -q "running"; then
        echo -e "${GREEN}Application is running!${NC}"
    else
        echo -e "${RED}Application may not have started correctly.${NC}"
        echo "Check logs with: docker compose logs"
    fi
}

# Generate demo data
generate_demo_data() {
    read -p "Generate demo data? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Generating demo data...${NC}"
        cd "$HOME/truenasmon"

        if [ "$EUID" -eq 0 ] || groups | grep -q docker; then
            docker compose exec -T truenas-mon python generate_mock_data.py
        else
            run_privileged docker compose exec -T truenas-mon python generate_mock_data.py
        fi

        echo -e "${GREEN}Demo data generated!${NC}"
    fi
}

# Print summary
print_summary() {
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

    echo ""
    echo -e "${GREEN}========================================"
    echo "   Deployment Complete!"
    echo "========================================${NC}"
    echo ""
    echo -e "Access the dashboard at:"
    echo -e "  ${BLUE}http://$SERVER_IP:8000${NC}"
    echo ""
    echo -e "Default login:"
    echo -e "  Email:    ${YELLOW}admin@truenas-mon.local${NC}"
    echo -e "  Password: ${YELLOW}admin${NC}"
    echo -e "  ${RED}(You will be required to change this)${NC}"
    echo ""
    echo -e "Webhook endpoint for n8n:"
    echo -e "  ${BLUE}http://$SERVER_IP:8000/webhook/metrics${NC}"
    echo -e "  Header: ${YELLOW}X-API-Key: <your-webhook-api-key>${NC}"
    echo ""
    echo -e "Useful commands:"
    echo -e "  cd ~/truenasmon"
    echo -e "  docker compose logs -f     # View logs"
    echo -e "  docker compose restart     # Restart app"
    echo -e "  docker compose down        # Stop app"
    echo ""
    echo -e "${GREEN}Enjoy TrueNAS Mon!${NC}"
}

# Main installation flow
main() {
    echo -e "${BLUE}Step 1/5: Installing Docker...${NC}"
    install_docker

    echo ""
    echo -e "${BLUE}Step 2/5: Installing Docker Compose...${NC}"
    install_docker_compose

    echo ""
    echo -e "${BLUE}Step 3/5: Setting up repository...${NC}"
    setup_repo

    echo ""
    echo -e "${BLUE}Step 4/5: Configuring environment...${NC}"
    setup_env

    echo ""
    echo -e "${BLUE}Step 5/5: Deploying application...${NC}"
    deploy_app

    echo ""
    generate_demo_data

    print_summary
}

# Run main function
main
