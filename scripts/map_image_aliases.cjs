const fs = require('fs');
const path = require('path');

const publicAssets = path.resolve('public/assets');
const publicDir = path.resolve('public');
const shopDir = path.resolve('public/cdn/shop/files');
fs.mkdirSync(shopDir, { recursive: true });

const files = fs.readdirSync(publicAssets);

for (const file of files) {
  // If it is an image
  if (/\.(jpg|jpeg|png|webp|svg)$/i.test(file)) {
    const src = path.join(publicAssets, file);

    // Also copy to public root
    const rootDest = path.join(publicDir, file);
    if (!fs.existsSync(rootDest)) fs.copyFileSync(src, rootDest);

    // Create unhashed name, e.g. creamearlgrey-yC8DmIAI.jpg -> creamearlgrey.jpg
    const unhashed = file.replace(/[-_][a-zA-Z0-9]{8,15}\.(jpg|jpeg|png|webp|svg)$/i, '.$1')
                         .replace(/_[0-9]{13,}\.(jpg|jpeg|png|webp|svg)$/i, '.$1');

    if (unhashed !== file) {
      console.log(`Mapping ${file} -> ${unhashed}`);
      fs.copyFileSync(src, path.join(publicAssets, unhashed));
      fs.copyFileSync(src, path.join(publicDir, unhashed));
      fs.copyFileSync(src, path.join(shopDir, unhashed));
    }
  }
}

console.log('Done mapping all image variations!');
