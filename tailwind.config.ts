import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/sections/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // @tailwindcss/typography and @tailwindcss/forms removed —
    // not installed. Install with: npm i @tailwindcss/typography @tailwindcss/forms
    // then uncomment below:
    // require('@tailwindcss/typography'),
    // require('@tailwindcss/forms'),
  ],
};

export default config;
