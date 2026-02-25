/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'axiom-purple': '#8B5CF6',
        'axiom-blue': '#3B82F6',
        'aurelia-green': '#10B981',
        'aurelia-orange': '#F59E0B',
      },
    },
  },
  plugins: [],
};
