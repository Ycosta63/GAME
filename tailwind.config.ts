import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      colors: {
        // Shelfie: a warm, wood-shelf-toned dark UI — deliberately not the
        // generic blue-slate dark mode.
        shelf: {
          bg: "#16110d",
          card: "#211a15",
          surface: "#2a221c",
          border: "#3c3126",
          text: "#f2e9df",
          muted: "#b3a08d",
        },
        brass: {
          DEFAULT: "#d1a13f",
          hover: "#e6b755",
          ink: "#4a3a17",
        },
        sage: {
          DEFAULT: "#7fa876",
          bg: "rgba(127,168,118,0.14)",
        },
        rust: {
          DEFAULT: "#c1653d",
          bg: "rgba(193,101,61,0.14)",
        },
        steam: "#1b2838",
        psn: "#003791",
      },
    },
  },
  plugins: [],
};

export default config;
