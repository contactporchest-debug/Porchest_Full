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
                    base: '#050505',
                    elevated: '#0B0B0F',
                    card: 'rgba(20,20,30,0.65)',
                },
            },
            fontFamily: {
                sans: ['Space Grotesk', 'Inter', '-apple-system', 'sans-serif'],
                display: ['Space Grotesk', 'sans-serif'],
            },
            borderRadius: {
                'card': '28px',
                'card-lg': '32px',
                'card-xl': '40px',
                'btn': '999px',
            },
            backdropBlur: { 'card': '25px', },
            boxShadow: {
                'card': '0 0 60px rgba(123,63,242,0.12), 0 0 120px rgba(123,63,242,0.06)',
                'card-hover': '0 0 80px rgba(123,63,242,0.2), 0 0 160px rgba(123,63,242,0.08)',
                'btn': '0 0 30px rgba(123,63,242,0.5), 0 0 80px rgba(123,63,242,0.2)',
                'btn-hover': '0 0 40px rgba(168,85,247,0.65), 0 0 100px rgba(123,63,242,0.3)',
                'glow-sm': '0 0 20px rgba(123,63,242,0.3)',
                'glow-md': '0 0 40px rgba(123,63,242,0.35)',
                'glow-lg': '0 0 80px rgba(123,63,242,0.4)',
            },
            animation: {
                'float-a': 'float-a 5s ease-in-out infinite',
                'float-b': 'float-b 7s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 6s ease-in-out infinite',
                'ring': 'ring-pulse 2.5s ease-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'gradient-shift': 'gradient-shift 4s ease infinite',
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
                    '0%, 100%': { opacity: '0.6', transform: 'translateX(-50%) scale(1)' },
                    '50%': { opacity: '1', transform: 'translateX(-50%) scale(1.08)' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'gradient-shift': {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
            },
        },
    },
    plugins: [],
}
