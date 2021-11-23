module.exports = {
    purge: {
        content: ['_site/**/*.html'],
        options: {
            safelist: [],
        },
    },
    theme: {
        extend: {
            colors: {
                lightBase: '#FFA336',
                lightHighlight: '#FF8D0A',
                darkBase: '#267DAB',
                darkHighlight: '#312483',
                darkBG: '#071828',
                darkBGHighlight1: '#092034',
                darkBGHighlight2: '#0C2B45',
                button: '#2C5197',
            },
            fontFamily: {
                heading: ['"Baloo 2"', 'cursive'],
                body: ['Assistant', 'sans-serif'],
            },
        },
    },
    variants: {},
    plugins: [require('@tailwindcss/forms')],
};
