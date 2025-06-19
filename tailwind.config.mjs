/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        blackhan: ['"Black Han Sans"', 'sans-serif'],
        pretendard: ['Pretendard', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 