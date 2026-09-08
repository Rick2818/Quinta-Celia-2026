import fs from 'fs';
import path from 'path';

function buildSingleHtml() {
  const distDir = path.resolve('dist');
  const indexHtmlPath = path.join(distDir, 'index.html');

  if (!fs.existsSync(indexHtmlPath)) {
    console.error('dist/index.html does not exist. Run npm run build first.');
    process.exit(1);
  }

  let htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

  // Change title and meta tags
  htmlContent = htmlContent.replace(
    /<title>.*?<\/title>/i,
    () => '<title>Terrenos Ricardo - Simulador de Hipotecas Quinta Celia</title>'
  );
  htmlContent = htmlContent.replace(
    /<meta property="og:title" content=".*?" \/>/i,
    () => '<meta property="og:title" content="Terrenos Ricardo - Simulador de Hipotecas Quinta Celia" />'
  );

  // Find JS and CSS bundles in dist/assets
  const assetsDir = path.join(distDir, 'assets');
  const assetFiles = fs.readdirSync(assetsDir);
  const jsFile = assetFiles.find(f => f.endsWith('.js') && f.startsWith('index-'));
  const cssFile = assetFiles.find(f => f.endsWith('.css') && f.startsWith('index-'));

  if (!jsFile || !cssFile) {
    console.error('Could not find JS or CSS asset in dist/assets');
    process.exit(1);
  }

  const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf-8');
  const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf-8');

  // Replace CSS link with inline <style> using function replacer to prevent $& substitution
  htmlContent = htmlContent.replace(
    new RegExp(`<link rel="stylesheet"[^>]*?href="[^"]*?${cssFile}"[^>]*?>`, 'i'),
    () => `<style type="text/css">\n${cssContent}\n</style>`
  );

  // Escape script tags safely so HTML parser does not close or break <script>
  // \x3c evaluates to '<' in JavaScript strings at runtime without confusing HTML parser
  const safeJsContent = jsContent
    .replace(/<\/script/gi, '\\x3c/script')
    .replace(/<script/gi, '\\x3cscript');

  // Remove JS script tag from <head>
  htmlContent = htmlContent.replace(
    new RegExp(`<script type="module"[^>]*?src="[^"]*?${jsFile}"[^>]*?><\\/script>`, 'i'),
    ''
  );

  // Clean any remaining modulepreload links that cause issues in file://
  htmlContent = htmlContent.replace(/<link rel="modulepreload"[^>]*?>/gi, '');

  // Inject the script before </body> so DOM elements (like <div id="root"></div>) are fully available
  htmlContent = htmlContent.replace(
    '</body>',
    () => `  <script type="text/javascript">\n${safeJsContent}\n  </script>\n</body>`
  );

  // Write Terrenos Ricardo.html in root, dist, and public
  const targetRoot = path.resolve('Terrenos Ricardo.html');
  const targetDist = path.join(distDir, 'Terrenos Ricardo.html');
  const targetDistIndex = path.join(distDir, 'index.html');
  const targetRoot120 = path.resolve('Terrenos-Ricardo-120-Meses.html');
  const targetDist120 = path.join(distDir, 'Terrenos-Ricardo-120-Meses.html');

  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const targetPublic = path.join(publicDir, 'Terrenos Ricardo.html');
  const targetPublic120 = path.join(publicDir, 'Terrenos-Ricardo-120-Meses.html');

  fs.writeFileSync(targetRoot, htmlContent, 'utf-8');
  fs.writeFileSync(targetDist, htmlContent, 'utf-8');
  fs.writeFileSync(targetDistIndex, htmlContent, 'utf-8');
  fs.writeFileSync(targetPublic, htmlContent, 'utf-8');
  fs.writeFileSync(targetRoot120, htmlContent, 'utf-8');
  fs.writeFileSync(targetDist120, htmlContent, 'utf-8');
  fs.writeFileSync(targetPublic120, htmlContent, 'utf-8');

  console.log('✓ Successfully created pure self-contained "Terrenos Ricardo.html" and "Terrenos-Ricardo-120-Meses.html"');
}

buildSingleHtml();


