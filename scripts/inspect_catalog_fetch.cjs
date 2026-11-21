const fs = require('fs');

const code = fs.readFileSync('src/index-B-h_qskT.js', 'utf8');

const idx = code.indexOf('/data/catalog.json');
console.log('index of catalog.json:', idx);
console.log('Snippet around fetch catalog:\n', code.substring(idx - 100, idx + 600));
