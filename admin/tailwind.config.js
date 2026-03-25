/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          bg: '#0c0c0c',
          card: '#1a1a1a',
          sidebar: '#111111',
          accent: '#c026d3', // Fuchsia
          yellow: '#f59e0b', // Amber/Gold
        }
      }
    },
  },
  plugins: [],
}
