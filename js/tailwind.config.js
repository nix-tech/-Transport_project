
tailwind.config = {
    theme: {
        extend: {
            // Tipografi
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },

            // Coulè mak (brand palette)
            colors: {
                brand: {
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                },
            },

            // Animasyon custom
            animation: {
                'float':      'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'slide-up':   'slideUp 0.5s ease-out',
            },

            // Keyframes pou animasyon yo
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%':      { transform: 'translateY(-12px)' },
                },
                slideUp: {
                    '0%':   { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
};
