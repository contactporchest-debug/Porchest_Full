/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                purple: {
                    primary: '#7B3FF2',
                    accent: '#A855F7',
                    dim: 'rgba(123,63,242,0.12)',
                    glow: 'rgba(123,63,242,0.35)',
                },
                bg: {
                    base: '#0c0c0c',
                    elevated: '#111111',
                    card: 'rgba(255,255,255,0.04)',
                    'card-hover': 'rgba(255,255,255,0.07)',
                    surface: 'rgba(255,255,255,0.03)',
                },
                border: {
                    subtle: 'rgba(255,255,255,0.06)',
                    card: 'rgba(255,255,255,0.08)',
                    hover: 'rgba(255,255,255,0.14)',
                },
            },
            fontFamily: {
                sans: ['Inter', 'Space Grotesk', '-apple-system', 'sans-serif'],
                display: ['Space Grotesk', 'Inter', 'sans-serif'],
            },
            borderRadius: {
                'card': '16px',
                'card-lg': '20px',
                'card-xl': '28px',
                'card-2xl': '32px',
                'btn': '999px',
            },
            boxShadow: {
                'card': '0 1px 0 rgba(255,255,255,0.03)',
                'card-hover': '0 0 40px rgba(123,63,242,0.06)',
                'btn': '0 0 30px rgba(123,63,242,0.25)',
                'btn-hover': '0 0 50px rgba(123,63,242,0.35)',
                'glow-sm': '0 0 20px rgba(123,63,242,0.15)',
                'glow-md': '0 0 40px rgba(123,63,242,0.2)',
                'glow-lg': '0 0 80px rgba(123,63,242,0.25)',
            },
            animation: {
                'float-a': 'float-a 5s ease-in-out infinite',
                'float-b': 'float-b 7s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 8s ease-in-out infinite',
                'ring': 'ring-pulse 2.5s ease-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'marquee': 'marquee-scroll 30s linear infinite',
            },
            keyframes: {
                'float-a': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'float-b': {
                    '0%, 100%': { transform: 'translateY(-6px)' },
                    '50%': { transform: 'translateY(6px)' },
                },
                'pulse-glow': {
                    '0%, 100%': { opacity: '0.5', transform: 'translateX(-50%) scale(1)' },
                    '50%': { opacity: '0.8', transform: 'translateX(-50%) scale(1.05)' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'marquee-scroll': {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
            },
        },
    },
    plugins: [],
}
