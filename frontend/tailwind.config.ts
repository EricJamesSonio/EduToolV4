import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
      },
colors: {
  // Sidebar (OPTIONAL if you still use it)
  sidebar: {
    bg: "var(--sidebar-bg)",
    border: "var(--sidebar-border)",
    text: "var(--sidebar-text)",
    "text-muted": "var(--sidebar-text-muted)",
    active: "var(--sidebar-active)",
    "active-text": "var(--sidebar-active-text)",
    hover: "var(--sidebar-hover)",
  },

  // Surface system (optional future use)
  surface: {
    DEFAULT: "var(--surface)",
    raised: "var(--surface-raised)",
    overlay: "var(--surface-overlay)",
  },

  // ✅ CORE THEME TOKENS (FIXED)
  background: "var(--background)",
  foreground: "var(--foreground)",

  card: {
    DEFAULT: "var(--card)",
    foreground: "var(--card-foreground)",
  },

  popover: {
    DEFAULT: "var(--popover)",
    foreground: "var(--popover-foreground)",
  },

  primary: {
    DEFAULT: "var(--primary)",
    foreground: "var(--primary-foreground)",
  },

  secondary: {
    DEFAULT: "var(--secondary)",
    foreground: "var(--secondary-foreground)",
  },

  muted: {
    DEFAULT: "var(--muted)",
    foreground: "var(--muted-foreground)",
  },

  accent: {
    DEFAULT: "var(--accent)",
    foreground: "var(--accent-foreground)",
    soft: "var(--accent-soft)",
    "soft-foreground": "var(--accent-soft-foreground)",
  },

  destructive: {
    DEFAULT: "var(--destructive)",
    foreground: "var(--destructive-foreground)",
  },

  success: {
    DEFAULT: "var(--success)",
    foreground: "var(--success-foreground)",
  },

  warning: {
    DEFAULT: "var(--warning)",
    foreground: "var(--warning-foreground)",
  },

  info: {
    DEFAULT: "var(--info)",
    foreground: "var(--info-foreground)",
  },

  border: "var(--border)",
  input: "var(--input)",
  ring: "var(--ring)",

  chart: {
    "1": "var(--chart-1)",
    "2": "var(--chart-2)",
    "3": "var(--chart-3)",
    "4": "var(--chart-4)",
    "5": "var(--chart-5)",
    "6": "var(--chart-6)",
    "7": "var(--chart-7)",
    "8": "var(--chart-8)",
    "9": "var(--chart-9)",
    "10": "var(--chart-10)",
  },
},
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Sidebar dimensions
      spacing: {
        sidebar: "240px",
        "sidebar-collapsed": "64px",
        topbar: "56px",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
          "school-scroll": {
    "0%":   { transform: "translateX(0)" },
    "100%": { transform: "translateX(-50%)" },
  },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.25s ease-out",
        "school-scroll": "school-scroll 28s linear infinite",
      },
    },
  },
  plugins: [tailwindAnimate],
};

export default config;
