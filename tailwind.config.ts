import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["Cairo", "Rajdhani", "sans-serif"],
        body: ["Cairo", "Inter", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        /* HMK Brand scales */
        gold: {
          DEFAULT: "#FFB000",
          50: "#FFF6E0",
          100: "#FFE9B3",
          200: "#FFD980",
          300: "#FFC94D",
          400: "#FFBE26",
          500: "#FFB000",
          600: "#E89F00",
          700: "#B57C00",
          800: "#825900",
          900: "#4F3600",
        },
        fire: {
          DEFAULT: "#FF6A00",
          50: "#FFE4D1",
          100: "#FFCBA8",
          200: "#FFA76B",
          300: "#FF8A3D",
          400: "#FF7820",
          500: "#FF6A00",
          600: "#E85C00",
          700: "#B54700",
          800: "#823300",
          900: "#4F1F00",
        },
        diamond: {
          DEFAULT: "#00C2FF",
          50: "#D6F4FF",
          100: "#A8E8FF",
          200: "#70D9FF",
          300: "#3DCBFF",
          400: "#1AC5FF",
          500: "#00C2FF",
          600: "#0099CC",
          700: "#0077A0",
          800: "#005374",
          900: "#0066CC",
        },
        /* Legacy aliases — keep cyan/purple working but pointing at brand */
        cyan: {
          DEFAULT: "#FFB000",
          50: "#FFF6E0",
          100: "#FFE9B3",
          200: "#FFD980",
          300: "#FFC94D",
          400: "#FFBE26",
          500: "#FFB000",
          600: "#E89F00",
          700: "#B57C00",
          800: "#825900",
          900: "#4F3600",
        },
        purple: {
          DEFAULT: "#FF6A00",
          50: "#FFE4D1",
          100: "#FFCBA8",
          200: "#FFA76B",
          300: "#FF8A3D",
          400: "#FF7820",
          500: "#FF6A00",
          600: "#E85C00",
          700: "#B54700",
          800: "#823300",
          900: "#4F1F00",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(0, 255, 255, 0.2)" },
          "50%": { boxShadow: "0 0 20px rgba(0, 255, 255, 0.4)" },
        },
        "slide-up": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-up": "slide-up 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
