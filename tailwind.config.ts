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
        // Shelfie: restrained near-black neutral, letting cover art carry
        // the color — like Letterboxd/Trakt, not a "warm dashboard" full of
        // filled, bordered cards.
        shelf: {
          bg: "#121110",
          card: "#1b1917",
          surface: "#232019",
          border: "#2e2b25",
          text: "#ece6db",
          muted: "#8f8579",
        },
        brass: {
          DEFAULT: "#e0913c",
          hover: "#ecab5f",
          ink: "#241505",
        },
        sage: {
          DEFAULT: "#7fae7a",
          bg: "rgba(127,174,122,0.14)",
        },
        rust: {
          DEFAULT: "#d1495b",
          bg: "rgba(209,73,91,0.14)",
        },
        steam: "#1b2838",
        psn: "#003791",
      },
    },
  },
  plugins: [],
};

export default config;
