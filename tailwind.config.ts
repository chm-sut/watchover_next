import { type Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        'xxl': '1400px',
      },
      fontFamily: {
        heading: ["Urbanist", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      fontSize: {
        h1: ["80px", "80px"],
        h2: ["60px", "60px"],
        h3: ["40px", "44px"],
        h4: ["30px", "34px"],
        h5: ["24px", "28px"],
        h6: ["20px", "24px"],
        body: ["16px", "20px"],
        caption: ["14px", "22px"],
        "body-sm": ["12px", "18px"],
        "caption-sm": ["10px", "16px"],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },
      colors: {
        logoBlue: "#229FBC",
        logoRed: "#DE3D3F",
        logoWhite: "#E0E0E0",
        logoBlack: "#121824",
        darkBlue: "#10596A",
        darkRed: "#990002",
        darkWhite: "#7B7B7B",
        lightYellow: "#FFE089",
        lightOrange: "#FFB889",
        lightRed: "#FF8F89",
        lightGreen: "#AAFFB7",
      },
    },
  },
  plugins: [],
};

export default config;
