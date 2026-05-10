#!/bin/bash
# Configuration
PORT=30779
APP_NAME="ReleaseHub"

# Function to check if the port is in use
is_port_in_use() {
    lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null
}

echo "🚀 Launching $APP_NAME..."

if is_port_in_use; then
    echo "✨ $APP_NAME is already running on port $PORT."
    echo "🌐 Opening browser..."
    open "http://localhost:$PORT"
else
    # 🔍 Healthcheck
    ./scripts/healthcheck.sh

    if [ -d ".git" ]; then
        echo "🔍 Checking for updates..."
        # Ensure upstream is set
        if ! git rev-parse @{u} &>/dev/null; then
            git branch --set-upstream-to=origin/main main &>/dev/null || true
        fi
        if git fetch origin main &>/dev/null; then
            LOCAL=$(git rev-parse HEAD)
            REMOTE=$(git rev-parse @{u} 2>/dev/null || git rev-parse origin/main)
            if [ "$LOCAL" != "$REMOTE" ]; then
                echo "✨ New version detected. Updating $APP_NAME..."
                git reset --hard origin/main
                npm install && npm run build
            fi
        fi
    fi

    [ ! -d "node_modules" ] && npm install
    [ ! -d "dist" ] && npm run build

    echo "📦 Starting $APP_NAME on port $PORT..."
    npm run preview -- --port $PORT --open
fi
