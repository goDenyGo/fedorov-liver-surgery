import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createVcard } from '../js/vcard.js';
const content = JSON.parse(await readFile(new URL('../data/site-content.json', import.meta.url)));
test('localized vCards keep UTF-8 folding and match current questionnaire',()=>{
 for(const language of ['uk','en']) {
  const card=createVcard(content,language);
  assert.ok(card.endsWith('END:VCARD\r\n'));
  for(const line of card.split('\r\n')) assert.ok(Buffer.byteLength(line)<=75);
  const unfolded=card.replaceAll('\r\n ','');
  assert.ok(unfolded.includes('FN:'+content.translations[language].hero.name));
  assert.ok(unfolded.includes(content.contacts.email));
 }
});
