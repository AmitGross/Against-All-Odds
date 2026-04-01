import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#10212B",
        sand: "#F4E9D8",
        field: "#2E7D32",
        clay: "#C7643B",
      },
    },
  },
  plugins: [],
};

export default config;
