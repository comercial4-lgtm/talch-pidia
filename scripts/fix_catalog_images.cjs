const fs = require('fs');

const orig = JSON.parse(fs.readFileSync('/tmp/original_catalog.json', 'utf8'));

const fw = {
  "earl-grey": "/assets/creamearlgrey-yC8DmIAI.jpg",
  "cherry-rose": "/assets/cha-verde-cherry-rose-talcha-D4nTpJYj.jpg",
  "doce-amendoa": "/assets/doceamendoa-BlMYaqBT.jpg",
  "gengibre-fresh": "/assets/infusaofrescor-DEKs3cbB.jpg",
  "rooibos-equilibrio": "/assets/infusao-calmaria-talcha-DcWxjR94.jpg",
  "vermelho-intenso": "/assets/vermelho-intenso-talcha-BCZZNWYz.jpg",
  "rtd-vermelho-intenso": "/assets/vermelho-intenso-talcha-BCZZNWYz.jpg",
  "rtd-rose": "/assets/lata-infusao_1-CXX8kq2Y.png",
  "rtd-cha-verde-detox": "/assets/infusaofrescor-DEKs3cbB.jpg",
  "long-sono": "/assets/infusao-calmaria-talcha-DcWxjR94.jpg",
  "long-relaxa": "/assets/cha-verde-cherry-rose-talcha-D4nTpJYj.jpg",
  "long-foco": "/assets/infusaofrescor-DEKs3cbB.jpg",
  "long-energia": "/assets/lata-talcha-cha-preto-fxDTyD3v.jpg",
  "long-imunidade": "/assets/vermelho-intenso-talcha-BCZZNWYz.jpg",
  "long-desinflama": "/assets/doceamendoa-BlMYaqBT.jpg",
  "long-spice-detox": "/assets/creamearlgrey-yC8DmIAI.jpg",
  "vapt-vupt": "/assets/vapt-vupt-talcha-1-B6WOclqk.jpg",
  "copo-vidro-duplo": "/assets/Copo-de-Vidro-Duplo-350ml-ZZDKSDSz.jpg",
  "amostra-olfativa": "/assets/kit-favoritos-talcha-novo-ziaIHLYK.png",
  "sache-piramidal": "/assets/talcha_b2b_servir-Df2AfCVZ.jpg"
};

// Set both imageUrl and image for maximum compatibility
orig.products.forEach(p => {
  p.imageUrl = fw[p.id] || p.imageUrl;
  p.image = fw[p.id] || p.imageUrl;
});

if (orig.equipment) {
  orig.equipment.forEach(e => {
    e.imageUrl = fw[e.id] || e.imageUrl;
    e.image = fw[e.id] || e.imageUrl;
  });
}

fs.writeFileSync('public/data/catalog.json', JSON.stringify(orig, null, 2));
console.log('Updated public/data/catalog.json successfully!');
orig.products.forEach(p => {
  console.log(p.id, '->', p.imageUrl);
});
