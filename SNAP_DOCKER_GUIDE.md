# 🐳 Snap Docker Quick Guide

## Issue: Permission Denied with Snap Docker

If you installed Docker via Snap (Ubuntu's default), you'll encounter permission issues because Snap Docker runs in a confined environment.

## Quick Solutions

### Option 1: Use sudo (Easiest for Snap)

```bash
# Start services
sudo docker compose up --build -d

# View logs
sudo docker compose logs -f

# Stop services
sudo docker compose down

# Or use the helper script
./docker-snap-start.sh
```

### Option 2: Fix Socket Permissions (Temporary)

This works until reboot:

```bash
sudo chmod 666 /var/run/docker.sock
docker compose up --build -d
```

### Option 3: Switch to Official Docker (Recommended)

For the best experience without sudo:

```bash
# 1. Remove Snap Docker
sudo snap remove docker

# 2. Install official Docker
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 3. Add user to docker group
sudo usermod -aG docker $USER

# 4. Log out and log back in

# 5. Now you can use Docker without sudo!
docker compose up --build -d
```

## Why This Happens

Snap Docker:
- Runs in a confined environment
- Socket owned by root:root
- Requires sudo for most operations
- Limited filesystem access

Official Docker:
- Creates a `docker` group
- Users in docker group can run without sudo
- Full filesystem access
- Better integration with docker-compose

## Recommendation

**Switch to official Docker** for the best experience. It takes 5 minutes and eliminates all permission issues.

## Quick Start with Snap Docker

If you want to keep Snap Docker:

```bash
# Use the helper script
./docker-snap-start.sh

# Or manually with sudo
sudo docker compose up --build -d
```

## Access Your Application

Once running:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Database: http://localhost:3001

## Common Commands (with sudo)

```bash
sudo docker compose up -d              # Start
sudo docker compose down               # Stop
sudo docker compose logs -f            # Logs
sudo docker compose ps                 # Status
sudo docker compose restart backend    # Restart service
```

---

**For detailed Docker installation guide, see DOCKER.md**
