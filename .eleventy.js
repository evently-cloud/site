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
    eleventyConfig.addWatchTarget('assets/*.json');
    eleventyConfig.addPassthroughCopy('assets/*.json');
    eleventyConfig.addPassthroughCopy('src/css/svg-noise.svg');

    eleventyConfig.addShortcode('shinyAJSFunc', function () {
        return "@mousemove=\"$el.style.setProperty('--x', $event.clientX - $el.getBoundingClientRect().x);$el.style.setProperty('--y', $event.clientY - $el.getBoundingClientRect().y)\"";
    });

    // If being deployed (build rather than start), minify everything
    eleventyConfig.addTransform('htmlmin', function (content, outputPath) {
        if (process.env.ELEVENTY_PRODUCTION == true && outputPath && outputPath.endsWith('.html')) {
            let minified = htmlmin.minify(content, {
                useShortDoctype: true,
                removeComments: true,
                collapseWhitespace: true,
            });
            return minified;
        }
        return content;
    });

    eleventyConfig.addFilter('alpineNav', function (navData) {
        // Prepare overarching unordered list element
        var navHTML = '<ul>';
        navData.forEach(parent => {
            // Prepare empty list item for parent menu
            var parentHTML = '<li x-data="{open: false}" @pointerenter="open = true" @pointerleave="open = false">';
            // Add parent link
            parentHTML += `<a href='${parent.url}'>${parent.key}</a>`;
            // Add children list, if any
            if (parent.children.length > 0) {
                var childHTML = '<ul x-show="open" x-collapse x-cloak>'; //
                parent.children.forEach(child => {
                    childHTML += `<li><a href='${child.url}'>${child.key}</a></li>`;
                });
                childHTML += '</ul>';
                parentHTML += childHTML;
            }
            parentHTML += '</li>';
            navHTML += parentHTML;
        });
        navHTML += '</ul>';
        return navHTML;
    });

    eleventyConfig.addFilter('mdChanges', function (content) {
        var changedContent = '';
        // Handle superscript
        changedContent = content.replace(/\^\S+\^/g, function (match) {
            var superStr = match.match(/(?<=\^)\S+(?=\^)/g);
            return `<sup>${superStr}</sup>`;
        });

        return changedContent;
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
