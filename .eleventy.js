module.exports = async function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/site/styles.css");
  eleventyConfig.addPassthroughCopy("src/site/terminal-banner.js");
  eleventyConfig.addPassthroughCopy("src/site/terminal.js");
  return {
    dir: {
      input: "src/site",
      output: "dist",
      includes: "_includes",
    },
    templateFormats : ["njk", "md"],
    htmlTemplateEngine : "njk",
    markdownTemplateEngine : "njk",
    passthroughFileCopy: true
  };
};
