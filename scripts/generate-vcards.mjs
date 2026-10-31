import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createVcard } from '../js/vcard.js';
const root = new URL('../', import.meta.url);
const content = JSON.parse(await readFile(new URL('data/site-content.json', root), 'utf8'));
const target = process.argv.includes('--dist') ? new URL('dist/', root) : root;
await mkdir(new URL('vcard/', target), { recursive: true });
for (const language of ['uk', 'en']) {
  const output = createVcard(content, language);
  await writeFile(new URL(content.vcard.path[language], target), output);
  if (language === 'en') await writeFile(new URL('vcard/denys-fedorov.vcf', target), output);
}
