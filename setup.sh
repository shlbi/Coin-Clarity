#!/bin/bash

# Coin Clarity Setup Script

echo "🚀 Setting up Coin Clarity..."

# Copy .env.example to .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your API keys if needed."
else
    echo "ℹ️  .env file already exists, skipping..."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file if you want to add API keys (optional)"
echo "2. Run: docker compose -f infra/docker-compose.yml up --build"
echo "3. Open http://localhost:3000 in your browser"
echo ""
