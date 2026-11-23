/**
 * Builds public/assets/index-B-h_qskT.js from the clean reference bundle src/index-B-h_qskT.js:
 * 1. Keeps the header, hero, and navigation structure 100% identical to
 *    https://ais-pre-msr3gkhtymu4xiaa5ukmb2-582500982508.us-east1.run.app/
 * 2. Compiles src/FlavorMap.tsx using the bundle's single React instance (`w`) and JSX runtime (`Z`),
 *    injects strictly scoped utility CSS rules into `#talcha-flavormap-scope` (no global CSS leakage),
 *    and registers `mapa_sabores`.
 * 3. Upgrades ALL 5 Talchá PDFs (j9, FM, E9, Guia de Infusão, Manual Logística) + M9 A4 Preview
 *    to cohesive official Talchá Editorial branding (official PNG wordmark + teacup logos,
 *    Warm Cream #FAF7F2, Deep Burgundy #8B2635, Brushed Gold #C68A36, Botanical Green #2E6B34)
 *    with proportional Client Logo Co-Branding (`talcha_carta_client_logo`).
 * 4. Adds synced Client Logo Upload + Preview inside BOTH the Contact Modal (Lfe) and Carta B2B (jfe)
 *    using cohesive Talchá editorial light ivory/burgundy/gold styling.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const tailwindcss = require('tailwindcss');

const SOURCE_BUNDLE = path.resolve(__dirname, '../src/index-B-h_qskT.js');
const SOURCE_CSS = path.resolve(__dirname, '../public/assets/index-xYMwszd6.css');
const OUTPUT_BUNDLE = path.resolve(__dirname, '../public/assets/index-B-h_qskT.js');
const FLAVOR_MAP_TSX = path.resolve(__dirname, '../src/FlavorMap.tsx');
const ESTABLISHMENT_DASHBOARD_TSX = path.resolve(__dirname, '../src/DashboardEstabelecimento.tsx');
const TEA_RITUAL_3D_TSX = path.resolve(__dirname, '../src/TeaRitual3D.tsx');
const TALCHA_MAPS_TSX = path.resolve(__dirname, '../src/TalchaMapsExplorer.tsx');
const TALCHA_STUDIO_AI_TSX = path.resolve(__dirname, '../src/TalchaStudioAI.tsx');
const CARTA_PDF_PREVIEW_TSX = path.resolve(__dirname, '../src/CartaPdfPreviewModal.tsx');
const FAQ_SECTION_TSX = path.resolve(__dirname, '../src/FaqSection.tsx');
const PARTNER_TESTIMONIALS_TSX = path.resolve(__dirname, '../src/PartnerTestimonialsSection.tsx');
const TALCHA_INTERACTIVE_HEADER_TSX = path.resolve(__dirname, '../src/TalchaInteractiveHeader.tsx');
const TALCHA_BRAND_CONTEXT_TSX = path.resolve(__dirname, '../src/TalchaBrandContextSection.tsx');

function stripTopLevelBlock(css, prefix) {
  let out = '';
  let i = 0;
  while (i < css.length) {
    const idx = css.indexOf(prefix, i);
    if (idx === -1) {
      out += css.slice(i);
      break;
    }
    out += css.slice(i, idx);
    const semi = css.indexOf(';', idx);
    const brace = css.indexOf('{', idx);
    if (semi !== -1 && (brace === -1 || semi < brace)) {
      i = semi + 1;
      continue;
    }
    if (brace !== -1) {
      let depth = 1;
      let j = brace + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      i = j;
      continue;
    }
    i = idx + prefix.length;
  }
  return out;
}

async function compileMissingScopedCssFromText(sourceText, scopeSelector, options = {}) {
  const { includeAllTokens = false } = options;
  const existingCss = fs.readFileSync(SOURCE_CSS, 'utf8');

  const tokenSet = new Set();
  const pushTokens = (rawText) => {
    String(rawText || '')
      .replace(/\$\{[^}]+\}/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .forEach((tok) => {
        if (/^[a-zA-Z0-9_:\[\]#\/.\-%(),!]+$/.test(tok)) tokenSet.add(tok);
      });
  };
  for (const m of sourceText.matchAll(
    /(?:className\s*[:=]\s*(?:[`'"]([^`'"]+)[`'"]|\{[`'"]([^`'"]+)[`'"]\}))|(?:(?:bgLight|bgDark|color):\s*['"]([^'"]+)['"])/g
  )) {
    pushTokens(m[1] || m[2] || m[3] || '');
  }
  // Extract quoted / template segments inside dynamic className={...} expressions
  let searchPos = 0;
  while (true) {
    const idx = sourceText.indexOf('className={', searchPos);
    if (idx === -1) break;
    let depth = 1;
    let j = idx + 'className={'.length;
    while (j < sourceText.length && depth > 0 && j - idx < 2500) {
      if (sourceText[j] === '{') depth++;
      else if (sourceText[j] === '}') depth--;
      j++;
    }
    const expr = sourceText.slice(idx + 'className={'.length, j - 1);
    for (const qm of expr.matchAll(/[`'"]([^`'"]+)[`'"]/g)) {
      pushTokens(qm[1]);
    }
    searchPos = j;
  }

  const candidates = includeAllTokens
    ? [...tokenSet]
    : [...tokenSet].filter((tok) => {
        const escTok = tok.replace(/[[\]#:/.%(),]/g, (c) => `\\${c}`);
        return (
          !existingCss.includes(`.${escTok}{`) &&
          !existingCss.includes(`.${escTok}:`) &&
          !existingCss.includes(`.${escTok},`) &&
          !existingCss.includes(`.${escTok} `)
        );
      });

  if (candidates.length === 0) return '';

  const twDir = path.dirname(require.resolve('tailwindcss/package.json'));
  const compiler = await tailwindcss.compile(
    `@custom-variant dark (&:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *));\n@import "tailwindcss/theme";\n@import "tailwindcss/utilities";`,
    {
      base: twDir,
      loadStylesheet: async (id) => {
        let target = id.replace(/^tailwindcss\//, '');
        if (!target.endsWith('.css')) target += '.css';
        const resolved = path.join(twDir, target);
        return {
          path: resolved,
          base: path.dirname(resolved),
          content: fs.readFileSync(resolved, 'utf8'),
        };
      },
    }
  );

  let built = compiler.build(candidates);
  // Remove global @property / @layer properties declarations so main page Tailwind cascade stays 100% intact
  built = stripTopLevelBlock(built, '@layer properties');
  built = stripTopLevelBlock(built, '@property ');
  built = built.replace(/:root,\s*:host\b/g, '&').trim();

  // Strictly scope all generated utility rules inside @layer utilities & scopeSelector
  const scopedCss = `@layer utilities { ${scopeSelector} { ${built} } }`;
  return esbuild.transformSync(scopedCss, { loader: 'css', minify: true }).code.trim();
}

async function compileMissingScopedCss(tsxPath, scopeSelector, options = {}) {
  const fmSrc = fs.readFileSync(tsxPath, 'utf8');
  return compileMissingScopedCssFromText(fmSrc, scopeSelector, options);
}

async function main() {
  let code = fs.readFileSync(SOURCE_BUNDLE, 'utf8');

  // ---------------------------------------------------------------------------
  // 0. Inject provisioned Firebase configuration from firebase-applet-config.json
  // ---------------------------------------------------------------------------
  const FIREBASE_CONFIG_PATH = path.resolve(__dirname, '../firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(FIREBASE_CONFIG_PATH, 'utf8'));
  const targetFirebaseInit =
    'var zS={projectId:`gen-lang-client-0463531550`,appId:`1:319883251550:web:a76b3f7e61040d1a3049cf`,apiKey:`AIzaSyDFanFu8BWY5PvduSV4UWjV8HRpxvi2SnY`,authDomain:`gen-lang-client-0463531550.firebaseapp.com`,firestoreDatabaseId:`ai-studio-talchpidiaconsul-86c36ca8-d5fe-4235-8340-585004124b24`,storageBucket:`gen-lang-client-0463531550.firebasestorage.app`,messagingSenderId:`319883251550`,measurementId:``,oAuthClientId:`319883251550-82vv2u515gtsn9q07sgum8o48robvjcr.apps.googleusercontent.com`,recaptchaSiteKey:``},BS=Yr(zS),VS=xS(BS,zS.firestoreDatabaseId),HS=uc(BS);';
  if (!code.includes(targetFirebaseInit)) {
    throw new Error('Could not find targetFirebaseInit (zS)');
  }
  code = code.replace(
    targetFirebaseInit,
    () =>
      `var zS=${JSON.stringify(firebaseConfig)},BS=Yr(zS),VS=(function(db){try{db._setSettings({experimentalForceLongPolling:!0,useFetchStreams:!1})}catch{}return db})(xS(BS,zS.firestoreDatabaseId)),HS=uc(BS);`
  );

  const targetAuthorizedDomains =
    'authorizedDomains:[zS.authDomain,`ais-dev-msr3gkhtymu4xiaa5ukmb2-582500982508.us-east1.run.app`,`ais-pre-msr3gkhtymu4xiaa5ukmb2-582500982508.us-east1.run.app`,`localhost`]';
  if (!code.includes(targetAuthorizedDomains)) {
    throw new Error('Could not find targetAuthorizedDomains (US)');
  }
  const replaceAuthorizedDomains =
    'authorizedDomains:[zS.authDomain,`ais-dev-kxou6cudx6nvzljeywf2g3-582500982508.us-east1.run.app`,`ais-pre-kxou6cudx6nvzljeywf2g3-582500982508.us-east1.run.app`,...(typeof window!==`undefined`&&window.location?.hostname?[window.location.hostname]:[]),`localhost`]';
  code = code.replace(targetAuthorizedDomains, replaceAuthorizedDomains);
  console.log('✓ Wired live Firebase configuration & authorizedDomains from firebase-applet-config.json');

  // ---------------------------------------------------------------------------
  // 0B. Expose ReactDOM (`h`) from the bundle for external React libraries (@vis.gl/react-google-maps)
  // ---------------------------------------------------------------------------
  const targetReactDomExport = 't.exports=m()})),g=o(';
  const replaceReactDomExport =
    't.exports=m(),globalThis.__TALCHA_BUNDLE_REACTDOM__=t.exports})),g=o(';
  if (!code.includes(targetReactDomExport)) {
    throw new Error('Could not find targetReactDomExport (react-dom bridge)');
  }
  code = code.replace(targetReactDomExport, replaceReactDomExport);
  console.log('✓ Exposed bundle ReactDOM instance via globalThis.__TALCHA_BUNDLE_REACTDOM__');

  // ---------------------------------------------------------------------------
  // 1. Compile FlavorMap, EstablishmentDashboard, TeaRitual3D, TalchaMapsExplorer, TalchaStudioAI + Scoped CSS
  // ---------------------------------------------------------------------------
  const bridgePlugin = {
    name: 'talcha-react-bridge',
    setup(build) {
      build.onResolve({ filter: /^react$/ }, () => ({
        path: 'react',
        namespace: 'talcha-react-ns',
      }));
      build.onLoad({ filter: /.*/, namespace: 'talcha-react-ns' }, () => ({
        contents: 'module.exports = globalThis.__TALCHA_BUNDLE_REACT__;',
        loader: 'js',
      }));
      build.onResolve({ filter: /^react-dom$/ }, () => ({
        path: 'react-dom',
        namespace: 'talcha-reactdom-ns',
      }));
      build.onLoad({ filter: /.*/, namespace: 'talcha-reactdom-ns' }, () => ({
        contents: 'module.exports = globalThis.__TALCHA_BUNDLE_REACTDOM__;',
        loader: 'js',
      }));
      build.onResolve({ filter: /^react\/jsx-runtime$/ }, () => ({
        path: 'react/jsx-runtime',
        namespace: 'talcha-jsx-ns',
      }));
      build.onLoad({ filter: /.*/, namespace: 'talcha-jsx-ns' }, () => ({
        contents: 'module.exports = globalThis.__TALCHA_BUNDLE_JSX__;',
        loader: 'js',
      }));
    },
  };

  const replaceHeroMarkup =
    '(0,Z.jsx)(`div`,{className:`absolute inset-0 bg-gradient-to-b from-[#0A120E]/20 via-[#0A120E]/60 via-45% to-[#0A120E]/95 md:hidden pointer-events-none`}),(0,Z.jsx)(`div`,{className:`absolute inset-0 hidden md:block bg-gradient-to-r from-[#0A120E]/85 via-[#0A120E]/40 via-45% to-transparent pointer-events-none`}),(0,Z.jsx)(`div`,{className:`relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-16 pb-6 sm:pb-12 mt-auto sm:my-auto`,children:(0,Z.jsxs)(`div`,{className:`w-full max-w-2xl lg:max-w-3xl space-y-3.5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700`,children:[(0,Z.jsxs)(`div`,{className:`sm:hidden flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F3D78E]`,children:[(0,Z.jsx)(`span`,{className:`w-6 h-[1.5px] bg-[#C68A36] shrink-0`,"aria-hidden":`true`}),(0,Z.jsx)(`span`,{children:a===`en`?`Talchá · B2B Tea Curation`:a===`es`?`Talchá · Curaduría B2B`:`Talchá · Curadoria B2B de Chás`})]}),(0,Z.jsxs)(`h1`,{className:`font-serif-editorial text-[2.125rem] sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[#FAF7F2] leading-[1.08] text-balance drop-shadow-[0_2px_14px_rgba(0,0,0,0.88)] sm:drop-shadow-md`,children:[i(`hero.headlineStart`),` `,(0,Z.jsx)(`span`,{className:`italic font-semibold sm:font-normal text-[#F3D78E] sm:text-[#D89B48] drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]`,children:i(`hero.headlineAccent`)}),` `,i(`hero.headlineEnd`)]}),(0,Z.jsx)(`p`,{className:`text-[15px] sm:text-lg md:text-xl text-[#FAF7F2]/90 sm:text-[#EBE4D8] font-normal sm:font-light leading-relaxed max-w-[34ch] sm:max-w-xl text-balance drop-shadow-[0_1px_8px_rgba(0,0,0,0.88)] sm:drop-shadow-sm`,children:i(`hero.subtitle`)}),(0,Z.jsxs)(`div`,{className:`w-full pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 sm:max-w-none`,children:[(0,Z.jsxs)(`button`,{type:`button`,onClick:m,className:`relative w-full sm:w-auto px-5 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-full bg-gradient-to-r from-[#173322] via-[#22442E] to-[#173322] hover:from-[#1d3d2a] hover:to-[#2c5339] text-[#FAF7F2] border-2 border-[#C68A36] font-semibold text-[15px] sm:text-base shadow-[0_6px_22px_rgba(198,138,54,0.32)] sm:shadow-[0_0_24px_rgba(198,138,54,0.4)] hover:shadow-[0_0_36px_rgba(198,138,54,0.6)] sm:ring-4 sm:ring-[#C68A36]/25 sm:hover:ring-[#C68A36]/50 transition-all duration-300 flex items-center justify-center gap-3 group cursor-pointer active:scale-[0.99] min-h-[52px]`,id:`hero-cta-encontrar-cha`,children:[(0,Z.jsx)(`div`,{className:`w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#C68A36]/25 flex items-center justify-center group-hover:bg-[#C68A36]/40 transition-colors shrink-0`,children:(0,Z.jsx)(it,{className:`w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F3D78E] group-hover:scale-110 transition-transform`})}),(0,Z.jsx)(`span`,{className:`tracking-wide font-semibold sm:font-medium`,children:i(`hero.findTea`)}),(0,Z.jsx)(k,{className:`w-4 h-4 text-[#DDD4C4] group-hover:translate-x-1 transition-transform shrink-0`})]}),(0,Z.jsxs)(`button`,{type:`button`,onClick:()=>{Q.light(),t()},className:`w-full sm:w-auto px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-full bg-[#1E1B18]/75 sm:bg-black/35 hover:bg-black/60 text-[#FAF7F2] sm:text-[#DDD4C4] hover:text-[#FAF7F2] border border-[#C68A36]/45 sm:border-white/20 hover:border-white/40 backdrop-blur-md font-medium text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] min-h-[48px]`,id:`hero-cta-explorar-talchapidia`,children:[(0,Z.jsx)(_e,{className:`w-4 h-4 text-[#F3D78E] sm:text-[#DDD4C4]/80 group-hover:text-white shrink-0`}),(0,Z.jsx)(`span`,{children:i(`hero.explore`)})]})]}),(0,Z.jsxs)(`div`,{className:`w-full pt-3 sm:pt-2 mt-1 sm:mt-0 border-t border-white/15 sm:border-t-0 grid grid-cols-3 sm:flex sm:flex-wrap items-start sm:items-center gap-2 sm:gap-x-3 gap-y-1 text-[11px] sm:text-sm text-[#DDD4C4]/90 sm:text-[#DDD4C4]/85`,children:[(0,Z.jsxs)(`span`,{className:`flex flex-col sm:flex-row sm:items-center sm:gap-1 leading-tight`,children:[(0,Z.jsx)(`strong`,{className:`text-sm text-[#FAF7F2] font-semibold tabular-nums`,children:`+500`}),` `,i(`hero.venues`)]}),(0,Z.jsx)(`span`,{"aria-hidden":`true`,className:`hidden sm:inline text-[#8E867B]`,children:`·`}),(0,Z.jsxs)(`span`,{className:`flex flex-col sm:flex-row sm:items-center sm:gap-1 leading-tight`,children:[(0,Z.jsx)(`strong`,{className:`text-sm text-[#FAF7F2] font-semibold`,children:`100%`}),` `,i(`hero.leaves`)]}),(0,Z.jsx)(`span`,{"aria-hidden":`true`,className:`hidden sm:inline text-[#8E867B]`,children:`·`}),(0,Z.jsxs)(`span`,{className:`flex flex-col sm:flex-row sm:items-center sm:gap-1 leading-tight`,children:[(0,Z.jsx)(`strong`,{className:`text-sm text-[#6FD47B] font-semibold tabular-nums`,children:`+750%`}),` `,i(`hero.margin`)]})]})]})})';

  const stripCssTokensSample = `
    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 border-t border-[#E5DACB] dark:border-[#2C241E]"
    className="mb-7 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
    className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8B2635] dark:text-[#E88E9B]"
    className="font-serif-editorial text-2xl sm:text-3xl font-bold text-[#1E1B18] dark:text-[#FAF7F2] mt-1"
    className="text-sm text-[#5C564D] dark:text-[#C2B8AA] max-w-xl"
    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    className="group text-left bg-white dark:bg-[#191512] rounded-2xl border border-[#DFD2BF] dark:border-[#352C23] hover:border-[#C68A36] p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4"
    className="flex items-center justify-between gap-2"
    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#FAF7F2] dark:bg-[#231E1A] text-[#8B2635] dark:text-[#E88E9B] border border-[#E5DACB] dark:border-[#3C332B]"
    className="text-xs font-bold text-[#C68A36] group-hover:translate-x-1 transition-transform"
    className="font-serif-editorial text-lg font-bold text-[#1E1B18] dark:text-[#FAF7F2] group-hover:text-[#8B2635] dark:group-hover:text-[#F3D78E] transition-colors"
    className="text-xs text-[#5C564D] dark:text-[#C2B8AA] leading-relaxed"
  `;

  const [
    flavorMapResult,
    extraFlavorCss,
    dashboardResult,
    extraDashboardCss,
    teaRitual3DResult,
    extraTeaRitual3DCss,
    talchaMapsResult,
    extraTalchaMapsCss,
    talchaStudioAIResult,
    extraTalchaStudioAICss,
    cartaPdfPreviewResult,
    extraCartaPdfPreviewCss,
    faqSectionResult,
    extraFaqSectionCss,
    partnerTestimonialsResult,
    extraPartnerTestimonialsCss,
    interactiveHeaderResult,
    extraInteractiveHeaderCss,
    brandContextResult,
    extraBrandContextCss,
    extraStripCss,
    extraHeroCss,
  ] = await Promise.all([
    esbuild.build({
      entryPoints: [FLAVOR_MAP_TSX],
      bundle: true,
      write: false,
      format: 'iife',
      globalName: '__TalchaFlavorMapMod',
      minify: true,
      jsx: 'automatic',
      target: ['es2020'],
      plugins: [bridgePlugin],
    }),
    compileMissingScopedCss(FLAVOR_MAP_TSX, '#talcha-flavormap-scope'),
    esbuild.build({
      entryPoints: [ESTABLISHMENT_DASHBOARD_TSX],
      bundle: true,
      write: false,
      format: 'iife',
      globalName: '__TalchaEstablishmentDashboardMod',
      minify: true,
      jsx: 'automatic',
      target: ['es2020'],
      plugins: [bridgePlugin],
    }),
    compileMissingScopedCssFromText(
      fs.readFileSync(ESTABLISHMENT_DASHBOARD_TSX, 'utf8') +
        '\n' +
        fs.readFileSync(path.resolve(__dirname, '../src/components/DashboardEstabelecimento.tsx'), 'utf8'),
      '#talcha-dashboard-estabelecimento-scope',
      { includeAllTokens: true }
    ),
    esbuild.build({
      entryPoints: [TEA_RITUAL_3D_TSX],
      bundle: true,
      write: false,
      format: 'iife',
      globalName: '__TalchaTeaRitual3DMod',
      minify: true,
      jsx: 'automatic',
      target: ['es2020'],
      plugins: [bridgePlugin],
    }),
    compileMissingScopedCss(TEA_RITUAL_3D_TSX, '#talcha-ritual3d-scope'),
    esbuild.build({
      entryPoints: [TALCHA_MAPS_TSX],
      bundle: true,
      write: false,
      format: 'iife',
      globalName: '__TalchaMapsExplorerMod',
      minify: true,
      jsx: 'automatic',
      target: ['es2020'],
      plugins: [bridgePlugin],
    }),
    compileMissingScopedCss(TALCHA_MAPS_TSX, '#talcha-maps-scope'),
    esbuild.build({
      entryPoints: [TALCHA_STUDIO_AI_TSX],
      bundle: true,
      write: false,
      format: 'iife',
      globalName: '__TalchaStudioAIMod',
      minify: true,
      jsx: 'automatic',
      target: ['es2020'],
      plugins: [bridgePlugin],
    }),
    compileMissingScopedCss(TALCHA_STUDIO_AI_TSX, '#talcha-studio-ai-scope'),
    esbuild.build({
      entryPoints: [CARTA_PDF_PREVIEW_TSX],
      bundle: true,
      write: false,
      format: 'iife',
      globalName: '__TalchaPdfPreviewMod',
      minify: true,
      jsx: 'automatic',
      target: ['es2020'],
      plugins: [bridgePlugin],
    }),
    compileMissingScopedCss(CARTA_PDF_PREVIEW_TSX, '#talcha-pdf-preview-scope'),
    esbuild.build({
      entryPoints: [FAQ_SECTION_TSX],
      bundle: true,
      write: false,
      format: 'iife',
      globalName: '__TalchaFaqSectionMod',
      minify: true,
      jsx: 'automatic',
      target: ['es2020'],
      plugins: [bridgePlugin],
    }),
    compileMissingScopedCss(FAQ_SECTION_TSX, '#talcha-faq-scope'),
    esbuild.build({
      entryPoints: [PARTNER_TESTIMONIALS_TSX],
      bundle: true,
      write: false,
      format: 'iife',
      globalName: '__TalchaPartnerTestimonialsMod',
      minify: true,
      jsx: 'automatic',
      target: ['es2020'],
      plugins: [bridgePlugin],
    }),
    compileMissingScopedCss(PARTNER_TESTIMONIALS_TSX, '#talcha-testimonials-scope'),
    esbuild.build({
      entryPoints: [TALCHA_INTERACTIVE_HEADER_TSX],
      bundle: true,
      write: false,
      format: 'iife',
      globalName: '__TalchaInteractiveHeaderMod',
      minify: true,
      jsx: 'automatic',
      target: ['es2020'],
      plugins: [bridgePlugin],
    }),
    compileMissingScopedCss(TALCHA_INTERACTIVE_HEADER_TSX, '#talcha-interactive-header-scope', { includeAllTokens: true }),
    esbuild.build({
      entryPoints: [TALCHA_BRAND_CONTEXT_TSX],
      bundle: true,
      write: false,
      format: 'iife',
      globalName: '__TalchaBrandContextMod',
      minify: true,
      jsx: 'automatic',
      target: ['es2020'],
      plugins: [bridgePlugin],
    }),
    compileMissingScopedCss(TALCHA_BRAND_CONTEXT_TSX, '#talcha-brand-context-scope', { includeAllTokens: true }),
    compileMissingScopedCssFromText(stripCssTokensSample, '#talcha-experiences-strip-scope', { includeAllTokens: true }),
    compileMissingScopedCssFromText(replaceHeroMarkup, '#home-hero', { includeAllTokens: true }),
  ]);

  const LOGO_WHITE_PATH = path.resolve(__dirname, '../public/assets/logo_talcha_branco.png');
  const LOGO_BLACK_PATH = path.resolve(__dirname, '../public/assets/logo_talcha_preto.png');
  const PDF_OVERRIDE_PATH = path.resolve(__dirname, './talcha_pdf_override.js');

  const logoWhiteB64 = `data:image/png;base64,${fs.readFileSync(LOGO_WHITE_PATH).toString('base64')}`;
  const logoBlackB64 = `data:image/png;base64,${fs.readFileSync(LOGO_BLACK_PATH).toString('base64')}`;

  // Shared client logo normalizer (preserves natural aspect ratio) + Scoped FlavorMap CSS + Logo UI strip
  const sharedRuntimeHelper = `
;var TALCHA_LOGO_WHITE=${JSON.stringify(logoWhiteB64)},TALCHA_LOGO_BLACK=${JSON.stringify(logoBlackB64)};
function talchaNormalizeClientLogo(file,cb){
  if(!file)return;
  var rd=new FileReader();
  rd.onload=function(){
    var dataUrl=String(rd.result||'');
    if(!dataUrl)return;
    var img=new Image();
    img.onload=function(){
      try{
        var iw=img.naturalWidth||240,ih=img.naturalHeight||120;
        var sc=Math.min(480/iw,240/ih,1);
        var dw=Math.max(40,Math.round(iw*sc)),dh=Math.max(40,Math.round(ih*sc));
        var cv=document.createElement('canvas');
        cv.width=dw;cv.height=dh;
        var ctx=cv.getContext('2d');
        ctx.clearRect(0,0,dw,dh);
        ctx.drawImage(img,0,0,dw,dh);
        var png=cv.toDataURL('image/png');
        try{localStorage.setItem('talcha_carta_client_logo',png);}catch(e){}
        try{window.dispatchEvent(new CustomEvent('talcha_logo_updated',{detail:png}));}catch(e){}
        if(cb)cb(png);
      }catch(err){
        try{localStorage.setItem('talcha_carta_client_logo',dataUrl);}catch(e){}
        try{window.dispatchEvent(new CustomEvent('talcha_logo_updated',{detail:dataUrl}));}catch(e){}
        if(cb)cb(dataUrl);
      }
    };
    img.onerror=function(){
      try{localStorage.setItem('talcha_carta_client_logo',dataUrl);}catch(e){}
      try{window.dispatchEvent(new CustomEvent('talcha_logo_updated',{detail:dataUrl}));}catch(e){}
      if(cb)cb(dataUrl);
    };
    img.src=dataUrl;
  };
  rd.readAsDataURL(file);
}
function talchaClearClientLogo(cb){
  try{localStorage.removeItem('talcha_carta_client_logo');}catch(e){}
  try{window.dispatchEvent(new CustomEvent('talcha_logo_updated',{detail:null}));}catch(e){}
  if(cb)cb(null);
}
function talchaUseReveal(threshold){
  var ref=(0,w.useRef)(null);
  var _st=(0,w.useState)(false),shown=_st[0],setShown=_st[1];
  (0,w.useEffect)(function(){
    try{
      if(typeof window!=='undefined'&&window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){
        setShown(true);return;
      }
    }catch(e){}
    var el=ref.current;
    if(!el){setShown(true);return;}
    try{
      var r=el.getBoundingClientRect();
      if(r.top<=(window.innerHeight||800)*0.96){setShown(true);return;}
    }catch(e){}
    if(typeof IntersectionObserver==='undefined'){setShown(true);return;}
    var obs=new IntersectionObserver(function(entries){
      for(var k=0;k<entries.length;k++){
        if(entries[k].isIntersecting){setShown(true);obs.disconnect();break;}
      }
    },{threshold:threshold||0.08,rootMargin:'0px 0px -30px 0px'});
    obs.observe(el);
    return function(){obs.disconnect();};
  },[]);
  return[ref,shown];
}
(function(){
  if(typeof document!=='undefined'&&!document.getElementById('talcha-flavormap-css')){
    var st=document.createElement('style');
    st.id='talcha-flavormap-css';
    st.textContent=${JSON.stringify(extraFlavorCss)};
    document.head.appendChild(st);
  }
  if(typeof document!=='undefined'&&!document.getElementById('talcha-establishment-dashboard-css')){
    var st2=document.createElement('style');
    st2.id='talcha-establishment-dashboard-css';
    st2.textContent=${JSON.stringify(extraDashboardCss)};
    document.head.appendChild(st2);
  }
  if(typeof document!=='undefined'&&!document.getElementById('talcha-hero-mobile-css')){
    var st3=document.createElement('style');
    st3.id='talcha-hero-mobile-css';
    st3.textContent=${JSON.stringify(extraHeroCss)};
    document.head.appendChild(st3);
  }
  if(typeof document!=='undefined'&&!document.getElementById('talcha-ritual3d-css')){
    var st4=document.createElement('style');
    st4.id='talcha-ritual3d-css';
    st4.textContent=${JSON.stringify(extraTeaRitual3DCss)};
    document.head.appendChild(st4);
  }
  if(typeof document!=='undefined'&&!document.getElementById('talcha-maps-css')){
    var st5=document.createElement('style');
    st5.id='talcha-maps-css';
    st5.textContent=${JSON.stringify(extraTalchaMapsCss)};
    document.head.appendChild(st5);
  }
  if(typeof document!=='undefined'&&!document.getElementById('talcha-studio-ai-css')){
    var st6=document.createElement('style');
    st6.id='talcha-studio-ai-css';
    st6.textContent=${JSON.stringify(extraTalchaStudioAICss)};
    document.head.appendChild(st6);
  }
  if(typeof document!=='undefined'&&!document.getElementById('talcha-experiences-strip-css')){
    var st7=document.createElement('style');
    st7.id='talcha-experiences-strip-css';
    st7.textContent=${JSON.stringify(extraStripCss)};
    document.head.appendChild(st7);
  }
  if(typeof document!=='undefined'&&!document.getElementById('talcha-pdf-preview-css')){
    var st8=document.createElement('style');
    st8.id='talcha-pdf-preview-css';
    st8.textContent=${JSON.stringify(extraCartaPdfPreviewCss)};
    document.head.appendChild(st8);
  }
  if(typeof document!=='undefined'&&!document.getElementById('talcha-faq-css')){
    var st9=document.createElement('style');
    st9.id='talcha-faq-css';
    st9.textContent=${JSON.stringify(extraFaqSectionCss)};
    document.head.appendChild(st9);
  }
  if(typeof document!=='undefined'&&!document.getElementById('talcha-testimonials-css')){
    var st10=document.createElement('style');
    st10.id='talcha-testimonials-css';
    st10.textContent=${JSON.stringify(extraPartnerTestimonialsCss)};
    document.head.appendChild(st10);
  }
  if(typeof document!=='undefined'&&!document.getElementById('talcha-interactive-header-css')){
    var st11=document.createElement('style');
    st11.id='talcha-interactive-header-css';
    st11.textContent=${JSON.stringify(extraInteractiveHeaderCss)};
    document.head.appendChild(st11);
  }
  if(typeof document!=='undefined'&&!document.getElementById('talcha-brand-context-css')){
    var st12=document.createElement('style');
    st12.id='talcha-brand-context-css';
    st12.textContent=${JSON.stringify(extraBrandContextCss)};
    document.head.appendChild(st12);
  }
})();
globalThis.__TALCHA_BUNDLE_REACT__=w;globalThis.__TALCHA_BUNDLE_JSX__=Z;
globalThis.__TALCHA_DASHBOARD_BRIDGE__={
  get useAuth(){return NC;},
  get useLang(){return SC;},
  get useTheme(){return hC;},
  get tier(){return zC;},
  get notifications(){return KC;},
  get audio(){return PC;},
  get haptics(){return Q;},
  get firebase(){return{config:zS,db:VS,auth:HS,doc:Qg,getDoc:AS,setDoc:MS,updateDoc:NS,deleteDoc:PS,serverTimestamp:E_,testConnection:KS,handleFirestoreError:JS,OperationType:qS};},
  get catalog(){return{products:zM,getTemplateForBusiness:KM,localizeProduct:NM,localizeCategory:DM};},
  get storage(){return{getCartas:()=>z9.getAll(),deleteCarta:id=>z9.delete(id),getLeads:()=>sC(),getLeadsStorageKey:()=>nC(),sanitizeId:rC,sanitizeText:iC,commercialContact:aC};},
  get pdf(){return{downloadCartaPdf:Sfe};}
};
${flavorMapResult.outputFiles[0].text}
${dashboardResult.outputFiles[0].text}
${teaRitual3DResult.outputFiles[0].text}
${talchaMapsResult.outputFiles[0].text}
${talchaStudioAIResult.outputFiles[0].text}
${cartaPdfPreviewResult.outputFiles[0].text}
${faqSectionResult.outputFiles[0].text}
${partnerTestimonialsResult.outputFiles[0].text}
${interactiveHeaderResult.outputFiles[0].text}
${brandContextResult.outputFiles[0].text}
function talchaMapBusinessType(rawSegment){
  var s=String(rawSegment||'').toLowerCase();
  if(s.includes('hotel')||s.includes('resort'))return 'Hotel';
  if(s.includes('cafeteria')||s.includes('café')||s.includes('padaria')||s.includes('confeitaria')||s.includes('bakery'))return 'Cafeteria';
  if(s.includes('spa')||s.includes('wellness'))return 'Spa';
  if(s.includes('empório')||s.includes('emporio')||s.includes('gourmet')||s.includes('delicatessen'))return 'Empório';
  if(s.includes('outro')||s.includes('evento')||s.includes('corporativo'))return 'Outro';
  return 'Restaurante';
}
function talchaNormalizeCartaPayload(raw,lang,localize,catalogList,getTplFn){
  var resolvedBiz=talchaMapBusinessType(raw.businessType||raw.segmento||'Restaurante');
  var tpl=typeof getTplFn==='function'?getTplFn(resolvedBiz,lang):null;
  var tplIds=Array.isArray(tpl&&tpl.items)?tpl.items.map(function(it){return it.blend&&it.blend.id;}).filter(Boolean):[];
  var list=Array.isArray(catalogList)?catalogList:[];
  function findProduct(token){
    if(!token)return null;
    var q=String(token).trim().toLowerCase();
    return list.find(function(p){
      if(!p)return false;
      if(String(p.id||'').toLowerCase()===q)return true;
      if(String(p.name||'').toLowerCase()===q)return true;
      if(p.name_en&&String(p.name_en).toLowerCase()===q)return true;
      if(p.name_es&&String(p.name_es).toLowerCase()===q)return true;
      return String(p.name||'').toLowerCase().includes(q);
    })||null;
  }
  var rawCustom=Array.isArray(raw.customBlendIds)?raw.customBlendIds:[];
  var rawRemoved=Array.isArray(raw.removedBlendIds)?raw.removedBlendIds:[];
  var rawBlends=Array.isArray(raw.blends)?raw.blends:[];
  var customBlendIds=rawCustom.map(function(x){var p=findProduct(x);return p?p.id:String(x);}).filter(Boolean);
  var removedBlendIds=rawRemoved.slice();
  if(rawBlends.length>0&&customBlendIds.length===0&&removedBlendIds.length===0){
    var matchedProducts=rawBlends.map(findProduct).filter(Boolean);
    if(matchedProducts.length>0){
      var matchedSet=new Set(matchedProducts.map(function(p){return p.id;}));
      removedBlendIds=tplIds.filter(function(tid){return !matchedSet.has(tid);});
      customBlendIds=matchedProducts.filter(function(p){return !tplIds.includes(p.id);}).map(function(p){return p.id;});
    }
  }
  return{
    id:raw.id,
    name:raw.name||raw.nome||raw.cartaTitle||'Carta de Chás',
    establishmentName:raw.establishmentName!==undefined?raw.establishmentName:(raw.estabelecimento||''),
    businessType:resolvedBiz,
    audienceProfile:raw.audienceProfile||'',
    operatingHours:raw.operatingHours||'',
    menuHighlights:raw.menuHighlights!==undefined?raw.menuHighlights:(raw.observacoes||''),
    serviceFormat:raw.serviceFormat!==undefined?raw.serviceFormat:(raw.formatoServico||''),
    cartaTitle:raw.cartaTitle||raw.nome||raw.name||'',
    itemCount:raw.itemCount||raw.itensCount||Math.max(1,tplIds.length-removedBlendIds.length+customBlendIds.length),
    customBlendIds:customBlendIds,
    removedBlendIds:removedBlendIds,
    replacedBlendMap:raw.replacedBlendMap&&typeof raw.replacedBlendMap==='object'?raw.replacedBlendMap:{},
    statusProposta:raw.statusProposta||'pendente',
    loadedFromFirestore:!!(raw._loadedFromFirestore||raw.source==='cloud')
  };
}
function TalchaCuratorEditBanner({editingCarta,saving,onSaveEdits,onOpenSaveModal,onDiscard,localize}){
  if(!editingCarta)return null;
  var st=editingCarta.statusProposta||'pendente';
  var isApproved=st==='aprovada';
  var statusLabel=st==='aprovada'?localize('Aprovada','Approved','Aprobada'):st==='em_analise'?localize('Em Análise','Under Review','En Análisis'):localize('Pendente','Pending','Pendiente');
  return(0,Z.jsxs)('div',{
    id:'talcha-curator-editing-banner',
    style:{backgroundColor:'#FFFFFF',borderTop:'3px solid #C68A36',borderRight:'1px solid #DFD2BF',borderBottom:'1px solid #DFD2BF',borderLeft:'1px solid #DFD2BF',borderRadius:'16px',marginBottom:'20px',padding:'14px 18px',display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:'12px',boxShadow:'0 4px 14px rgba(30,27,24,0.06)'},
    children:[
      (0,Z.jsxs)('div',{style:{minWidth:0,flex:'1 1 260px'},children:[
        (0,Z.jsxs)('div',{style:{display:'flex',flexWrap:'wrap',alignItems:'center',gap:'8px',marginBottom:'4px'},children:[
          (0,Z.jsx)('span',{style:{fontSize:'10px',fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',padding:'2px 8px',borderRadius:'6px',backgroundColor:'#8B2635',color:'#FFFFFF'},children:localize('Modo Edição · Firestore','Edit Mode · Firestore','Modo Edición · Firestore')}),
          (0,Z.jsx)('span',{style:{fontSize:'10px',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',padding:'2px 8px',borderRadius:'6px',backgroundColor:isApproved?'#EAF5EB':'#FAF4E8',color:isApproved?'#235428':'#8F5F14',border:'1px solid #C68A36'},children:localize('Proposta: ','Proposal: ','Propuesta: ')+statusLabel}),
          (0,Z.jsx)('span',{style:{fontSize:'10px',fontFamily:'monospace',color:'#70675A'},children:'#'+String(editingCarta.id||'')})
        ]}),
        (0,Z.jsx)('div',{style:{fontSize:'15px',fontWeight:700,color:'#1E1B18',lineHeight:1.3},children:editingCarta.name||localize('Carta de Chás','Tea Menu','Carta de Té')}),
        (0,Z.jsx)('div',{style:{fontSize:'12px',color:'#5C564D',marginTop:'2px'},children:isApproved?localize('Esta proposta já foi aprovada em cartas_cha; ao salvar alterações, sua edição será preservada na cópia pessoal ou como nova revisão.','This proposal is already approved; saving keeps your edits in your personal menu or creates a revision.','Esta propuesta ya fue aprobada; guardar actualiza tu copia personal o crea una nueva revisión.'):localize('Ajuste o segmento, estabelecimento, harmonizações ou blends abaixo e salve diretamente no Firestore.','Adjust venue details, pairings or blends below and save directly back to Firestore.','Ajusta segmento, local, notas o blends abajo y guarda los cambios en Firestore.')})
      ]}),
      (0,Z.jsxs)('div',{style:{display:'flex',flexWrap:'wrap',alignItems:'center',gap:'8px',flexShrink:0},children:[
        (0,Z.jsx)('button',{type:'button',disabled:!!saving,onClick:onSaveEdits,style:{padding:'8px 14px',borderRadius:'10px',backgroundColor:'#2E6B34',border:'1px solid #235428',color:'#FFFFFF',fontSize:'12px',fontWeight:700,cursor:saving?'wait':'pointer',opacity:saving?0.7:1},children:saving?localize('Salvando no Firestore...','Saving to Firestore...','Guardando...'):isApproved?localize('Atualizar Cópia Pessoal','Update Personal Copy','Actualizar Copia'):localize('Salvar Alterações no Firestore','Save Changes to Firestore','Guardar Cambios en Firestore')}),
        (0,Z.jsx)('button',{type:'button',onClick:onOpenSaveModal,style:{padding:'8px 12px',borderRadius:'10px',backgroundColor:'#FAF7F2',border:'1px solid #C68A36',color:'#8B2635',fontSize:'12px',fontWeight:600,cursor:'pointer'},children:localize('Renomear / Cópia','Rename / Copy','Renombrar / Copia')}),
        (0,Z.jsx)('button',{type:'button',onClick:onDiscard,style:{padding:'8px 12px',borderRadius:'10px',backgroundColor:'#FFFFFF',border:'1px solid #DFD2BF',color:'#5C564D',fontSize:'12px',fontWeight:600,cursor:'pointer'},children:localize('Sair da Edição','Exit Edit Mode','Salir de Edición')})
      ]})
    ]
  });
}
function TalchaClientLogoBar({venueName,localize}){
  let[logo,setLogo]=(0,w.useState)(()=>{try{return localStorage.getItem('talcha_carta_client_logo')||null}catch{return null}}),
  inpRef=(0,w.useRef)(null);
  (0,w.useEffect)(()=>{
    let h=ev=>setLogo(ev?.detail!==undefined?ev.detail:(()=>{try{return localStorage.getItem('talcha_carta_client_logo')||null}catch{return null}})());
    window.addEventListener('talcha_logo_updated',h);
    return()=>window.removeEventListener('talcha_logo_updated',h);
  },[]);
  return(0,Z.jsxs)('div',{
    id:'talcha-client-logo-personalizer',
    style:{backgroundColor:'#FFFFFF',borderTop:'3px solid #8B2635',borderRight:'1px solid #DFD2BF',borderBottom:'1px solid #DFD2BF',borderLeft:'1px solid #DFD2BF',borderRadius:'16px',marginBottom:'24px',padding:'12px 16px',display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:'12px',boxShadow:'0 3px 12px rgba(30,27,24,0.06)'},
    children:[
      (0,Z.jsxs)('div',{style:{display:'flex',alignItems:'center',gap:'12px',minWidth:0},children:[
        (0,Z.jsx)('img',{src:'/assets/logo_talcha_preto.png',alt:'Talchá',style:{height:'28px',width:'auto',objectFit:'contain',flexShrink:0}}),
        (0,Z.jsx)('div',{style:{height:'24px',width:'1px',backgroundColor:'#C68A36',flexShrink:0}}),
        (0,Z.jsxs)('div',{style:{minWidth:0},children:[
          (0,Z.jsx)('span',{style:{display:'block',fontSize:'10px',fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'#8B2635'},children:localize('Co-Branding Oficial nos PDFs','Official PDF Co-Branding','Co-Branding Oficial en PDFs')}),
          (0,Z.jsx)('span',{style:{display:'block',fontSize:'12px',color:'#4F4840',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'},children:logo?localize('Sua logo aparece ao lado da Talchá em todos os documentos B2B'+(venueName?' ('+venueName+')':''),'Your logo appears beside Talchá across all B2B PDFs','Su logotipo aparece junto a Talchá en todos los PDFs'):localize('Adicione o logotipo do seu estabelecimento para personalizar os PDFs','Upload your venue logo to personalize exported PDFs','Añade tu logotipo para personalizar los PDFs')})
        ]})
      ]}),
      (0,Z.jsxs)('div',{style:{display:'flex',alignItems:'center',gap:'8px',flexShrink:0},children:[
        logo&&(0,Z.jsxs)('div',{style:{position:'relative',display:'inline-flex',alignItems:'center'},children:[
          (0,Z.jsx)('img',{src:logo,alt:'Logo do cliente',style:{height:'34px',maxWidth:'92px',objectFit:'contain',backgroundColor:'#FAF7F2',borderRadius:'8px',padding:'3px 6px',border:'1px solid #C68A36'}}),
          (0,Z.jsx)('button',{type:'button',onClick:()=>talchaClearClientLogo(setLogo),title:localize('Remover logo','Remove logo','Eliminar logo'),style:{position:'absolute',top:'-6px',right:'-6px',width:'18px',height:'18px',borderRadius:'9999px',backgroundColor:'#8B2635',color:'#FFFFFF',border:'1px solid #FFFFFF',fontSize:'11px',lineHeight:1,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'},children:'×'})
        ]}),
        (0,Z.jsx)('input',{ref:inpRef,type:'file',accept:'image/png,image/jpeg,image/webp,image/svg+xml',onChange:ev=>{let fl=ev.target.files?.[0];if(fl)talchaNormalizeClientLogo(fl,setLogo);ev.target.value='';},style:{display:'none'}}),
        (0,Z.jsx)('button',{type:'button',id:'btn-carta-upload-logo',onClick:()=>inpRef.current?.click(),style:{padding:'7px 14px',borderRadius:'10px',backgroundColor:'#8B2635',border:'1px solid #C68A36',color:'#FFFFFF',fontSize:'12px',fontWeight:600,cursor:'pointer'},children:logo?localize('Trocar Logo','Change Logo','Cambiar Logo'):localize('+ Inserir Sua Logo no PDF','+ Add Your Logo to PDFs','+ Añadir Tu Logo al PDF')})
      ]})
    ]
  });
}
var FlavorMap=__TalchaFlavorMapMod.default||__TalchaFlavorMapMod;
var DashboardEstabelecimento=__TalchaEstablishmentDashboardMod.DashboardEstabelecimento||__TalchaEstablishmentDashboardMod.default||__TalchaEstablishmentDashboardMod;
var EstablishmentDashboard=DashboardEstabelecimento;
var TeaRitual3D=__TalchaTeaRitual3DMod.default||__TalchaTeaRitual3DMod;
var TalchaMapsExplorer=__TalchaMapsExplorerMod.default||__TalchaMapsExplorerMod;
var TalchaStudioAI=__TalchaStudioAIMod.default||__TalchaStudioAIMod;
var CartaPdfPreviewModal=__TalchaPdfPreviewMod.default||__TalchaPdfPreviewMod;
var TalchaFaqSection=__TalchaFaqSectionMod.default||__TalchaFaqSectionMod;
var TalchaTestimonialsSection=__TalchaPartnerTestimonialsMod.default||__TalchaPartnerTestimonialsMod;
var TalchaInteractiveHeader=__TalchaInteractiveHeaderMod.default||__TalchaInteractiveHeaderMod;
var TalchaBrandContextSection=__TalchaBrandContextMod.default||__TalchaBrandContextMod;
function TalchaExperiencesStrip({onNavigate}){
  let{localize:r}=SC();
  let[revealRef,revealed]=talchaUseReveal(0.08);
  let cards=[
    {id:'ritual_3d',badge:r('WebGL 3D Interativo','Interactive 3D WebGL','WebGL 3D Interactivo'),title:r('Mesa Ritual 3D · Vapt Vupt','3D Tea Ritual · Vapt Vupt','Mesa Ritual 3D · Vapt Vupt'),desc:r('Inspecione o infusor Vapt Vupt, copo duplo, tubo olfativo e simule a extração térmica de cada blend em 360°.','Inspect the Vapt Vupt brewer, double-wall glass, olfactory tubes and thermal steep simulation in 360°.','Inspecciona el infusor Vapt Vupt, vaso doble y tubos olfativos en 360°.')},
    {id:'mapa_flagship',badge:r('Google Maps & Places','Google Maps & Places','Google Maps & Places'),title:r('Mapa Flagship B2B & Terroirs','B2B Flagship & Terroir Map','Mapa Flagship B2B & Terroirs'),desc:r('Explore a flagship Pátio Higienópolis, estabelecimentos gastronômicos, rotas B2B e inteligência geográfica ao vivo.','Explore Flagship Higienópolis, culinary venues, B2B routing and live Maps Grounding intelligence.','Explora la flagship Higienópolis, rutas B2B e inteligencia geográfica en vivo.')},
    {id:'atelie_ia',badge:r('Imagen · Lyria 3 · Search','Imagen · Lyria 3 · Search','Imagen · Lyria 3 · Search'),title:r('Ateliê Sensorial IA Talchá','Talchá AI Sensory Studio','Atelier Sensorial IA Talchá'),desc:r('Gere imagens editoriais para cartas, trilhas sonoras sob medida para o salão e pesquisas gastronômicas com citações Google.','Generate editorial menu visuals, custom hospitality soundtracks and Search-grounded hospitality research.','Genera visuales editoriales, música ambiental a medida y búsquedas con fuentes Google.')},
    {id:'mapa_sabores',badge:r('Grafo Interativo B2B','B2B Interactive Graph','Grafo Interactivo B2B'),title:r('Mapa de Sabores & Blends','Flavor & Blend Map','Mapa de Sabores y Blends'),desc:r('Explore conexões visuais entre blends Talchá, perfis aromáticos e notas de harmonização gastronômica.','Explore visual connections between Talchá blends, aromatic profiles and culinary pairing notes.','Explora conexiones visuales entre blends Talchá, perfiles aromáticos y maridajes.')}
  ];
  return(0,Z.jsx)('section',{ref:revealRef,id:'talcha-experiences-strip-scope',className:'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 border-t border-[#E5DACB] dark:border-[#2C241E] '+(revealed?'animate-in fade-in slide-in-from-bottom-4 duration-700':'opacity-0'),children:(0,Z.jsxs)('div',{children:[
    (0,Z.jsxs)('div',{className:'mb-7 flex flex-col sm:flex-row sm:items-end justify-between gap-4',children:[
      (0,Z.jsxs)('div',{children:[
        (0,Z.jsx)('span',{className:'text-[11px] font-bold uppercase tracking-[0.16em] text-[#8B2635] dark:text-[#E88E9B]',children:r('Laboratório Experiencial Talchá B2B','Talchá B2B Experiential Lab','Laboratorio Experiencial Talchá B2B')}),
        (0,Z.jsx)('h2',{className:'font-serif-editorial text-2xl sm:text-3xl font-bold text-[#1E1B18] dark:text-[#FAF7F2] mt-1',children:r('Ferramentas Imersivas de Salão & Curadoria','Immersive Hospitality & Curation Suite','Herramientas Inmersivas de Salón & Curaduría')})
      ]}),
      (0,Z.jsx)('p',{className:'text-sm text-[#5C564D] dark:text-[#C2B8AA] max-w-xl',children:r('Explore o preparo em 3D, descubra rotas e terroirs no mapa interativo ou crie ativos visuais, sonoros e pesquisas com IA.','Explore 3D brewing, inspect venues & B2B routes on the live map, or compose studio visuals, music and research.','Explora la preparación en 3D, descubre rutas B2B en el mapa o crea visuales, música e investigación.')})
    ]}),
    (0,Z.jsx)('div',{className:'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',children:cards.map((c,_idx)=>(0,Z.jsxs)('button',{type:'button',onClick:()=>onNavigate(c.id),className:'group text-left bg-white dark:bg-[#191512] rounded-2xl border border-[#DFD2BF] dark:border-[#352C23] hover:border-[#C68A36] p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4 '+(revealed?'animate-in fade-in slide-in-from-bottom-4 duration-500 '+(_idx===1?'delay-100':_idx>=2?'delay-200':''):'opacity-0'),children:[
      (0,Z.jsxs)('div',{className:'space-y-2.5',children:[
        (0,Z.jsxs)('div',{className:'flex items-center justify-between gap-2',children:[
          (0,Z.jsx)('span',{className:'text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#FAF7F2] dark:bg-[#231E1A] text-[#8B2635] dark:text-[#E88E9B] border border-[#E5DACB] dark:border-[#3C332B]',children:c.badge}),
          (0,Z.jsx)('span',{className:'text-xs font-bold text-[#C68A36] group-hover:translate-x-1 transition-transform',children:'→'})
        ]}),
        (0,Z.jsx)('h3',{className:'font-serif-editorial text-lg font-bold text-[#1E1B18] dark:text-[#FAF7F2] group-hover:text-[#8B2635] dark:group-hover:text-[#F3D78E] transition-colors',children:c.title}),
        (0,Z.jsx)('p',{className:'text-xs text-[#5C564D] dark:text-[#C2B8AA] leading-relaxed',children:c.desc})
      ]}),
      (0,Z.jsx)('div',{className:'text-[11px] font-bold uppercase tracking-wider text-[#8B2635] dark:text-[#F3D78E]',children:r('Abrir Experiência','Open Experience','Abrir Experiencia')})
    ]},c.id))})
  ]})});
}
`;

  const targetHeroMarkup =
    '(0,Z.jsx)(`div`,{className:`absolute inset-0 bg-gradient-to-b from-[#0A120E]/35 via-[#0A120E]/65 via-50% to-[#0A120E]/95 md:hidden pointer-events-none`}),(0,Z.jsx)(`div`,{className:`absolute inset-0 hidden md:block bg-gradient-to-r from-[#0A120E]/85 via-[#0A120E]/40 via-45% to-transparent pointer-events-none`}),(0,Z.jsx)(`div`,{className:`relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-16 pb-6 sm:pb-12 mt-auto sm:my-auto`,children:(0,Z.jsxs)(`div`,{className:`max-w-2xl lg:max-w-3xl space-y-4 sm:space-y-6`,children:[(0,Z.jsxs)(`h1`,{className:`font-serif-editorial text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white sm:text-[#FAF7F2] leading-[1.12] sm:leading-[1.08] text-balance drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:drop-shadow-md`,children:[i(`hero.headlineStart`),` `,(0,Z.jsx)(`span`,{className:`italic font-semibold sm:font-normal text-[#FFE8A3] sm:text-[#D89B48] drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]`,children:i(`hero.headlineAccent`)}),` `,i(`hero.headlineEnd`)]}),(0,Z.jsx)(`p`,{className:`text-sm sm:text-lg md:text-xl text-white sm:text-[#EBE4D8] font-medium sm:font-light leading-snug sm:leading-relaxed max-w-xl text-balance drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] sm:drop-shadow-sm`,children:i(`hero.subtitle`)}),(0,Z.jsxs)(`div`,{className:`pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 max-w-md sm:max-w-none`,children:[(0,Z.jsxs)(`button`,{type:`button`,onClick:m,className:`relative w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl sm:rounded-full bg-gradient-to-r from-[#173322] via-[#22442E] to-[#173322] hover:from-[#1d3d2a] hover:to-[#2c5339] text-[#FAF7F2] border-2 border-[#C68A36] font-semibold text-sm sm:text-base shadow-[0_0_24px_rgba(198,138,54,0.4)] hover:shadow-[0_0_36px_rgba(198,138,54,0.6)] ring-4 ring-[#C68A36]/25 hover:ring-[#C68A36]/50 transition-all duration-300 flex items-center justify-center gap-2.5 sm:gap-3 group cursor-pointer active:scale-[0.98] min-h-[50px] sm:min-h-[52px]`,id:`hero-cta-encontrar-cha`,children:[(0,Z.jsx)(`div`,{className:`w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#C68A36]/25 flex items-center justify-center group-hover:bg-[#C68A36]/40 transition-colors`,children:(0,Z.jsx)(it,{className:`w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F3D78E] group-hover:scale-110 transition-transform`})}),(0,Z.jsx)(`span`,{className:`tracking-wide font-medium`,children:i(`hero.findTea`)}),(0,Z.jsx)(k,{className:`w-4 h-4 text-[#DDD4C4] group-hover:translate-x-1 transition-transform ml-auto sm:ml-0`})]}),(0,Z.jsxs)(`button`,{type:`button`,onClick:()=>{Q.light(),t()},className:`w-full sm:w-auto px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl sm:rounded-full bg-black/35 hover:bg-black/60 text-[#DDD4C4] hover:text-[#FAF7F2] border border-white/20 hover:border-white/40 backdrop-blur-md font-medium text-xs sm:text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] min-h-[46px] sm:min-h-[48px]`,id:`hero-cta-explorar-talchapidia`,children:[(0,Z.jsx)(_e,{className:`w-4 h-4 text-[#DDD4C4]/80 group-hover:text-white`}),(0,Z.jsx)(`span`,{children:i(`hero.explore`)})]})]}),(0,Z.jsxs)(`div`,{className:`pt-1 sm:pt-2 flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1 text-[11px] sm:text-sm text-[#DDD4C4]/85`,children:[(0,Z.jsxs)(`span`,{className:`flex items-center gap-1`,children:[(0,Z.jsx)(`strong`,{className:`text-[#FAF7F2] font-semibold tabular-nums`,children:`+500`}),` `,i(`hero.venues`)]}),(0,Z.jsx)(`span`,{"aria-hidden":`true`,className:`text-[#8E867B]`,children:`·`}),(0,Z.jsxs)(`span`,{className:`flex items-center gap-1`,children:[(0,Z.jsx)(`strong`,{className:`text-[#FAF7F2] font-semibold`,children:`100%`}),` `,i(`hero.leaves`)]}),(0,Z.jsx)(`span`,{"aria-hidden":`true`,className:`text-[#8E867B]`,children:`·`}),(0,Z.jsxs)(`span`,{className:`flex items-center gap-1`,children:[(0,Z.jsx)(`strong`,{className:`text-[#6FD47B] font-semibold tabular-nums`,children:`+750%`}),` `,i(`hero.margin`)]})]})]})})';
  if (!code.includes(targetHeroMarkup)) throw new Error('Could not find targetHeroMarkup');
  code = code.replace(targetHeroMarkup, replaceHeroMarkup);
  console.log('✓ Upgraded Mobile Hero layout: full-width CTAs, Talchá editorial kicker & refined type hierarchy');

  const anchorZ = 'dC=`talchapidia_theme_mode`;';
  if (!code.includes(anchorZ)) throw new Error('Could not find anchorZ');
  code = code.replace(anchorZ, () => `${anchorZ}${sharedRuntimeHelper}`);
  console.log('✓ Embedded official Talchá PNG logos, FlavorMap, normalized logo helpers & strictly scoped FlavorMap CSS');

  // ---------------------------------------------------------------------------
  // 2. Keep Header Navigation `D` 100% identical to reference, while registering extra experience routes
  // ---------------------------------------------------------------------------

  const targetHeaderMount =
    '(0,Z.jsx)(qC,{currentMode:f,onSelectMode:P,onOpenLeadModal:F,onOpenPartnershipModal:()=>O(!0),onOpenPushModal:()=>A(!0),onOpenShareModal:()=>M(!0)})';
  const replaceHeaderMount =
    '(0,Z.jsx)(TalchaInteractiveHeader,{currentMode:f,onSelectMode:P,onOpenLeadModal:F,onOpenPartnershipModal:()=>O(!0),onOpenPushModal:()=>A(!0),onOpenShareModal:()=>M(!0)})';
  if (!code.includes(targetHeaderMount)) throw new Error('Could not find targetHeaderMount (qC)');
  code = code.replace(targetHeaderMount, replaceHeaderMount);
  console.log('✓ Replaced static header with TalchaInteractiveHeader (mega menu, quick search Cmd+K, scroll progress)');

  // Wire Auth Modal (rpe) direct Dashboard do Estabelecimento button when logged in
  const targetRpeSig = 'rpe=()=>{let{user:e,userProfile:t,csrfToken:n,isAuthModalOpen:r,setIsAuthModalOpen:i,';
  const replaceRpeSig = 'rpe=({onOpenDashboard}={})=>{let{user:e,userProfile:t,csrfToken:n,isAuthModalOpen:r,setIsAuthModalOpen:i,';
  if (!code.includes(targetRpeSig)) throw new Error('Could not find targetRpeSig');
  code = code.replace(targetRpeSig, replaceRpeSig);

  const targetRpeLoggedInStart = 'S&&(0,Z.jsxs)(`div`,{className:`mt-4 p-3.5 rounded-2xl bg-[#2E6B34]/10 border border-[#2E6B34]/30 text-xs text-[#2E6B34] dark:text-[#6FD47B] flex items-center gap-2`,children:[(0,Z.jsx)(fe,{className:`w-4 h-4 shrink-0`}),(0,Z.jsx)(`span`,{children:S})]}),e?(0,Z.jsxs)(`div`,{className:`mt-5 space-y-4`,children:[';
  const replaceRpeLoggedInStart = 'S&&(0,Z.jsxs)(`div`,{className:`mt-4 p-3.5 rounded-2xl bg-[#2E6B34]/10 border border-[#2E6B34]/30 text-xs text-[#2E6B34] dark:text-[#6FD47B] flex items-center gap-2`,children:[(0,Z.jsx)(fe,{className:`w-4 h-4 shrink-0`}),(0,Z.jsx)(`span`,{children:S})]}),e?(0,Z.jsxs)(`div`,{className:`mt-5 space-y-4`,children:[onOpenDashboard&&(0,Z.jsxs)(`div`,{className:`p-3.5 rounded-2xl bg-[#8B2635]/8 dark:bg-[#8B2635]/20 border border-[#8B2635]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3`,children:[(0,Z.jsxs)(`div`,{className:`min-w-0`,children:[(0,Z.jsx)(`span`,{className:`text-[10px] font-bold uppercase tracking-wider text-[#8B2635] dark:text-[#F3D78E] block`,children:_(`Área Autenticada · Firestore (cartas_cha)`,`Authenticated Workspace · Firestore`,`Área Autenticada · Firestore`)}),(0,Z.jsx)(`strong`,{className:`text-xs font-bold text-[#1E1B18] dark:text-[#FAF8F5] block`,children:_(`Dashboard do Estabelecimento`,`Establishment Dashboard`,`Panel del Establecimiento`)}),(0,Z.jsx)(`span`,{className:`text-[11px] text-[#6E6659] dark:text-[#C7BFB2] block`,children:_(`Consulte suas cartas de chá e status (Pendente / Em Análise / Aprovada).`,`View your tea menus and commercial proposal statuses.`,`Ve tus cartas de té y estado de propuestas.`)})]}),(0,Z.jsx)(`button`,{type:`button`,id:`auth-modal-open-dashboard-btn`,onClick:()=>{globalThis.__TALCHA_DASHBOARD_INIT_STATE__={tab:`cartas_cha`};j();onOpenDashboard()},className:`px-3.5 py-2 rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer shadow-xs`,children:_(`Abrir Dashboard`,`Open Dashboard`,`Abrir Panel`)})]}),';
  if (!code.includes(targetRpeLoggedInStart)) throw new Error('Could not find targetRpeLoggedInStart');
  code = code.replace(targetRpeLoggedInStart, () => replaceRpeLoggedInStart);

  const targetRpeMount = '(0,Z.jsx)(rpe,{})';
  const replaceRpeMount = '(0,Z.jsx)(rpe,{onOpenDashboard:()=>{P(`dashboard`),window.scrollTo({top:0,behavior:`smooth`})}})';
  if (!code.includes(targetRpeMount)) throw new Error('Could not find targetRpeMount');
  code = code.replace(targetRpeMount, replaceRpeMount);
  console.log('✓ Wired Auth Modal (rpe) direct Dashboard do Estabelecimento button');

  const targetApe = 'f===`cardapio`&&(0,Z.jsx)(Pfe,{onOpenLeadModal:(e,t)=>F(e,t)})';
  const replaceApe =
    'f===`ritual_3d`&&(0,Z.jsx)(TeaRitual3D,{onSelectBlendForCarta:()=>{p(`carta`),window.scrollTo({top:0,behavior:`smooth`})},onOpenLeadModal:(e,t)=>F(e,t)}),f===`mapa_flagship`&&(0,Z.jsx)(TalchaMapsExplorer,{onOpenLeadModal:(e,t)=>F(e,t)}),f===`atelie_ia`&&(0,Z.jsx)(TalchaStudioAI,{onOpenLeadModal:(e,t)=>F(e,t)}),f===`mapa_sabores`&&(0,Z.jsx)(FlavorMap,{onSelectBlendForCarta:()=>{p(`carta`),window.scrollTo({top:0,behavior:`smooth`})},onOpenLeadModal:(e,t)=>F(e,t)}),f===`cardapio`&&(0,Z.jsx)(Pfe,{onOpenLeadModal:(e,t)=>F(e,t)})';
  if (!code.includes(targetApe)) throw new Error('Could not find targetApe');
  code = code.replace(targetApe, replaceApe);

  const targetHomeStripAnchor = 'onOpenPartnershipModal:()=>O(!0)}),(0,Z.jsx)(Ife,{})]})';
  const replaceHomeStripAnchor =
    'onOpenPartnershipModal:()=>O(!0)}),(s&&o&&(0,Z.jsx)(DashboardEstabelecimento,{variant:`compact`,onOpenCarta:c=>{if(c){globalThis.__TALCHA_PENDING_CARTA_LOAD__=c;try{window.dispatchEvent(new CustomEvent(`talcha_load_carta`,{detail:c}))}catch{}}P(`carta`),window.scrollTo({top:0,behavior:`smooth`})},onOpenLeadModal:(e,t)=>F(e,t),onOpenFullDashboard:()=>{P(`dashboard`),window.scrollTo({top:0,behavior:`smooth`})}})),(0,Z.jsx)(TalchaTestimonialsSection,{onOpenLeadModal:F}),(0,Z.jsx)(Ife,{}),(0,Z.jsx)(TalchaBrandContextSection,{onNavigate:P,onOpenLeadModal:F}),(0,Z.jsx)(TalchaExperiencesStrip,{onNavigate:P})]})';
  if (!code.includes(targetHomeStripAnchor)) throw new Error('Could not find targetHomeStripAnchor');
  code = code.replace(targetHomeStripAnchor, replaceHomeStripAnchor);

  const targetFooterMount =
    'defaultSalePrice:16,costPerCup:1.45})})]}),(0,Z.jsx)(`footer`,{';
  const replaceFooterMount =
    'defaultSalePrice:16,costPerCup:1.45})})]}),(0,Z.jsx)(TalchaFaqSection,{onOpenLeadModal:(e,t)=>F(e,t)}),(0,Z.jsx)(`footer`,{';
  if (!code.includes(targetFooterMount)) throw new Error('Could not find targetFooterMount');
  code = code.replace(targetFooterMount, replaceFooterMount);
  console.log('✓ Mounted TalchaBrandContextSection (talcha.com.br B2B/Heritage) & TalchaFaqSection above footer');

  // ---------------------------------------------------------------------------
  // 2A-Sync. Synchronize institutional metrics & Footer with https://talcha.com.br/
  // ---------------------------------------------------------------------------
  const syncPatches = [
    [
      'children:e(`Loja SP`,`Boutique SP`,`Tienda SP`)}),(0,Z.jsx)(`div`,{className:`text-xs uppercase tracking-wider text-[#736C62] dark:text-[#A8A095] font-semibold mt-1`,children:`Pátio Higienópolis`})',
      'children:e(`2 Lojas SP`,`2 SP Stores`,`2 Tiendas SP`)}),(0,Z.jsx)(`div`,{className:`text-xs uppercase tracking-wider text-[#736C62] dark:text-[#A8A095] font-semibold mt-1`,children:`JK Iguatemi & Pátio Higienópolis`})',
    ],
    [
      'children:`80+`}),(0,Z.jsx)(`div`,{className:`text-xs uppercase tracking-wider text-[#736C62] dark:text-[#A8A095] font-semibold mt-1`,children:e(`Blends autorais na carta`,`Signature tea blends`,`Blends de autor en carta`)})',
      'children:`40+`}),(0,Z.jsx)(`div`,{className:`text-xs uppercase tracking-wider text-[#736C62] dark:text-[#A8A095] font-semibold mt-1`,children:e(`Origens únicas · 100% granel HORECA`,`Single origins · 100% bulk HORECA`,`Orígenes únicos · 100% granel`)})',
    ],
    [
      '"footer.aboutText":`Mudando sua percepção sobre o chá desde 2010. Carta autoral com mais de 80 blends servidos em mais de 500 estabelecimentos de prestígio, hotéis de luxo, confeitarias e restaurantes em todo o Brasil.`',
      '"footer.aboutText":`Fundada por Monica e Mariana (2008 Paris · 2010 São Paulo). Mais de 40 origens únicas e blends autorais — do Golden Pu-Ehr reserva ao Rooibos da África do Sul — nas boutiques Pátio Higienópolis e JK Iguatemi, em talcha.com.br e em mais de 500 restaurantes e hotéis.`',
    ],
    [
      '"footer.aboutText":`Changing your perception of tea since 2010. Signature catalog with over 80 blends served in more than 500 prestigious venues, luxury hotels, bakeries, and fine restaurants across Brazil.`',
      '"footer.aboutText":`Founded by Monica & Mariana (2008 Paris · 2010 São Paulo). Over 40 single origins and signature blends — from aged Golden Pu-Ehr to South African Rooibos — across Pátio Higienópolis and JK Iguatemi boutiques, talcha.com.br, and 500+ partner venues.`',
    ],
    [
      '"footer.aboutText":`Transformando su percepción del té desde 2010. Catálogo exclusivo con más de 80 blends servidos en más de 500 prestigiosos salones, hoteles de lujo y alta gastronomía.`',
      '"footer.aboutText":`Fundada por Monica y Mariana (2008 París · 2010 São Paulo). Más de 40 orígenes únicos y blends de autor en Pátio Higienópolis, JK Iguatemi, talcha.com.br y más de 500 establecimientos asociados.`',
    ],
    [
      '(0,Z.jsx)(`h4`,{className:`text-xs uppercase tracking-wider font-bold text-white mb-3`,children:n(`Loja Física em SP`,`Flagship Boutique in São Paulo`,`Boutique en São Paulo`)}),(0,Z.jsxs)(`ul`,{className:`space-y-2 text-xs text-[#A8A095]`,children:[(0,Z.jsxs)(`li`,{className:`flex items-start gap-1.5`,children:[(0,Z.jsx)(ze,{className:`w-3.5 h-3.5 text-[#8B2635] dark:text-[#E88E9B] shrink-0 mt-0.5`}),(0,Z.jsx)(`span`,{children:`Shopping Pátio Higienópolis · São Paulo`})]}),(0,Z.jsx)(`li`,{className:`text-[11px] text-[#8A8275] pt-1`,children:n(`Abra as caixas e vivencie os aromas nos displays olfativos.`,`Discover the whole leaves and aroma displays in-store.`,`Abra las latas y experimente los aromas en los mostradores olfativos.`)})]})',
      '(0,Z.jsx)(`h4`,{className:`text-xs uppercase tracking-wider font-bold text-white mb-3`,children:n(`2 Lojas Físicas em SP & Site Oficial`,`2 São Paulo Boutiques & Official Site`,`2 Tiendas en SP & Sitio Oficial`)}),(0,Z.jsxs)(`ul`,{className:`space-y-2 text-xs text-[#A8A095]`,children:[(0,Z.jsxs)(`li`,{className:`flex items-start gap-1.5`,children:[(0,Z.jsx)(ze,{className:`w-3.5 h-3.5 text-[#8B2635] dark:text-[#E88E9B] shrink-0 mt-0.5`}),(0,Z.jsx)(`span`,{children:`Shopping Pátio Higienópolis · Piso Pacaembu (Av. Higienópolis, 618)`})]}),(0,Z.jsxs)(`li`,{className:`flex items-start gap-1.5`,children:[(0,Z.jsx)(ze,{className:`w-3.5 h-3.5 text-[#C68A36] shrink-0 mt-0.5`}),(0,Z.jsx)(`span`,{children:`Shopping JK Iguatemi · Av. Juscelino Kubitschek, 2041 · SP`})]}),(0,Z.jsx)(`li`,{className:`text-[11px] text-[#C2B8AA] pt-0.5`,children:n(`Loja Online (Seg–Sex 9h–17h): (11) 94234-8210 · atendimento@talcha.com.br`,`Online Store (Mon–Fri 9am–5pm): (11) 94234-8210 · atendimento@talcha.com.br`,`Tienda Online (Lun–Vie 9h–17h): (11) 94234-8210 · atendimento@talcha.com.br`)}),(0,Z.jsx)(`li`,{className:`pt-1`,children:(0,Z.jsx)(`a`,{href:`https://talcha.com.br/pages/corporativo-novo`,target:`_blank`,rel:`noopener noreferrer`,className:`text-[11px] text-[#F3D78E] hover:text-white underline decoration-white/30`,children:`talcha.com.br/pages/corporativo-novo →`})})]})',
    ],
  ];
  for (const [fStr, rStr] of syncPatches) {
    if (!code.includes(fStr)) {
      throw new Error(`Could not find talcha.com.br sync anchor: ${fStr.slice(0, 70)}`);
    }
    code = code.replace(fStr, rStr);
  }
  console.log('✓ Synchronized institutional metrics, boutiques (Pátio Higienópolis & JK Iguatemi) & official channels with talcha.com.br');

  // ---------------------------------------------------------------------------
  // 2B. Apply smooth Tailwind `animate-in fade-in` animations to main sections & blend cards
  // ---------------------------------------------------------------------------
  const animPatches = [
    [
      'Ife=()=>{let{localize:e}=SC();return(0,Z.jsx)(`section`,{className:`border-t border-[#EAE3D6] dark:border-[#2C2721] bg-white/60 dark:bg-[#141210]/90 py-12 sm:py-16`,',
      'Ife=()=>{let{localize:e}=SC(),[ifeRef,ifeShown]=talchaUseReveal(0.08);return(0,Z.jsx)(`section`,{ref:ifeRef,className:`border-t border-[#EAE3D6] dark:border-[#2C2721] bg-white/60 dark:bg-[#141210]/90 py-12 sm:py-16 ${ifeShown?`animate-in fade-in slide-in-from-bottom-4 duration-700`:`opacity-0`}`,',
    ],
    [
      'der-gray-200`}}};return(0,Z.jsxs)(`div`,{className:`max-w-6xl mx-auto px-4 sm:px-6 py-10`,',
      'der-gray-200`}}};return(0,Z.jsxs)(`div`,{className:`max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500`,',
    ],
    [
      'className:`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`,children:p(IM).map(n=>{let a=NM(n,r);return(0,Z.jsxs)(`div`,{className:`bg-white dark:bg-[#151310] rounded-2xl p-6 border border-[#E5DDD0] dark:border-[#332D26] hover:border-[#8B2635]/40 dark:hover:border-[#E88E9B]/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between`,',
      'className:`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`,children:p(IM).map((n,_talchaIdx)=>{let a=NM(n,r);return(0,Z.jsxs)(`div`,{className:`bg-white dark:bg-[#151310] rounded-2xl p-6 border border-[#E5DDD0] dark:border-[#332D26] hover:border-[#8B2635]/40 dark:hover:border-[#E88E9B]/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 duration-500 ${_talchaIdx%3===1?`delay-100`:_talchaIdx%3===2?`delay-200`:``}`,',
    ],
    [
      'className:`grid grid-cols-1 md:grid-cols-3 gap-6`,children:p(LM).map(e=>{let n=NM(e,r);return(0,Z.jsxs)(`div`,{className:`bg-white dark:bg-[#151310] rounded-2xl p-6 border border-[#E5DDD0] dark:border-[#332D26] shadow-xs flex flex-col justify-between`,',
      'className:`grid grid-cols-1 md:grid-cols-3 gap-6`,children:p(LM).map((e,_talchaIdx)=>{let n=NM(e,r);return(0,Z.jsxs)(`div`,{className:`bg-white dark:bg-[#151310] rounded-2xl p-6 border border-[#E5DDD0] dark:border-[#332D26] shadow-xs flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 duration-500 ${_talchaIdx%3===1?`delay-100`:_talchaIdx%3===2?`delay-200`:``}`,',
    ],
    [
      'className:`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`,children:p(RM).map(e=>{let n=NM(e,r);return(0,Z.jsxs)(`div`,{className:`bg-white dark:bg-[#151310] rounded-2xl p-6 border border-[#E5DDD0] dark:border-[#332D26] shadow-xs flex flex-col justify-between`,',
      'className:`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`,children:p(RM).map((e,_talchaIdx)=>{let n=NM(e,r);return(0,Z.jsxs)(`div`,{className:`bg-white dark:bg-[#151310] rounded-2xl p-6 border border-[#E5DDD0] dark:border-[#332D26] shadow-xs flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 duration-500 ${_talchaIdx%3===1?`delay-100`:_talchaIdx%3===2?`delay-200`:``}`,',
    ],
    [
      'corporativas, salas VIP y catering`)}];return(0,Z.jsxs)(`div`,{className:`max-w-5xl mx-auto px-4 sm:px-6 py-10`,',
      'corporativas, salas VIP y catering`)}];return(0,Z.jsxs)(`div`,{className:`max-w-5xl mx-auto px-4 sm:px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500`,',
    ],
    [
      'Me.map((t,i)=>{let a=t.blend,o=NM(a,n),s=de.some(e=>e.blend.id===o.id),c=Ne.find(e=>e.blendId===o.id);return(0,Z.jsxs)(`div`,{className:`bg-white dark:bg-[#151310] rounded-2xl p-5 border border-[#E5DDD0] dark:border-[#332D26] shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4`,',
      'Me.map((t,i)=>{let a=t.blend,o=NM(a,n),s=de.some(e=>e.blend.id===o.id),c=Ne.find(e=>e.blendId===o.id);return(0,Z.jsxs)(`div`,{className:`bg-white dark:bg-[#151310] rounded-2xl p-5 border border-[#E5DDD0] dark:border-[#332D26] shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${i===1?`delay-75`:i===2?`delay-150`:i>=3?`delay-200`:``}`,',
    ],
    [
      'text-right`,children:[e,`/5`]})]})]});return(0,Z.jsxs)(`div`,{className:`max-w-5xl mx-auto px-4 sm:px-6 py-10`,',
      'text-right`,children:[e,`/5`]})]})]});return(0,Z.jsxs)(`div`,{className:`max-w-5xl mx-auto px-4 sm:px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500`,',
    ],
    [
      'className:`bg-[#FAF7F2] dark:bg-[#16211B] rounded-3xl p-5 sm:p-8 md:p-10 border border-[#DDD4C4] dark:border-[#2C3E2D] shadow-sm relative transition-all space-y-6`,',
      'className:`bg-[#FAF7F2] dark:bg-[#16211B] rounded-3xl p-5 sm:p-8 md:p-10 border border-[#DDD4C4] dark:border-[#2C3E2D] shadow-sm relative transition-all space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500`,',
    ],
    [
      '[j,a,s,r]);return(0,Z.jsxs)(`section`,{className:`${n?`py-4`:`max-w-6xl mx-auto px-4 sm:px-6 py-10`}`,',
      '[j,a,s,r]);return(0,Z.jsxs)(`section`,{className:`${n?`py-4`:`max-w-6xl mx-auto px-4 sm:px-6 py-10`} animate-in fade-in slide-in-from-bottom-4 duration-500`,',
    ],
    [
      'Encontro Wellness / Sarau / Oficina`];return(0,Z.jsxs)(`div`,{className:`max-w-5xl mx-auto px-4 sm:px-6 py-10`,',
      'Encontro Wellness / Sarau / Oficina`];return(0,Z.jsxs)(`div`,{className:`max-w-5xl mx-auto px-4 sm:px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500`,',
    ],
    [
      '|G9[0].text.pt)},[t]),(0,Z.jsxs)(`div`,{className:`max-w-5xl mx-auto px-4 sm:px-6 py-10`,',
      '|G9[0].text.pt)},[t]),(0,Z.jsxs)(`div`,{className:`max-w-5xl mx-auto px-4 sm:px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500`,',
    ],
  ];
  for (const [findStr, repStr] of animPatches) {
    if (!code.includes(findStr)) {
      throw new Error(`Could not find fade-in animation anchor: ${findStr.slice(0, 70)}`);
    }
    code = code.replace(findStr, repStr);
  }
  console.log('✓ Applied smooth Tailwind fade-in entrance animations across main sections & blend cards');

  // Wire EstablishmentDashboard + Carta navigation inside `dashboard` route & login prompt copy
  const targetApeDash = 'f===`dashboard`&&(s?o?(0,Z.jsx)(Gfe,{onOpenLeadModal:e=>F(e),onOpenPushModal:()=>A(!0)})';
  const replaceApeDash =
    'f===`dashboard`&&(s?o?(0,Z.jsx)(Gfe,{onOpenLeadModal:(e,t)=>F(e,t),onOpenPushModal:()=>A(!0),onNavigateToCarta:()=>{p(`carta`),window.scrollTo({top:0,behavior:`smooth`})}})';
  if (!code.includes(targetApeDash)) throw new Error('Could not find targetApeDash');
  code = code.replace(targetApeDash, replaceApeDash);

  const targetDashPrompt = 'Entre com Google ou Apple para consultar seus indicadores de vendas, estoque e pedidos.';
  const replaceDashPrompt = 'Entre com Google ou Apple para acessar o Dashboard do Estabelecimento: histórico de cartas de chá criadas, status das propostas comerciais e indicadores.';
  if (!code.includes(targetDashPrompt)) throw new Error('Could not find targetDashPrompt');
  code = code.replace(targetDashPrompt, replaceDashPrompt);

  // Hook pending & event-driven Carta load inside jfe + Editing state + Firestore Update + Save
  const targetJfeEffect = ',Ae=()=>{Q.light(),d(`Restaurante`)';
  const replaceJfeEffect =
    ',[editingCarta,setEditingCarta]=(0,w.useState)(null),[savingCuratorEdit,setSavingCuratorEdit]=(0,w.useState)(!1),talchaApplyCarta=(0,w.useCallback)(raw=>{if(!raw)return;try{let norm=talchaNormalizeCartaPayload(raw,n,r,zM,KM);ke({...norm,audienceProfile:norm.audienceProfile||i(n),operatingHours:norm.operatingHours||o(n),menuHighlights:norm.menuHighlights||a(n),serviceFormat:norm.serviceFormat||s(n)});if(norm.id&&!String(norm.id).startsWith(`preset_`)){setEditingCarta({id:norm.id,name:norm.name,statusProposta:norm.statusProposta||`pendente`,loadedFromFirestore:norm.loadedFromFirestore})}else{setEditingCarta(null)}}catch(err){console.warn(`Erro ao carregar carta no curador:`,err)}},[n,r]),_pendingCartaLoad=(0,w.useEffect)(()=>{let pending=globalThis.__TALCHA_PENDING_CARTA_LOAD__;if(pending){globalThis.__TALCHA_PENDING_CARTA_LOAD__=null;talchaApplyCarta(pending)}let onEv=ev=>{if(ev?.detail){globalThis.__TALCHA_PENDING_CARTA_LOAD__=null;talchaApplyCarta(ev.detail)}};window.addEventListener(`talcha_load_carta`,onEv);return()=>window.removeEventListener(`talcha_load_carta`,onEv)},[talchaApplyCarta]),Ae=()=>{Q.light(),setEditingCarta(null),d(`Restaurante`)';
  if (!code.includes(targetJfeEffect)) throw new Error('Could not find targetJfeEffect');
  code = code.replace(targetJfeEffect, replaceJfeEffect);

  const targetLeadSave = 'try{n.unshift(a),localStorage.setItem(nC(),JSON.stringify(n.slice(0,20)))}catch(e){console.warn(`Could not save lead in localStorage`,e)}';
  const replaceLeadSave = 'try{n.unshift(a),localStorage.setItem(nC(),JSON.stringify(n.slice(0,20))),window.dispatchEvent(new Event(`talcha_dashboard_refresh`))}catch(e){console.warn(`Could not save lead in localStorage`,e)}';
  if (!code.includes(targetLeadSave)) throw new Error('Could not find targetLeadSave');
  code = code.replace(targetLeadSave, replaceLeadSave);

  const targetLeadCloudSave = 'notes:iC(a.notes,1e3,``),status:`novo`,createdAt:E_(),updatedAt:E_()}).catch(e=>{try{JS(e,qS.CREATE,t)}catch{}})';
  const replaceLeadCloudSave = 'notes:iC(a.notes,1e3,``),status:`novo`,createdAt:E_(),updatedAt:E_()}).then(()=>{try{window.dispatchEvent(new Event(`talcha_dashboard_refresh`))}catch{}}).catch(e=>{try{JS(e,qS.CREATE,t)}catch{}})';
  if (!code.includes(targetLeadCloudSave)) throw new Error('Could not find targetLeadCloudSave');
  code = code.replace(targetLeadCloudSave, replaceLeadCloudSave);

  const targetCartaSave = 'try{localStorage.setItem(F9(),JSON.stringify(a))}catch(e){console.error(`Erro ao persistir carta:`,e)}';
  const replaceCartaSave = 'try{localStorage.setItem(F9(),JSON.stringify(a)),window.dispatchEvent(new Event(`talcha_dashboard_refresh`))}catch(e){console.error(`Erro ao persistir carta:`,e)}';
  if (!code.includes(targetCartaSave)) throw new Error('Could not find targetCartaSave');
  code = code.replace(targetCartaSave, replaceCartaSave);

  const targetCartaCloudSave = 'customBlendIds:t,createdAt:E_(),updatedAt:E_()}).catch(t=>{try{JS(t,qS.CREATE,e)}catch{}})';
  const replaceCartaCloudSave = 'customBlendIds:t,createdAt:E_(),updatedAt:E_()}).then(()=>{try{let chaBlends=Array.isArray(e.allBlendIds)&&e.allBlendIds.length>0?e.allBlendIds.slice(0,20).map(b=>L9(b,80)).filter(Boolean):t;MS(Qg(VS,`cartas_cha`,r),{id:r,uid:n,ownerId:n,nome:L9(i.name,140,`Carta Personalizada`),estabelecimento:L9(i.establishmentName,150,``),segmento:L9(i.businessType,80,`Restaurante`),formatoServico:L9(i.serviceFormat,160,`Serviço de Salão`),itensCount:Math.max(1,Math.min(20,Number(i.itemCount)||4)),blends:chaBlends,statusProposta:`pendente`,observacoes:L9(i.menuHighlights,500,``),createdAt:E_(),updatedAt:E_()}).catch(()=>{});window.dispatchEvent(new Event(`talcha_dashboard_refresh`))}catch{}}).catch(t=>{try{JS(t,qS.CREATE,e)}catch{}})';
  if (!code.includes(targetCartaCloudSave)) throw new Error('Could not find targetCartaCloudSave');
  code = code.replace(targetCartaCloudSave, replaceCartaCloudSave);

  const targetZ9SaveEnd = 'HS.currentUser.getIdToken().then(e=>eC(`/api/cartas`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${e}`},body:JSON.stringify(i)})).catch(()=>{})}return i},delete(e){';
  const replaceZ9SaveEnd = 'HS.currentUser.getIdToken().then(e=>eC(`/api/cartas`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${e}`},body:JSON.stringify(i)})).catch(()=>{})}return i},async update(rawId,e){let t=this.getAll(),n=HS.currentUser?.uid?I9(HS.currentUser.uid):void 0,r=I9(rawId),nowIso=new Date().toISOString(),existing=t.find(x=>x.id===r),updated={...(existing||{}),...e,id:r,ownerId:n||existing?.ownerId,savedAt:nowIso,updatedAt:nowIso},nextList=existing?t.map(x=>x.id===r?updated:x):[updated,...t];try{localStorage.setItem(F9(),JSON.stringify(nextList)),window.dispatchEvent(new Event(`talcha_dashboard_refresh`))}catch(err){console.error(`Erro ao atualizar carta local:`,err)}let cloudStatus=`local`;if(HS.currentUser&&HS.currentUser.emailVerified&&n){let cIds=Array.isArray(e.customBlendIds)?e.customBlendIds.slice(0,20).map(b=>L9(b,80)).filter(Boolean):[],chaBlends=Array.isArray(e.allBlendIds)&&e.allBlendIds.length>0?e.allBlendIds.slice(0,20).map(b=>L9(b,80)).filter(Boolean):cIds,uName=L9(e.name,140,`Carta Personalizada`),uVenue=L9(e.establishmentName,150,``),uBiz=L9(e.businessType,80,`Restaurante`),uAud=L9(e.audienceProfile,200,``),uHours=L9(e.operatingHours,120,``),uHigh=L9(e.menuHighlights,500,``),uFmt=L9(e.serviceFormat,160,`Serviço de Salão`),uTitle=L9(e.cartaTitle,160,`Carta de Chás B2B`),uCount=Math.max(1,Math.min(20,Number(e.itemCount)||4));try{let uSnap=await AS(Qg(VS,`users`,n));if(!uSnap.exists()){await MS(Qg(VS,`users`,n),{uid:n,displayName:L9(HS.currentUser.displayName||`Parceiro Talchá`,120,`Parceiro Talchá`),role:HS.currentUser.email===`comercial4@talcha.com.br`?`admin`:`partner`,tier:`prata`,providerId:HS.currentUser.providerData?.[0]?.providerId||`google.com`,createdAt:E_(),updatedAt:E_()})}}catch{}let uPath=`users/${n}/cartas/${r}`;try{let ucRef=Qg(VS,`users`,n,`cartas`,r),ucSnap=await AS(ucRef);if(ucSnap.exists()){await NS(ucRef,{name:uName,establishmentName:uVenue,businessType:uBiz,audienceProfile:uAud,operatingHours:uHours,menuHighlights:uHigh,serviceFormat:uFmt,cartaTitle:uTitle,itemCount:uCount,customBlendIds:cIds,updatedAt:E_()})}else{await MS(ucRef,{id:r,uid:n,ownerId:n,name:uName,establishmentName:uVenue,businessType:uBiz,audienceProfile:uAud,operatingHours:uHours,menuHighlights:uHigh,serviceFormat:uFmt,cartaTitle:uTitle,itemCount:uCount,customBlendIds:cIds,createdAt:E_(),updatedAt:E_()})}}catch(err){try{JS(err,qS.UPDATE,uPath)}catch{}}let chaPath=`cartas_cha/${r}`;try{let cRef=Qg(VS,`cartas_cha`,r),cSnap=await AS(cRef),isAdmin=HS.currentUser.email===`comercial4@talcha.com.br`;if(cSnap.exists()){let cd=cSnap.data()||{};if(cd.statusProposta!==`aprovada`||isAdmin){await NS(cRef,{nome:uName,estabelecimento:uVenue,segmento:uBiz,formatoServico:uFmt,itensCount:uCount,blends:chaBlends,observacoes:uHigh,updatedAt:E_()});cloudStatus=`updated`}else{cloudStatus=`aprovada_locked_local_only`}}else{await MS(cRef,{id:r,uid:n,ownerId:n,nome:uName,estabelecimento:uVenue,segmento:uBiz,formatoServico:uFmt,itensCount:uCount,blends:chaBlends,statusProposta:`pendente`,observacoes:uHigh,createdAt:E_(),updatedAt:E_()});cloudStatus=`updated`}}catch(err){try{JS(err,qS.UPDATE,chaPath)}catch{}}HS.currentUser.getIdToken().then(tok=>eC(`/api/cartas`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${tok}`},body:JSON.stringify(updated)})).catch(()=>{});try{window.dispatchEvent(new Event(`talcha_dashboard_refresh`))}catch{}}return{item:updated,cloudStatus}},delete(e){';
  if (!code.includes(targetZ9SaveEnd)) throw new Error('Could not find targetZ9SaveEnd');
  code = code.replace(targetZ9SaveEnd, () => replaceZ9SaveEnd);

  const targetCartaCloudDel = 'PS(Qg(VS,`users`,n,`cartas`,r)).catch(t=>{try{JS(t,qS.DELETE,e)}catch{}})';
  const replaceCartaCloudDel = 'PS(Qg(VS,`users`,n,`cartas`,r)).then(()=>{try{PS(Qg(VS,`cartas_cha`,r)).catch(()=>{});window.dispatchEvent(new Event(`talcha_dashboard_refresh`))}catch{}}).catch(t=>{try{JS(t,qS.DELETE,e)}catch{}})';
  if (!code.includes(targetCartaCloudDel)) throw new Error('Could not find targetCartaCloudDel');
  code = code.replace(targetCartaCloudDel, replaceCartaCloudDel);

  const targetJfeConfigStart = '(0,Z.jsxs)(`div`,{id:`tour-step-config`,className:`bg-white dark:bg-[#1A1815]';
  const replaceJfeConfigStart =
    '(0,Z.jsx)(TalchaCuratorEditBanner,{editingCarta:editingCarta,saving:savingCuratorEdit,onSaveEdits:async()=>{if(!editingCarta||savingCuratorEdit)return;setSavingCuratorEdit(!0);try{let payload={name:editingCarta.name||c.trim()||`Carta ${u}`,establishmentName:c.trim()||void 0,businessType:u,audienceProfile:f,operatingHours:g,menuHighlights:m,serviceFormat:v,itemCount:Me.length,cartaTitle:je.title,customBlendIds:de.map(e=>e.blend.id),allBlendIds:Me.map(e=>e.blend.id),removedBlendIds:le,replacedBlendMap:Object.fromEntries(Object.entries(R).map(([e,t])=>[e,t.id]))};let res=await z9.update(editingCarta.id,payload);we(z9.getAll().length);setEditingCarta(prev=>prev?{...prev,name:res.item.name}:prev);Q.success();Oe(res.cloudStatus===`aprovada_locked_local_only`?r(`Alterações salvas na cópia pessoal (proposta aprovada permanece protegida em cartas_cha).`,`Saved to personal menu copy (approved proposal stays locked).`,`Cambios guardados en copia personal.`):r(`Carta "${res.item.name}" atualizada com sucesso no Firestore!`,`"${res.item.name}" updated in Firestore!`,`¡Carta "${res.item.name}" actualizada en Firestore!`))}catch(err){console.error(err);Oe(r(`Erro ao atualizar carta no Firestore.`,`Failed to update menu in Firestore.`,`Error al actualizar carta.`))}finally{setSavingCuratorEdit(!1)}},onOpenSaveModal:()=>xe(!0),onDiscard:()=>setEditingCarta(null),localize:r}),(0,Z.jsxs)(`div`,{id:`tour-step-config`,className:`bg-white dark:bg-[#1A1815]';
  if (!code.includes(targetJfeConfigStart)) throw new Error('Could not find targetJfeConfigStart');
  code = code.replace(targetJfeConfigStart, replaceJfeConfigStart);

  const targetEfeDef = 'Efe=({isOpen:e,onClose:t,currentCartaData:n,onLoadCarta:r,onNewBlankCarta:i})=>{let{language:a,localize:o}=SC(),[s,c]=(0,w.useState)(`list`),[l,u]=(0,w.useState)(()=>{let e=n.establishmentName?.trim();return e?`Carta de Chás - ${e}`:`Carta ${n.businessType} · ${new Date().toLocaleDateString(a===`en`?`en-US`:a===`es`?`es-ES`:`pt-BR`)}`}),[d,f]=(0,w.useState)(()=>z9.getAll()),[p,m]=(0,w.useState)(null),[h,g]=(0,w.useState)(null);if(!e)return null;let _=e=>{if(e.preventDefault(),!l.trim())return;let t=z9.save({name:l.trim(),establishmentName:n.establishmentName?.trim()||void 0,businessType:n.businessType,audienceProfile:n.audienceProfile,operatingHours:n.operatingHours,menuHighlights:n.menuHighlights,serviceFormat:n.serviceFormat,itemCount:n.itemCount,cartaTitle:n.cartaTitle,customBlendIds:n.customBlendIds,removedBlendIds:n.removedBlendIds,replacedBlendMap:n.replacedBlendMap}),r=z9.getAll();f(r),c(`list`),m(o(`"${t.name}" salva com sucesso!`,`"${t.name}" saved successfully!`,`¡"${t.name}" guardada con éxito!`)),setTimeout(()=>m(null),4e3)}';
  const replaceEfeDef = 'Efe=({isOpen:e,onClose:t,currentCartaData:n,editingCarta:editMeta,onLoadCarta:r,onNewBlankCarta:i})=>{let{language:a,localize:o}=SC(),[s,c]=(0,w.useState)(`list`),[l,u]=(0,w.useState)(()=>{if(editMeta?.name)return editMeta.name;let e=n.establishmentName?.trim();return e?`Carta de Chás - ${e}`:`Carta ${n.businessType} · ${new Date().toLocaleDateString(a===`en`?`en-US`:a===`es`?`es-ES`:`pt-BR`)}`}),[d,f]=(0,w.useState)(()=>z9.getAll()),[p,m]=(0,w.useState)(null),[h,g]=(0,w.useState)(null);(0,w.useEffect)(()=>{if(e){f(z9.getAll());if(editMeta?.name)u(editMeta.name)}},[e,editMeta?.id]);if(!e)return null;let _=async e=>{if(e.preventDefault(),!l.trim())return;let payload={name:l.trim(),establishmentName:n.establishmentName?.trim()||void 0,businessType:n.businessType,audienceProfile:n.audienceProfile,operatingHours:n.operatingHours,menuHighlights:n.menuHighlights,serviceFormat:n.serviceFormat,itemCount:n.itemCount,cartaTitle:n.cartaTitle,customBlendIds:n.customBlendIds,allBlendIds:n.allBlendIds,removedBlendIds:n.removedBlendIds,replacedBlendMap:n.replacedBlendMap};if(editMeta?.id&&!editMeta.saveAsNew){let upd=await z9.update(editMeta.id,payload);f(z9.getAll()),c(`list`),m(o(`"${upd.item.name}" atualizada no Firestore!`,`"${upd.item.name}" updated in Firestore!`,`¡"${upd.item.name}" actualizada en Firestore!`)),setTimeout(()=>m(null),4e3);return}let t=z9.save(payload),r=z9.getAll();f(r),c(`list`),m(o(`"${t.name}" salva com sucesso!`,`"${t.name}" saved successfully!`,`¡"${t.name}" guardada con éxito!`)),setTimeout(()=>m(null),4e3)}';
  if (!code.includes(targetEfeDef)) throw new Error('Could not find targetEfeDef');
  code = code.replace(targetEfeDef, () => replaceEfeDef);

  const targetEfeMount = 'customBlendIds:de.map(e=>e.blend.id),removedBlendIds:le,replacedBlendMap:Object.fromEntries(Object.entries(R).map(([e,t])=>[e,t.id]))},onLoadCarta:ke,onNewBlankCarta:Ae})';
  const replaceEfeMount = 'customBlendIds:de.map(e=>e.blend.id),allBlendIds:Me.map(e=>e.blend.id),removedBlendIds:le,replacedBlendMap:Object.fromEntries(Object.entries(R).map(([e,t])=>[e,t.id]))},editingCarta:editingCarta,onLoadCarta:talchaApplyCarta,onNewBlankCarta:Ae})';
  if (!code.includes(targetEfeMount)) throw new Error('Could not find targetEfeMount');
  code = code.replace(targetEfeMount, () => replaceEfeMount);

  // Upgrade Gfe with Dashboard do Estabelecimento primary workspace + Sales/ESG Analytics & Admin CRM tabs
  const targetGfeSig = 'Gfe=({onOpenLeadModal:e,onOpenPushModal:t})=>{';
  const replaceGfeSig =
    'Gfe=({onOpenLeadModal:e,onOpenPushModal:t,onNavigateToCarta:navCarta})=>{let{user:dashAuthUser}=NC(),[dashWorkspace,setDashWorkspace]=(0,w.useState)(()=>{if(typeof window!==`undefined`){let h=window.location.hash||``;if(h.includes(`monitor-estoque`)||h.includes(`sugestao-de-reposicao`)||h.includes(`relatorio-de-impacto`))return `analytics`}return `estabelecimento`});(0,w.useEffect)(()=>{let onHash=()=>{let h=window.location.hash||``;if(h.includes(`monitor-estoque`)||h.includes(`sugestao-de-reposicao`)||h.includes(`relatorio-de-impacto`))setDashWorkspace(`analytics`)};window.addEventListener(`hashchange`,onHash);return()=>window.removeEventListener(`hashchange`,onHash)},[]);';
  if (!code.includes(targetGfeSig)) throw new Error('Could not find targetGfeSig');
  code = code.replace(targetGfeSig, replaceGfeSig);

  const targetGfeRetStart = 'return(0,Z.jsxs)(`div`,{className:`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-in fade-in duration-300`,children:[(0,Z.jsx)(Hfe,{}),';
  const replaceGfeRetStart =
    'return(0,Z.jsxs)(`div`,{className:`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-in fade-in duration-300`,children:[(0,Z.jsxs)(`div`,{className:`flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E5DACB] dark:border-[#352C23]`,children:[(0,Z.jsxs)(`div`,{className:`inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23]`,children:[(0,Z.jsx)(`button`,{type:`button`,onClick:()=>setDashWorkspace(`estabelecimento`),className:`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${dashWorkspace===`estabelecimento`?`bg-[#8B2635] text-white`:`text-[#5C564D] dark:text-[#C2B8AA] hover:text-[#1E1B18] dark:hover:text-white`}`,children:r(`Dashboard do Estabelecimento · Cartas & Propostas`,`Establishment Dashboard · Menus & Proposals`,`Panel del Establecimiento · Cartas y Propuestas`)}),(0,Z.jsx)(`button`,{type:`button`,onClick:()=>setDashWorkspace(`analytics`),className:`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${dashWorkspace===`analytics`?`bg-[#8B2635] text-white`:`text-[#5C564D] dark:text-[#C2B8AA] hover:text-[#1E1B18] dark:hover:text-white`}`,children:r(`Analytics de Vendas & ESG`,`Sales & ESG Analytics`,`Analítica de Ventas & ESG`)}),dashAuthUser?.role===`admin`&&(0,Z.jsx)(`button`,{type:`button`,onClick:()=>setDashWorkspace(`admin`),className:`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${dashWorkspace===`admin`?`bg-[#8B2635] text-white`:`text-[#5C564D] dark:text-[#C2B8AA] hover:text-[#1E1B18] dark:hover:text-white`}`,children:r(`Governança & CRM (Admin)`,`Governance & CRM (Admin)`,`Gobernanza y CRM`)})]})]}),dashWorkspace===`estabelecimento`&&(0,Z.jsx)(DashboardEstabelecimento,{variant:`full`,onOpenCarta:c=>{if(c){globalThis.__TALCHA_PENDING_CARTA_LOAD__=c;try{window.dispatchEvent(new CustomEvent(`talcha_load_carta`,{detail:c}))}catch{}}navCarta?.()},onOpenLeadModal:e}),dashWorkspace===`admin`&&dashAuthUser?.role===`admin`&&(0,Z.jsx)(Hfe,{}),dashWorkspace===`analytics`&&(0,Z.jsxs)(Z.Fragment,{children:[';
  if (!code.includes(targetGfeRetStart)) throw new Error('Could not find targetGfeRetStart');
  code = code.replace(targetGfeRetStart, replaceGfeRetStart);

  const targetGfeRetEnd = 'n===`en`?`Request Batch Reposition`:n===`es`?`Solicitar Reposición de Lote`:`Solicitar Reposição de Lote`}),(0,Z.jsx)(A,{className:`w-4 h-4`})]})})]})]})]})},Y9=new class';
  const replaceGfeRetEnd = 'n===`en`?`Request Batch Reposition`:n===`es`?`Solicitar Reposición de Lote`:`Solicitar Reposição de Lote`}),(0,Z.jsx)(A,{className:`w-4 h-4`})]})})]})]})]})]})},Y9=new class';
  if (!code.includes(targetGfeRetEnd)) throw new Error('Could not find targetGfeRetEnd');
  code = code.replace(targetGfeRetEnd, replaceGfeRetEnd);

  console.log('✓ Registered mapa_sabores & EstablishmentDashboard inside Gfe/ape');

  // ---------------------------------------------------------------------------
  // 3. Sync active Carta selection + Inject Logo Customizer inside Carta B2B (jfe)
  // ---------------------------------------------------------------------------
  const targetMeSync = 'Ne=W9.checkCartaAvailability(Me.map(e=>e.blend.id))';
  const replaceMeSync =
    'Ne=((()=>{try{globalThis.__TALCHA_ACTIVE_CARTA__={establishmentName:c.trim(),businessType:u,cartaTitle:je.title,cartaSubtitle:je.subtitle,strategicRationale:je.strategicRationale,items:Me};}catch{}return W9.checkCartaAvailability(Me.map(e=>e.blend.id))})())';
  if (!code.includes(targetMeSync)) throw new Error('Could not find targetMeSync');
  code = code.replace(targetMeSync, replaceMeSync);

  const targetTourExportEnd =
    '`Exportando...`):t(`carta.downloadNow`)})]})]})]}),';
  const replaceTourExportEnd =
    '`Exportando...`):t(`carta.downloadNow`)})]})]})]}),(0,Z.jsx)(TalchaClientLogoBar,{venueName:c.trim(),localize:r}),';
  if (!code.includes(targetTourExportEnd)) throw new Error('Could not find targetTourExportEnd in jfe');
  code = code.replace(targetTourExportEnd, replaceTourExportEnd);
  console.log('✓ Injected Client Logo Co-Branding Strip inside Carta B2B (jfe)');

  // ---------------------------------------------------------------------------
  // 4. Replace PM() & j9() with scripts/talcha_pdf_override.js
  // ---------------------------------------------------------------------------
  const pdfOverrideRaw = fs.readFileSync(PDF_OVERRIDE_PATH, 'utf8');
  const pdfOverrideMin = esbuild.transformSync(pdfOverrideRaw, {
    loader: 'js',
    minifyWhitespace: true,
    minifySyntax: true,
    minifyIdentifiers: false,
    target: ['es2020'],
  }).code;

  const pmStart = code.indexOf('function PM(');
  const pmEnd = code.indexOf('async function FM(');
  const j9Start = code.indexOf('function j9(e){');
  const j9End = code.indexOf('async function Sfe(e){');
  if (pmStart === -1 || pmEnd === -1 || j9Start === -1 || j9End === -1) {
    throw new Error('Could not locate PM() or j9() boundaries');
  }
  const splitIdx = pdfOverrideMin.indexOf('function j9(');
  if (splitIdx === -1) throw new Error('Could not split talcha_pdf_override.js at function j9');

  code = code.slice(0, j9Start) + pdfOverrideMin.slice(splitIdx) + code.slice(j9End);
  code = code.slice(0, pmStart) + pdfOverrideMin.slice(0, splitIdx) + code.slice(pmEnd);
  console.log('✓ Upgraded PM() & j9() PDF generators with official Talchá Warm Cream/Burgundy/Gold branding');

  // ---------------------------------------------------------------------------
  // 5. Upgrade FM() (A4 Printable Carta PDF): Official Talchá Palette + Logos + Client Crest
  // ---------------------------------------------------------------------------
  const targetFmMarfim =
    'v={marfim:{primary:[139,38,53],accent:[160,92,44],heading:[30,27,24],text:[65,58,50],muted:[120,112,102],bg:[253,251,247],cardBg:[255,255,255],cardBorder:[228,220,208],badgeBg:[247,241,232],goldLine:[196,150,88]}';
  const replaceFmMarfim =
    'v={marfim:{primary:[139,38,53],accent:[198,138,54],heading:[30,27,24],text:[52,46,40],muted:[108,100,90],bg:[250,247,242],cardBg:[255,255,255],cardBorder:[229,218,203],badgeBg:[245,239,228],goldLine:[198,138,54]}';
  if (!code.includes(targetFmMarfim)) throw new Error('Could not find targetFmMarfim');
  code = code.replace(targetFmMarfim, replaceFmMarfim);

  const targetFmPmCall =
    'PM(_,105,x,{scale:.95,showBrandText:!0,showSubtext:!0,venueName:s,theme:n,language:t,primaryColor:v.primary,accentColor:v.accent,textColor:v.heading})';
  const replaceFmPmCall =
    'PM(_,105,x,{scale:.95,showBrandText:!0,showSubtext:!0,venueName:s,theme:n,language:t,primaryColor:v.primary,accentColor:v.accent,textColor:v.heading,clientLogoDataUrl:talchaGetClientLogo(e.clientLogoDataUrl)})';
  if (!code.includes(targetFmPmCall)) throw new Error('Could not find targetFmPmCall');
  code = code.replace(targetFmPmCall, replaceFmPmCall);

  const targetFmYParam =
    ',y=e=>{_.setFillColor(v.bg[0],v.bg[1],v.bg[2]),_.rect(0,0,210,297,`F`),_.setDrawColor(v.cardBorder[0],v.cardBorder[1],v.cardBorder[2]),_.setLineWidth(.4),_.rect(7,7,196,283,`S`),_.setDrawColor(v.goldLine[0],v.goldLine[1],v.goldLine[2]),_.setLineWidth(.2),_.rect(8.2,8.2,193.6,280.6,`S`),_.setFillColor(v.primary[0],v.primary[1],v.primary[2]),[[9.5,9.5],[200.5,9.5],[9.5,287.5],[200.5,287.5]].forEach(([e,t])=>{_.rect(e-.75,t-.75,1.5,1.5,`F`)}),e>1&&(_.setFont(`times`,`bold`),_.setFontSize(8.5),_.setTextColor(v.primary[0],v.primary[1],v.primary[2]),_.text(`TALCHÁ • ${s.toUpperCase()}`,14,13.5),_.setFont(`times`,`italic`),_.setFontSize(8),_.setTextColor(v.muted[0],v.muted[1],v.muted[2]),_.text(c,196,13.5,{align:`right`}),_.setDrawColor(v.cardBorder[0],v.cardBorder[1],v.cardBorder[2]),_.setLineWidth(.3),_.line(14,15.5,196,15.5))}';
  const replaceFmYParam =
    ',y=pg=>{_.setFillColor(v.bg[0],v.bg[1],v.bg[2]),_.rect(0,0,210,297,`F`),_.setDrawColor(v.cardBorder[0],v.cardBorder[1],v.cardBorder[2]),_.setLineWidth(.4),_.rect(7,7,196,283,`S`),_.setDrawColor(v.goldLine[0],v.goldLine[1],v.goldLine[2]),_.setLineWidth(.2),_.rect(8.2,8.2,193.6,280.6,`S`),_.setFillColor(v.primary[0],v.primary[1],v.primary[2]),[[9.5,9.5],[200.5,9.5],[9.5,287.5],[200.5,287.5]].forEach(([e,t])=>{_.rect(e-.75,t-.75,1.5,1.5,`F`)}),pg>1&&((()=>{let cLg=talchaGetClientLogo(e.clientLogoDataUrl);talchaAddAspectLogo(_,n===`noir`?TALCHA_LOGO_WHITE:TALCHA_LOGO_BLACK,`PNG`,14,8.6,13,6.5);_.setFont(`times`,`bold`);_.setFontSize(8.2);_.setTextColor(v.primary[0],v.primary[1],v.primary[2]);_.text(s.toUpperCase(),29,13.2);if(cLg){talchaDrawClientCrest(_,cLg,172,8.8,24,6.4,n===`noir`,v.cardBorder);_.setFont(`times`,`italic`);_.setFontSize(7.6);_.setTextColor(v.muted[0],v.muted[1],v.muted[2]);_.text(c,168,13.2,{align:`right`})}else{_.setFont(`times`,`italic`);_.setFontSize(8);_.setTextColor(v.muted[0],v.muted[1],v.muted[2]);_.text(c,196,13.2,{align:`right`})}_.setDrawColor(v.cardBorder[0],v.cardBorder[1],v.cardBorder[2]);_.setLineWidth(.3);_.line(14,16,196,16)})())}';
  if (!code.includes(targetFmYParam)) throw new Error('Could not find targetFmYParam');
  code = code.replace(targetFmYParam, replaceFmYParam);

  const targetFmHeadline =
    '_.setFont(`times`,`italic`),_.setFontSize(8.2),_.setTextColor(v.text[0],v.text[1],v.text[2]),_.text(s.profileHeadline,20,x+14.5)';
  const replaceFmHeadline =
    '_.setFont(`times`,`italic`),_.setFontSize(8.2),_.setTextColor(v.text[0],v.text[1],v.text[2]),_.text(_.splitTextToSize(s.profileHeadline||``,170)[0]||``,20,x+14.5)';
  if (!code.includes(targetFmHeadline)) throw new Error('Could not find targetFmHeadline');
  code = code.replace(targetFmHeadline, replaceFmHeadline);
  console.log('✓ Upgraded FM() printable A4 Carta PDF with authentic Talchá Burgundy/Gold/Cream palette & client crest');

  // ---------------------------------------------------------------------------
  // 6. Upgrade E9() (Dossiê Diretoria / Executivo): Editorial Banner + Client Crest + No ✓ Bug
  // ---------------------------------------------------------------------------
  const targetE9Palette =
    'b={primary:[139,38,53],primaryDark:[95,23,34],primaryLight:[247,238,240],green:[46,107,52],greenLight:[235,245,237],amber:[196,125,59],amberLight:[250,243,234],dark:[30,27,24],textMuted:[115,107,98],border:[222,213,201],bgLight:[252,250,246],white:[255,255,255],gold:[160,92,44]}';
  const replaceE9Palette =
    'b={primary:[139,38,53],primaryDark:[106,27,39],primaryLight:[250,238,240],green:[23,51,34],greenLight:[238,245,240],amber:[198,138,54],amberLight:[250,244,234],dark:[30,27,24],textMuted:[108,100,90],border:[229,218,203],bgLight:[250,247,242],white:[255,255,255],gold:[198,138,54]}';
  if (!code.includes(targetE9Palette)) throw new Error('Could not find targetE9Palette');
  code = code.replace(targetE9Palette, replaceE9Palette);

  const targetE9PageBg =
    'let T=e=>{y.setFillColor(b.bgLight[0],b.bgLight[1],b.bgLight[2]),y.rect(0,0,210,297,`F`),y.setDrawColor(b.border[0],b.border[1],b.border[2]),y.setLineWidth(.4),y.rect(7,7,196,283,`S`),y.setFillColor(b.primary[0],b.primary[1],b.primary[2]),y.rect(7,7,196,3,`F`)}';
  const replaceE9PageBg =
    'let T=pg=>{y.setFillColor(b.bgLight[0],b.bgLight[1],b.bgLight[2]),y.rect(0,0,210,297,`F`);if(pg===1){talchaDrawEditorialBanner(y,{subtitle:v===`en`?`EXECUTIVE ROI & TEA ARCHITECTURE DOSSIER`:v===`es`?`DOSSIER EJECUTIVO DE ROI & ARQUITECTURA`:`DOSSIÊ EXECUTIVO B2B · RENTABILIDADE & SALÃO`,badge:v===`en`?`EXECUTIVE DOSSIER`:v===`es`?`DOSSIER EJECUTIVO`:`DOSSIÊ DIRETORIA`,venueName:t,issuedDate:C,clientLogo:e.clientLogoDataUrl})}else{talchaDrawContinuationHeader(y,{subtitle:t.toUpperCase(),clientLogo:e.clientLogoDataUrl})}}';
  if (!code.includes(targetE9PageBg)) throw new Error('Could not find targetE9PageBg');
  code = code.replace(targetE9PageBg, replaceE9PageBg);

  const targetE9HeaderBlock =
    'T(1);let D=11,O=PM(y,30,D,{scale:.75,showBrandText:!0,showSubtext:!0,language:v,primaryColor:b.primary,accentColor:b.gold});y.setFillColor(b.primary[0],b.primary[1],b.primary[2]),y.roundedRect(136,D+2,60,6.5,1.2,1.2,`F`),y.setFont(`helvetica`,`bold`),y.setFontSize(7),y.setTextColor(b.white[0],b.white[1],b.white[2]),y.text(v===`en`?`EXECUTIVE MANAGEMENT DOSSIER`:v===`es`?`DOSSIÊ EJECUTIVO PARA DIRECCIÓN`:`DOSSIÊ EXECUTIVO PARA DIRETORIA`,166,D+6.3,{align:`center`}),y.setFont(`helvetica`,`normal`),y.setFontSize(7.5),y.setTextColor(b.textMuted[0],b.textMuted[1],b.textMuted[2]),y.text(`${v===`en`?`Date`:v===`es`?`Fecha`:`Emissão`}: ${C} • Status: Homologado`,196,D+13,{align:`right`}),D=Math.max(O,D+16)+2,';
  const replaceE9HeaderBlock = 'T(1);let D=38;';
  if (!code.includes(targetE9HeaderBlock)) throw new Error('Could not find targetE9HeaderBlock');
  code = code.replace(targetE9HeaderBlock, replaceE9HeaderBlock);

  const targetE9Page2Top =
    'E(1),y.addPage(),T(2),D=14,y.setFont(`times`,`bold`),y.setFontSize(9),y.setTextColor(b.primary[0],b.primary[1],b.primary[2]),y.text(`TALCHÁ • ARQUITETURA FINALIZADA DA CARTA DE CHÁS & INFUSÕES`,14,D)';
  const replaceE9Page2Top =
    'E(1),y.addPage(),T(2),D=24,y.setFont(`helvetica`,`bold`),y.setFontSize(7.4),y.setTextColor(b.primary[0],b.primary[1],b.primary[2]),y.text(`TALCHÁ · ARQUITETURA FINALIZADA DA CARTA DE CHÁS & INFUSÕES`,14,D)';
  if (!code.includes(targetE9Page2Top)) throw new Error('Could not find targetE9Page2Top');
  code = code.replace(targetE9Page2Top, replaceE9Page2Top);

  // Replace Unicode ✓ tick inside E9 with vector green circle dot check
  const targetE9CheckTick =
    'y.setTextColor(b.primary[0],b.primary[1],b.primary[2]),y.text(`✓ ${e.title}`,n+2.5,r+3.8)';
  const replaceE9CheckTick =
    'talchaDrawCheckDot(y,n+4,r+3,1.3,[46,107,52]),y.setTextColor(b.primary[0],b.primary[1],b.primary[2]),y.text(e.title,n+6.8,r+3.8)';
  if (!code.includes(targetE9CheckTick)) throw new Error('Could not find targetE9CheckTick');
  code = code.replace(targetE9CheckTick, replaceE9CheckTick);

  const targetE9Title =
    'y.setFont(`times`,`bold`),y.setFontSize(16),y.setTextColor(b.dark[0],b.dark[1],b.dark[2]),y.text(v===`en`?`FEASIBILITY STUDY:';
  const replaceE9Title =
    'y.setFont(`times`,`bold`),y.setFontSize(13),y.setTextColor(b.dark[0],b.dark[1],b.dark[2]),y.text(v===`en`?`FEASIBILITY STUDY:';
  if (!code.includes(targetE9Title)) throw new Error('Could not find targetE9Title');
  code = code.replace(targetE9Title, replaceE9Title);

  const targetE9VenueSub =
    'y.text(v===`en`?`Client Venue: ${t.toUpperCase()} (${n}) • Wholesale Pricing Architecture`:v===`es`?`Establecimiento: ${t.toUpperCase()} (${n}) • Arquitectura de Precios Mayoristas`:`Estabelecimento: ${t.toUpperCase()} (${n}) • Arquitetura de Preços Corporativos`,14,D),D+=6;';
  const replaceE9VenueSub =
    '((()=>{let vSub=y.splitTextToSize(v===`en`?`Client Venue: ${t.toUpperCase()} (${n}) • Wholesale Pricing Architecture`:v===`es`?`Establecimiento: ${t.toUpperCase()} (${n}) • Arquitectura de Precios Mayoristas`:`Estabelecimento: ${t.toUpperCase()} (${n}) • Arquitetura de Preços Corporativos`,182).slice(0,2);y.text(vSub,14,D);D+=vSub.length*3.8+2.5})());';
  if (!code.includes(targetE9VenueSub)) throw new Error('Could not find targetE9VenueSub');
  code = code.replace(targetE9VenueSub, replaceE9VenueSub);

  const targetE9Page2Headline =
    'y.setFont(`times`,`bold`),y.setFontSize(15),y.setTextColor(b.dark[0],b.dark[1],b.dark[2]),y.text(`DETALHAMENTO DOS BLENDS HOMOLOGADOS PARA ${t.toUpperCase()}`,14,D),D+=4.5,';
  const replaceE9Page2Headline =
    'y.setFont(`times`,`bold`),y.setFontSize(13.5),y.setTextColor(b.dark[0],b.dark[1],b.dark[2]),((()=>{let p2h=y.splitTextToSize(`DETALHAMENTO DOS BLENDS HOMOLOGADOS PARA ${t.toUpperCase()}`,182).slice(0,2);y.text(p2h,14,D);D+=p2h.length*5.2})()),';
  if (!code.includes(targetE9Page2Headline)) throw new Error('Could not find targetE9Page2Headline');
  code = code.replace(targetE9Page2Headline, replaceE9Page2Headline);

  const targetE9ParecerBox =
    'y.setFillColor(b.primaryLight[0],b.primaryLight[1],b.primaryLight[2]),y.roundedRect(14,D,182,14,1.5,1.5,`F`),y.setDrawColor(b.primary[0],b.primary[1],b.primary[2]),y.setLineWidth(.3),y.roundedRect(14,D,182,14,1.5,1.5,`S`)';
  const replaceE9ParecerBox =
    'y.setFillColor(b.primaryLight[0],b.primaryLight[1],b.primaryLight[2]),y.roundedRect(14,D,182,18.5,1.5,1.5,`F`),y.setDrawColor(b.primary[0],b.primary[1],b.primary[2]),y.setLineWidth(.3),y.roundedRect(14,D,182,18.5,1.5,1.5,`S`)';
  if (!code.includes(targetE9ParecerBox)) throw new Error('Could not find targetE9ParecerBox');
  code = code.replace(targetE9ParecerBox, replaceE9ParecerBox);

  const targetE9TableHeader =
    'let M={name:58,category:32,service:34,cost:18,price:18,profit:22};y.setFillColor(b.primaryDark[0],b.primaryDark[1],b.primaryDark[2]),y.rect(14,D,182,6.5,`F`),y.setFont(`helvetica`,`bold`),y.setFontSize(6.8),';
  const replaceE9TableHeader =
    'let M={name:54,category:31,service:35,cost:16,price:17,profit:29};y.setFillColor(b.primaryDark[0],b.primaryDark[1],b.primaryDark[2]),y.rect(14,D,182,6.5,`F`),y.setFont(`helvetica`,`bold`),y.setFontSize(6.4),';
  if (!code.includes(targetE9TableHeader)) throw new Error('Could not find targetE9TableHeader');
  code = code.replace(targetE9TableHeader, replaceE9TableHeader);

  const targetE9RowPairing =
    'let l=(n.blend.foodPairings?.[0]||`Harmonização de mesa`).substring(0,24);y.text(l,N,D+6)';
  const replaceE9RowPairing =
    'let l=y.splitTextToSize(n.blend.foodPairings?.[0]||`Harmonização de mesa`,33)[0]||``;y.text(l,N,D+6)';
  if (!code.includes(targetE9RowPairing)) throw new Error('Could not find targetE9RowPairing');
  code = code.replace(targetE9RowPairing, replaceE9RowPairing);

  const targetE9Headline = 'y.text(n.blend.profileHeadline.substring(0,42),N,D+6)';
  const replaceE9Headline = 'y.text(y.splitTextToSize(n.blend.profileHeadline||``,51)[0]||``,N,D+6)';
  if (!code.includes(targetE9Headline)) throw new Error('Could not find targetE9Headline');
  code = code.replace(targetE9Headline, replaceE9Headline);

  const targetE9Approval =
    'y.text(`Declaro aprovada a implantação da Carta de Chás & Infusões Talchá para ${t.toUpperCase()} conforme as condições simuladas.`,18,D+9.5);let F=D+18;y.setDrawColor(b.dark[0],b.dark[1],b.dark[2]),y.setLineWidth(.3),y.line(20,F,101,F),y.setFont(`helvetica`,`bold`),y.setFontSize(6),y.setTextColor(b.dark[0],b.dark[1],b.dark[2]),y.text(`${t.toUpperCase()} — Diretoria / Gerência`,20,F+3.5)';
  const replaceE9Approval =
    'y.text(y.splitTextToSize(`Declaro aprovada a implantação da Carta de Chás & Infusões Talchá para ${t.toUpperCase()} conforme as condições simuladas.`,174).slice(0,2),18,D+9.2);let F=D+19.2;y.setDrawColor(b.dark[0],b.dark[1],b.dark[2]),y.setLineWidth(.3),y.line(20,F,101,F),y.setFont(`helvetica`,`bold`),y.setFontSize(6),y.setTextColor(b.dark[0],b.dark[1],b.dark[2]),y.text(y.splitTextToSize(`${t.toUpperCase()} — Diretoria / Gerência`,79)[0],20,F+3.5)';
  if (!code.includes(targetE9Approval)) throw new Error('Could not find targetE9Approval');
  code = code.replace(targetE9Approval, replaceE9Approval);
  console.log('✓ Upgraded E9() Executive Dossier PDF with Talchá banner, client crest, clean widths & vector checks');

  // ---------------------------------------------------------------------------
  // 7. Upgrade Guia_de_Infusao_Talcha_B2B.pdf
  // ---------------------------------------------------------------------------
  const targetGuiaHeader =
    'e.setFillColor(250,248,245),e.rect(0,0,210,297,`F`),e.setFillColor(139,38,53),e.rect(0,0,210,4,`F`);let n=14;e.setFont(`times`,`bold`),e.setFontSize(18),e.setTextColor(139,38,53),e.text(`talchá`,14,n),e.setFont(`helvetica`,`bold`),e.setFontSize(8),e.setTextColor(160,92,44),e.text(i(`· GUIA TÉCNICO DE INFUSÃO & BANCADA B2B`,`· B2B BARISTA INFUSION & TEMPERATURE GUIDE`,`· GUÍA TÉCNICA DE INFUSIÓN Y BARRA B2B`),36,n-.5),t&&(e.setFont(`helvetica`,`bold`),e.setFontSize(8),e.setTextColor(30,27,24),e.text(t.toUpperCase(),196,n-.5,{align:`right`})),n+=6,e.setDrawColor(220,212,200),e.setLineWidth(.3),e.line(14,n,196,n),n+=7,';
  const replaceGuiaHeader =
    'e.setFillColor(250,247,242),e.rect(0,0,210,297,`F`);let n=talchaDrawEditorialBanner(e,{subtitle:i(`GUIA TÉCNICO DE INFUSÃO & BANCADA B2B`,`B2B BARISTA INFUSION & TEMPERATURE GUIDE`,`GUÍA TÉCNICA DE INFUSIÓN Y BARRA B2B`),badge:i(`GUIA OFICIAL B2B`,`OFFICIAL B2B GUIDE`,`GUÍA OFICIAL B2B`),venueName:t||``})+3;';
  if (!code.includes(targetGuiaHeader)) throw new Error('Could not find targetGuiaHeader');
  code = code.replace(targetGuiaHeader, replaceGuiaHeader);

  const targetGuiaTable1 =
    'e.setFillColor(30,27,24),e.roundedRect(14,n,182,7,1,1,`F`),e.setFont(`helvetica`,`bold`),e.setFontSize(7),e.setTextColor(255,255,255),e.text(i(`FAMÍLIA BOTÂNICA`,`TEA FAMILY`,`FAMILIA BOTÁNICA`),17,n+4.8),e.text(i(`TEMPERATURA`,`TEMPERATURE`,`TEMPERATURA`),72,n+4.8),e.text(i(`TEMPO IDEAL`,`STEEP TIME`,`TIEMPO IDEAL`),104,n+4.8),e.text(i(`DOSAGEM`,`DOSAGE`,`DOSIFICACIÓN`),134,n+4.8),e.text(i(`OBSERVAÇÃO DE BANCADA`,`BARISTA NOTE`,`NOTA DE BARRA`),162,n+4.8),n+=8.5,k9.forEach((t,i)=>{e.setFillColor(i%2==0?255:246,i%2==0?255:242,i%2==0?255:235),e.roundedRect(14,n,182,11,1,1,`F`),e.setFont(`times`,`bold`),e.setFontSize(9),e.setTextColor(30,27,24),e.text(t.name[r],17,n+4.5),e.setFont(`helvetica`,`normal`),e.setFontSize(6.2),e.setTextColor(110,103,92),e.text(t.scientificNote[r],17,n+8.5),e.setFont(`helvetica`,`bold`),e.setFontSize(8.5),e.setTextColor(139,38,53),e.text(t.tempC,72,n+6.5),e.setTextColor(46,107,52),e.text(t.infusionTimeLabel,104,n+6.5),e.setTextColor(30,27,24),e.setFontSize(7.5),e.text(t.dosage,134,n+6.5),e.setFont(`helvetica`,`normal`),e.setFontSize(6.2),e.setTextColor(90,84,75);let a=e.splitTextToSize(t.baristaAlert[r],32);e.text(a.slice(0,2),162,n+4.5),n+=12.5})';
  const replaceGuiaTable1 =
    'e.setFillColor(139,38,53),e.roundedRect(14,n,182,7,1,1,`F`),e.setFillColor(198,138,54),e.rect(14,n,1.5,7,`F`),e.setFont(`helvetica`,`bold`),e.setFontSize(6.6),e.setTextColor(255,255,255),e.text(i(`FAMÍLIA BOTÂNICA`,`TEA FAMILY`,`FAMILIA BOTÁNICA`),17.5,n+4.7),e.text(i(`TEMP.`,`TEMP.`,`TEMP.`),71,n+4.7),e.text(i(`TEMPO`,`STEEP`,`TIEMPO`),95,n+4.7),e.text(i(`DOSAGEM`,`DOSAGE`,`DOSIS`),119,n+4.7),e.text(i(`OBSERVAÇÃO DE BANCADA`,`BARISTA NOTE`,`NOTA DE BARRA`),144,n+4.7),n+=8.5,k9.forEach((t,i)=>{e.setFillColor(i%2==0?255:245,i%2==0?255:239,i%2==0?255:228),e.roundedRect(14,n,182,11.5,1,1,`F`),e.setFont(`times`,`bold`),e.setFontSize(9),e.setTextColor(30,27,24),e.text(t.name[r],17,n+4.5),e.setFont(`helvetica`,`normal`),e.setFontSize(5.4),e.setTextColor(108,100,90);let sn=e.splitTextToSize(t.scientificNote[r],52.5);e.text(sn[0]||t.scientificNote[r],17,n+8.6),e.setFont(`helvetica`,`bold`),e.setFontSize(8.2),e.setTextColor(139,38,53),e.text(t.tempC,71,n+6.5),e.setTextColor(46,107,52),e.text(t.infusionTimeLabel,95,n+6.5),e.setTextColor(30,27,24),e.setFontSize(7.4),e.text(t.dosage,119,n+6.5),e.setFont(`helvetica`,`normal`),e.setFontSize(6),e.setTextColor(84,78,70);let a=e.splitTextToSize(t.baristaAlert[r],49);e.text(a.slice(0,2),144,n+4.5),n+=12.8})';
  if (!code.includes(targetGuiaTable1)) throw new Error('Could not find targetGuiaTable1');
  code = code.replace(targetGuiaTable1, replaceGuiaTable1);

  const targetGuiaTable2Bar =
    'n+=5,e.setFillColor(139,38,53),e.roundedRect(14,n,182,7,1,1,`F`),e.setFont(`helvetica`,`bold`),e.setFontSize(7),e.setTextColor(255,255,255),e.text(`BLEND TALCHÁ`,17,n+4.8),e.text(i(`CATEGORIA`,`CATEGORY`,`CATEGORÍA`),72,n+4.8),e.text(i(`TEMP.`,`TEMP.`,`TEMP.`),109,n+4.8),e.text(i(`TEMPO`,`TIME`,`TIEMPO`),132,n+4.8),e.text(i(`CAFEÍNA`,`CAFFEINE`,`CAFEÍNA`),159,n+4.8),n+=8,P.slice(0,14).forEach((t,i)=>{let a=NM(t,r);e.setFillColor(i%2==0?255:246,i%2==0?255:242,i%2==0?255:235),e.roundedRect(14,n,182,8.5,.8,.8,`F`),e.setFont(`times`,`bold`),e.setFontSize(8.5),e.setTextColor(30,27,24),e.text(a.name,17,n+5.5),e.setFont(`helvetica`,`normal`),e.setFontSize(7),e.setTextColor(102,96,86),e.text(DM(a.category,r).toUpperCase(),72,n+5.5),e.setFont(`helvetica`,`bold`),e.setTextColor(139,38,53),e.text(a.brewGuide.tempC,109,n+5.5),e.setTextColor(46,107,52),e.text(a.brewGuide.infusionTime,132,n+5.5),e.setFont(`helvetica`,`normal`),e.setTextColor(102,96,86),e.text(OM(a.caffeine,r),159,n+5.5),n+=9.5})';
  const replaceGuiaTable2Bar =
    'n+=5;if(n+24>278){e.addPage();e.setFillColor(250,247,242),e.rect(0,0,210,297,`F`);n=talchaDrawContinuationHeader(e,{subtitle:i(`GUIA TÉCNICO DE INFUSÃO`,`B2B BARISTA INFUSION GUIDE`,`GUÍA TÉCNICA DE INFUSIÓN`),venueName:t||``})}e.setFillColor(139,38,53),e.roundedRect(14,n,182,7,1,1,`F`),e.setFillColor(198,138,54),e.rect(14,n,1.5,7,`F`),e.setFont(`helvetica`,`bold`),e.setFontSize(7),e.setTextColor(255,255,255),e.text(`BLEND TALCHÁ`,17,n+4.8),e.text(i(`CATEGORIA`,`CATEGORY`,`CATEGORÍA`),72,n+4.8),e.text(i(`TEMP.`,`TEMP.`,`TEMP.`),109,n+4.8),e.text(i(`TEMPO`,`TIME`,`TIEMPO`),132,n+4.8),e.text(i(`CAFEÍNA`,`CAFFEINE`,`CAFEÍNA`),159,n+4.8),n+=8,P.slice(0,14).forEach((pgItem,idx)=>{if(n+10>278){e.addPage();e.setFillColor(250,247,242),e.rect(0,0,210,297,`F`);n=talchaDrawContinuationHeader(e,{subtitle:i(`GUIA TÉCNICO DE INFUSÃO (CONT.)`,`B2B BARISTA INFUSION GUIDE (CONT.)`,`GUÍA TÉCNICA DE INFUSIÓN (CONT.)`),venueName:t||``});e.setFillColor(139,38,53),e.roundedRect(14,n,182,7,1,1,`F`),e.setFillColor(198,138,54),e.rect(14,n,1.5,7,`F`),e.setFont(`helvetica`,`bold`),e.setFontSize(7),e.setTextColor(255,255,255),e.text(`BLEND TALCHÁ`,17,n+4.8),e.text(i(`CATEGORIA`,`CATEGORY`,`CATEGORÍA`),72,n+4.8),e.text(i(`TEMP.`,`TEMP.`,`TEMP.`),109,n+4.8),e.text(i(`TEMPO`,`TIME`,`TIEMPO`),132,n+4.8),e.text(i(`CAFEÍNA`,`CAFFEINE`,`CAFEÍNA`),159,n+4.8),n+=8}let a=NM(pgItem,r);e.setFillColor(idx%2==0?255:245,idx%2==0?255:239,idx%2==0?255:228),e.roundedRect(14,n,182,8.5,.8,.8,`F`),e.setFont(`times`,`bold`),e.setFontSize(8.5),e.setTextColor(30,27,24),e.text(a.name,17,n+5.5),e.setFont(`helvetica`,`normal`),e.setFontSize(7),e.setTextColor(102,96,86),e.text(DM(a.category,r).toUpperCase(),72,n+5.5),e.setFont(`helvetica`,`bold`),e.setTextColor(139,38,53),e.text(a.brewGuide.tempC,109,n+5.5),e.setTextColor(46,107,52),e.text(a.brewGuide.infusionTime,132,n+5.5),e.setFont(`helvetica`,`normal`),e.setTextColor(102,96,86),e.text(OM(a.caffeine,r),159,n+5.5),n+=9.5})';
  if (!code.includes(targetGuiaTable2Bar)) throw new Error('Could not find targetGuiaTable2Bar');
  code = code.replace(targetGuiaTable2Bar, replaceGuiaTable2Bar);
  console.log('✓ Upgraded Guia_de_Infusao_Talcha_B2B.pdf with official Talchá Burgundy/Gold banner, pagination, clean columns & client logo');

  // ---------------------------------------------------------------------------
  // 8. Upgrade Kfe() (Manual de Logística & Prazos B2B PDF)
  // ---------------------------------------------------------------------------
  const targetKfePalette =
    'a={r:139,g:38,b:53},o={r:30,g:27,b:24},s={r:198,g:138,b:54},c={r:46,g:107,b:52},l={r:250,g:247,b:242},u={r:229,g:218,b:203},d={r:102,g:93,b:79},f={r:248,g:243,b:235}';
  const replaceKfePalette =
    'a={r:139,g:38,b:53},o={r:30,g:27,b:24},s={r:198,g:138,b:54},c={r:23,g:51,b:34},l={r:250,g:247,b:242},u={r:229,g:218,b:203},d={r:102,g:93,b:79},f={r:245,g:239,b:228}';
  if (!code.includes(targetKfePalette)) throw new Error('Could not find targetKfePalette');
  code = code.replace(targetKfePalette, replaceKfePalette);

  const targetKfeHeader =
    'h=e=>{i.setFillColor(a.r,a.g,a.b),i.rect(0,0,210,5,`F`),e||(i.setFillColor(l.r,l.g,l.b),i.rect(0,5,210,12,`F`),i.setDrawColor(u.r,u.g,u.b),i.line(0,17,210,17),i.setFont(`times`,`bold`),i.setFontSize(10),i.setTextColor(a.r,a.g,a.b),i.text(`Talchapidia`,16,13),i.setFont(`helvetica`,`normal`),i.setFontSize(8),i.setTextColor(d.r,d.g,d.b),i.text(t===`en`?`· B2B Logistics & Operations Manual (Offline Consultation)`:t===`es`?`· Manual de Logística, Plazos & Facturación B2B (Consulta Offline)`:`· Manual de Logística, Prazos & Faturamento B2B (Consulta Offline)`,36,13))}';
  const replaceKfeHeader =
    'h=e=>{if(e)return;talchaDrawContinuationHeader(i,{subtitle:t===`en`?`B2B Logistics & Operations Manual`:t===`es`?`Manual de Logística, Plazos & Facturación B2B`:`Manual de Logística, Prazos & Faturamento B2B`})}';
  if (!code.includes(targetKfeHeader)) throw new Error('Could not find targetKfeHeader');
  code = code.replace(targetKfeHeader, replaceKfeHeader);

  const targetKfeAddPage = '_=e=>{p+e>277&&(g(m),i.addPage(),m+=1,h(!1),p=24)}';
  const replaceKfeAddPage =
    '_=e=>{p+e>277&&(g(m),i.addPage(),i.setFillColor(l.r,l.g,l.b),i.rect(0,0,210,297,`F`),m+=1,h(!1),p=24)}';
  if (!code.includes(targetKfeAddPage)) throw new Error('Could not find targetKfeAddPage');
  code = code.replace(targetKfeAddPage, replaceKfeAddPage);

  const targetKfePage1Top =
    'h(!0),p=16,i.setFont(`times`,`bold`),i.setFontSize(24),i.setTextColor(o.r,o.g,o.b),i.text(`Talchapidia`,16,p),i.setFont(`helvetica`,`bold`),i.setFontSize(8.5),i.setTextColor(a.r,a.g,a.b),i.text(t===`en`?`OFFICIAL B2B LOGISTICS & PROCUREMENT GUIDE`:t===`es`?`GUÍA OFICIAL DE LOGÍSTICA & SUMINISTROS B2B`:`GUIA OFICIAL DE LOGÍSTICA & SUPRIMENTOS B2B`,61,p-1),p+=6';
  const replaceKfePage1Top =
    'i.setFillColor(250,247,242),i.rect(0,0,210,297,`F`),p=talchaDrawEditorialBanner(i,{subtitle:t===`en`?`OFFICIAL B2B LOGISTICS & PROCUREMENT GUIDE`:t===`es`?`GUÍA OFICIAL DE LOGÍSTICA & SUMINISTROS B2B`:`GUIA OFICIAL DE LOGÍSTICA & SUPRIMENTOS B2B`,badge:`MANUAL OFICIAL B2B`})+3';
  if (!code.includes(targetKfePage1Top)) throw new Error('Could not find targetKfePage1Top');
  code = code.replace(targetKfePage1Top, replaceKfePage1Top);

  const targetKfeKpis =
    'i.setFillColor(f.r,f.g,f.b),i.setDrawColor(u.r,u.g,u.b),i.roundedRect(16,p,y,16,2,2,`FD`),i.setFont(`helvetica`,`bold`),i.setFontSize(7.5),i.setTextColor(a.r,a.g,a.b),i.text(t===`en`?`DISPATCH LEAD TIME`:t===`es`?`PLAZO DE DESPACHO`:`PRAZO DE DESPACHO`,20,p+5),i.setFont(`helvetica`,`bold`),i.setFontSize(9.5),i.setTextColor(o.r,o.g,o.b),i.text(t===`en`?`24h - 48h Business Days`:t===`es`?`24h a 48h Hábiles`:`24h a 48h Úteis`,20,p+11.5),i.roundedRect(76.33333333333334,p,y,16,2,2,`FD`),i.setFont(`helvetica`,`bold`),i.setFontSize(7.5),i.setTextColor(c.r,c.g,c.b),i.text(t===`en`?`MINIMUM ORDER (MOQ)`:`PEDIDO MÍNIMO (MOQ)`,80.33333333333334,p+5),i.setFont(`helvetica`,`bold`),i.setFontSize(9.5),i.setTextColor(o.r,o.g,o.b),i.text(t===`en`?`From 4 Tins (Mix Free)`:t===`es`?`Desde 4 Latas (Mix Libre)`:`A partir de 4 Latas (Mix Livre)`,80.33333333333334,p+11.5),i.roundedRect(136.66666666666669,p,y,16,2,2,`FD`),i.setFont(`helvetica`,`bold`),i.setFontSize(7.5),i.setTextColor(s.r,s.g,s.b),i.text(t===`en`?`PRESERVATION`:t===`es`?`PRESERVACIÓN EN LATA`:`PRESERVAÇÃO EM LATA`,140.66666666666669,p+5),i.setFont(`helvetica`,`bold`),i.setFontSize(9.5),i.setTextColor(o.r,o.g,o.b),i.text(t===`en`?`24-Mo. UV Hermetic Seal`:t===`es`?`24 Meses · Bloqueo UV`:`24 Meses · Bloqueio UV`,140.66666666666669,p+11.5)';
  const replaceKfeKpis =
    'i.setFillColor(255,255,255),i.setDrawColor(u.r,u.g,u.b),i.roundedRect(16,p,y,16,2,2,`FD`),i.setFont(`helvetica`,`bold`),i.setFontSize(7.2),i.setTextColor(a.r,a.g,a.b),i.text(t===`en`?`DISPATCH LEAD TIME`:t===`es`?`PLAZO DE DESPACHO`:`PRAZO DE DESPACHO`,20,p+5),i.setFont(`helvetica`,`bold`),i.setFontSize(9.2),i.setTextColor(o.r,o.g,o.b),i.text(t===`en`?`24h - 48h Business Days`:t===`es`?`24h a 48h Hábiles`:`24h a 48h Úteis`,20,p+11.5),i.setFillColor(255,255,255),i.setDrawColor(u.r,u.g,u.b),i.roundedRect(76.33333333333334,p,y,16,2,2,`FD`),i.setFont(`helvetica`,`bold`),i.setFontSize(7.2),i.setTextColor(c.r,c.g,c.b),i.text(t===`en`?`MINIMUM ORDER (MOQ)`:`PEDIDO MÍNIMO (MOQ)`,80.33333333333334,p+5),i.setFont(`helvetica`,`bold`),i.setFontSize(9.2),i.setTextColor(o.r,o.g,o.b),i.text(t===`en`?`From 4 Tins (Mix Free)`:t===`es`?`Desde 4 Latas (Mix Libre)`:`A partir de 4 Latas (Mix Livre)`,80.33333333333334,p+11.5),i.setFillColor(255,255,255),i.setDrawColor(u.r,u.g,u.b),i.roundedRect(136.66666666666669,p,y,16,2,2,`FD`),i.setFont(`helvetica`,`bold`),i.setFontSize(7.2),i.setTextColor(s.r,s.g,s.b),i.text(t===`en`?`PRESERVATION`:t===`es`?`PRESERVACIÓN EN LATA`:`PRESERVAÇÃO EM LATA`,140.66666666666669,p+5),i.setFont(`helvetica`,`bold`),i.setFontSize(9.2),i.setTextColor(o.r,o.g,o.b),i.text(t===`en`?`24-Mo. UV Hermetic Seal`:t===`es`?`24 Meses · Bloqueo UV`:`24 Meses · Bloqueio UV`,140.66666666666669,p+11.5)';
  if (!code.includes(targetKfeKpis)) throw new Error('Could not find targetKfeKpis');
  code = code.replace(targetKfeKpis, replaceKfeKpis);

  const targetKfeTable1 =
    'i.setFillColor(o.r,o.g,o.b),i.rect(16,p,178,7,`F`),i.setFont(`helvetica`,`bold`),i.setFontSize(7.5),i.setTextColor(255,255,255),i.text(t===`en`?`DESTINATION REGION`:t===`es`?`REGIÓN DE DESTINO`:`REGIÃO DE DESTINO`,20,p+4.8),i.text(t===`en`?`TRANSIT TIME`:t===`es`?`PLAZO DE TRÁNSITO`:`PRAZO DE TRÂNSITO`,96,p+4.8),i.text(t===`en`?`MODALITY & LOGISTIC NOTES`:t===`es`?`MODALIDAD & OBSERVACIONES`:`MODALIDADE & OBSERVAÇÕES`,141,p+4.8),p+=7,[{region:`São Paulo Capital & Grande SP (ABC)`,time:`24h a 48h úteis`,notes:`Frota própria climatizada / motofrete expresso para emergências`},{region:`Capitais Sudeste e Sul (RJ, Curitiba, BH, POA, Floripa)`,time:`48h a 72h úteis`,notes:`Malha rodoviária expressa com rastreamento eletrônico CT-e`},{region:`Capitais Centro-Oeste e Nordeste (Brasília, Goiânia, Salvador, Recife)`,time:`3 a 5 dias úteis`,notes:`Transportadora parceira com seguro de carga e aviso por WhatsApp`},{region:`Cidades do Interior & Região Norte`,time:`4 a 7 dias úteis`,notes:`Sedex Corporativo ou transportadora com caixa isotérmica reforçada`}].forEach((e,t)=>{_(8);let n=t%2==0?l:{r:255,g:255,b:255};i.setFillColor(n.r,n.g,n.b),i.rect(16,p,178,7.5,`F`),i.setDrawColor(u.r,u.g,u.b),i.line(16,p+7.5,194,p+7.5),i.setFont(`helvetica`,`bold`),i.setFontSize(8),i.setTextColor(o.r,o.g,o.b),i.text(e.region,20,p+5),i.setFont(`helvetica`,`bold`),i.setTextColor(c.r,c.g,c.b),i.text(e.time,96,p+5),i.setFont(`helvetica`,`normal`),i.setFontSize(7.5),i.setTextColor(d.r,d.g,d.b),i.text(e.notes,141,p+5),p+=7.5})';
  const replaceKfeTable1 =
    'i.setFillColor(a.r,a.g,a.b),i.rect(16,p,178,7,`F`),i.setFillColor(198,138,54),i.rect(16,p,1.5,7,`F`),i.setFont(`helvetica`,`bold`),i.setFontSize(7),i.setTextColor(255,255,255),i.text(t===`en`?`DESTINATION REGION`:t===`es`?`REGIÓN DE DESTINO`:`REGIÃO DE DESTINO`,20,p+4.7),i.text(t===`en`?`TRANSIT TIME`:t===`es`?`PLAZO DE TRÁNSITO`:`PRAZO DE TRÂNSITO`,88,p+4.7),i.text(t===`en`?`MODALITY & LOGISTIC NOTES`:t===`es`?`MODALIDAD & OBSERVACIONES`:`MODALIDADE & OBSERVAÇÕES`,120,p+4.7),p+=7,[{region:`São Paulo Capital & Grande SP (ABC)`,time:`24h a 48h úteis`,notes:`Frota própria climatizada / motofrete expresso para emergências`},{region:`Capitais Sudeste e Sul (RJ, Curitiba, BH, POA, Floripa)`,time:`48h a 72h úteis`,notes:`Malha rodoviária expressa com rastreamento eletrônico CT-e`},{region:`Capitais Centro-Oeste e Nordeste (Brasília, Goiânia, Salvador, Recife)`,time:`3 a 5 dias úteis`,notes:`Transportadora parceira com seguro de carga e aviso por WhatsApp`},{region:`Cidades do Interior & Região Norte`,time:`4 a 7 dias úteis`,notes:`Sedex Corporativo ou transportadora com caixa isotérmica reforçada`}].forEach((e,t)=>{i.setFont(`helvetica`,`bold`),i.setFontSize(7.6);let rl=i.splitTextToSize(e.region,64).slice(0,2);i.setFont(`helvetica`,`normal`),i.setFontSize(7.1);let nl=i.splitTextToSize(e.notes,71).slice(0,2);let rh=Math.max(8.5,Math.max(rl.length,nl.length)*3.6+4);_(rh+1);let n=t%2==0?{r:255,g:255,b:255}:f;i.setFillColor(n.r,n.g,n.b),i.rect(16,p,178,rh,`F`),i.setDrawColor(u.r,u.g,u.b),i.line(16,p+rh,194,p+rh),i.setFont(`helvetica`,`bold`),i.setFontSize(7.6),i.setTextColor(o.r,o.g,o.b),i.text(rl,20,p+4.4),i.setFont(`helvetica`,`bold`),i.setFontSize(7.6),i.setTextColor(c.r,c.g,c.b),i.text(e.time,88,p+4.4),i.setFont(`helvetica`,`normal`),i.setFontSize(7.1),i.setTextColor(d.r,d.g,d.b),i.text(nl,120,p+4.4),p+=rh})';
  if (!code.includes(targetKfeTable1)) throw new Error('Could not find targetKfeTable1');
  code = code.replace(targetKfeTable1, replaceKfeTable1);
  console.log('✓ Upgraded Kfe() Manual de Logística PDF with official Talchá Burgundy/Gold banner & client logo');

  // ---------------------------------------------------------------------------
  // 8B. Upgrade M9 (A4 Document Preview Modal #carta-pdf-render-root)
  // ---------------------------------------------------------------------------
  const targetM9Header1 =
    'className:`w-[794px] min-h-[1123px] h-[1123px] bg-[#FAF8F5] p-10 flex flex-col justify-between relative box-border overflow-hidden border-b-2 border-dashed border-[#DDD4C5]`,style:{boxSizing:`border-box`},children:[(0,Z.jsx)(`div`,{className:`absolute top-0 left-0 right-0 h-3 bg-[#8B2635]`}),(0,Z.jsxs)(`div`,{children:[(0,Z.jsxs)(`div`,{className:`flex items-center justify-between pb-4 border-b border-[#E5DDD0] mt-1 mb-5`,children:[(0,Z.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,Z.jsx)(`div`,{className:`w-12 h-12 rounded-full bg-[#1E1B18] text-white flex items-center justify-center p-2 shadow-xs shrink-0`,children:(0,Z.jsxs)(`svg`,{viewBox:`0 0 100 80`,fill:`none`,xmlns:`http://www.w3.org/2000/svg`,className:`w-7 h-7 stroke-white stroke-[5]`,children:[(0,Z.jsx)(`path`,{d:`M 12 18 L 88 18 C 84 55, 66 70, 50 70 C 34 70, 16 55, 12 18 Z`,strokeLinejoin:`round`,strokeLinecap:`round`}),(0,Z.jsx)(`path`,{d:`M 50 64 C 40 50, 42 34, 52 26 C 62 38, 58 56, 50 64 Z`,strokeLinejoin:`round`,strokeLinecap:`round`})]})}),(0,Z.jsxs)(`div`,{children:[(0,Z.jsx)(`div`,{className:`flex items-baseline gap-2`,children:(0,Z.jsx)(`span`,{className:`font-serif text-3xl font-bold tracking-tight text-[#1E1B18]`,children:`Talchapidia`})}),(0,Z.jsx)(`p`,{className:`text-[10px] uppercase tracking-wider text-[#706B63] font-semibold`,children:b.subBrand})]})]}),(0,Z.jsxs)(`div`,{className:`text-right`,children:[(0,Z.jsx)(`div`,{className:`inline-block px-3 py-1 rounded-full bg-[#8B2635]/10 border border-[#8B2635]/20 text-[#8B2635] text-[10px] font-bold uppercase tracking-wider mb-1`,children:b.officialBadge}),(0,Z.jsxs)(`div`,{className:`text-[11px] text-[#696256] font-medium`,children:[b.issued,`: `,_]})]})]})';

  const replaceM9Header1Exact =
    'className:`w-[794px] min-h-[1123px] h-[1123px] bg-[#FAF7F2] px-10 pb-8 pt-[114px] flex flex-col justify-between relative box-border overflow-hidden border-b-2 border-dashed border-[#DDD4C5]`,style:{boxSizing:`border-box`},children:[((()=>{let cLg=null;try{cLg=localStorage.getItem(`talcha_carta_client_logo`)||null}catch{}return(0,Z.jsxs)(`div`,{style:{position:`absolute`,top:0,left:0,right:0,height:`94px`,backgroundColor:`#FFFFFF`,borderTop:`6px solid #8B2635`,borderBottom:`1.5px solid #E5DACB`,padding:`0 40px`,display:`flex`,alignItems:`center`,justifyContent:`space-between`},children:[(0,Z.jsx)(`div`,{style:{position:`absolute`,top:0,left:0,right:0,height:`2px`,backgroundColor:`#C68A36`}}),(0,Z.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`16px`},children:[(0,Z.jsx)(`img`,{src:`/assets/logo_talcha_preto.png`,alt:`Talchá`,style:{height:`44px`,width:`auto`,objectFit:`contain`}}),(0,Z.jsx)(`div`,{style:{height:`34px`,width:`1px`,backgroundColor:`#C68A36`}}),(0,Z.jsxs)(`div`,{children:[(0,Z.jsx)(`div`,{style:{fontSize:`10px`,fontWeight:700,letterSpacing:`0.14em`,textTransform:`uppercase`,color:`#8B2635`},children:`CHÁS ESPECIAIS & ALTA GASTRONOMIA`}),(0,Z.jsx)(`div`,{style:{fontSize:`10px`,color:`#696256`,marginTop:`2px`},children:b.subBrand})]})]}),(0,Z.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,alignItems:`flex-end`,gap:`4px`},children:[cLg?(0,Z.jsx)(`div`,{style:{backgroundColor:`#FFFFFF`,border:`1.5px solid #C68A36`,borderRadius:`8px`,padding:`4px 10px`},children:(0,Z.jsx)(`img`,{src:cLg,alt:`Logo cliente`,style:{height:`34px`,maxWidth:`110px`,objectFit:`contain`}})}):(0,Z.jsx)(`div`,{style:{padding:`4px 14px`,borderRadius:`6px`,backgroundColor:`#8B2635`,border:`1px solid #C68A36`,color:`#FFFFFF`,fontSize:`10px`,fontWeight:700,textTransform:`uppercase`,letterSpacing:`0.08em`},children:b.officialBadge}),(0,Z.jsxs)(`div`,{style:{fontSize:`10px`,color:`#696256`,fontWeight:500},children:[b.issued,`: `,_]})]})]})})()),(0,Z.jsxs)(`div`,{children:[';
  if (!code.includes(targetM9Header1)) throw new Error('Could not find targetM9Header1');
  code = code.replace(targetM9Header1, replaceM9Header1Exact);

  const targetM9CardCircle =
    '(0,Z.jsxs)(`div`,{className:`bg-white rounded-xl p-3 border border-[#E5DDD0] flex items-start justify-between gap-3 text-xs`,children:[(0,Z.jsxs)(`div`,{className:`flex items-start gap-3 flex-1`,children:[(0,Z.jsxs)(`div`,{className:`w-7 h-7 rounded-full bg-[#8B2635] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`,children:[`0`,t+1]}),(0,Z.jsxs)(`div`,{children:[(0,Z.jsxs)(`div`,{className:`flex items-center gap-2 mb-0.5`,children:[(0,Z.jsx)(`span`,{className:`font-serif text-sm font-bold text-[#1E1B18]`,children:n.name}),(0,Z.jsx)(`span`,{className:`text-[9px] uppercase font-bold text-[#8B2635] bg-[#F7EFE8] px-1.5 py-0.5 rounded`,children:r}),(0,Z.jsxs)(`span`,{className:`text-[9px] text-[#7A7367]`,children:[`· `,i]})]}),(0,Z.jsx)(`div`,{className:`text-[11px] font-semibold text-[#8B2635] mb-0.5`,children:e.roleInMenu}),(0,Z.jsxs)(`div`,{className:`text-[10.5px] text-[#554E44] leading-snug`,children:[n.profileHeadline,` · `,b.keyIngredient,`: `,n.keyIngredient,`.`]}),n.foodPairings&&n.foodPairings.length>0&&(0,Z.jsxs)(`div`,{className:`text-[10px] text-[#787165] mt-0.5`,children:[b.pairing,`: `,n.foodPairings.slice(0,3).join(`, `)]})]})]}),(0,Z.jsxs)(`div`,{className:`bg-[#FAF8F5] p-2.5 rounded-lg border border-[#EBE3D7] text-[10.5px] text-[#6E675C] shrink-0 w-52`,children:[(0,Z.jsx)(`div`,{className:`font-semibold text-[#1E1B18] mb-0.5`,children:e.serviceTip}),(0,Z.jsxs)(`div`,{className:`text-[10px] text-[#8B2635] font-medium mt-1`,children:[n.brewGuide.tempC,` · `,n.brewGuide.infusionTime]})]})]},n.id)})]})]}),(0,Z.jsxs)(`div`,{className:`pt-3 border-t border-[#E5DDD0] flex items-center justify-between text-[10px] text-[#787165]`,children:[(0,Z.jsx)(`div`,{children:`Talchapidia · Powered by Talchá · www.talcha.com.br`}),(0,Z.jsx)(`div`,{className:`font-bold text-[#1E1B18]`,children:b.page1of2})]})]}),';
  const replaceM9CardCircle =
    '(0,Z.jsxs)(`div`,{className:`bg-white rounded-xl p-3 border border-[#E5DACB] border-l-[3px] border-l-[#8B2635] flex items-start justify-between gap-4 text-xs`,children:[(0,Z.jsxs)(`div`,{className:`flex items-start gap-3 flex-1 min-w-0`,children:[(0,Z.jsxs)(`div`,{style:{width:`26px`,height:`26px`,borderRadius:`9999px`,backgroundColor:`#8B2635`,color:`#FAF7F2`,fontSize:`11px`,fontWeight:700,display:`flex`,alignItems:`center`,justifyContent:`center`,flexShrink:0,marginTop:`2px`},children:[t<9?`0`+(t+1):t+1]}),(0,Z.jsxs)(`div`,{className:`min-w-0 flex-1 break-words`,children:[(0,Z.jsxs)(`div`,{className:`flex items-center flex-wrap gap-2 mb-0.5`,children:[(0,Z.jsx)(`span`,{className:`font-serif text-sm font-bold text-[#1E1B18]`,children:n.name}),(0,Z.jsx)(`span`,{className:`text-[9px] uppercase font-bold text-[#8B2635] bg-[#F5EFE4] border border-[#E5DACB] px-1.5 py-0.5 rounded`,children:r}),(0,Z.jsxs)(`span`,{className:`text-[9px] text-[#696256]`,children:[`· `,i]})]}),(0,Z.jsx)(`div`,{className:`text-[11px] font-semibold text-[#8B2635] mb-0.5`,children:e.roleInMenu}),(0,Z.jsxs)(`div`,{className:`text-[10.5px] text-[#423D37] leading-snug`,children:[n.profileHeadline,` · `,b.keyIngredient,`: `,n.keyIngredient,`.`]}),n.foodPairings&&n.foodPairings.length>0&&(0,Z.jsxs)(`div`,{className:`text-[10px] text-[#696256] mt-0.5`,children:[b.pairing,`: `,n.foodPairings.slice(0,3).join(`, `)]})]})]}),(0,Z.jsxs)(`div`,{className:`bg-[#F5EFE4] p-2.5 rounded-lg border border-[#E5DACB] text-[10px] text-[#696256] shrink-0 w-[188px]`,children:[(0,Z.jsx)(`div`,{className:`text-[9px] font-bold uppercase tracking-wider text-[#8B2635] mb-0.5`,children:m===`en`?`STEEPING RITUAL`:m===`es`?`RITUAL DE INFUSIÓN`:`RITUAL DE INFUSÃO`}),(0,Z.jsxs)(`div`,{className:`text-[10.5px] text-[#1E1B18] font-bold`,children:[n.brewGuide.tempC,` · `,n.brewGuide.infusionTime]}),(0,Z.jsx)(`div`,{className:`text-[10px] text-[#554E44] mt-0.5 leading-snug break-words`,children:e.serviceTip})]})]},n.id)})]})]}),(0,Z.jsxs)(`div`,{className:`pt-3 border-t border-[#E5DACB] flex items-center justify-between text-[10px] text-[#696256]`,children:[(0,Z.jsx)(`div`,{children:`Talchá Chás Especiais · Alta Gastronomia & Hotelaria · www.talcha.com.br`}),(0,Z.jsx)(`div`,{className:`font-bold text-[#8B2635]`,children:b.page1of2})]})]}),';
  if (!code.includes(targetM9CardCircle)) throw new Error('Could not find targetM9CardCircle');
  code = code.replace(targetM9CardCircle, replaceM9CardCircle);

  const targetM9Header2 =
    'id:`carta-pdf-page-2`,className:`w-[794px] min-h-[1123px] h-[1123px] bg-[#FAF8F5] p-10 flex flex-col justify-between relative box-border overflow-hidden`,style:{boxSizing:`border-box`},children:[(0,Z.jsx)(`div`,{className:`absolute top-0 left-0 right-0 h-3 bg-[#8B2635]`}),(0,Z.jsxs)(`div`,{children:[(0,Z.jsxs)(`div`,{className:`flex items-center justify-between pb-3 border-b border-[#E5DDD0] mt-1 mb-5`,children:[(0,Z.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,Z.jsx)(`span`,{className:`font-serif text-xl font-bold tracking-tight text-[#8B2635]`,children:`talchá`}),(0,Z.jsx)(`span`,{className:`text-xs text-[#706B63]`,children:b.manualHeader})]}),(0,Z.jsx)(`div`,{className:`text-right text-[10px] font-semibold text-[#1E1B18]`,children:r?r.toUpperCase():b.exclusiveMenu})]})';
  const replaceM9Header2 =
    'id:`carta-pdf-page-2`,className:`w-[794px] min-h-[1123px] h-[1123px] bg-[#FAF7F2] px-10 pb-8 pt-[74px] flex flex-col justify-between relative box-border overflow-hidden`,style:{boxSizing:`border-box`},children:[((()=>{let cLg=null;try{cLg=localStorage.getItem(`talcha_carta_client_logo`)||null}catch{}return(0,Z.jsxs)(`div`,{style:{position:`absolute`,top:0,left:0,right:0,height:`56px`,backgroundColor:`#FFFFFF`,borderTop:`4px solid #8B2635`,borderBottom:`1.5px solid #E5DACB`,padding:`0 40px`,display:`flex`,alignItems:`center`,justifyContent:`space-between`},children:[(0,Z.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`12px`},children:[(0,Z.jsx)(`img`,{src:`/assets/logo_talcha_preto.png`,alt:`Talchá`,style:{height:`28px`,width:`auto`,objectFit:`contain`}}),(0,Z.jsx)(`span`,{style:{fontSize:`11px`,fontWeight:600,color:`#8B2635`},children:b.manualHeader})]}),(0,Z.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`10px`},children:[cLg&&(0,Z.jsx)(`div`,{style:{backgroundColor:`#FFFFFF`,borderRadius:`6px`,padding:`2px 6px`,border:`1px solid #C68A36`},children:(0,Z.jsx)(`img`,{src:cLg,alt:`Logo cliente`,style:{height:`22px`,maxWidth:`74px`,objectFit:`contain`}})}),(0,Z.jsx)(`div`,{style:{fontSize:`10px`,fontWeight:700,color:`#696256`},children:r?r.toUpperCase():b.exclusiveMenu})]})]})})()),(0,Z.jsxs)(`div`,{children:[';
  if (!code.includes(targetM9Header2)) throw new Error('Could not find targetM9Header2');
  code = code.replace(targetM9Header2, replaceM9Header2);
  console.log('✓ Upgraded M9 Visualizar Prévia A4 viewer with authentic Talchá Ivory/Burgundy/Gold banner & client logo');

  // ---------------------------------------------------------------------------
  // 8C. Replace legacy Carta B2B (jfe) scaled preview modal + hidden M9 with full-page CartaPdfPreviewModal
  // ---------------------------------------------------------------------------
  const jfePreviewStartAnchor =
    '(0,Z.jsx)(`div`,{"aria-hidden":`true`,className:`fixed left-[-9999px] top-0 pointer-events-none opacity-100 z-[-100]`,children:(0,Z.jsx)(M9,';
  const jfePreviewEndAnchor =
    ',Ee&&(0,Z.jsxs)(`div`,{className:`fixed bottom-6 right-6 z-50';
  const jfeP1 = code.indexOf(jfePreviewStartAnchor);
  const jfeP2 = jfeP1 !== -1 ? code.indexOf(jfePreviewEndAnchor, jfeP1) : -1;
  if (jfeP1 === -1 || jfeP2 === -1) {
    throw new Error('Could not find jfe legacy M9 preview block anchors');
  }
  const jfePreviewReplacement =
    '(0,Z.jsx)(CartaPdfPreviewModal,{isOpen:k,onClose:()=>A(!1),establishmentName:c,businessType:u,audienceProfile:f,operatingHours:g,menuHighlights:m,serviceFormat:v,cartaTitle:je.title,cartaSubtitle:je.subtitle,strategicRationale:je.strategicRationale,language:n,items:Me,onDownloadPdf:opts=>Re(opts),isDownloading:S,hasDownloaded:T,showPrintFallbackWhenClosed:!0})';
  code = code.slice(0, jfeP1) + jfePreviewReplacement + code.slice(jfeP2);
  console.log('✓ Wired full-page CartaPdfPreviewModal inside Carta B2B (jfe) with A4 print fallback');

  // ---------------------------------------------------------------------------
  // 9. Upgrade Lfe (Contact Modal) with Cohesive Ivory/Burgundy/Gold Preview + Logo Uploader + Download Carta
  // ---------------------------------------------------------------------------
  const targetLfeState =
    'Lfe=({isOpen:e,onClose:t,interestType:n,recommendedTeaName:r})=>{let{language:i,localize:a}=SC(),[o,s]=(0,w.useState)({name:``,company:``,role:``,whatsapp:``,email:``,city:``,estimatedQuantity:`Ainda em planejamento / Sob demanda`,notes:``}),[c,l]=(0,w.useState)(!1),[u,d]=(0,w.useState)(!1),[f,p]=(0,w.useState)(null),[m,h]=(0,w.useState)(null);';
  const replaceLfeState =
    'Lfe=({isOpen:e,onClose:t,interestType:n,recommendedTeaName:r})=>{let{language:i,localize:a}=SC(),[o,s]=(0,w.useState)({name:``,company:``,role:``,whatsapp:``,email:``,city:``,estimatedQuantity:`Ainda em planejamento / Sob demanda`,notes:``}),[c,l]=(0,w.useState)(!1),[u,d]=(0,w.useState)(!1),[f,p]=(0,w.useState)(null),[m,h]=(0,w.useState)(null),[gLogo,setGLogo]=(0,w.useState)(()=>{try{return localStorage.getItem(`talcha_carta_client_logo`)||null}catch{return null}}),[cartaMode,setCartaMode]=(0,w.useState)(`customer`),[dlBusy,setDlBusy]=(0,w.useState)(!1),[dlDone,setDlDone]=(0,w.useState)(!1),fileInputRef=(0,w.useRef)(null);(0,w.useEffect)(()=>{let onLogoSync=ev=>setGLogo(ev?.detail!==undefined?ev.detail:(()=>{try{return localStorage.getItem(`talcha_carta_client_logo`)||null}catch{return null}})());window.addEventListener(`talcha_logo_updated`,onLogoSync);return()=>window.removeEventListener(`talcha_logo_updated`,onLogoSync)},[]);let activeCarta=(()=>{let ac=globalThis.__TALCHA_ACTIVE_CARTA__;if(ac&&Array.isArray(ac.items)&&ac.items.length>0)return ac;let km=KM(`Restaurante`,i||`pt`);if(r){let matched=zM.find(x=>x.name.toLowerCase().includes(String(r).toLowerCase())||String(r).toLowerCase().includes(x.name.toLowerCase()));if(matched&&!km.items.some(it=>it.blend.id===matched.id)){km={...km,items:[{blend:matched,roleInMenu:a(`Destaque Selecionado`,`Selected Highlight`,`Destacado Seleccionado`),serviceTip:`${matched.brewGuide?.tempC||`90°C`} · ${matched.brewGuide?.infusionTime||`3 min`}`},...km.items.slice(0,5)]}}}return{establishmentName:``,businessType:`Restaurante`,...km}})(),onLogoFile=ev=>{let fl=ev.target.files?.[0];if(fl)talchaNormalizeClientLogo(fl,setGLogo);ev.target.value=``},onDownloadCartaPdf=async()=>{if(dlBusy)return;setDlBusy(!0);try{let venue=(o.company||``).trim()||activeCarta.establishmentName||a(`Estabelecimento Parceiro`,`Partner Venue`,`Establecimiento Asociado`);await Sfe({establishmentName:venue,businessType:activeCarta.businessType||`Restaurante`,audienceProfile:a(`Alta Gastronomia & Salão`,`Fine Dining & Hospitality`,`Alta Gastronomía`),operatingHours:a(`Almoço, Chá da Tarde & Jantar`,`Lunch, Afternoon & Dinner`,`Almuerzo, Tarde & Cena`),menuHighlights:activeCarta.items.slice(0,3).map(it=>it.blend.name).join(` · `),serviceFormat:a(`Infusor Vapt Vupt + Copo Vidro Duplo`,`Vapt Vupt Brewer + Double-Wall Glass`,`Infusor Vapt Vupt + Vaso Doble Vidrio`),cartaTitle:activeCarta.cartaTitle||activeCarta.title||a(`Carta de Chás Especiais — ${venue}`,`Specialty Tea Menu — ${venue}`,`Carta de Tés Especiales — ${venue}`),cartaSubtitle:activeCarta.cartaSubtitle||activeCarta.subtitle||a(`Curadoria sensorial sob medida para salão e hospitalidade`,`Tailored sensory tea curation for hospitality`,`Curaduría sensorial a medida para sala`),strategicRationale:activeCarta.strategicRationale||a(`Carta projetada para máxima rentabilidade (+700%) e experiência memorável à mesa.`,`Menu engineered for +700% gross margin and memorable tableside experience.`,`Carta diseñada para +700% de margen y experiencia memorable en mesa.`),items:activeCarta.items,language:i||`pt`,theme:`editorial`,mode:cartaMode,clientLogoDataUrl:gLogo});setDlDone(!0);setTimeout(()=>setDlDone(!1),3500)}catch(err){console.error(`Download Carta PDF error:`,err)}finally{setDlBusy(!1)}};';

  if (!code.includes(targetLfeState)) throw new Error('Could not find targetLfeState');
  code = code.replace(targetLfeState, replaceLfeState);

  const targetLfeButtons =
    '(0,Z.jsx)(`div`,{className:`pt-2`,children:(0,Z.jsxs)(`button`,{type:`submit`,disabled:u,className:`w-full min-h-[50px] bg-[#8B2635] hover:bg-[#721F2B] active:scale-[0.99] disabled:opacity-60 text-white font-bold text-base sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer`,children:[(0,Z.jsx)(`span`,{children:u?a(`Enviando...`,`Sending...`,`Enviando...`):a(`Enviar Solicitação`,`Submit Request`,`Enviar Solicitud`)}),(0,Z.jsx)(k,{className:`w-4 h-4`})]})})';

  const replaceLfeButtons =
    '(0,Z.jsxs)(`div`,{style:{borderRadius:`16px`,border:`1px solid #DDD3C3`,backgroundColor:`#FAF7F2`,overflow:`hidden`,boxShadow:`0 2px 10px rgba(30,27,24,0.06)`},children:[(0,Z.jsxs)(`div`,{style:{backgroundColor:`#FFFFFF`,padding:`10px 14px`,borderTop:`3px solid #8B2635`,borderBottom:`1.5px solid #C68A36`,display:`flex`,alignItems:`center`,justifyContent:`space-between`,gap:`10px`},children:[(0,Z.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`10px`,minWidth:0},children:[(0,Z.jsx)(`img`,{src:`/assets/logo_talcha_preto.png`,alt:`Talchá`,style:{height:`24px`,width:`auto`,objectFit:`contain`,flexShrink:0}}),(0,Z.jsx)(`div`,{style:{height:`22px`,width:`1px`,backgroundColor:`#C68A36`,flexShrink:0}}),(0,Z.jsxs)(`div`,{style:{minWidth:0},children:[(0,Z.jsx)(`span`,{style:{display:`block`,fontSize:`9px`,fontWeight:700,textTransform:`uppercase`,letterSpacing:`0.12em`,color:`#8B2635`},children:a(`Prévia da Carta (PDF)`,`Menu Preview (PDF)`,`Vista Previa (PDF)`)}),(0,Z.jsx)(`p`,{style:{margin:0,fontSize:`12px`,fontWeight:600,color:`#1E1B18`,whiteSpace:`nowrap`,overflow:`hidden`,textOverflow:`ellipsis`},children:(o.company||``).trim()||activeCarta.establishmentName||a(`Estabelecimento Parceiro`,`Partner Venue`,`Establecimiento Asociado`)})]})]}),(0,Z.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`8px`,flexShrink:0},children:[gLogo&&(0,Z.jsxs)(`div`,{style:{position:`relative`,display:`inline-flex`,alignItems:`center`},children:[(0,Z.jsx)(`img`,{src:gLogo,alt:`Logo cliente`,style:{height:`30px`,maxWidth:`76px`,objectFit:`contain`,borderRadius:`8px`,backgroundColor:`#FAF7F2`,padding:`2px 6px`,border:`1px solid #C68A36`}}),(0,Z.jsx)(`button`,{type:`button`,onClick:()=>talchaClearClientLogo(setGLogo),style:{position:`absolute`,top:`-6px`,right:`-6px`,width:`16px`,height:`16px`,borderRadius:`9999px`,backgroundColor:`#8B2635`,color:`#FFFFFF`,border:`1px solid #FFFFFF`,fontSize:`10px`,lineHeight:1,fontWeight:700,display:`flex`,alignItems:`center`,justifyContent:`center`,cursor:`pointer`},title:a(`Remover logo`,`Remove logo`,`Eliminar logo`),children:`×`})]}),(0,Z.jsx)(`input`,{ref:fileInputRef,type:`file`,accept:`image/png,image/jpeg,image/webp,image/svg+xml`,onChange:onLogoFile,style:{display:`none`}}),(0,Z.jsx)(`button`,{type:`button`,id:`btn-modal-upload-logo`,onClick:()=>fileInputRef.current?.click(),style:{padding:`6px 11px`,borderRadius:`8px`,border:`1px solid #C68A36`,backgroundColor:`#FAF7F2`,fontSize:`11px`,fontWeight:600,color:`#8B2635`,cursor:`pointer`},children:gLogo?a(`Trocar Logo`,`Change Logo`,`Cambiar Logo`):a(`+ Sua Logo`,`+ Your Logo`,`+ Tu Logo`)})]})]}),(0,Z.jsxs)(`div`,{style:{padding:`12px`},children:[(0,Z.jsxs)(`div`,{style:{display:`flex`,flexWrap:`wrap`,alignItems:`center`,justifyContent:`space-between`,gap:`8px`,marginBottom:`8px`},children:[(0,Z.jsxs)(`span`,{style:{fontSize:`11px`,fontWeight:600,color:`#5C564D`},children:[activeCarta.items.length,` `,a(`blends selecionados na carta`,`blends in tea menu`,`blends en la carta`)]}),(0,Z.jsxs)(`div`,{style:{display:`inline-flex`,borderRadius:`8px`,backgroundColor:`#EBE3D5`,padding:`2px`,fontSize:`10px`,fontWeight:600},children:[(0,Z.jsx)(`button`,{type:`button`,onClick:()=>setCartaMode(`customer`),style:{padding:`4px 9px`,borderRadius:`6px`,border:`none`,cursor:`pointer`,backgroundColor:cartaMode===`customer`?`#8B2635`:`transparent`,color:cartaMode===`customer`?`#FFFFFF`:`#5C564D`},children:a(`Cardápio Salão`,`Guest Menu`,`Carta Sala`)}),(0,Z.jsx)(`button`,{type:`button`,onClick:()=>setCartaMode(`executive`),style:{padding:`4px 9px`,borderRadius:`6px`,border:`none`,cursor:`pointer`,backgroundColor:cartaMode===`executive`?`#8B2635`:`transparent`,color:cartaMode===`executive`?`#FFFFFF`:`#5C564D`},children:a(`Dossiê B2B`,`B2B Dossier`,`Dossier B2B`)})]})]}),(0,Z.jsx)(`div`,{style:{display:`flex`,flexWrap:`wrap`,gap:`6px`},children:activeCarta.items.slice(0,6).map(it=>(0,Z.jsxs)(`span`,{style:{display:`inline-flex`,alignItems:`center`,gap:`6px`,padding:`3px 8px`,borderRadius:`6px`,backgroundColor:`#FFFFFF`,border:`1px solid #E5DACB`,fontSize:`10px`,fontWeight:600,color:`#1E1B18`},children:[(0,Z.jsx)(`span`,{style:{width:`6px`,height:`6px`,borderRadius:`9999px`,backgroundColor:`#8B2635`,display:`inline-block`}}),it.blend.name]},it.blend.id))})]})]}),(0,Z.jsxs)(`div`,{className:`pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5`,children:[(0,Z.jsxs)(`button`,{type:`button`,onClick:onDownloadCartaPdf,disabled:dlBusy,id:`btn-download-carta-pdf`,style:{width:`100%`,minHeight:`50px`,backgroundColor:`#FAF7F2`,border:`1.5px solid #8B2635`,color:`#8B2635`,fontWeight:700,fontSize:`14px`,borderRadius:`16px`,boxShadow:`0 2px 8px rgba(139,38,53,0.10)`,display:`flex`,alignItems:`center`,justifyContent:`center`,gap:`8px`,cursor:`pointer`},children:[(0,Z.jsx)(`svg`,{viewBox:`0 0 24 24`,fill:`none`,stroke:`#8B2635`,strokeWidth:`2`,style:{width:`16px`,height:`16px`},children:[(0,Z.jsx)(`path`,{d:`M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4`}),(0,Z.jsx)(`polyline`,{points:`7 10 12 15 17 10`}),(0,Z.jsx)(`line`,{x1:`12`,y1:`15`,x2:`12`,y2:`3`})]}),(0,Z.jsx)(`span`,{children:dlBusy?a(`Gerando PDF...`,`Generating PDF...`,`Generando PDF...`):dlDone?a(`Carta Baixada!`,`Downloaded!`,`Descargada!`):a(`Download Carta`,`Download Carta`,`Download Carta`)})]}),(0,Z.jsxs)(`button`,{type:`submit`,disabled:u,className:`w-full min-h-[50px] bg-[#8B2635] hover:bg-[#721F2B] active:scale-[0.99] disabled:opacity-60 text-white font-bold text-base sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer`,children:[(0,Z.jsx)(`span`,{children:u?a(`Enviando...`,`Sending...`,`Enviando...`):a(`Enviar Solicitação`,`Submit Request`,`Enviar Solicitud`)}),(0,Z.jsx)(k,{className:`w-4 h-4`})]})]})';

  if (!code.includes(targetLfeButtons)) throw new Error('Could not find targetLfeButtons');
  code = code.replace(targetLfeButtons, replaceLfeButtons);
  console.log('✓ Upgraded Contact Modal (Lfe) with cohesive Ivory/Burgundy/Gold Preview Banner, Logo Sync & Download Carta');

  // ---------------------------------------------------------------------------
  // 10. Normalize visible brand spelling to official accented "Talchápidia"
  // ---------------------------------------------------------------------------
  code = code.replace(/Talchapidia/g, 'Talchápidia');
  console.log('✓ Normalized visible brand spelling to Talchápidia');

  // ---------------------------------------------------------------------------
  // 11. Validate final bundle JS with esbuild before writing
  // ---------------------------------------------------------------------------
  esbuild.transformSync(code, { loader: 'js' });
  console.log('✓ ESBuild syntax verification: PASSED');

  fs.writeFileSync(OUTPUT_BUNDLE, code, 'utf8');
  console.log(`✓ Wrote ${OUTPUT_BUNDLE} (${code.length} bytes)`);
}

main().catch((err) => {
  console.error('Build patched bundle failed:', err);
  process.exit(1);
});
