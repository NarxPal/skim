import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dash_dark: "#16151A",
        icon_col: "#A0A0A2",
        gray_col: "#212024",

        border_col: "#1A1B1D",
        dash_bg: "#101010",
        inner_box: "#131416",
        light_gray: "#202123",
      },
    },
  },
  plugins: [],
} satisfies Config;
