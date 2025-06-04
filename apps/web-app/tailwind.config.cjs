 // tailwind.config.cjs
 const { join } = require('path'); // Use require here, as this is a .cjs file

 /** @type {import('tailwindcss').Config} */
 module.exports = {
   darkMode: 'class',
   content: [
     join(__dirname, 'src/app/**/*.{js,ts,jsx,tsx,mdx}'), // Use join for robust paths
     join(__dirname, 'src/components/**/*.{js,ts,jsx,tsx,mdx}'),
   ],
   theme: {
     extend: {},
   },
   plugins: [],
 };