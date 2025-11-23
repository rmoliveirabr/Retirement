# 🐳 Docker Quick Reference Card

## 🚀 Getting Started

### First Time Setup
```bash
./docker-start.sh
```
OR
```bash
make setup
make up
```

## 📍 Access Points
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Database | http://localhost:3001 |

## 🎯 Common Commands

### Using Make (Easiest)
| Command | Description |
|---------|-------------|
| `make help` | Show all commands |
| `make up` | Start production |
| `make dev-up` | Start development (hot reload) |
| `make down` | Stop all services |
| `make logs` | View logs (follow) |
| `make ps` | List containers |
| `make restart` | Restart all services |
| `make backup` | Backup database |
| `make health` | Check service health |
| `make clean` | Clean up resources |

### Using Docker Compose
| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start production |
| `docker compose down` | Stop services |
| `docker compose logs -f` | View logs |
| `docker compose ps` | List containers |
| `docker compose restart` | Restart all |
| `docker compose build` | Rebuild images |

### Development Mode
| Command | Description |
|---------|-------------|
| `make dev-up` | Start with hot reload |
| `make dev-down` | Stop dev services |
| `make dev-logs` | View dev logs |

## 🔍 Debugging

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f database
```

### Access Container Shell
```bash
make shell-backend
make shell-frontend
make shell-database
```

### Check Health
```bash
make health
# OR
docker compose ps
curl http://localhost:8000/health
```

## 💾 Database Operations

### Backup
```bash
make backup
```

### Restore
```bash
make restore
# Then enter backup filename
```

## 🛠️ Troubleshooting

### Services Won't Start
```bash
docker compose logs
docker compose down -v
docker compose build --no-cache
docker compose up
```

### Port Already in Use
```bash
sudo netstat -tulpn | grep -E '3000|8000|3001'
# Kill the process or change ports in docker-compose.yml
```

### Permission Issues
```bash
chmod 666 database/db.json
docker compose down
docker compose build --no-cache
docker compose up
```

### Clean Everything
```bash
make clean-all
# OR
docker compose down -v
docker system prune -a --volumes
```

## 📊 Monitoring

### Resource Usage
```bash
docker stats
```

### Container Status
```bash
docker compose ps
```

## ⚙️ Configuration

### Environment Variables
Edit `.env` file:
```bash
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-4-turbo
```

### Change Ports
Edit `docker-compose.yml`:
```yaml
ports:
  - "NEW_PORT:CONTAINER_PORT"
```

## 🔄 Update Application

```bash
git pull
docker compose down
docker compose build
docker compose up -d
```

## 📚 Full Documentation
- **DOCKER_SETUP.md** - Setup summary
- **DOCKER.md** - Complete guide
- **README.md** - Application docs

---

**Quick Help**: Run `make help` for all commands
