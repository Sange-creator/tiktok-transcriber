import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        tiktok: {
          cyan: "#25F4EE",
          pink: "#FE2C55",
          dark: "#010101",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 15px rgba(254, 44, 85, 0.4), 0 0 30px rgba(37, 244, 238, 0.2)" },
          "100%": { boxShadow: "0 0 25px rgba(254, 44, 85, 0.7), 0 0 45px rgba(37, 244, 238, 0.4)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
