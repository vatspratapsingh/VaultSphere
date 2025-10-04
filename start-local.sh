#!/bin/bash

# VaultSphere Local Development Startup Script
# This script starts both frontend and backend services for local development

echo "🚀 Starting VaultSphere Local Development Environment"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Kill any existing processes on our ports
echo -e "${YELLOW}🧹 Cleaning up existing processes...${NC}"
pkill -f "node.*server-local.js" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true
sleep 2

# Start backend
echo -e "${BLUE}🔧 Starting Backend Server...${NC}"
cd backend
node server-local.js &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
sleep 3

# Check if backend is running
if check_port 5001; then
    echo -e "${GREEN}✅ Backend server started successfully on port 5001${NC}"
else
    echo -e "${RED}❌ Failed to start backend server${NC}"
    exit 1
fi

# Start frontend
echo -e "${BLUE}🎨 Starting Frontend Server...${NC}"
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo -e "${YELLOW}⏳ Waiting for frontend to start...${NC}"
sleep 5

# Check if frontend is running
if check_port 3000; then
    echo -e "${GREEN}✅ Frontend server started successfully on port 3000${NC}"
else
    echo -e "${RED}❌ Failed to start frontend server${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo
echo -e "${GREEN}🎉 VaultSphere is now running!${NC}"
echo "================================"
echo
echo -e "${BLUE}📱 Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}🔧 Backend API:${NC} http://localhost:5001/api"
echo -e "${BLUE}🏥 Health Check:${NC} http://localhost:5001/api/health"
echo
echo -e "${YELLOW}📋 Demo Credentials:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}👤 Admin User${NC}"
echo "   Email: admin@vaultsphere.com"
echo "   Password: admin123"
echo "   Role: System Administrator"
echo
echo -e "${GREEN}👤 Food Company User${NC}"
echo "   Email: food@vaultsphere.com"
echo "   Password: food123"
echo "   Role: Client User"
echo
echo -e "${GREEN}👤 IT Company User${NC}"
echo "   Email: it@vaultsphere.com"
echo "   Password: it123"
echo "   Role: Client User"
echo
echo -e "${GREEN}👤 Test User${NC}"
echo "   Email: eathealthy@gmail.com"
echo "   Password: food123"
echo "   Role: Client User"
echo
echo -e "${YELLOW}💡 Tips:${NC}"
echo "• Select the correct role when logging in"
echo "• Client users are automatically routed to their company dashboard"
echo "• Admin users get access to the system administration panel"
echo
echo -e "${YELLOW}🛑 To stop the servers:${NC}"
echo "Press Ctrl+C or run: pkill -f 'node.*server-local.js' && pkill -f 'react-scripts start'"
echo

# Keep the script running and handle Ctrl+C
trap 'echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

# Wait for user to stop the script
wait