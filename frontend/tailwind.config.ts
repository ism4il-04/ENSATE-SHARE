import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#0066cc', // Main primary color
                    600: '#0052a3',
                    700: '#003d7a',
                    800: '#002952',
                    900: '#001429',
                },
                secondary: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#333333', // Main secondary color
                    600: '#292929',
                    700: '#1f1f1f',
                    800: '#141414',
                    900: '#0a0a0a',
                },
                success: {
                    500: '#10b981',
                    600: '#059669',
                },
                danger: {
                    500: '#ef4444',
                    600: '#dc2626',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};

export default config;
