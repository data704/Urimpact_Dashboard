# URIMPACT Dashboard - Exact Laravel/Filament Replica in React

## 🎯 Project Goal
Create a **pixel-perfect replica** of the Laravel/Filament dashboard in React + TypeScript with:
- ✅ Same sidebar navigation (16 resources)
- ✅ Same topbar with user menu  
- ✅ Exact Filament styling and colors
- ✅ Same login page with background image
- ✅ All dashboard widgets
- ✅ Same images and assets
- ✅ Identical layout and spacing

---

## 📋 Complete Navigation Structure

### 1. **Dashboard** (Home Page)
- Icon: Chart Bar
- Path: `/admin`
- Role: All authenticated users
- Widgets: 13 different charts and stats

### 2. **Content Management** (Navigation Group)

#### **Planting Records**
- Icon: Viewfinder Circle  
- Path: `/admin/planting-records`
- Role: SUPER_ADMIN, ADMIN, FIELDCREW
- Features: Create, View, Edit, Approve/Reject

#### **Internal Assignment Tools** (Plants Assignments)
- Icon: Clipboard Document List
- Path: `/admin/internal-assignment-tools`
- Role: All users
- Features: Assign trees to clients

#### **Projects**
- Icon: Rectangle Stack
- Path: `/admin/projects`
- Role: SUPER_ADMIN
- Features: Manage tree planting projects

#### **Programs**  
- Icon: Rectangle Stack
- Path: `/admin/programs`
- Role: SUPER_ADMIN
- Features: Organize projects into programs

#### **Regions**
- Icon: Map
- Path: `/admin/regions`
- Role: SUPER_ADMIN
- Features: Geographic regions

#### **Species Libraries**
- Icon: Book Open
- Path: `/admin/species-libraries`
- Role: All users
- Features: Tree species database

#### **Services**
- Icon: Wrench Screwdriver
- Path: `/admin/services`
- Role: SUPER_ADMIN
- Features: Service offerings

#### **Sliders**
- Icon: Photo
- Path: `/admin/sliders`
- Role: SUPER_ADMIN
- Features: Homepage sliders

#### **About Us**
- Icon: Information Circle
- Path: `/admin/about-us`
- Role: SUPER_ADMIN
- Features: About page content

#### **Contacts**
- Icon: Envelope
- Path: `/admin/contacts`
- Role: All users
- Features: Contact messages

#### **Newsletters**
- Icon: Newspaper
- Path: `/admin/newsletters`
- Role: All users
- Features: Newsletter subscriptions

#### **Departments**
- Icon: Server Stack
- Path: `/admin/departments`
- Role: Clients only
- Features: Organizational departments

#### **Employees**
- Icon: Users
- Path: `/admin/employees`
- Role: Clients
- Features: Employee management

### 3. **Users**
- Icon: User Circle
- Path: `/admin/users`
- Role: SUPER_ADMIN only
- Features: User management

---

## 🎨 Exact Styling Requirements

### Colors (from Laravel Filament theme)
```css
--primary-50: oklch(0.971 0.013 17.38);
--primary-100: oklch(0.936 0.032 17.717);
/* ... more shades */
--primary-600: #13c5bc; /* Main primary color */

--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
--gray-950: #030712;
```

### Topbar
- Background: White (`#ffffff`)
- Height: `4rem` (64px)
- Shadow: `0 1px 3px 0 rgba(0, 0, 0, 0.1)`
- Padding: `1rem 1.5rem`
- Brand logo height: `2.8rem`

### Sidebar
- Width: `18rem` (288px)
- Background: White (`#ffffff`)
- Border right: `1px solid #e5e7eb`
- Scrollbar: Thin, custom styled

#### Sidebar Item (Inactive)
- Padding: `0.75rem 1rem`
- Text color: `#6b7280`
- Hover background: `#f9fafb`
- Border radius: `0.375rem`

#### Sidebar Item (Active)
- Background: `#13c5bc` (primary-600)
- Text color: `#f3f4f6` (gray-100)
- Icon color: `#f3f4f6`
- Border radius: `0.375rem`

### Main Content Area
- Background: `#f5f5f4` (whitesmoke)
- Border radius top-right: `25px`
- Padding: `1.5rem`

