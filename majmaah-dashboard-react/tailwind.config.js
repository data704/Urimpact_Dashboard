/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdfa',
          100: '#cff4f0',
          200: '#9fe9e1',
          300: '#70ded1',
          400: '#40d3c2',
          500: '#22d3c5',
          600: '#13c5bc',
          700: '#109c95',
          800: '#0d736e',
          900: '#094a46',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'filament': '25px',
      },
    },
  },
  plugins: [],
}

