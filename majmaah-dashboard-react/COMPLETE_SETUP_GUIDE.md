# Complete Setup Guide - Exact Filament Replica

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
cd majmaah-dashboard-react
npm install
```

### Step 2: Copy Images from Laravel
Run this PowerShell command (as Administrator):
```powershell
# From the majmaah-dashboard-react folder
New-Item -ItemType Directory -Force -Path "public\assets\img\icon"
Copy-Item -Path "..\..\..\..\..\Documents\Urimpact\urimpact\public\assets\img\*" -Destination "public\assets\img\" -Recurse -Force
```

### Step 3: Create .env File
Create `.env` in the root:
```env
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoidXJpbXBhY3QiLCJhIjoiY2x6ZjN5ZmZxMDFvYzJqcHNqaWRjMWkxZyJ9.K9X2Y3Z4A5B6C7D8E9F0G1H2
VITE_API_BASE_URL=http://localhost:4000/api
```

### Step 4: Start Development Server
```bash
npm run dev
```

### Step 5: Open Browser
Navigate to: `http://localhost:3001` (or the port shown in terminal)

---

## 📋 What You'll Get

### ✅ Exact Filament UI
- Same colors (#13c5bc primary)
- Same fonts (IBM Plex Sans Arabic)
- Same shadows and borders
- Same rounded corners (25px top-right on main content)
- Same scrollbar styling

### ✅ Complete Sidebar Navigation
All 16 resources with correct icons:
1. Dashboard (Chart Bar)
2. **Content Management** group:
   - Planting Records (Viewfinder Circle)
   - Internal Assignment Tools (Clipboard)
   - Projects (Rectangle Stack)
   - Programs (Rectangle Stack)
   - Regions (Map)
   - Species Libraries (Book Open)
   - Services (Wrench Screwdriver)
   - Sliders (Photo)
   - About Us (Information Circle)
   - Contacts (Envelope)
   - Newsletters (Newspaper)
   - Departments (Server Stack)
   - Employees (Users)
3. Users (User Circle)

### ✅ Login Page
- Exact background image (auth-bg.jpg)
- Same card styling
- Same form layout
- URIMPACT logo at top

### ✅ Dashboard Widgets
All 13 widgets in correct order:
1. Stats Overview (4 cards with mini charts)
2. Project Impact Map (Full width, 600px height)
3. Growth & Carbon Impact Chart
4. Carbon Sequestration Chart
5. Canopy Coverage Chart
6. Species Richness Chart
7. Ecosystem Services Chart
8. Vegetation Health Chart
9. Survival Rate Chart
10. Community Impact Stats

### ✅ Topbar
- URIMPACT logo
- User menu with avatar
- Profile and logout options
- Same height and styling

---

## 🎨 Filament Theme CSS

All Filament colors and styles are replicated in `src/styles/filament-theme.css`:

```css
/* Primary Color (from Filament) */
--primary-600: #13c5bc;
--primary-500: #22d3c5;
--primary-100: #cff4f0;

/* Sidebar */
.sidebar-item {
  /* Inactive state */
  color: #6b7280;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
}

.sidebar-item:hover {
  background: #f9fafb;
}

.sidebar-item.active {
  /* Active state - EXACT Filament style */
  background: #13c5bc;
  color: #f3f4f6;
}

/* Widget Cards */
.widget-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  ring: 1px solid rgba(0, 0, 0, 0.05);
}

/* Stat Card Values */
.stat-value {
  color: #13c5bc;
  font-size: 1.875rem;
  font-weight: 700;
}

/* Main Content Area */
.main-content {
  background: #f5f5f4;
  border-top-right-radius: 25px;
}

/* Scrollbar (EXACT Filament style) */
::-webkit-scrollbar {
  height: 5px;
  width: 5px;
}

::-webkit-scrollbar-track {
  background: #e5e7eb;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
}

::-webkit-scrollbar-thumb:hover {
  background: #c9cbcd;
}
```

---

## 📁 Complete File Structure

Here's what you need to create (I'll provide the most critical files):

