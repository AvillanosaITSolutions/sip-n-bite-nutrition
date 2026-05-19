import flowbite from "flowbite-react/tailwind";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}", flowbite.content()],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        display: ['"Fraunces"', '"DM Serif Display"', "Georgia", "serif"],
        script: ['"Caveat"', "cursive"],
      },
    },
  },
  plugins: [flowbite.plugin()],
};
