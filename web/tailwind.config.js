/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pink:    '#F9A8C9',
          lavender:'#C9A8EC',
          violet:  '#9B9AEE',
          // 버튼/액센트용 약간 진한 톤
          dark:    '#8B7FE8',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #F9A8C9 0%, #C9A8EC 50%, #9B9AEE 100%)',
        'brand-gradient-r': 'linear-gradient(to right, #F9A8C9, #C9A8EC, #9B9AEE)',
      },
    },
  },
  plugins: [],
}
