import type { Config } from "tailwindcss";

// Tokens mirror docs/design/design-system.md exactly.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#0F766E", soft: "#CCFBF1" }, // teal-700 / teal-100
        ink: "#1F2937", // gray-800
        muted: "#6B7280", // gray-500
        surface: "#FFFFFF",
        bg: "#F9FAFB", // gray-50
        border: "#E5E7EB", // gray-200
        danger: "#DC2626", // red-600
        warning: "#D97706", // amber-600
        success: "#16A34A", // green-600
        info: "#2563EB", // blue-600
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      maxWidth: {
        app: "640px", // focused, phone-like column
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
} satisfies Config;
