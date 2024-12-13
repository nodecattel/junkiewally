/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      width: {
        33: "8.6rem",
        20.5: "6.01rem",
        38: "9.5rem",
        38.1: "9.6875rem",
      },
      height: {
        33: "8.6rem",
        38: "9.5rem",
        38.1: "9.6875rem",
      },
      colors: {
        bg: "#060e21",
        "input-bg": "#3d3d3d95",
        "input-light": "#3d3d3d35",
        "toast-bg": "#3d3d3d",
        text: "#ffffff",
        secondary: "#fc4516",
        primary: "#ffbc42",
        panel: "#669bbc",
        hovered: "#a8d0db",
        "hovered-btn": "#fd9343",
        "light-orange": "#ff863a",
        "junk-orange": "#fc4516",
        "junk-red": "#be123c",
        "junk-reddishblack": "#110802",

        background: "#0A0E14",
        "primary-dark": "#CC5500",
        surface: "#2A2E35",
        "primary-80": "rgba(255, 107, 0, 0.8)",
        "primary-60": "rgba(255, 107, 0, 0.6)",
        "primary-40": "rgba(255, 107, 0, 0.4)",
        "primary-20": "rgba(255, 107, 0, 0.2)",
        "text-primary": "#FFFFFF",
        "text-secondary": "rgba(255, 255, 255, 0.7)",
        border: "rgba(255, 107, 0, 0.3)",
        overlay: "rgba(10, 14, 20, 0.8)",
      },
      screens: {
        "standard": "455px",
        "sm": "640px",
        "md": "768px",
        "lg": "1024px",
        "xl": "1280px",
        "2xl": "1536px"
      }
    },
  },
  plugins: [],
};
