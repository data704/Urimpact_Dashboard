# User Management UI - Admin Dashboard

## Overview
The admin UI for user management has been added to the NDVI Calculator application. Admins can now create users, manage their accounts, and assign specific analyses to each user.

## New Components

### 1. User Management (`/components/UserManagement`)
**Location:** `client/src/components/UserManagement/`

**Features:**
- Create new users (name, email, password, role)
- View all users in a table
- Edit user details (name, email, password, role, status)
- Delete users
- Activate/deactivate users
- Admin authentication (login required)

**Usage:**
1. Click on "👥 User Management" tab
2. Login with admin credentials when prompted:
   - Email: `admin@urimpact.com`
   - Password: `admin123`
3. Click "Create New User" to add a new user
4. Use Edit/Delete buttons to manage existing users

### 2. User Assignments (`/components/UserAssignments`)
**Location:** `client/src/components/UserAssignments/`

**Features:**
- Select a user from dropdown
- View analyses already assigned to that user
- Assign new analyses from available analyses
- Remove analysis assignments
- Bulk assign multiple analyses
- Search/filter available analyses

**Usage:**
1. Click on "🔗 User Assignments" tab
2. Select a user from the dropdown
3. View assigned analyses in the top section
4. Assign new analyses from the "Available Analyses" section
5. Use "Assign All Available" for bulk assignment

## Updated Components

### Admin Assignments
- Updated to use authentication token
- Shares token with User Management component via localStorage

## Navigation

The app now has 4 tabs:
1. **🛰️ GEE Analysis** - Run baseline assessments
2. **📊 Admin Assignments** - Assign analyses to Majmaah dashboard
3. **👥 User Management** - Create and manage users
4. **🔗 User Assignments** - Assign analyses to specific users

## Authentication Flow

1. When accessing User Management or User Assignments, you'll be prompted to login
2. Login credentials are stored in `localStorage` as `admin_token`
3. Token is shared across all admin components
4. Token expires after 7 days (backend setting)

## API Integration

All components use the backend API at `http://localhost:3000/api`:

### User Management Endpoints:
- `POST /api/auth/login` - Admin login
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### User Assignment Endpoints:
- `GET /api/users/:userId/assigned-analyses` - Get user's assigned analyses
- `POST /api/users/:userId/assign-analysis` - Assign analysis to user
- `DELETE /api/users/:userId/assignments/:analysisId` - Remove assignment
- `POST /api/users/:userId/bulk-assign` - Bulk assign analyses

## Default Admin Credentials

- **Email:** `admin@urimpact.com`
- **Password:** `admin123`

⚠️ **Change this password in production!**

## Workflow

### Complete User Management Workflow:

1. **Create Users:**
   - Go to "User Management" tab
   - Click "Create New User"
   - Fill in user details (name, email, password, role)
   - Click "Create User"

2. **Assign Analyses to Users:**
   - Go to "User Assignments" tab
   - Select a user from dropdown
   - View their current assignments
   - Assign new analyses from "Available Analyses"
   - Users will only see analyses assigned to them

3. **User Login (Majmaah Dashboard):**
   - User logs in with their credentials
   - Dashboard shows only analyses assigned to them
   - Data is filtered based on user assignments

## Testing

1. Start the backend server:
   ```bash
   cd server
   npm start
   ```

2. Start the NDVI calculator client:
   ```bash
   cd client
   npm run dev
   ```

3. Test the flow:
   - Login as admin in User Management
   - Create a test user
   - Assign analyses to that user
   - Test login with the new user credentials in Majmaah dashboard

## Notes

- Admin users don't need analysis assignments (they see all analyses)
- Client users only see analyses assigned to them
- Inactive users cannot login
- Token is stored in localStorage and shared across tabs
- All API calls include Authorization header with Bearer token

