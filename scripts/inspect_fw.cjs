const fs = require('fs');

const code = fs.readFileSync('src/index-B-h_qskT.js', 'utf8');

// Find where fw is defined
const idx = code.indexOf('fw={');
console.log('fw={ at:', idx);
console.log('Snippet around fw:\n', code.substring(idx - 100, idx + 600));

// Find where fw is used
let searchIdx = 0;
const uses = [];
while ((searchIdx = code.indexOf('fw[', searchIdx)) !== -1) {
  uses.push(code.substring(searchIdx - 20, searchIdx + 40));
  searchIdx += 3;
}
console.log('\nUses of fw[...]:', uses);
