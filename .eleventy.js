module.exports = async function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/site/styles.css");
  return {
    dir: {
      input: "src/site",
      output: "../dist",
      includes: "../_includes",
    },
    templateFormats : ["njk", "md"],
    htmlTemplateEngine : "njk",
    markdownTemplateEngine : "njk",
    passthroughFileCopy: true
  };
};
