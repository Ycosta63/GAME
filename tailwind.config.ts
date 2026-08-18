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
        // Shelfie: restrained neutral, letting cover art carry the color —
        // like Letterboxd/Trakt, not a "warm dashboard" full of filled,
        // bordered cards. Values are CSS custom properties (see
        // globals.css) so the light/dark swap is a single attribute
        // toggle, not a duplicated component tree.
        shelf: {
          bg: "var(--shelf-bg)",
          card: "var(--shelf-card)",
          surface: "var(--shelf-surface)",
          border: "var(--shelf-border)",
          text: "var(--shelf-text)",
          muted: "var(--shelf-muted)",
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