### Widget Cards
- Background: White
- Border radius: `0.75rem` (12px)
- Shadow: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)`
- Padding: `1.5rem`
- Ring: `1px solid rgba(0, 0, 0, 0.05)`

### Stat Cards
- Same as widget cards
- Value color: `#13c5bc` (primary-600)
- Value font size: `1.875rem` (30px)
- Value font weight: `700` (bold)

---

## 📦 Dashboard Widgets (Order & Visibility)

### For ADVANCEDCLIENT Role:
1. **AdvancedClientStatsOverview** (4 stat cards)
   - Trees Planted
   - Carbon Sequestration  
   - Survival Rate
   - Communities Supported

2. **ProjectImpactWidget** (Full width map)
   - Majmaah University Tree Map
   - Height: 600px
   - With clustering

3. **GrowthCarbonImpactChart**
   - Dual-axis chart
   - Growth (line) + Carbon (bar)

4. **CarbonSequestrationChart**
   - Line chart
   - Monthly data

5. **CanopyCoverageChart**
   - Pie chart
   - Coverage distribution

6. **SpeciesRichnessChart**
   - Bar chart
   - Species counts

7. **EcosystemServicesChart**
   - Radar chart
   - 5 metrics

8. **VegetationHealthChart**
   - Pie chart
   - Health conditions

9. **SurvivalRateChart**
   - Line chart
   - Yearly trends

10. **CommunityImpactStatsOverview**
    - Additional stats cards

### For ADMIN/SUPER_ADMIN Role:
11. **StatsOverview** (3 stat cards)
    - Planting Records
    - Species Libraries
    - Crew Members

12. **PlantingRecordsChart**
    - Bar chart

13. **PlantedSpeciesChart**
    - Bar chart

14. **CarbonEmissionBarChart**
    - Bar chart

---

## 🖼️ Required Images & Assets

### From `public/assets/img/`:
```
✅ URIMPACT_LOGO.png
✅ URIMPACT_LOGO_WHITE.png
✅ auth-bg.jpg (login background)
✅ favicon.ico
✅ about.jpg
✅ carousel-1.jpg
✅ carousel-2.jpg
✅ service-1.jpg through service-6.jpg
✅ team-1.jpg, team-2.jpg, team-3.jpg
✅ testimonial-1.jpg, testimonial-2.jpg
✅ project-impact.jpeg
✅ map-placeholder.png
✅ reports-map-placeholder.png

Icon folder:
✅ icon-1.png through icon-10.png
✅ tree-icon.png
✅ tree.png
```

---

## 🔐 Login Page Specifications

### Layout
- Background image: `auth-bg.jpg` (full screen)
- Overlay: Dark overlay with opacity 0.5
- Card centered on screen
- Card background: White with blur
- Card width: `28rem` (448px)
- Card padding: `2rem`
- Border radius: `0.75rem`

### Logo
- URIMPACT_LOGO.png
- Height: `3rem`
- Centered above card

### Form Fields
1. **Email Input**
   - Label: "Email"
   - Type: email
   - Required
   - Placeholder: "Enter your email"
   - Border: `1px solid #e5e7eb`
   - Focus border: `#13c5bc`

2. **Password Input**
   - Label: "Password"
   - Type: password
   - Required
   - Placeholder: "Enter your password"
   - Border: `1px solid #e5e7eb`
   - Focus border: `#13c5bc`

3. **Remember Me Checkbox**
   - Label: "Remember me"
   - Checkbox color: `#13c5bc`

4. **Login Button**
   - Background: `#13c5bc`
   - Text: White
   - Width: Full
   - Height: `2.5rem`
   - Border radius: `0.375rem`
   - Hover: Slightly darker

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
  - Sidebar: Hidden, toggle with hamburger menu
  - Topbar: Show hamburger icon
  - Widgets: Single column grid
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  - Sidebar: Collapsible
  - Widgets: 2-column grid
}

