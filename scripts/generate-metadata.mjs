import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const content = JSON.parse(await readFile(new URL('data/site-content.json', root), 'utf8'));
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const { title, description } = content.translations.uk.meta;
const url = new URL(content.site.url).href;
const image = new URL(content.assets.socialPreview, url).href;
const tags = [
  `  <title>${escape(title)}</title>`,
  ...[
    ['name', 'description', description], ['name', 'author', content.site.copyrightName],
    ['property', 'og:title', title], ['property', 'og:description', description],
    ['property', 'og:type', 'website'], ['property', 'og:url', url],
    ['property', 'og:image', image], ['property', 'og:image:alt', 'Denys Fedorov — HPB Surgeon · Liver Transplant Surgeon'],
    ['property', 'og:image:width', '1200'], ['property', 'og:image:height', '630'],
    ['property', 'og:image:type', 'image/png'], ['property', 'og:locale', 'uk_UA'],
    ['name', 'twitter:card', 'summary_large_image'], ['name', 'twitter:title', title],
    ['name', 'twitter:description', description], ['name', 'twitter:image', image],
    ['name', 'twitter:image:alt', 'Denys Fedorov — HPB Surgeon · Liver Transplant Surgeon'],
  ].map(([attribute, name, value]) => `  <meta ${attribute}="${name}" content="${escape(value)}" />`),
  `  <link rel="canonical" href="${escape(url)}" />`,
].join('\n');
const path = new URL('index.html', root);
const html = await readFile(path, 'utf8');
const pattern = /  <!-- Generated metadata: start -->[\s\S]*?  <!-- Generated metadata: end -->/;
if (!pattern.test(html)) throw new Error('Metadata markers missing');
const result = html.replace(pattern, `  <!-- Generated metadata: start -->\n${tags}\n  <!-- Generated metadata: end -->`);
if (process.argv.includes('--check')) {
  if (result !== html) throw new Error('Run node scripts/generate-metadata.mjs before publishing');
} else await writeFile(path, result);
