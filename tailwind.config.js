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
                lightest: '#ffffff',
                light: '#A9CDEF',
                darkBase: '#267DAB',
                darkHighlight: '#312483',
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
