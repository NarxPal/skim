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

        // new design col
        editor_bg: "#161819",
        editor_gray: "#1F2027",
        blue_btn: "#2A6FFF",
        border: "#1B1D1E",

        // more new design col
        black_bg: "#040507",
        off_voi: "#12131A",
        voilet_btn: "#4D2CF4",
      },

      backgroundImage: {
        "diagonal-stripes":
          "repeating-linear-gradient(-45deg, #2C2C2C, #2C2C2C 1.5px, #12131A 1.5px, #12131A  8px)",
      },
    },
  },
  plugins: [],
} satisfies Config;
