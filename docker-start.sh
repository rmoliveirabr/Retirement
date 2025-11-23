#!/bin/bash

# Retirement Planning App - Docker Quick Start Script
# This script helps you get started with Docker quickly

set -e

echo "🐳 Retirement Planning App - Docker Quick Start"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo ""
    echo "Would you like to install Docker now? (Ubuntu only)"
    read -p "Install Docker? (yes/no): " install_docker
    
    if [ "$install_docker" = "yes" ]; then
        echo "Installing Docker..."
        make install-docker
        echo -e "${GREEN}✅ Docker installed! Please log out and log back in, then run this script again.${NC}"
        exit 0
    else
        echo -e "${YELLOW}Please install Docker manually and run this script again.${NC}"
        echo "Visit: https://docs.docker.com/engine/install/ubuntu/"
        exit 1
    fi
fi

# Check if Docker Compose is installed
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed!${NC}"
    echo "Please install Docker Compose and run this script again."
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Setup environment files
echo "⚙️  Setting up environment..."
if [ ! -f .env ]; then
    cp .env.docker .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env and add your OPENAI_API_KEY${NC}"
    
    read -p "Do you want to edit .env now? (yes/no): " edit_env
    if [ "$edit_env" = "yes" ]; then
        ${EDITOR:-nano} .env
    fi
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Setup database
if [ ! -f database/db.json ]; then
    cp database/db.sample.json database/db.json
    echo -e "${GREEN}✅ Created database/db.json${NC}"
else
    echo -e "${GREEN}✅ database/db.json already exists${NC}"
fi

echo ""
echo "🎯 Choose your mode:"
echo "1) Production mode (optimized, no hot reload)"
echo "2) Development mode (hot reload enabled)"
echo ""
read -p "Enter your choice (1 or 2): " mode_choice

echo ""

if [ "$mode_choice" = "1" ]; then
    echo "🚀 Starting in PRODUCTION mode..."
    echo ""
    echo "Building Docker images (this may take a few minutes)..."
    docker compose build
    
    echo ""
    echo "Starting services..."
    docker compose up -d
    
    echo ""
    echo -e "${GREEN}✅ Services started successfully!${NC}"
    echo ""
    echo "📍 Access your application:"
    echo "   Frontend:  http://localhost:3000"
    echo "   Backend:   http://localhost:8000"
    echo "   API Docs:  http://localhost:8000/docs"
    echo "   Database:  http://localhost:3001"
    echo ""
    echo "📊 View logs:"
    echo "   docker compose logs -f"
    echo ""
    echo "🛑 Stop services:"
    echo "   docker compose down"
    
elif [ "$mode_choice" = "2" ]; then
    echo "🚀 Starting in DEVELOPMENT mode..."
    echo ""
    echo "Building Docker images (this may take a few minutes)..."
    docker compose -f docker-compose.dev.yml build
    
    echo ""
    echo "Starting services with hot reload..."
    docker compose -f docker-compose.dev.yml up -d
    
    echo ""
    echo -e "${GREEN}✅ Development services started successfully!${NC}"
    echo ""
    echo "📍 Access your application:"
    echo "   Frontend:  http://localhost:3000 (with hot reload)"
    echo "   Backend:   http://localhost:8000 (with hot reload)"
    echo "   API Docs:  http://localhost:8000/docs"
    echo "   Database:  http://localhost:3001"
    echo ""
    echo "📊 View logs:"
    echo "   docker compose -f docker-compose.dev.yml logs -f"
    echo ""
    echo "🛑 Stop services:"
    echo "   docker compose -f docker-compose.dev.yml down"
else
    echo -e "${RED}❌ Invalid choice${NC}"
    exit 1
fi

echo ""
echo "💡 Tip: Use 'make help' to see all available commands"
echo ""

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check health
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend is still starting up...${NC}"
fi

if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Database is still starting up...${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup complete! Your application is running.${NC}"
echo ""
