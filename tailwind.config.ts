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
                // Atlas-inspired: deep navy (logo) — primary brand
                atlas: {
                    50: '#e8ecf2',
                    100: '#c5d0e0',
                    200: '#9fb3cb',
                    300: '#7896b5',
                    400: '#5b80a5',
                    500: '#3d6a94',
                    600: '#2d5074',
                    700: '#1e3554',
                    800: '#152238',
                    900: '#0f1828',
                    950: '#080d14',
                },
                // Warm off-white / cream (logo background) — surfaces
                cream: {
                    50: '#fefdfb',
                    100: '#faf8f5',
                    200: '#f5f2ed',
                    300: '#ebe6de',
                    400: '#d9d1c4',
                    500: '#c4b9a8',
                },
                // Accent: sophisticated teal — CTAs, links, highlights
                accent: {
                    50: '#ecfdf9',
                    100: '#d1faf2',
                    200: '#a7f3e4',
                    300: '#6ee7d4',
                    400: '#34d3be',
                    500: '#0d9488',
                    600: '#0f766e',
                    700: '#115e59',
                    800: '#134e4a',
                    900: '#13433f',
                },
                // Accent: soft gold — badges, success, premium feel
                gold: {
                    50: '#fffbeb',
                    100: '#fef3c7',
                    200: '#fde68a',
                    300: '#fcd34d',
                    400: '#fbbf24',
                    500: '#d4a012',
                    600: '#b45309',
                    700: '#92400e',
                    800: '#78350f',
                    900: '#451a03',
                },
                // Legacy aliases for existing components (map to Atlas palette)
                primary: {
                    50: '#e8ecf2',
                    100: '#c5d0e0',
                    200: '#9fb3cb',
                    300: '#7896b5',
                    400: '#5b80a5',
                    500: '#2d5074',
                    600: '#1e3554',
                    700: '#152238',
                    800: '#0f1828',
                    900: '#080d14',
                },
                secondary: {
                    50: '#f5f2ed',
                    100: '#ebe6de',
                    200: '#d9d1c4',
                    300: '#c4b9a8',
                    400: '#9c8f7a',
                    500: '#5c5248',
                    600: '#3d352e',
                    700: '#2a2520',
                    800: '#1a1714',
                    900: '#0f0d0b',
                },
                success: { 500: '#0d9488', 600: '#0f766e' },
                danger: { 500: '#dc2626', 600: '#b91c1c' },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'atlas-subtle': 'linear-gradient(135deg, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 100%)',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(15, 24, 40, 0.08)',
                'glass-lg': '0 16px 48px 0 rgba(15, 24, 40, 0.12)',
                'glow': '0 0 24px -4px rgba(13, 148, 136, 0.25)',
                'glow-gold': '0 0 24px -4px rgba(212, 160, 18, 0.2)',
                'inner-soft': 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
            },
            backdropBlur: {
                xs: '2px',
            },
            animation: {
                'fade-in': 'fadeIn 0.4s ease-out forwards',
                'slide-up': 'slideUp 0.45s ease-out forwards',
            },
            keyframes: {
                fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
                slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
            },
        },
    },
    plugins: [],
};

export default config;
