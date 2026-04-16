import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          50: "#f3f7ff",
          100: "#e6eefb",
          200: "#cfddf4",
          300: "#b1c6e6",
          400: "#88a5cf",
          500: "#6584b2",
          600: "#486491",
          700: "#31496f",
          800: "#1e3250",
          900: "#0c1d34"
        },
        accent: {
          50: "#e9f1ff",
          100: "#d7e6ff",
          200: "#b6d0ff",
          300: "#8cb3ff",
          400: "#668fff",
          500: "#3e70ff",
          600: "#3159d9",
          700: "#2646af",
          800: "#1d3589",
          900: "#172969"
        }
      },
      fontFamily: {
        heading: ["Rajdhani", "ui-sans-serif", "system-ui"],
        body: ["Manrope", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular"]
      },
      boxShadow: {
        glow: "0 20px 48px -22px rgba(62,112,255,0.55)",
        card: "0 20px 40px -24px rgba(12,29,52,0.35)"
      },
      backgroundImage: {
        "grid-soft":
          "linear-gradient(to right, rgba(29,38,50,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(29,38,50,0.04) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
} satisfies Config;
