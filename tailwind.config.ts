import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#dc2626",
          soft: "#fee2e2",
          ring: "#fecaca"
        },
        ink: "#0a0a0a",
        muted: "#6b7280",
        surface: "#ffffff",
        line: "#e5e7eb",
        bg: "#f7f7f8"
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(0,0,0,0.04)"
      },
      keyframes: {
        heartbeat: {
          "0%,100%": { transform: "scale(1)" },
          "20%": { transform: "scale(1.12)" },
          "40%": { transform: "scale(0.98)" },
          "60%": { transform: "scale(1.08)" }
        },
        fadein: {
          "0%": { opacity: "0", transform: "translateY(2px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        heartbeat: "heartbeat 1s ease-in-out infinite",
        fadein: "fadein 300ms ease-out"
      }
    }
  },
  plugins: []
};
export default config;
