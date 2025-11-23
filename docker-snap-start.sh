#!/bin/bash

# Helper script for Snap Docker users
# This script handles the sudo requirement for Snap Docker

echo "🐳 Snap Docker Helper"
echo "===================="
echo ""

# Check if Docker is installed via snap
if [ -f "/snap/bin/docker" ]; then
    echo "✅ Snap Docker detected"
    echo ""
    echo "Note: Snap Docker requires sudo for most operations."
    echo ""
    
    # Check if user wants to continue
    read -p "Run 'sudo docker compose up --build -d'? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        echo ""
        echo "🚀 Starting Docker services..."
        sudo docker compose up --build -d
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Services started successfully!"
            echo ""
            echo "Access your application:"
            echo "  Frontend:  http://localhost:3000"
            echo "  Backend:   http://localhost:8000"
            echo "  API Docs:  http://localhost:8000/docs"
            echo "  Database:  http://localhost:3001"
            echo ""
            echo "View logs: sudo docker compose logs -f"
            echo "Stop services: sudo docker compose down"
        else
            echo ""
            echo "❌ Failed to start services. Check the error above."
        fi
    else
        echo "Cancelled."
    fi
else
    echo "⚠️  Snap Docker not detected. Running without sudo..."
    docker compose up --build -d
fi
