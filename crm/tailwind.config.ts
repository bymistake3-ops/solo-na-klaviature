import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        border: "hsl(220 13% 91%)",
        muted: "hsl(220 14% 96%)",
        bg: "hsl(0 0% 100%)",
        fg: "hsl(222 47% 11%)",
        subtle: "hsl(215 16% 47%)",
        brand: {
          DEFAULT: "hsl(222 89% 55%)",
          fg: "hsl(0 0% 100%)",
          soft: "hsl(222 100% 97%)",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)",
        pop: "0 10px 30px -10px rgb(0 0 0 / 0.15)",
      },
      borderRadius: {
        xl: "0.9rem",
      },
    },
  },
  plugins: [],
};

export default config;
