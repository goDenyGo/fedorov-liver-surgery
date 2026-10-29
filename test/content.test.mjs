import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createVcard } from '../js/vcard.js';
const content = JSON.parse(await readFile(new URL('../data/site-content.json', import.meta.url)));
const source = (await readFile(new URL('../js/main.js', import.meta.url), 'utf8')).replace(/^import .*\n/, '');
function fixture(data, fail = false) {
  const element = (dataset = {}) => ({ dataset, attributes: {}, textContent: '', hidden: false,
    setAttribute(k,v) { this.attributes[k]=v; }, removeAttribute(k) { delete this.attributes[k]; } });
  const name=element(); name.getAttribute=()=> 'hero.name';
  const email=element({content:'contacts.email'});
  const link=element({contentAttr:'href:links.scopus'});
  const image=element({contentAttr:'src:assets.portrait'});
  const card=element(); const error=element();
  const metas = new Map();
  const doc = { documentElement:{lang:'uk'}, title:'', querySelector(selector) {
    if (selector==='#content-error') return error;
    if (selector.startsWith('meta')) { if (!metas.has(selector)) metas.set(selector,element()); return metas.get(selector); }
    return null;
  }, querySelectorAll(selector) { return ({'[data-i18n]':[name],'[data-content]':[email],'[data-content-attr]':[link,image],'[data-vcard]':[card]})[selector] || []; } };
  const blobs=[];
  const ctx=vm.createContext({ document:doc,createVcard,Blob,TextEncoder,URL:class extends URL {
    static createObjectURL(blob) { blobs.push(blob); return 'blob:test/'+blobs.length; }
    static revokeObjectURL() {}
  },location:{href:'http://localhost:8000/'},localStorage:{getItem:()=> 'uk',setItem(){}},navigator:{language:'uk'},console:{error(){}},fetch:async()=>{if(fail)throw Error('offline');return {ok:true,json:async()=>data};} });
  vm.runInContext(source,ctx);
  return {ctx,doc,name,email,link,image,card,error,blobs};
}
test('JSON edits reach text, links, image, metadata and generated vCards', async()=>{
  const data=structuredClone(content);
  data.translations.en.hero.name='New Name';data.translations.en.meta.title='Changed title';
  data.contacts.email='new@example.test';data.links.scopus='https://example.test/profile';data.assets.portrait='img/new.jpg';
  const f=fixture(data);await vm.runInContext("setLanguage('en')",f.ctx);
  assert.equal(f.name.textContent,'New Name');assert.equal(f.doc.title,'Changed title');
  assert.equal(f.email.textContent,'new@example.test');assert.equal(f.link.attributes.href,data.links.scopus);
  assert.equal(f.image.attributes.src,'img/new.jpg');assert.equal(f.card.download,data.vcard.path.en.split('/').pop());
  assert.match(await f.blobs[1].text(),/FN:New Name/);assert.match(await f.blobs[1].text(),/new@example.test/);
  await vm.runInContext("setLanguage('uk')",f.ctx);assert.equal(f.name.textContent,data.translations.uk.hero.name);
});
test('empty and omitted text, null URLs and load errors have explicit states',async()=>{
 const data=structuredClone(content);data.links.scopus=null;data.editorial.fieldStatus['/translations/uk/hero/name']='omit';
 const f=fixture(data);await vm.runInContext("setLanguage('uk')",f.ctx);
 assert.equal(f.name.hidden,true);assert.equal(f.link.hidden,true);
 const bad=fixture(content,true);await vm.runInContext("setLanguage('uk')",bad.ctx);assert.equal(bad.error.hidden,false);
});
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
