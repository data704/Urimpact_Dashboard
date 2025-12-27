# Running Database Migration

## Option 1: Using Docker Exec (Recommended)

If your Docker container is already running:

```powershell
# Navigate to server directory
cd C:\Users\Muhammad Kashif\Desktop\Fiver\Maria\Test\lun\lun2\ndvi-calculatorr\server

# Run the migration script
.\run-migration.ps1
```

Or manually:
```powershell
docker exec -i ndvi_majmaah_postgres psql -U postgres -d ndvi_majmaah_db < migrations/002-users-and-assignments.sql
```

## Option 2: Using Docker Compose Exec

```powershell
docker-compose exec postgres psql -U postgres -d ndvi_majmaah_db -f /docker-entrypoint-initdb.d/002-users-and-assignments.sql
```

## Option 3: Copy file into container and run

```powershell
# Copy migration file into container
docker cp migrations/002-users-and-assignments.sql ndvi_majmaah_postgres:/tmp/migration.sql

# Execute migration
docker exec ndvi_majmaah_postgres psql -U postgres -d ndvi_majmaah_db -f /tmp/migration.sql
```

## Option 4: Using pgAdmin (Web Interface)

1. Open pgAdmin at http://localhost:5050
2. Login with:
   - Email: admin@urimpact.com
   - Password: admin123
3. Connect to PostgreSQL server:
   - Host: postgres (or localhost)
   - Port: 5432
   - Database: ndvi_majmaah_db
   - Username: postgres
   - Password: ndvi_majmaah_2025
4. Right-click on `ndvi_majmaah_db` → Query Tool
5. Open and execute `migrations/002-users-and-assignments.sql`

## Verify Migration

After running the migration, verify it worked:

```powershell
docker exec ndvi_majmaah_postgres psql -U postgres -d ndvi_majmaah_db -c "\dt users"
docker exec ndvi_majmaah_postgres psql -U postgres -d ndvi_majmaah_db -c "\dt user_analysis_assignments"
```

You should see both tables listed.

## Default Admin Credentials

After migration, you can login with:
- Email: admin@urimpact.com
- Password: admin123

**⚠️ IMPORTANT: Change this password in production!**

