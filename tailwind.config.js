/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/react/**/*.{js,jsx,ts,tsx}",
  ],
  corePlugins: {
    // Don't inject Tailwind's preflight reset — the existing global.css
    // manages its own box-model and element defaults.
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};
