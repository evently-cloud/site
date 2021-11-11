const htmlmin = require('html-minifier');
const eleventyNavigationPlugin = require('@11ty/eleventy-navigation');

module.exports = function (eleventyConfig) {
    const markdownIt = require('markdown-it');
    const markdownItContainer = require('markdown-it-container');
    const markdownItPrism = require('markdown-it-prism');
    const markdownLib = markdownIt().use(markdownItContainer, 'sidebar').use(markdownItPrism);
    eleventyConfig.setLibrary('md', markdownLib);

    eleventyConfig.addPlugin(eleventyNavigationPlugin);

    eleventyConfig.setUseGitIgnore(false);
    eleventyConfig.addWatchTarget('./_tmp/main.css');
    eleventyConfig.addPassthroughCopy({ './_tmp/main.css': './css/main.css' });
    eleventyConfig.addPassthroughCopy('src/css/prism.css');
    eleventyConfig.addWatchTarget('src/css/eclipse.css');
    eleventyConfig.addPassthroughCopy('src/css/eclipse.css');
    eleventyConfig.addPassthroughCopy('src/preview-signup');
    eleventyConfig.addPassthroughCopy('assets/*.png');
    eleventyConfig.addPassthroughCopy('assets/*.jpg');
    eleventyConfig.addPassthroughCopy('assets/*.ico');
    eleventyConfig.addPassthroughCopy('src/css/svg-noise.svg');

    // If being deployed (build rather than start), minify everything
    eleventyConfig.addTransform('htmlmin', function (content, outputPath) {
        if (process.env.ELEVENTY_PRODUCTION && outputPath && outputPath.endsWith('.html')) {
            let minified = htmlmin.minify(content, {
                useShortDoctype: true,
                removeComments: true,
                collapseWhitespace: true,
            });
            return minified;
        }
        return content;
    });

    return {
        dir: {
            input: 'src',
            layouts: '_includes/layouts',
            output: '_site',
        },
        markdownTemplateEngine: 'njk',
    };
};
