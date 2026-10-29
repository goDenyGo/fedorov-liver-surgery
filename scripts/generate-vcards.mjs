import { readFile, writeFile } from 'node:fs/promises';
import { createVcard } from '../js/vcard.js';
const root = new URL('../', import.meta.url);
const content = JSON.parse(await readFile(new URL('data/site-content.json', root), 'utf8'));
for (const language of ['uk', 'en']) {
  const output = createVcard(content, language);
  await writeFile(new URL(content.vcard.path[language], root), output);
  if (language === 'en') await writeFile(new URL('vcard/denys-fedorov.vcf', root), output);
}
