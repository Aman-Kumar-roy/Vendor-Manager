/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="dark"], .dark'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc8fc",
          400: "#36a9f8",
          500: "#0c8ce9",
          600: "#026ec7",
          700: "#0358a1",
          800: "#074a83",
          900: "#0c3e6e",
          950: "#082749",
        },
        slate: {
          850: "#152033",
          950: "#0b1329",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow:            "0 0 25px -5px rgba(12,140,233,0.45)",
        "glow-sm":       "0 0 14px -4px rgba(12,140,233,0.4)",
        "glow-lg":       "0 0 40px -8px rgba(12,140,233,0.55)",
        "glow-emerald":  "0 0 25px -5px rgba(16,185,129,0.45)",
        "glow-amber":    "0 0 25px -5px rgba(245,158,11,0.45)",
        "glow-rose":     "0 0 25px -5px rgba(244,63,94,0.45)",
        "glow-indigo":   "0 0 25px -5px rgba(99,102,241,0.45)",
        card:            "0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 6px -1px rgba(0,0,0,0.02)",
        "card-dark":     "0 4px 24px -4px rgba(0,0,0,0.5), 0 2px 6px -1px rgba(0,0,0,0.25)",
        "card-elevated": "0 8px 40px -8px rgba(0,0,0,0.6), 0 4px 14px -4px rgba(0,0,0,0.4)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
}
