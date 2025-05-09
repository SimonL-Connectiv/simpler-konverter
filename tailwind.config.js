const colors = require('tailwindcss/colors');
const flowbiteReact = require("flowbite-react/plugin/tailwindcss");

module.exports = {
  content: [
    './src/renderer/**/*.{js,jsx,ts,tsx,ejs}',
    './node_modules/flowbite/**/*.js',
    './node_modules/flowbite-react/**/*.js',
    ".flowbite-react\\class-list.json"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sky: colors.sky,
        cyan: colors.cyan,
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin'),
    require('flowbite-react/plugin'),
    flowbiteReact
  ],
};