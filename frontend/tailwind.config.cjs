module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Your brand blue (already have this)
        brand: {
          DEFAULT: "#3b82f6",
          dark: "#2162b6ff"
        },

        // Blue-gray system (site palette)
        app: {
          bg: "#232a34",       // page background
          panel: "#454D58",    // cards/panels
          panel2: "#3a4452",   // elevated panel
          border: "#1b2028",   // subtle borders/dividers
          text: "#e2e8f0",     // main text
          muted: "#94a3b8"     // secondary text
        }
      }
    }
  },
  plugins: []
};
