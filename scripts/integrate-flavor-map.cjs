/**
 * Script to integrate FlavorMap into index-B-h_qskT.js
 */
const fs = require('fs');
const esbuild = require('esbuild');

const filePath = 'src/index-B-h_qskT.js';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add import FlavorMap at the beginning
if (!code.startsWith('import FlavorMap')) {
  code = 'import FlavorMap from "./FlavorMap";\n' + code;
}

// 2. Add mapa_sabores in qC (navigation array D)
const targetD = '{id:`cardapio`,label:u(`nav.pairing`),shortLabel:u(`nav.short.pairing`),icon:Ee,iconColor:`text-[#4D6575] dark:text-[#7BA3BE]`,description:u(`nav.desc.pairing`)}';
const replaceD = '{id:`mapa_sabores`,label:f(`Mapa de Sabores B2B`,`B2B Flavor Map`,`Mapa de Sabores B2B`),shortLabel:f(`Mapa de Sabores`,`Flavor Map`,`Mapa de Sabores`),icon:Ee,iconColor:`text-[#8B2635] dark:text-[#E88E9B]`,description:f(`Gráfico interativo conectando blends a perfis gastronômicos`,`Interactive graph connecting blends to culinary profiles`,`Gráfico interactivo conectando mezclas con perfiles gastronómicos`)},{id:`cardapio`,label:u(`nav.pairing`),shortLabel:u(`nav.short.pairing`),icon:Ee,iconColor:`text-[#4D6575] dark:text-[#7BA3BE]`,description:u(`nav.desc.pairing`)}';

if (code.includes(targetD) && !code.includes('id:`mapa_sabores`')) {
  code = code.replace(targetD, replaceD);
  console.log('✓ mapa_sabores added to navigation array D');
}

// 3. Add mapa_sabores route in ape
const targetApe = 'f===`cardapio`&&(0,Z.jsx)(Pfe,{onOpenLeadModal:(e,t)=>F(e,t)})';
const replaceApe = 'f===`mapa_sabores`&&(0,Z.jsx)(FlavorMap,{onSelectBlendForCarta:(e)=>{p(`carta`),window.scrollTo({top:0,behavior:`smooth`})},onOpenLeadModal:(e,t)=>F(e,t)}),f===`cardapio`&&(0,Z.jsx)(Pfe,{onOpenLeadModal:(e,t)=>F(e,t)})';

if (code.includes(targetApe) && !code.includes('f===`mapa_sabores`')) {
  code = code.replace(targetApe, replaceApe);
  console.log('✓ mapa_sabores route added to ape router');
}

// 4. Validate syntax
try {
  esbuild.transformSync(code, { loader: 'js' });
  console.log('✓ ESBuild syntax verification: PASSED');
  fs.writeFileSync('src/index-B-h_qskT.js', code, 'utf8');
  fs.writeFileSync('public/assets/index-B-h_qskT.js', code, 'utf8');
  console.log('✓ Successfully wrote updated files.');
} catch (err) {
  console.error('Syntax error during verification:', err);
  process.exit(1);
}
