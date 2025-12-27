# Copy Images from Laravel to React

## Quick Command (Run in PowerShell from project root)

```powershell
# Navigate to the React project
cd "C:\Users\Muhammad Kashif\Desktop\Fiver\Maria\Test\lun\lun2\majmaah-dashboard-react"

# Create public/assets/img directory
New-Item -ItemType Directory -Force -Path "public\assets\img\icon"

# Copy all images from Laravel public/assets/img to React
Copy-Item -Path "C:\Users\Muhammad Kashif\Documents\Urimpact\urimpact\public\assets\img\*" -Destination "public\assets\img\" -Recurse -Force

Write-Host "✅ All images copied successfully!" -ForegroundColor Green
```

## Manual Steps (if command fails)

1. Create folders in React project:
   ```
   majmaah-dashboard-react/public/assets/img/
   majmaah-dashboard-react/public/assets/img/icon/
   ```

2. Copy from Laravel:
   ```
   C:\Users\Muhammad Kashif\Documents\Urimpact\urimpact\public\assets\img\
   ```

3. Paste to React:
   ```
   C:\Users\Muhammad Kashif\Desktop\Fiver\Maria\Test\lun\lun2\majmaah-dashboard-react\public\assets\img\
   ```

## Required Images Checklist

- [ ] URIMPACT_LOGO.png
- [ ] URIMPACT_LOGO_WHITE.png
- [ ] auth-bg.jpg
- [ ] favicon.ico
- [ ] about.jpg
- [ ] carousel-1.jpg
- [ ] carousel-2.jpg
- [ ] service-1.jpg through service-6.jpg
- [ ] team-1.jpg, team-2.jpg, team-3.jpg
- [ ] testimonial-1.jpg, testimonial-2.jpg
- [ ] project-impact.jpeg
- [ ] map-placeholder.png
- [ ] reports-map-placeholder.png
- [ ] icon/icon-1.png through icon/icon-10.png
- [ ] icon/tree-icon.png
- [ ] icon/tree.png

