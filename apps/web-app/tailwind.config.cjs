 // tailwind.config.cjs
 const { join } = require('path');

 /** @type {import('tailwindcss').Config} */
 module.exports = {
   darkMode: 'class',
   content: [
     join(__dirname, 'src/app/**/*.{js,ts,jsx,tsx,mdx}'), 
     join(__dirname, 'src/components/**/*.{js,ts,jsx,tsx,mdx}'),
   ],
   theme: {
     extend: {},
   },
   plugins: [],
 };