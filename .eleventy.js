module.exports = function(eleventyConfig) {
  const markdownIt = require('markdown-it')
  const markdownItContainer = require('markdown-it-container')
  const markdownItPrism = require('markdown-it-prism')
  const markdownLib =
    markdownIt()
      .use(markdownItContainer, 'sidebar')
      .use(markdownItPrism)
  eleventyConfig.setLibrary('md', markdownLib)

  eleventyConfig.addPassthroughCopy('src/css')

  return {
    dir: {
      input: 'src'
    },
    passthroughFileCopy: true
  }
};