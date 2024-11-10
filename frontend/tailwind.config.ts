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
      },
    },
  },
  plugins: [],
} satisfies Config;
