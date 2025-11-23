# Retirement Planning Application - Docker Guide

## 🐳 Docker Setup

This guide will help you run the entire Retirement Planning Application using Docker and Docker Compose.

## Prerequisites

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)

### Installing Docker on Ubuntu

```bash
# Update package index
sudo apt update

# Install required packages
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Log out and log back in for group changes to take effect
```

Verify installation:
```bash
docker --version
docker compose version
```

## 🚀 Quick Start

### 1. Configure Environment Variables

Copy the environment template and configure your API keys:

```bash
cp .env.docker .env
```

Edit `.env` and add your OpenAI API key:
```bash
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
OPENAI_MODEL=gpt-4-turbo
```

### 2. Build and Start All Services

```bash
# Build and start all containers
docker compose up --build

# Or run in detached mode (background)
docker compose up --build -d
```

This will:
- Build Docker images for all three services (Frontend, Backend, Database)
- Create a Docker network for inter-service communication
- Start all containers with proper health checks
- Mount the database file for data persistence

### 3. Access the Application

Once all services are healthy:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: http://localhost:3001

## 📦 Docker Architecture

### Services Overview

```
┌─────────────────────────────────────────────────────┐
│                  Docker Network                      │
│                retirement-network                    │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Frontend   │  │   Backend    │  │ Database  │ │
│  │   (nginx)    │──│   (FastAPI)  │──│(json-srv) │ │
│  │   Port 3000  │  │   Port 8000  │  │Port 3001  │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Container Details

#### 1. **Frontend Container** (`retirement-frontend`)
- **Base Image**: `node:18-alpine` (build) + `nginx:alpine` (runtime)
- **Build Type**: Multi-stage (optimized for production)
- **Port**: 3000 → 80
- **Features**:
  - Optimized production build
  - Nginx for serving static files
  - Gzip compression enabled
  - Security headers configured
  - React Router support

#### 2. **Backend Container** (`retirement-backend`)
- **Base Image**: `python:3.11-slim`
- **Port**: 8000
- **Features**:
  - FastAPI with Uvicorn
  - Non-root user for security
  - Health check endpoint
  - Environment-based configuration
  - OpenAI integration

#### 3. **Database Container** (`retirement-database`)
- **Base Image**: `node:18-alpine`
- **Port**: 3001
- **Features**:
  - JSON Server for REST API
  - Data persistence via volume mount
  - Non-root user for security
  - Custom middleware support

## 🛠️ Docker Commands

### Basic Operations

```bash
# Start services
docker compose up

# Start in background
docker compose up -d

# Stop services
docker compose down

# Stop and remove volumes (⚠️ deletes data)
docker compose down -v

# Rebuild images
docker compose build

# Rebuild and start
docker compose up --build
```

### View Logs

```bash
# All services
docker compose logs

# Follow logs in real-time
docker compose logs -f

# Specific service
docker compose logs frontend
docker compose logs backend
docker compose logs database

# Last 100 lines
docker compose logs --tail=100
```

### Service Management

```bash
# Restart a specific service
docker compose restart backend

# Stop a specific service
docker compose stop frontend

# Start a specific service
docker compose start frontend

# View running containers
docker compose ps

# View service status
docker compose ps -a
```

### Debugging

```bash
# Execute command in running container
docker compose exec backend bash
docker compose exec frontend sh
docker compose exec database sh

# View container resource usage
docker stats

# Inspect a service
docker compose config

# View service health
docker inspect retirement-backend | grep -A 10 Health
```

### Cleanup

```bash
# Remove stopped containers
docker compose rm

# Remove all unused images
docker image prune -a

# Remove all unused volumes
docker volume prune

