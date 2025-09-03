import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        minecraft: {
          bg: "var(--minecraft-bg)",
          paper: "var(--minecraft-paper)",
          border: "var(--minecraft-border)",
          "border-dark": "var(--minecraft-border-dark)",
          text: "var(--minecraft-text)",
          "text-light": "var(--minecraft-text-light)",
          green: "var(--minecraft-green)",
          "green-light": "var(--minecraft-green-light)",
          blue: "var(--minecraft-blue)",
          "blue-light": "var(--minecraft-blue-light)",
          orange: "var(--minecraft-orange)",
          "orange-light": "var(--minecraft-orange-light)",
          accent: "var(--minecraft-accent)",
          shadow: "var(--minecraft-shadow)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': {
            transform: 'translateX(-100%)',
          },
          '100%': {
            transform: 'translateX(100%)',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;