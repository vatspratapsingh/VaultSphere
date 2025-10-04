#!/bin/bash

# VaultSphere Status Check Script
echo "🔍 VaultSphere Status Check"
echo "=========================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check backend
echo -n "🔧 Backend (port 5001): "
if curl -s http://localhost:5001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Running${NC}"
    echo "   Health: $(curl -s http://localhost:5001/api/health | jq -r '.status' 2>/dev/null || echo 'OK')"
else
    echo -e "${RED}❌ Not running${NC}"
fi

# Check frontend
echo -n "🎨 Frontend (port 3000): "
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
fi

# Test login
echo -n "🔐 Login API: "
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vaultsphere.com","password":"admin123"}' 2>/dev/null)

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Working${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
fi

echo
echo "🌐 Access URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5001/api"
echo "   Health Check: http://localhost:5001/api/health"