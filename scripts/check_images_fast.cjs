const fs = require('fs');

const code = fs.readFileSync('src/index-B-h_qskT.js', 'utf8');

const exts = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
const found = new Set();

for (const ext of exts) {
  let idx = 0;
  while ((idx = code.indexOf(ext, idx)) !== -1) {
    // Look backward for quote or slash
    let start = idx;
    while (start > 0 && !['"', "'", '`', '(', ' '].includes(code[start - 1])) {
      start--;
      if (idx - start > 100) break;
    }
    const filename = code.substring(start, idx + ext.length);
    found.add(filename);
    idx += ext.length;
  }
}

console.log('Total found assets:', found.size);
const list = Array.from(found);
console.log(JSON.stringify(list, null, 2));

// Check catalog.json
const catalog = JSON.parse(fs.readFileSync('public/data/catalog.json', 'utf8'));
console.log('\n--- Catalog products count:', catalog.products.length);
catalog.products.forEach(p => {
  console.log(`Product: id=${p.id}, name=${p.name}, imageUrl=${p.imageUrl}, image=${p.image}`);
});
