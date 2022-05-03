module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
    minWidth: {
      200: '200px',
      250: '250px',
      300: '300px',
      400: '400px',
      '1/2': '50%',
      '1/3': '33%',
    },
    minHeight: {
      '1/3': '33%',
      '1/2': '50%',
      '2/3': '66%'
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
