.PHONY: help build up down restart logs clean dev-up dev-down prod-up prod-down

# Default target
help:
	@echo "🐳 Docker Management Commands for Retirement Planning App"
	@echo ""
	@echo "Production Commands:"
	@echo "  make build       - Build all Docker images"
	@echo "  make up          - Start all services in production mode"
	@echo "  make down        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - View logs from all services"
	@echo "  make clean       - Remove all containers, images, and volumes"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev-up      - Start all services in development mode (with hot reload)"
	@echo "  make dev-down    - Stop development services"
	@echo "  make dev-logs    - View development logs"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make ps          - List running containers"
	@echo "  make shell-backend   - Open shell in backend container"
	@echo "  make shell-frontend  - Open shell in frontend container"
	@echo "  make shell-database  - Open shell in database container"
	@echo "  make backup      - Backup database"
	@echo "  make restore     - Restore database from backup"
	@echo ""

# Production commands
build:
	@echo "🔨 Building Docker images..."
	docker compose build

up:
	@echo "🚀 Starting services in production mode..."
	docker compose up -d
	@echo "✅ Services started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8000"
	@echo "Database: http://localhost:3001"

down:
	@echo "🛑 Stopping services..."
	docker compose down

restart:
	@echo "🔄 Restarting services..."
	docker compose restart

logs:
	docker compose logs -f

ps:
	docker compose ps

# Development commands
dev-up:
	@echo "🚀 Starting services in development mode..."
	docker compose -f docker-compose.dev.yml up -d
	@echo "✅ Development services started with hot reload!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8000"
	@echo "Database: http://localhost:3001"

dev-down:
	@echo "🛑 Stopping development services..."
	docker compose -f docker-compose.dev.yml down

dev-logs:
	docker compose -f docker-compose.dev.yml logs -f

# Shell access
shell-backend:
	docker compose exec backend bash

shell-frontend:
	docker compose exec frontend sh

shell-database:
	docker compose exec database sh

# Database management
backup:
	@echo "💾 Backing up database..."
	@mkdir -p backups
	docker compose exec database cat /app/db.json > backups/db-backup-$$(date +%Y%m%d-%H%M%S).json
	@echo "✅ Backup created in backups/ directory"

restore:
	@echo "📥 Restoring database..."
	@read -p "Enter backup file name (in backups/ directory): " backup; \
	docker compose cp backups/$$backup database:/app/db.json
	docker compose restart database
	@echo "✅ Database restored and service restarted"

# Cleanup
clean:
	@echo "🧹 Cleaning up Docker resources..."
	docker compose down -v
	docker system prune -f
	@echo "✅ Cleanup complete"

clean-all:
	@echo "⚠️  WARNING: This will remove ALL Docker resources!"
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		docker compose down -v; \
		docker system prune -a -f --volumes; \
		echo "✅ All Docker resources removed"; \
	else \
		echo "❌ Cleanup cancelled"; \
	fi

# Health checks
health:
	@echo "🏥 Checking service health..."
	@docker compose ps
	@echo ""
	@echo "Backend health:"
	@curl -s http://localhost:8000/health || echo "❌ Backend not responding"
	@echo ""
	@echo "Database health:"
	@curl -s http://localhost:3001 || echo "❌ Database not responding"

# Install Docker (Ubuntu)
install-docker:
	@echo "📦 Installing Docker on Ubuntu..."
	sudo apt update
	sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
	curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
	echo "deb [arch=$$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $$(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
	sudo apt update
	sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
	sudo usermod -aG docker $$USER
	@echo "✅ Docker installed! Please log out and log back in for group changes to take effect."

# Setup environment
setup:
	@echo "⚙️  Setting up environment..."
	@if [ ! -f .env ]; then \
		cp .env.docker .env; \
		echo "✅ Created .env file from template"; \
		echo "⚠️  Please edit .env and add your OPENAI_API_KEY"; \
	else \
		echo "ℹ️  .env file already exists"; \
	fi
	@if [ ! -f database/db.json ]; then \
		cp database/db.sample.json database/db.json; \
		echo "✅ Created database/db.json from sample"; \
	else \
		echo "ℹ️  database/db.json already exists"; \
	fi
	@echo "✅ Setup complete!"
