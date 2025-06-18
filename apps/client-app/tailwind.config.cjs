/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Main HTML file for Vite (relative to this config file)
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  darkMode: 'class', 
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans, 'Noto Sans'],
      },
    },
  },
  plugins: [],
};