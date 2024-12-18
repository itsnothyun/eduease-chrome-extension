import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"], // Enables 'class' strategy for dark mode
  content: [
    './pages/**/*.{ts,tsx}',      // Includes pages directory
    './components/**/*.{ts,tsx}', // Includes components directory
    './app/**/*.{ts,tsx}',        // Includes app directory
    './src/**/*.{ts,tsx}',        // Includes src directory
    './styles/global.css', // Ensure global.css is included
  ],
  theme: {
    container: {
      center: true, // Center aligns container
      padding: "2rem", // Adds padding
      screens: {
        "2xl": "1400px", // Sets max-width for larger screens
      },
    },
    extend: {
      colors: {
        // Default color tokens
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: {
          DEFAULT: "hsl(var(--background))",
          dark: "#000000", // Global dark background
        },
        foreground: "hsl(var(--foreground))",

        // Primary and secondary color definitions
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },

        // Utility colors for various UI states
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Custom sidebar colors
        sidebarLight: "#ffffff", // Light mode solid color
        sidebarDark: "#000000",  // Dark mode solid color
      },

      // Border radius scaling
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // Animations
      keyframes: {
        "accordion-down": {
          from: { height: '0' },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: '0' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), // Enables animations
    require("@tailwindcss/forms"),  // Better styling for forms
    require("@tailwindcss/typography"), // For rich-text content
  ],
}

export default config
