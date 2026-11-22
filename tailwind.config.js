/** @type {import('tailwindcss').Config} */
// Moved from the inline `tailwind.config` script in index.html (BUG-021).
module.exports = {
  content: ["./index.html", "./offline.html", "./script.js", "./animations.js"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          900: "#1e3a8a",
        },
        accent: {
          500: "#8b5cf6",
          600: "#7c3aed",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
