const fs = require('fs');

const code = fs.readFileSync('src/index-B-h_qskT.js', 'utf8');

// Match all image URLs or imports
const regex = /(?:\/assets\/|[a-zA-Z0-9_\-\.\/]+)[a-zA-Z0-9_\-\.]+\.(?:jpg|jpeg|png|webp|svg)/gi;
const matches = code.match(regex) || [];
const unique = [...new Set(matches)];
console.log('Total matches:', matches.length);
console.log('Unique matches count:', unique.length);
console.log('Matches list:\n', JSON.stringify(unique, null, 2));

// Also let's check catalog.json
const catalog = JSON.parse(fs.readFileSync('public/data/catalog.json', 'utf8'));
console.log('\n--- Catalog images ---');
catalog.products.forEach(p => {
  console.log(p.id, '-> imageUrl:', p.imageUrl, 'image:', p.image);
});
if (catalog.equipment) {
  catalog.equipment.forEach(e => {
    console.log('Equip:', e.id, '-> imageUrl:', e.imageUrl);
  });
}
