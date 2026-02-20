/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          deep: '#1A3828',
          mid: '#2D5A3D',
          light: '#4A7C5C',
          soft: '#E8F0EB',
        },
        gold: {
          dark: '#8B6914',
          DEFAULT: '#C49A28',
          light: '#E8C547',
          pale: '#F5E9B0',
        },
        ivory: {
          DEFAULT: '#F5EDD6',
          dark: '#EDE0C4',
          darker: '#DDD0B0',
        },
        parchment: '#FAF5E9',
      },
      fontFamily: {
        display: ['"Amiri"', 'Georgia', 'serif'],
        body: ['"Lato"', 'system-ui', 'sans-serif'],
        arabic: ['"Amiri"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
