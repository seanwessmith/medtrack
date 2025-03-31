#!/bin/bash

set -e # Exit on error

PROJECT_NAME="medications"
DIST_DIR="./dist"
CUSTOM_DOMAIN="medications.seanwesleysmith.com"
ACCOUNT_ID="df69bdcad63997be6e6241eef973d718"
ENV_FILE=".env"

# Load Cloudflare token from .env
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found."
  exit 1
fi

CLOUDFLARE_API_TOKEN=$(grep CLOUDFLARE_API_TOKEN "$ENV_FILE" | cut -d '=' -f2 | tr -d ' ')
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "Error: CLOUDFLARE_API_TOKEN not found in .env."
  exit 1
fi

# Ensure dist folder exists
if [ ! -d "$DIST_DIR" ]; then
  echo "Error: dist directory not found. Run 'vite build' first or check your build config."
  exit 1
fi

# Build the site
vite build

# Check if project exists
echo "Checking if project '$PROJECT_NAME' exists..."
if ! wrangler pages project list | grep -q "$PROJECT_NAME"; then
  echo "Creating project '$PROJECT_NAME'..."
  wrangler pages project create "$PROJECT_NAME" --production-branch main
else
  echo "Project '$PROJECT_NAME' already exists."
fi

# Deploy to Cloudflare Pages
echo "Deploying '$PROJECT_NAME' to branch 'main'..."
wrangler pages deploy "$DIST_DIR" --project-name "$PROJECT_NAME" --branch main

# Ensure domain is set
echo "Ensuring custom domain '$CUSTOM_DOMAIN' is configured..."
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"domains\": [\"$CUSTOM_DOMAIN\"]}" |
  jq .

echo "✅ Deployment complete and live at https://$CUSTOM_DOMAIN"
