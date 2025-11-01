#!/bin/bash

echo "=========================================="
echo "HR Management System - Full Stack Setup"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null
then
    echo "⚠️  MongoDB is not installed locally."
    echo "   You can either:"
    echo "   1. Install MongoDB: https://www.mongodb.com/try/download/community"
    echo "   2. Use MongoDB Atlas: https://www.mongodb.com/cloud/atlas"
    echo ""
else
    echo "✅ MongoDB is installed"
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo "✅ Frontend dependencies installed"

# Install backend dependencies
echo ""
echo "Installing backend dependencies..."
cd server
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

cd ..
echo "✅ Backend dependencies installed"

# Check if .env files exist
echo ""
echo "🔧 Checking environment configuration..."

if [ ! -f ".env" ]; then
    echo "⚠️  Frontend .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Frontend .env created"
else
    echo "✅ Frontend .env exists"
fi

if [ ! -f "server/.env" ]; then
    echo "⚠️  Backend .env file not found. Creating from .env.example..."
    cp server/.env.example server/.env
    echo "✅ Backend .env created"
    echo ""
    echo "⚠️  IMPORTANT: Please update server/.env with your MongoDB URI and secrets!"
else
    echo "✅ Backend .env exists"
fi

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Configure MongoDB:"
echo "   - Update MONGODB_URI in server/.env"
echo "   - Default: mongodb://localhost:27017/hr_management_system"
echo ""
echo "2. Update JWT_SECRET in server/.env for security"
echo ""
echo "3. (Optional) Seed the database with sample data:"
echo "   cd server && npm run seed && cd .."
echo ""
echo "4. Start the application:"
echo "   npm run dev:fullstack"
echo ""
echo "5. Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5000"
echo ""
echo "📚 For detailed instructions, see FULLSTACK_SETUP.md"
echo ""
