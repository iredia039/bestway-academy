/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#0140AA", dark: "#012F80" },
        ink: "#0F2557",
        mist: "#EEF3FD",
        line: "#D3DFF5",
        ok: "#1F8A4C",
        danger: "#C0262D",
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