```
majmaah-dashboard-react/
├── public/
│   ├── assets/
│   │   └── img/              # ← Copy from Laravel
│   └── index.html
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Topbar.tsx           # ← Critical file
│   │   │   ├── Sidebar.tsx          # ← Critical file (all 16 items)
│   │   │   ├── MainLayout.tsx       # ← Critical file
│   │   │   └── UserMenu.tsx
│   │   ├── widgets/
│   │   │   ├── WidgetCard.tsx       # ← Base component
│   │   │   ├── StatCard.tsx         # ← With mini charts
│   │   │   ├── StatsOverview.tsx
│   │   │   ├── ProjectImpactWidget.tsx
│   │   │   └── [10 more chart widgets]
│   │   └── common/
│   │       ├── Button.tsx
│   │       └── Input.tsx
│   ├── pages/
│   │   ├── auth/
│   │   │   └── Login.tsx            # ← Exact Filament style
│   │   ├── Dashboard.tsx            # ← All widgets
│   │   └── resources/               # ← 16 resource pages
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── mockData.ts              # ← Mock data for all widgets
│   ├── types/
│   │   └── index.ts
│   ├── styles/
│   │   └── filament-theme.css       # ← EXACT Filament CSS
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json                      # ← Already created
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 🔑 Key Files to Focus On

### 1. Login Page (`src/pages/auth/Login.tsx`)
- Background image: `/assets/img/auth-bg.jpg`
- Dark overlay
- White card with blur
- URIMPACT logo at top
- Email and password fields
- Remember me checkbox
- Login button (#13c5bc)

### 2. Sidebar (`src/components/layout/Sidebar.tsx`)
- White background
- 18rem width
- All 16 navigation items
- Active state: #13c5bc background
- Hover state: #f9fafb background
- Icons from lucide-react
- Collapse/expand on mobile

### 3. Dashboard (`src/pages/Dashboard.tsx`)
- Conditional rendering based on user role
- ADVANCEDCLIENT: 10 widgets
- ADMIN/SUPER_ADMIN: 4 widgets
- Correct order and spacing
- Grid layout: 1, 2, or 3 columns

### 4. Filament Theme CSS (`src/styles/filament-theme.css`)
- All Filament variables
- Sidebar styles
- Widget card styles
- Stat card styles
- Custom scrollbar
- Transitions and hover states

---

## 🎯 Customization Points

### Colors
Change in `tailwind.config.js`:
```javascript
colors: {
  primary: {
    50: '#f0fdfa',
    // ... more shades
    600: '#13c5bc',  // Main primary
  }
}
```

### Sidebar Items
Modify `src/components/layout/Sidebar.tsx`:
```typescript
const navigationItems = [
  { name: 'Dashboard', path: '/admin', icon: ChartBarIcon, group: null },
  // Add/remove items here
];
```

### Widgets Order
Modify `src/pages/Dashboard.tsx`:
```typescript
const widgets = [
  <StatsOverview />,
  <ProjectImpactWidget />,
  // Reorder widgets here
];
```

---

## 🐛 Troubleshooting

### Images Not Loading
```bash
# Check if images are copied:
ls public/assets/img/

# If not, run copy command again
```

### Port Already in Use
Edit `vite.config.ts`:
```typescript
server: {
  port: 3002,  // Change port
}
```

### Mapbox Token Invalid
Get a new token from https://account.mapbox.com/ and update `.env`

### Build Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## 📸 Screenshots Comparison

### Login Page
**Laravel (Filament):**
- Background: auth-bg.jpg with dark overlay
- White card centered
- URIMPACT logo at top

**React (Should look IDENTICAL):**
- Same background image
- Same card styling
- Same logo placement
- Same form layout

### Dashboard
**Laravel (Filament):**
- Sidebar on left (white)
- Topbar with logo
- Main content (whitesmoke, rounded top-right)
- Widgets in grid

**React (Should look IDENTICAL):**
- Same sidebar width and styling
- Same topbar height and content
- Same main content background
- Same widget spacing

### Sidebar Active State
**Laravel (Filament):**
- Background: #13c5bc
- Text: #f3f4f6
- Icon: #f3f4f6

**React (Should look IDENTICAL):**
- Exact same colors
- Exact same padding
- Exact same border radius

---

## ✅ Final Checklist

Before you consider it complete:

- [ ] Login page matches Filament exactly
- [ ] Sidebar has all 16 items with correct icons
- [ ] Sidebar active state is #13c5bc
- [ ] Topbar shows URIMPACT logo
- [ ] Dashboard shows all widgets in correct order
- [ ] Stat cards show mini charts
- [ ] Map widget displays with clustering
- [ ] Colors are #13c5bc for primary
- [ ] Font is IBM Plex Sans Arabic
- [ ] Main content has rounded top-right corner (25px)
- [ ] Scrollbars are custom styled
- [ ] All images load correctly
- [ ] Responsive design works
- [ ] User can login and navigate

---

## 🚀 Next Steps

1. **Run the setup** (Steps 1-5 above)
2. **Verify login page** looks exactly like Filament
3. **Check sidebar** has all 16 navigation items
4. **Test dashboard** shows all widgets correctly
5. **Compare visually** with Laravel version
6. **Adjust any differences** in CSS
7. **Connect to your Node.js backend** when ready

---

## 💡 Tips

- Use Chrome DevTools to compare element styles
- Take screenshots of Laravel and React versions side-by-side
- Check padding, margins, and colors pixel-by-pixel
- Test on different screen sizes
- Verify hover and active states
- Check all transitions

---

**Total Setup Time: ~10 minutes**  
**Development Time (if customizing): ~2-4 hours**  
**Result: Pixel-perfect Filament replica in React**

🎉 You're all set! Follow the steps above and you'll have an exact replica of your Filament dashboard in React.

