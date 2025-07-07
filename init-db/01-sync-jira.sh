#!/bin/bash

# Wait for PostgreSQL to be ready
until pg_isready -h localhost -p 5432 -U admin; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "PostgreSQL is ready!"

# Check if we're in development mode and sync data
if [ "$NODE_ENV" != "production" ]; then
  echo "🔄 Starting customer and JIRA sync on database startup..."
  
  # Wait a bit more to ensure database is fully ready
  sleep 5
  
  # Navigate to app directory and run syncs
  cd /app
  
  # First fetch customers from JIRA
  echo "📋 Fetching customers from JIRA..."
  npm run fetch-customers
  
  # Then sync tickets
  echo "🎫 Syncing JIRA tickets..."
  npm run sync-jira
  
  echo "✅ Complete sync completed on startup"
fi