# Complete cleanup (⚠️ removes everything)
docker system prune -a --volumes
```

## 🔧 Configuration

### Environment Variables

#### Root `.env` file
```bash
OPENAI_API_KEY=sk-proj-xxxxx
OPENAI_MODEL=gpt-4-turbo
ENVIRONMENT=production
DEBUG=false
```

#### Backend Environment (in docker-compose.yml)
- `ENVIRONMENT`: development/production
- `JSON_SERVER_URL`: Internal URL to database service
- `DEBUG`: Enable debug logging
- `CORS_ORIGINS`: Allowed CORS origins
- `OPENAI_API_KEY`: OpenAI API key
- `OPENAI_MODEL`: OpenAI model to use

### Ports Configuration

To change ports, edit `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Change 8080 to your desired port
  
  backend:
    ports:
      - "9000:8000"  # Change 9000 to your desired port
```

### Volume Mounts

The database file is mounted for persistence:

```yaml
volumes:
  - ./database/db.json:/app/db.json
```

This ensures your data persists even when containers are recreated.

## 🏥 Health Checks

All services include health checks:

- **Frontend**: HTTP check on port 80
- **Backend**: Python health endpoint check
- **Database**: HTTP check on port 3001

Services start in order based on health status:
1. Database starts first
2. Backend waits for database to be healthy
3. Frontend waits for backend to be healthy

## 🔒 Security Features

### Container Security
- ✅ Non-root users in all containers
- ✅ Minimal base images (Alpine/Slim)
- ✅ No unnecessary packages
- ✅ Security headers in nginx
- ✅ Health checks for all services

### Network Security
- ✅ Isolated Docker network
- ✅ Services communicate via internal network
- ✅ Only necessary ports exposed to host

## 🐛 Troubleshooting

### Services won't start

```bash
# Check service logs
docker compose logs

# Check if ports are already in use
sudo netstat -tulpn | grep -E '3000|8000|3001'

# Rebuild from scratch
docker compose down -v
docker compose build --no-cache
docker compose up
```

### Database connection issues

```bash
# Check if database is healthy
docker compose ps

# View database logs
docker compose logs database

# Verify database is accessible
docker compose exec backend curl http://database:3001
```

### Frontend can't connect to backend

```bash
# Check backend health
docker compose exec frontend wget -O- http://backend:8000/health

# Verify CORS settings in docker-compose.yml
docker compose config | grep CORS
```

### Permission issues

```bash
# Fix database file permissions
chmod 666 database/db.json

# Rebuild with proper permissions
docker compose down
docker compose build --no-cache
docker compose up
```

### Out of disk space

```bash
# Check Docker disk usage
docker system df

# Clean up unused resources
docker system prune -a --volumes
```

## 📊 Monitoring

### Resource Usage

```bash
# Real-time stats
docker stats

# Specific container
docker stats retirement-backend
```

### Logs Management

```bash
# Configure log rotation in docker-compose.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 🚀 Production Deployment

### Best Practices

1. **Use specific image tags** instead of `latest`
2. **Set resource limits**:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

3. **Use secrets for sensitive data**:
```yaml
secrets:
  openai_key:
    file: ./secrets/openai_key.txt

services:
  backend:
    secrets:
      - openai_key
```

4. **Enable restart policies** (already configured):
```yaml
restart: unless-stopped
```

5. **Use external volumes** for data:
```yaml
volumes:
  db-data:
    external: true
```

## 🔄 Development vs Production

### Development Mode

```bash
# Use development compose file
docker compose -f docker-compose.dev.yml up
```

### Production Mode

```bash
# Use production settings
docker compose up -d

# Monitor logs
docker compose logs -f
```

## 📝 Additional Notes

### Data Backup

```bash
# Backup database
docker compose exec database cat /app/db.json > backup-$(date +%Y%m%d).json

# Restore database
docker compose cp backup-20231122.json database:/app/db.json
docker compose restart database
```

### Updating the Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose down
docker compose up --build -d
```

## 🆘 Getting Help

If you encounter issues:

1. Check the logs: `docker compose logs`
2. Verify health status: `docker compose ps`
3. Review configuration: `docker compose config`
4. Check Docker resources: `docker system df`

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

**Happy Dockerizing! 🐳**
