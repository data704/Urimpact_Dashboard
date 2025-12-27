#!/bin/bash
# ============================================
# Fetch Secrets from AWS Secrets Manager
# Outputs environment variables for use in deployment
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-eu-central-1}

echo -e "${GREEN}🔐 Fetching secrets from AWS Secrets Manager...${NC}"

# Fetch RDS password
echo -e "${YELLOW}Fetching RDS password...${NC}"
DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id ndvi/rds/password --region $AWS_REGION --query SecretString --output text)
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ Error: Failed to fetch RDS password${NC}"
    exit 1
fi

# Fetch JWT secret
echo -e "${YELLOW}Fetching JWT secret...${NC}"
JWT_SECRET=$(aws secretsmanager get-secret-value --secret-id ndvi/jwt/secret --region $AWS_REGION --query SecretString --output text)
if [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}❌ Error: Failed to fetch JWT secret${NC}"
    exit 1
fi

# Fetch GEE credentials
echo -e "${YELLOW}Fetching GEE credentials...${NC}"
GEE_CREDENTIALS=$(aws secretsmanager get-secret-value --secret-id ndvi/gee/credentials --region $AWS_REGION --query SecretString --output text)
if [ -z "$GEE_CREDENTIALS" ]; then
    echo -e "${RED}❌ Error: Failed to fetch GEE credentials${NC}"
    exit 1
fi

# Parse GEE credentials
GEE_PRIVATE_KEY=$(echo $GEE_CREDENTIALS | jq -r '.private_key')
GEE_CLIENT_EMAIL=$(echo $GEE_CREDENTIALS | jq -r '.client_email')
GEE_PROJECT_ID=$(echo $GEE_CREDENTIALS | jq -r '.project_id')

# Fetch Mapbox token (optional)
echo -e "${YELLOW}Fetching Mapbox token...${NC}"
MAPBOX_TOKEN=$(aws secretsmanager get-secret-value --secret-id ndvi/mapbox/token --region $AWS_REGION --query SecretString --output text 2>/dev/null || echo "")

# Output as environment variables
echo ""
echo -e "${GREEN}✅ Secrets fetched successfully!${NC}"
echo ""
echo "# Export these environment variables:"
echo "export DB_PASSWORD='$DB_PASSWORD'"
echo "export JWT_SECRET='$JWT_SECRET'"
echo "export GEE_PRIVATE_KEY='$GEE_PRIVATE_KEY'"
echo "export GEE_CLIENT_EMAIL='$GEE_CLIENT_EMAIL'"
echo "export GEE_PROJECT_ID='$GEE_PROJECT_ID'"
if [ -n "$MAPBOX_TOKEN" ]; then
    echo "export MAPBOX_TOKEN='$MAPBOX_TOKEN'"
fi

# Optionally save to file
if [ "$1" == "--save" ]; then
    OUTPUT_FILE=${2:-.env.secrets}
    echo ""
    echo -e "${YELLOW}Saving to $OUTPUT_FILE...${NC}"
    cat > $OUTPUT_FILE << EOF
# Auto-generated secrets file - DO NOT COMMIT TO GIT
DB_PASSWORD='$DB_PASSWORD'
JWT_SECRET='$JWT_SECRET'
GEE_PRIVATE_KEY='$GEE_PRIVATE_KEY'
GEE_CLIENT_EMAIL='$GEE_CLIENT_EMAIL'
GEE_PROJECT_ID='$GEE_PROJECT_ID'
MAPBOX_TOKEN='$MAPBOX_TOKEN'
EOF
    echo -e "${GREEN}✅ Secrets saved to $OUTPUT_FILE${NC}"
    echo -e "${YELLOW}⚠️  Remember to add $OUTPUT_FILE to .gitignore!${NC}"
fi

