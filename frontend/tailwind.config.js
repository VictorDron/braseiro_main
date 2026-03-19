/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#d4dfcf',
          100: '#c5d4be',
          200: '#b0c4a8',
          300: '#9cac94',
          400: '#8a9c84',
          500: '#81917c',
          600: '#747c6c',
          700: '#6c7c6c',
          800: '#435341',
          900: '#24301c',
          950: '#081208',
        },
        dark: {
          50: '#F9FAF9',
          100: '#eeeeee',
          200: '#e0e0e0',
          300: '#c2c2c2',
          400: '#999999',
          500: '#777777',
          600: '#555555',
          700: '#333333',
          800: '#1c2c1c',
          900: '#222222',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};
