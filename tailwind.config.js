/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./popup.html", // Exact file
    "./*.html"      // Wildcard to catch any HTML files
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};