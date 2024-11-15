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
        dash_dark: "#161616",
        icon_col: "#A0A0A2",
        gray_col: "#212024",

        // border_col: "#1A1B1D",
        // border_col: "#3C3C3C",
        dash_bg: "#101010",
        inner_box: "#131416",
        light_gray: "#202123",
        sm_light_gray: "#23212191",
        too_light: "#1c1b1b7a",
        grayBox: "#212121",
        containerGray: "#2C2C2C",
        scroll_hover: "#555",
      },
    },
  },
  plugins: [],
} satisfies Config;
