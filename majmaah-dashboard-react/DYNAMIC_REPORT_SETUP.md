# 📊 Dynamic Report Generation - Complete Setup Guide

## ✅ What Has Been Implemented

A **dynamic report generator** has been created that generates reports with **live data from the Majmaah Dashboard**. The report includes:

- ✅ **Real-time statistics** (Trees Planted, Carbon Sequestration, Survival Rate, Communities Supported)
- ✅ **All chart data** (Carbon Trends, Canopy Coverage, Species Richness, Ecosystem Services, etc.)
- ✅ **NDVI/EVI trends** (if available)
- ✅ **Vegetation Health Index** (if available)
- ✅ **AGC Trends** (if available)
- ✅ **PDF generation** with professional formatting
- ✅ **Print functionality**

---

## 🎯 How It Works

### User Flow:
1. User clicks **"Generate detailed report"** button
2. Modal opens and **fetches all dashboard data** from the NDVI backend
3. Report displays with **live data** in tables
4. User can:
   - ✅ **View the report** in the modal
   - ✅ **Download as PDF** (with date in filename)
   - ✅ **Print the report**

### Technical Flow:
```
Click Button
  → DynamicReportModal opens
    → Fetches all dashboard data in parallel:
      - Dashboard stats
      - Carbon trends
      - Canopy coverage
      - Species richness
      - Ecosystem services
      - Vegetation health
      - Survival rate
      - Growth & carbon impact
      - NDVI trends (optional)
      - EVI trends (optional)
      - Vegetation Health Index (optional)
      - AGC trends (optional)
    → Renders HTML report with live data
      → User can download PDF or print
```

---

## 📁 Files Created/Updated

### New Files:
- ✅ `src/components/DynamicReportModal.tsx` - Main dynamic report component

### Updated Files:
- ✅ `src/pages/Dashboard.tsx` - Now uses `DynamicReportModal` instead of static PDF
- ✅ `package.json` - Added `html2pdf.js` dependency

---

## 🔧 Dependencies

### Installed:
- ✅ `html2pdf.js` - For PDF generation from HTML

### Already Available:
- ✅ `axios` - For API calls
- ✅ `react` - React framework
- ✅ `lucide-react` - Icons

---

## 📊 Report Sections

The dynamic report includes:

1. **Report Header**
   - Title: "Majmaah University Tree Planting Project Dashboard Report"
   - Generation date/time

2. **Key Statistics** (4 stat boxes)
   - Trees Planted
   - Carbon Sequestration (tons CO₂)
   - Survival Rate (%)
   - Communities Supported

3. **Carbon Sequestration Trends** (Table)
   - Monthly carbon sequestration data

4. **Canopy Coverage Distribution** (Table)
   - Coverage ranges and percentages

5. **Species Richness** (Table)
   - Species names and counts

6. **Ecosystem Services Scores** (Table)
   - Service names and scores

7. **Vegetation Health Distribution** (Table)
   - Condition categories and percentages

8. **Survival Rate Over Time** (Table)
   - Yearly survival rates

9. **Growth and Carbon Impact** (Table)
   - Monthly growth and carbon data

10. **NDVI Trends** (Table, if available)
    - Monthly NDVI values

11. **EVI Trends** (Table, if available)
    - Monthly EVI values

12. **Vegetation Health Index** (Table, if available)
    - Category values

13. **AGC Trends** (Table, if available)
    - Monthly AGC values

14. **Report Footer**
    - Generation note
    - Contact information

---

## 🚀 How to Use

### Step 1: Ensure Backend is Running
```bash
cd ndvi-calculatorr/server
npm start
```

### Step 2: Run React Dashboard
```bash
cd majmaah-dashboard-react
npm run dev
```

### Step 3: Generate Report
1. Login as **ADVANCEDCLIENT** user
2. Navigate to Dashboard
3. Click **"Generate detailed report"** button
4. Wait for data to load (shows loading spinner)
5. Review the report with live data
6. Click **"Download PDF"** or **"Print"**

---

## 🎨 Report Styling

The report uses:
- **Professional table styling** with alternating row colors
- **Bordered tables** for clarity
- **Bold headers** for sections
- **Proper spacing** between sections
- **Print-friendly** formatting
- **PDF-optimized** layout

---

## ✅ Features

| Feature | Status |
|---------|--------|
| Fetches live dashboard data | ✅ |
| Displays all statistics | ✅ |
| Shows all chart data in tables | ✅ |
| PDF generation | ✅ |
| Print functionality | ✅ |
| Professional formatting | ✅ |
| Error handling | ✅ |
| Loading states | ✅ |
| Responsive design | ✅ |

---

## 🐛 Troubleshooting

### Issue: Report shows "Failed to fetch dashboard data"
**Solution:**
- Ensure NDVI backend is running on port 3000
- Check browser console for API errors
- Verify backend endpoints are accessible
- Check CORS settings if needed

### Issue: PDF generation fails
**Solution:**
- Check browser console for errors
- Ensure `html2pdf.js` is installed: `npm install html2pdf.js`
- Try printing instead (browser's native print)

### Issue: Some data sections are empty
**Solution:**
- This is normal if backend doesn't have that data yet
- Only sections with data will be displayed
- Check backend API responses in browser console

### Issue: Tables don't render properly in PDF
**Solution:**
- Tables use inline styles for PDF compatibility
- If issues persist, try printing instead
- Check browser compatibility (Chrome/Edge work best)

---

## 📝 Notes

- **Data Source**: Report fetches data from `/api/majmaah/*` endpoints
- **Real-time**: Data is fetched when modal opens (not cached)
- **Fallback**: If API fails, shows error message with retry option
- **Optional Sections**: NDVI/EVI/AGC sections only show if data is available
- **PDF Quality**: Uses high-quality settings (scale: 2, quality: 0.98)

---

## 🔄 Future Enhancements (Optional)

1. **Chart Images**: Capture chart images and include in PDF
2. **Map Screenshots**: Include map widget screenshot
3. **Custom Branding**: Add logos and custom styling
4. **Email Export**: Send report via email
5. **Scheduled Reports**: Auto-generate reports on schedule
6. **Report Templates**: Multiple report templates/styles

---

## ✨ Summary

✅ **Dynamic report generator** created  
✅ **Fetches live dashboard data** from NDVI backend  
✅ **Displays all statistics and chart data** in tables  
✅ **PDF generation** with professional formatting  
✅ **Print functionality** for easy sharing  
✅ **Error handling** and loading states  
✅ **Professional styling** for reports  

**The feature is ready to use!** Just restart your React dev server and test the "Generate detailed report" button - it will now show live data from your dashboard!