/* Desktop */
@media (min-width: 1025px) {
  - Sidebar: Always visible
  - Widgets: 2-3 column grid
  - Full width for map widget
}
```

---

## 🚀 Implementation Steps

### Phase 1: Setup & Structure (1 hour)
- [x] Create React + TypeScript + Vite project
- [x] Install dependencies (React Router, Tailwind, Mapbox, Recharts)
- [x] Copy all images from Laravel `public/assets/` to React `public/assets/`
- [x] Set up routing structure
- [x] Create authentication context

### Phase 2: Authentication & Layout (2 hours)
- [ ] Create exact login page with background image
- [ ] Create main layout with Filament styling:
  - Topbar component
  - Sidebar component with all 16 navigation items
  - Main content area with rounded corner
- [ ] User menu with profile and logout

### Phase 3: Dashboard Widgets (4 hours)
- [ ] Create WidgetCard component (Filament-styled)
- [ ] Create StatCard component
- [ ] Implement all 13 widgets with exact styling
- [ ] Match Recharts colors to Filament theme
- [ ] Implement Mapbox map widget with clustering

### Phase 4: Resource Pages (4 hours)
- [ ] Create list/table view template (Filament-styled)
- [ ] Create form view template
- [ ] Create view/details template
- [ ] Implement placeholders for all 16 resources

### Phase 5: Styling & Polish (2 hours)
- [ ] Match exact colors from Filament theme
- [ ] Custom scrollbars
- [ ] Hover states and transitions
- [ ] Loading states
- [ ] Empty states

### Phase 6: Integration & Testing (1 hour)
- [ ] Connect to mock API
- [ ] Test all routes
- [ ] Test responsive design
- [ ] Fix any styling discrepancies

---

## 📂 Final File Structure

```
majmaah-dashboard-react/
├── public/
│   ├── assets/
│   │   └── img/
│   │       ├── URIMPACT_LOGO.png
│   │       ├── URIMPACT_LOGO_WHITE.png
│   │       ├── auth-bg.jpg
│   │       ├── favicon.ico
│   │       └── ... (all other images)
│   └── index.html
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Topbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MainLayout.tsx
│   │   │   └── UserMenu.tsx
│   │   ├── widgets/
│   │   │   ├── WidgetCard.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── StatsOverview.tsx
│   │   │   ├── ProjectImpactWidget.tsx
│   │   │   ├── CarbonSequestrationChart.tsx
│   │   │   └── ... (11 more widgets)
│   │   ├── mapbox/
│   │   │   └── MapboxMap.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Card.tsx
│   ├── pages/
│   │   ├── auth/
│   │   │   └── Login.tsx
│   │   ├── Dashboard.tsx
│   │   └── resources/
│   │       ├── PlantingRecords/
│   │       ├── Projects/
│   │       ├── Programs/
│   │       └── ... (13 more resources)
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useNavigate.ts
│   ├── services/
│   │   ├── api.ts
│   │   └── mockData.ts
│   ├── types/
│   │   └── index.ts
│   ├── styles/
│   │   └── filament-theme.css
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## ✅ Quality Checklist

Before considering the project complete, verify:

- [ ] Login page looks identical to Filament
- [ ] Sidebar has all 16 resources with correct icons
- [ ] Sidebar active state matches Filament exactly
- [ ] Topbar matches Filament styling
- [ ] Dashboard widgets display in correct order
- [ ] All stat cards show mini charts
- [ ] Map widget displays with clustering
- [ ] Colors match Filament theme (`#13c5bc` primary)
- [ ] Font is IBM Plex Sans Arabic
- [ ] Widget cards have correct shadows and borders
- [ ] Scrollbars are custom styled
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] All images load correctly
- [ ] Navigation works smoothly
- [ ] User menu displays correctly

---

## 🎯 Success Criteria

The project is complete when:
1. A user cannot tell the difference between Laravel and React versions by looking at them
2. All navigation items are present and functional
3. All widgets display with correct data (mock or real)
4. Login page is indistinguishable from Filament
5. Sidebar, topbar, and main content match pixel-perfect
6. Colors, fonts, spacing are identical
7. All images display correctly
8. Responsive design works seamlessly

---

**Total Estimated Time: 14 hours of development**

**Total Files to Create: ~100 files**

**Lines of Code: ~15,000 LOC**

This is a substantial project but completely achievable. The result will be a production-ready React dashboard that perfectly replicates your Filament administration panel.

