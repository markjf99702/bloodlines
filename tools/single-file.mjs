// Bundles the app into one self-contained HTML file (fonts inlined, no service worker),
// for sharing as a single page:  node tools/single-file.mjs [out.html]
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || join(root, 'dist/bloodlines.html');
const read = f => readFile(join(root, f), 'utf8');

const font = (await readFile(join(root, 'fonts/source-serif-4.woff2'))).toString('base64');
const css = (await read('css/app.css'))
  .replace("url('../fonts/source-serif-4.woff2')", `url(data:font/woff2;base64,${font})`)
  // Fill the frame it's shown in, rather than the whole window.
  .concat('\nhtml, body { height: 100%; }\n.app { height: 100%; }\n');

// ES modules become one script: drop the imports and the export keywords.
const js = (await Promise.all(['js/horses.js', 'js/tree.js', 'js/app.js'].map(read)))
  .map(src => src.replace(/^import .*$/gm, '').replace(/^export /gm, ''))
  .join('\n')
  .replace(/if \('serviceWorker' in navigator[\s\S]*?\n}\n/, '');

const html = await read('index.html');
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('<script type="module"')).trim();
await writeFile(out, `<title>Bloodlines</title>
<meta name="description" content="The racehorse family tree, from three stallions to Secretariat, Frankel and Winx.">
<style>
${css}</style>
${body}
<script type="module">
${js}
</script>
`);
console.log('wrote', out);
