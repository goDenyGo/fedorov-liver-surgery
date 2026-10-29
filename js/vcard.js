const escapeText = (value) => String(value ?? '').replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll(';', '\\;').replaceAll(',', '\\,');
const local = (value, language) => value && typeof value === 'object' ? value[language] : value;
function fold(line) {
  const parts = [];
  let part = '';
  for (const char of line) {
    if (new TextEncoder().encode(part + char).length > 75) {
      // Keep whitespace on the next physical line, after its folding marker.
      const trailing = part.match(/ +$/)?.[0] ?? '';
      parts.push(part.slice(0, part.length - trailing.length));
      part = ' ' + trailing;
    }
    part += char;
  }
  return [...parts, part].join('\r\n');
}

export function createVcard(content, language) {
  const hero = content.translations[language].hero;
  const profile = content.profile;
  const card = content.vcard;
  const name = hero.name.trim().split(/\s+/);
  const organization = hero.institution.replace(/, (Київ, Україна|Kyiv, Ukraine)$/, '');
  const lines = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `N:${escapeText(name.slice(1).join(' '))};${escapeText(name[0])};;;`,
    `FN:${escapeText(hero.name)}`,
    `TITLE:${escapeText(profile.position[language] || hero.subtitle)}`,
    `ORG:${escapeText(organization)};${escapeText(profile.department[language])}`,
    `URL:${content.site.url}`,
    `EMAIL;TYPE=INTERNET,WORK:${escapeText(content.contacts.email)}`,
    `TEL;TYPE=WORK,VOICE:${content.contacts.phone.replace(/\s/g, '')}`,
    'ADR;TYPE=WORK:;;' + ['street', 'city', 'region', 'postalCode', 'country'].map((key) => escapeText(local(card[key], language))).join(';'),
  ];
  const telegram = content.contacts.telegramUrl;
  if (telegram) lines.push(`URL:${telegram}`);
  const note = [profile.academicDegree[language], local(card.note, language)].filter(Boolean).join(' · ');
  if (note) lines.push(`NOTE:${escapeText(note)}`);
  lines.push('END:VCARD');
  return lines.map(fold).join('\r\n') + '\r\n';
}
