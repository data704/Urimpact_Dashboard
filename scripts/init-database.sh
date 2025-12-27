#!/bin/bash
# ============================================
# Database Initialization Script
# Runs migrations on RDS PostgreSQL
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
RDS_ENDPOINT=${RDS_ENDPOINT:-ndvi-majmaah-db.c9quck2ekoks.eu-central-1.rds.amazonaws.com}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-ndvi_majmaah_db}
DB_USER=${DB_USER:-postgres}
MIGRATIONS_DIR=${MIGRATIONS_DIR:-ndvi-calculatorr/server/migrations}

echo -e "${GREEN}🗄️  Initializing database...${NC}"

# Fetch password from AWS Secrets Manager
echo -e "${YELLOW}🔐 Fetching database password...${NC}"
DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id ndvi/rds/password --region eu-central-1 --query SecretString --output text)

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ Error: Failed to fetch database password${NC}"
    exit 1
fi

# Export password for psql
export PGPASSWORD=$DB_PASSWORD

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}❌ Error: Migrations directory not found: $MIGRATIONS_DIR${NC}"
    exit 1
fi

# Run migrations in order
echo -e "${YELLOW}📝 Running migrations...${NC}"

# Migration 1: Initial schema
if [ -f "$MIGRATIONS_DIR/001-initial-schema.sql" ]; then
    echo -e "${YELLOW}Running migration: 001-initial-schema.sql${NC}"
    psql -h $RDS_ENDPOINT -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATIONS_DIR/001-initial-schema.sql"
    echo -e "${GREEN}✅ Migration 001 completed${NC}"
else
    echo -e "${RED}❌ Error: Migration file not found: 001-initial-schema.sql${NC}"
    exit 1
fi

# Migration 2: Users and assignments
if [ -f "$MIGRATIONS_DIR/002-users-and-assignments.sql" ]; then
    echo -e "${YELLOW}Running migration: 002-users-and-assignments.sql${NC}"
    psql -h $RDS_ENDPOINT -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATIONS_DIR/002-users-and-assignments.sql"
    echo -e "${GREEN}✅ Migration 002 completed${NC}"
else
    echo -e "${YELLOW}⚠️  Migration file not found: 002-users-and-assignments.sql (skipping)${NC}"
fi

# Verify tables exist
echo -e "${YELLOW}🔍 Verifying database schema...${NC}"
TABLE_COUNT=$(psql -h $RDS_ENDPOINT -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('projects', 'analysis_results', 'majmaah_assignments', 'calculated_metrics', 'species_data', 'users', 'user_analysis_assignments');")

if [ "$TABLE_COUNT" -ge 5 ]; then
    echo -e "${GREEN}✅ Database schema verified ($TABLE_COUNT tables found)${NC}"
else
    echo -e "${RED}❌ Error: Database schema incomplete ($TABLE_COUNT tables found, expected at least 5)${NC}"
    exit 1
fi

# Unset password
unset PGPASSWORD

echo -e "${GREEN}✅ Database initialization complete!${NC}"

