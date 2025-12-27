# User Management and Analysis Assignment Implementation

## Overview
This document describes the implementation of user management and analysis assignment functionality, allowing admins to create users and assign specific analyses to them.

## Database Schema

### Tables Created:
1. **users** - Stores user accounts for Majmaah dashboard
2. **user_analysis_assignments** - Links users to specific analyses they can view

### Migration File:
`migrations/002-users-and-assignments.sql`

Run the migration:
```bash
psql -U postgres -d ndvi_majmaah_db -f migrations/002-users-and-assignments.sql
```

## Backend API Endpoints

### Authentication
- `POST /api/auth/login` - User login (returns JWT token)
- `GET /api/auth/me` - Get current user info

### User Management (Admin)
- `POST /api/users` - Create new user
- `GET /api/users` - Get all users
- `GET /api/users/:userId` - Get user by ID
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### User Analysis Assignments
- `POST /api/users/:userId/assign-analysis` - Assign analysis to user
- `GET /api/users/:userId/assigned-analyses` - Get analyses assigned to user
- `DELETE /api/users/:userId/assignments/:analysisId` - Remove assignment
- `POST /api/users/:userId/bulk-assign` - Bulk assign multiple analyses

## Implementation Status

### ✅ Completed:
1. Database migration file created
2. User service (`src/services/userService.js`) - CRUD operations, authentication, assignments
3. User controller (`src/controllers/userController.js`) - Request handlers
4. User routes (`src/routes/userRoutes.js`) - API endpoints
5. Auth middleware (`src/middleware/auth.js`) - JWT token verification
6. Updated `app.js` to include user routes
7. Updated `getMajmaahDashboardStats` to filter by user assignments

### 🔄 In Progress:
1. Update all majmaah dashboard query functions to filter by user assignments
2. Update majmaah routes to use authentication middleware
3. Create admin UI in NDVI calculator for user management
4. Create admin UI for assigning analyses to users
5. Update Majmaah dashboard authentication to use real API

### 📝 Next Steps:

1. **Update Database Service Functions** - Add userId parameter to all majmaah query functions:
   - `getCarbonTrends(projectId, months, userId)`
   - `getCanopyCoverageDistribution(projectId, userId)`
   - `getSpeciesRichnessData(projectId, userId)`
   - `getEcosystemServices(projectId, userId)`
   - `getVegetationHealthDistribution(projectId, userId)`
   - `getSurvivalRateData(projectId, userId)`
   - `getGrowthCarbonImpact(projectId, months, userId)`
   - `getNDVITrends(projectId, months, userId)`
   - `getEVITrends(projectId, months, userId)`
   - `getAGCTrends(projectId, months, userId)`
   - `getVegetationHealthIndex(projectId, userId)`
   - `getMajmaahTreesForMap(projectId, userId)`
   - `getLatestAnalysis(projectId, userId)`

2. **Update Majmaah Routes** - Add `authenticateToken` middleware and pass userId:
   ```javascript
   router.get('/majmaah/dashboard-stats', authenticateToken, async (req, res) => {
     const userId = req.user?.userId || null;
     const stats = await db.getMajmaahDashboardStats(projectId, userId);
     // ...
   });
   ```

3. **Create Admin UI Components** (in NDVI calculator):
   - User list page
   - Create/edit user form
   - User-analysis assignment interface
   - Analysis assignment modal/page

4. **Update Majmaah Dashboard**:
   - Replace mock authentication with real API calls
   - Store JWT token in localStorage
   - Send token in Authorization header for all API requests
   - Handle authentication errors

## Usage Example

### Creating a User (Admin):
```javascript
POST /api/users
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "client"
}
```

### Assigning Analysis to User:
```javascript
POST /api/users/1/assign-analysis
{
  "analysisId": 5,
  "notes": "Q4 2025 analysis"
}
```

### User Login:
```javascript
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "securepassword"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client"
    }
  }
}
```

### Accessing Dashboard (with token):
```javascript
GET /api/majmaah/dashboard-stats?projectId=1
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Notes

- JWT tokens expire after 7 days
- Passwords are hashed using bcrypt (10 rounds)
- User assignments are unique (user_id, analysis_id)
- If no userId is provided, all assigned analyses are returned (for admin view)
- If userId is provided, only analyses assigned to that user are returned

