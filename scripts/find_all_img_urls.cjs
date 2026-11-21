const fs = require('fs');

const code = fs.readFileSync('src/index-B-h_qskT.js', 'utf8');

// Find all occurrences of image URLs or imports
const matches = code.match(/["'`](https:\/\/[^"'`]+\.(?:jpg|png|webp|svg)|(?:\/assets\/)[^"'`]+\.(?:jpg|png|webp|svg))["'`]/g) || [];
console.log('Matches count:', matches.length);
const clean = [...new Set(matches.map(m => m.slice(1, -1)))];
console.log('Clean matches:', JSON.stringify(clean, null, 2));
