/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1E5EFF",
          50: "#EFF4FF",
          100: "#D9E6FF",
          200: "#B3CDFF",
          300: "#8DB4FF",
          400: "#669BFF",
          500: "#1E5EFF",
          600: "#0F4ADB",
          700: "#0B39A8",
          800: "#082975",
          900: "#051942",
        },
        background: {
          DEFAULT: "#0F1326",
          card: "#1A1F36",
        },
        success: "#00C48C",
        warning: "#FFAB00",
        danger: "#FF4D4F",
        info: "#1E5EFF",
        pending: "#FFAB00",
      },
      borderRadius: {
        xl: "12px",
      },
      transitionDuration: {
        DEFAULT: "300ms",
      },
      transitionTimingFunction: {
        DEFAULT: "ease-out",
      },
      animation: {
        "spin-slow": "spin 1s linear infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      spacing: {
        safe: "env(safe-area-inset-bottom)",
      },
    },
  },
  plugins: [],
};
