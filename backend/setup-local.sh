#!/bin/bash

echo "🚀 Setting up VaultSphere for local development..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
PORT=5001
JWT_SECRET=vaultsphere_super_secret_jwt_key_2024
NODE_ENV=development

# Supabase Database (replace YOUR_PASSWORD with your actual password)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.gchbahgyhiptxrxrfgmh.supabase.co:5432/postgres
EOF
    echo "✅ .env file created!"
    echo "⚠️  Please edit .env file and replace YOUR_PASSWORD with your actual Supabase password"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📋 Next steps:"
echo "1. Edit .env file and replace YOUR_PASSWORD with your actual Supabase password"
echo "2. Run: npm start"
echo "3. Your backend will be available at: http://localhost:5001"
echo "4. Your frontend will be available at: http://localhost:3000"
echo ""
echo "🌐 Supabase project URL: https://gchbahgyhiptxrxrfgmh.supabase.co"
