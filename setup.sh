#!/bin/bash

# =========================================================
# SMAART EMR - Quick Setup Script
# =========================================================
# This script automates the setup of both frontend and backend

set -e

echo "=========================================="
echo "🏥 SMAART EMR - Quick Setup"
echo "=========================================="
echo ""

# Check for required tools
echo "✓ Checking prerequisites..."
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed. Please install Node.js v16+"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo "❌ npm is not installed. Please install npm"
  exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"
echo ""

# Setup Backend
echo "=========================================="
echo "Setting up Backend..."
echo "=========================================="
cd smaart-emr-backend

if [ ! -f ".env" ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "✓ Backend .env created"
  echo "⚠️  Please edit .env with your MongoDB URI"
else
  echo "✓ Backend .env already exists"
fi

echo "Installing backend dependencies..."
npm install

echo "✓ Backend setup complete!"
echo ""

# Setup Frontend
echo "=========================================="
echo "Setting up Frontend..."
echo "=========================================="
cd ../smaart-emr-frontend

if [ ! -f ".env" ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "✓ Frontend .env created"
else
  echo "✓ Frontend .env already exists"
fi

echo "Installing frontend dependencies..."
npm install

echo "✓ Frontend setup complete!"
echo ""

# Summary
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1️⃣  Start Backend:"
echo "   cd smaart-emr-backend"
echo "   npm run dev"
echo ""
echo "2️⃣  Start Frontend (in another terminal):"
echo "   cd smaart-emr-frontend"
echo "   npm run dev"
echo ""
echo "3️⃣  Open your browser:"
echo "   http://localhost:5173"
echo ""
echo "4️⃣  Test login with:"
echo "   Email: admin@smaart-healthcare.com"
echo "   Password: Admin@123456"
echo ""
echo "📖 For detailed setup guide, see: COMPLETE_SETUP_GUIDE.md"
echo ""
