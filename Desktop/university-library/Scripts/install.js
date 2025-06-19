const fs = require('fs');
const path = require('path');
const https = require('https');

// Load the books JSON
const books = require('../dummybooks.json');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'covers');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Download function
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(`Failed to get '${url}' (${response.statusCode})`);
        return;
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err.message));
    });
  });
}

// Download all covers
(async () => {
  for (const book of books) {
    const url = book.coverUrl;
    if (!url) continue;
    const filename = path.basename(url.split('?')[0]);
    const dest = path.join(outputDir, filename);
    try {
      console.log(`Downloading ${url}...`);
      await download(url, dest);
      console.log(`Saved to ${dest}`);
    } catch (err) {
      console.error(`Error downloading ${url}: ${err}`);
    }
  }
})();