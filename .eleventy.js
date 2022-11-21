const htmlmin = require('html-minifier');
const eleventyNavigationPlugin = require('@11ty/eleventy-navigation');
const embeds = require("eleventy-plugin-embed-everything");
const {DateTime} = require("luxon");
const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = function (eleventyConfig) {
    const markdownIt = require('markdown-it');
    const markdownItContainer = require('markdown-it-container');
    const markdownItPrism = require('markdown-it-prism');
    const markdownItAnchor = require('markdown-it-anchor');
    const markdownItCodetabs = require('markdown-it-codetabs')
    const mdfigcaption = require('markdown-it-image-figures');
    const markdownLib = markdownIt()
        .use(markdownItContainer, 'sidebar')
        .use(markdownItPrism)
        .use(markdownItCodetabs)
        .use(mdfigcaption, {
            figcaption: true
        })
        .use(markdownItAnchor, {
            permalink: markdownItAnchor.permalink.linkAfterHeader({
                style: 'visually-hidden',
                assistiveText: title => `Permalink to “${title}”`,
                visuallyHiddenClass: 'visually-hidden',
            }),
        });
    eleventyConfig.setLibrary('md', markdownLib);

    eleventyConfig.addPlugin(eleventyNavigationPlugin);
    eleventyConfig.addPlugin(embeds);
    eleventyConfig.addPlugin(pluginRss);

    eleventyConfig.setUseGitIgnore(false);
    eleventyConfig.addWatchTarget('./_tmp/main.css');
    eleventyConfig.addPassthroughCopy({ './_tmp/main.css': './css/main.css' });
    eleventyConfig.addPassthroughCopy('src/css/prism.css');
    eleventyConfig.addPassthroughCopy('src/preview-signup');
    eleventyConfig.addPassthroughCopy('assets/*.png');
    eleventyConfig.addPassthroughCopy('assets/*.jpg');
    eleventyConfig.addPassthroughCopy({'assets/googleb64f0f8acc1e003a.html': 'googleb64f0f8acc1e003a.html'});
    eleventyConfig.addPassthroughCopy('assets/evently-client-api.yaml');
    eleventyConfig.addPassthroughCopy({ 'assets/favicon.ico': '/favicon.ico' });
    eleventyConfig.addWatchTarget('assets/*.json');
    eleventyConfig.addPassthroughCopy('assets/*.json');
    eleventyConfig.addPassthroughCopy('src/blog/*/*.jpg');
    eleventyConfig.addPassthroughCopy('src/blog/*/*.png');
    eleventyConfig.addPassthroughCopy('src/blog/*/*.gif');

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
                var childHTML = '<ul x-show="open" x-cloak x-collapse>'; //
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
        let changedContent = content;

        // Handle superscript
        changedContent = changedContent.replace(/\^\S+\^/g, function (match) {
            const superStr = match.match(/(?<=\^)\S+(?=\^)/g);
            return `<sup>${superStr}</sup>`;
        });

        // Add copy code button
        changedContent = changedContent.replace(/<pre/g, function (match) {
            return '<pre x-data=\'{code : "", hover: false, copyText: "Copy"}\' x-init=\'code = htmlToText($refs.codeBlock.innerHTML)\' @pointerenter="hover = true" @pointerleave="hover = false; setTimeout(() => {copyText = \'Copy\'}, 300)"';
        });
        changedContent = changedContent.replace(/<code/g, function (match) {
            return '<code x-ref="codeBlock"';
        });
        changedContent = changedContent.replace(/<\/pre>/g, function (match) {
            return "<div class='copy-button' x-show='hover' x-transition.duration.300ms @click='navigator.clipboard.writeText(code); copyText = \"Copied!\";'><span x-text='copyText'></span</div></pre>";
        });

        // Handle sidebar content
        changedContent = changedContent.replace(/::: sidebar/g, '<div class="sidebar">');
        changedContent = changedContent.replace(/:::/g, '</div>');

        return changedContent;
    });

    eleventyConfig.addFilter("postDate", (dateObj) => {
        return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_FULL);
    });

    eleventyConfig.addCollection('tagsList', (collectionApi) => {
        const tagsSet = new Set();
        collectionApi.getAll().forEach((item) => {
            if(!item.data.tags) return;
            item.data.tags
                .filter((tag) => !'blogPosts'.includes(tag))
                .forEach((tag) => tagsSet.add(tag));
        });
        return [...tagsSet].sort((a, b) => b.localeCompare(a)).reverse();
    })

    return {
        dir: {
            input: 'src',
            layouts: '_includes/layouts',
            output: '_site',
        },
        markdownTemplateEngine: 'njk',
    };
};
