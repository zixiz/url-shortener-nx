// apps/web-app/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}', // If you have an src directory
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // Or if no src:
    // './app/**/*.{js,ts,jsx,tsx,mdx}',
    // './pages/**/*.{js,ts,jsx,tsx,mdx}',
    // './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', 
  theme: {
    extend: {
      // You can extend Tailwind's theme here
      // Example: colors that match your MUI theme if needed for non-MUI elements
      // colors: {
      //   primary: { // Corresponds to MUI primary
      //     light: '...', // amber equivalent
      //     DEFAULT: '...',
      //     dark: '...', // deepOrange equivalent
      //   }
      // }
    },
  },
  plugins: [],
};