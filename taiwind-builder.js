const chokidar = require('chokidar');
const { resolve } = require("path");
const { readFileSync, writeFileSync } = require("fs");
const layoutFiles = [
  resolve('./views', 'emails', 'notifications','admin', 'layouts', 'layout.liquid'),
  resolve('./views', 'emails', 'notifications','customer', 'layouts', 'layout.liquid'),
];
const tailwindOutput = resolve('./dist', 'tailwind-output.css');
// One-liner for current directory
chokidar.watch(tailwindOutput).on('all', async (event, path) => {
  const styles = readFileSync(tailwindOutput, 'utf8');

  for (let idx = 0; idx < layoutFiles.length; idx++) {
    const layoutFile = layoutFiles[idx];
    const layout = readFileSync(layoutFile, 'utf8');
    const newLayout = replaceStyleContents(layout, styles);
    console.log(`Updating ${layoutFile}`);
    console.log(newLayout)
    await writeFileSync(layoutFile, newLayout);
  }

});


function replaceStyleContents(str, replacement) {
  const pattern = /(<style\b[^<]*>)([\s\S]*?)(<\/style>)/gi;
  return str.replace(pattern, function(match, openingTag, contents, closingTag) {
    return openingTag + replacement + closingTag;
  });
}
