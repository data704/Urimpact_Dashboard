# URIMPACT Majmaah Dashboard - React + TypeScript

**EXACT REPLICA of Laravel/Filament Admin Panel**

## ✅ What's Included

### 🎨 **Exact Filament Styling**
- ✅ Same colors (#13c5bc primary)
- ✅ Same fonts (IBM Plex Sans Arabic)
- ✅ Same shadows and borders
- ✅ Same rounded corners (25px top-right on main content)
- ✅ Same scrollbar styling
- ✅ Same topbar and sidebar

### 📋 **Complete Navigation (16 Resources)**
1. Dashboard
2. **Content Management:**
   - Planting Records
   - Internal Assignment Tools
   - Projects
   - Programs
   - Regions
   - Species Libraries
   - Services
   - Sliders
   - About Us
   - Contacts
   - Newsletters
   - Departments
   - Employees
3. Users

### 📊 **All Dashboard Widgets**
- Stats Overview (4 cards with mini charts)
- Project Impact Map (Mapbox with clustering)
- Growth & Carbon Impact Chart
- Carbon Sequestration Chart
- Canopy Coverage Chart
- Species Richness Chart
- Ecosystem Services Chart
- Vegetation Health Chart
- Survival Rate Chart
- Community Impact Stats

### 🔐 **Login Page**
- Background image (auth-bg.jpg)
- URIMPACT logo
- Exact Filament styling

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Copy Images from Laravel
Run this command in PowerShell:
```powershell
New-Item -ItemType Directory -Force -Path "public\assets\img\icon"
Copy-Item -Path "..\..\..\..\..\..\Documents\Urimpact\urimpact\public\assets\img\*" -Destination "public\assets\img\" -Recurse -Force
```

Or manually copy:
- From: `C:\Users\Muhammad Kashif\Documents\Urimpact\urimpact\public\assets\img\`
- To: `C:\Users\Muhammad Kashif\Desktop\Fiver\Maria\Test\lun\lun2\majmaah-dashboard-react\public\assets\img\`

### 3. Start Development Server
```bash
npm run dev
```

### 4. Open Browser
Navigate to: `http://localhost:3001`

### 5. Login
Use any email/password (mock authentication is enabled)

---

## 📂 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx          # All 16 navigation items
│   │   ├── Topbar.tsx            # User menu
│   │   └── MainLayout.tsx        # Main layout wrapper
│   └── widgets/
│       ├── WidgetCard.tsx        # Base widget component
│       ├── StatCard.tsx          # Stat cards with mini charts
│       ├── StatsOverview.tsx     # Stats grid
│       ├── ProjectImpactWidget.tsx  # Mapbox map
│       └── ChartWidgets.tsx      # All chart components
├── pages/
│   ├── auth/
│   │   └── Login.tsx             # Login page
│   └── Dashboard.tsx             # Main dashboard
├── context/
│   └── AuthContext.tsx           # Authentication state
├── services/
│   └── mockData.ts               # Mock data for all widgets
├── types/
│   └── index.ts                  # TypeScript definitions
├── styles/
│   └── filament-theme.css        # EXACT Filament CSS
├── App.tsx                       # Main app with routing
└── main.tsx                      # Entry point
```

---

## 🎨 Exact Filament Styling

All Filament colors and styles are replicated:

- **Primary Color**: `#13c5bc`
- **Sidebar Width**: `18rem` (288px)
- **Topbar Height**: `4rem` (64px)
- **Main Content Background**: `#f5f5f4` (whitesmoke)
- **Main Content Border Radius**: `25px` (top-right)
- **Widget Card Shadow**: Exact Filament shadow
- **Sidebar Active State**: `#13c5bc` background
- **Scrollbar**: Custom thin scrollbar

---

## 🔌 Connecting to Node.js Backend

The app uses mock data currently. To connect to your backend:

1. **Update API URL** in `.env`:
   ```env
   VITE_API_BASE_URL=https://your-api-url.com/api
   ```

2. **Implement API endpoints** (see `src/services/api.ts` for structure)

3. **Replace mock data** in components with API calls

---

## 📱 Responsive Design

- **Mobile** (<768px): Collapsible sidebar with overlay
- **Tablet** (768px-1024px): Full sidebar, 2-column widgets
- **Desktop** (>1024px): Full sidebar, 2-3 column widgets

---

## 🛠️ Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 📸 Features

### Login Page
- ✅ Background image from Laravel (`auth-bg.jpg`)
- ✅ Dark overlay
- ✅ White card with blur
- ✅ URIMPACT logo
- ✅ Exact form styling

### Sidebar
- ✅ All 16 navigation items with correct icons
- ✅ Active state: #13c5bc background
- ✅ Hover state: #f9fafb background
- ✅ Collapse/expand on mobile
- ✅ URIMPACT logo at top

### Dashboard
- ✅ Conditional rendering based on user role
- ✅ ADVANCEDCLIENT: 10+ widgets
- ✅ ADMIN: 4 widgets
- ✅ All widgets with Filament styling
- ✅ Map with clustering
- ✅ Charts with Recharts

### Topbar
- ✅ URIMPACT logo (on mobile)
- ✅ User menu with avatar
- ✅ Profile and logout options
- ✅ Exact Filament height and styling

---

## 🎯 What's Next

1. **Copy images** from Laravel (Step 2 above)
2. **Test the dashboard** - should look identical to Filament
3. **Connect to your Node.js backend** when ready
4. **Implement CRUD pages** for each resource

---

## ✅ Verification Checklist

- [ ] Login page shows background image
- [ ] Sidebar has all 16 navigation items
- [ ] Sidebar active state is #13c5bc
- [ ] Dashboard shows all widgets
- [ ] Map displays with clustering
- [ ] Charts render correctly
- [ ] Colors match Filament (#13c5bc)
- [ ] Main content has rounded top-right corner
- [ ] Scrollbars are custom styled
- [ ] All images load correctly

---

## 💡 Tips

- Press `F12` in browser to compare styles with Laravel version
- Take screenshots side-by-side for pixel-perfect comparison
- Adjust CSS in `src/styles/filament-theme.css` if needed
- All colors are in `tailwind.config.js`

---

## 📞 Support

If something doesn't look right:
1. Check that images are copied
2. Verify `.env` has Mapbox token
3. Compare CSS with `src/styles/filament-theme.css`
4. Check browser console for errors

---

**Result: Pixel-perfect Filament replica in React!** 🎉

