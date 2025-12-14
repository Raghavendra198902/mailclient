#!/bin/bash

echo "===== Gmail OAuth Setup ====="
echo ""
echo "Please enter your Google OAuth credentials:"
echo ""
read -p "Gmail Client ID: " CLIENT_ID
read -p "Gmail Client Secret: " CLIENT_SECRET

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "Error: Both Client ID and Client Secret are required"
    exit 1
fi

# Update .env file
sed -i "s|GMAIL_CLIENT_ID=.*|GMAIL_CLIENT_ID=$CLIENT_ID|g" .env
sed -i "s|GMAIL_CLIENT_SECRET=.*|GMAIL_CLIENT_SECRET=$CLIENT_SECRET|g" .env

echo ""
echo "✅ Updated .env file with Gmail OAuth credentials"
echo ""
echo "Now restart the backend:"
echo "  docker-compose restart backend"
echo ""
