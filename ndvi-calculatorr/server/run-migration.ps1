# PowerShell script to run database migration via Docker
# Run this script from the server directory

Write-Host "Running database migration via Docker..." -ForegroundColor Cyan

# Check if Docker container is running
$containerName = "ndvi_majmaah_postgres"
$containerRunning = docker ps --filter "name=$containerName" --format "{{.Names}}"

if (-not $containerRunning) {
    Write-Host "Error: Docker container '$containerName' is not running!" -ForegroundColor Red
    Write-Host "Please start the container first with: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "Container is running. Executing migration..." -ForegroundColor Green

# Run the migration SQL file through Docker exec
docker exec -i $containerName psql -U postgres -d ndvi_majmaah_db < migrations/002-users-and-assignments.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migration completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Migration failed. Check the error messages above." -ForegroundColor Red
}

