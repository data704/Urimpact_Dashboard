#!/bin/bash
# ============================================
# Manual Backend Deployment Script
# Deploys backend Docker container to EC2
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration (set these or export as environment variables)
AWS_REGION=${AWS_REGION:-eu-central-1}
ECR_REPOSITORY=${ECR_REPOSITORY:-ndvi-backend}
ECR_REGISTRY=${ECR_REGISTRY:-}  # e.g., 123456789012.dkr.ecr.eu-central-1.amazonaws.com
EC2_HOST=${EC2_HOST:-}
EC2_USER=${EC2_USER:-ec2-user}
RDS_ENDPOINT=${RDS_ENDPOINT:-ndvi-majmaah-db.c9quck2ekoks.eu-central-1.rds.amazonaws.com}
CORS_ORIGINS=${CORS_ORIGINS:-}

echo -e "${GREEN}🚀 Starting backend deployment...${NC}"

# Validate required variables
if [ -z "$ECR_REGISTRY" ]; then
    echo -e "${RED}❌ Error: ECR_REGISTRY is not set${NC}"
    exit 1
fi

if [ -z "$EC2_HOST" ]; then
    echo -e "${RED}❌ Error: EC2_HOST is not set${NC}"
    exit 1
fi

# Step 1: Login to ECR
echo -e "${YELLOW}📦 Logging in to ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login -u AWS --password-stdin $ECR_REGISTRY

# Step 2: Pull latest image
echo -e "${YELLOW}📥 Pulling latest image...${NC}"
docker pull $ECR_REGISTRY/$ECR_REPOSITORY:latest

# Step 3: Fetch secrets from AWS Secrets Manager
echo -e "${YELLOW}🔐 Fetching secrets from AWS Secrets Manager...${NC}"
DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id ndvi/rds/password --region $AWS_REGION --query SecretString --output text)
JWT_SECRET=$(aws secretsmanager get-secret-value --secret-id ndvi/jwt/secret --region $AWS_REGION --query SecretString --output text)
GEE_CREDENTIALS=$(aws secretsmanager get-secret-value --secret-id ndvi/gee/credentials --region $AWS_REGION --query SecretString --output text)

# Parse GEE credentials
GEE_PRIVATE_KEY=$(echo $GEE_CREDENTIALS | jq -r '.private_key')
GEE_CLIENT_EMAIL=$(echo $GEE_CREDENTIALS | jq -r '.client_email')
GEE_PROJECT_ID=$(echo $GEE_CREDENTIALS | jq -r '.project_id')

# Step 4: Deploy to EC2 via SSH
echo -e "${YELLOW}🚀 Deploying to EC2...${NC}"

ssh $EC2_USER@$EC2_HOST << EOF
set -e

# Login to ECR on EC2
echo "📦 Logging in to ECR on EC2..."
aws ecr get-login-password --region $AWS_REGION | docker login -u AWS --password-stdin $ECR_REGISTRY

# Pull latest image
echo "📥 Pulling latest image..."
docker pull $ECR_REGISTRY/$ECR_REPOSITORY:latest

# Stop and remove old container
echo "🛑 Stopping old container..."
docker stop ndvi-backend || true
docker rm ndvi-backend || true

# Run new container
echo "▶️  Starting new container..."
docker run -d \\
  --name ndvi-backend \\
  --restart always \\
  -p 3000:3000 \\
  -e NODE_ENV=production \\
  -e AWS_REGION=$AWS_REGION \\
  -e USE_AWS_SECRETS=true \\
  -e DB_HOST=$RDS_ENDPOINT \\
  -e DB_PORT=5432 \\
  -e DB_NAME=ndvi_majmaah_db \\
  -e DB_USER=postgres \\
  -e DB_PASSWORD="$DB_PASSWORD" \\
  -e JWT_SECRET="$JWT_SECRET" \\
  -e GEE_PRIVATE_KEY="$GEE_PRIVATE_KEY" \\
  -e GEE_CLIENT_EMAIL="$GEE_CLIENT_EMAIL" \\
  -e GEE_PROJECT_ID="$GEE_PROJECT_ID" \\
  -e CORS_ORIGINS="$CORS_ORIGINS" \\
  -e PORT=3000 \\
  $ECR_REGISTRY/$ECR_REPOSITORY:latest

# Wait for health check
echo "⏳ Waiting for health check..."
sleep 10

# Health check
for i in {1..30}; do
  if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Health check passed!"
    exit 0
  fi
  echo "Health check attempt \$i/30..."
  sleep 2
done

echo "❌ Health check failed!"
docker logs ndvi-backend --tail 50
exit 1
EOF

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Backend is running at: http://$EC2_HOST:3000${NC}"

