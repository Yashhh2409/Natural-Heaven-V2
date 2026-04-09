/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: '#6C8EF7',
        'brand-dark': '#534AB7',
        vacant: '#22c55e',
        occupied: '#ef4444',
        cleaning: '#f59e0b',
        maintenance: '#8892a4',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Fraunces', 'serif'],
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
