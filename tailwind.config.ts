import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        steam: "#1b2838",
        psn: "#003791",
      },
    },
  },
  plugins: [],
};

export default config;
