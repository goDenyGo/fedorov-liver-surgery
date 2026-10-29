import { createVcard } from './vcard.js';
// Mobile navigation, footer year and simple UA/EN localization.

const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('#nav-menu');
const year = document.querySelector('#year');
const languageButtons = document.querySelectorAll('[data-lang-switch]');

const defaultLanguage = 'uk';
const supportedLanguages = ['uk', 'en'];

let contentPromise = null;
let currentContent = null;
let languageRequest = 0;
const cardUrls = {};

if (year) {
  year.textContent = new Date().getFullYear();
}

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function getNestedValue(object, path) {
  return path.split('.').reduce((current, key) => {
    if (current && Object.prototype.hasOwnProperty.call(current, key)) {
      return current[key];
    }
    return undefined;
  }, object);
}

async function loadContent() {
  if (!contentPromise) {
    contentPromise = fetch('data/site-content.json', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Cannot load site content');
        const content = await response.json();
        if (!content.translations?.uk || !content.translations?.en) throw new Error('Invalid site content');
        return content;
      }).catch((error) => { contentPromise = null; throw error; });
  }
  return contentPromise;
}

function bindContent(content) {
  document.querySelectorAll('[data-content]').forEach((element) => {
    const value = getNestedValue(content, element.dataset.content);
    element.textContent = typeof value === 'string' ? value : '';
    element.hidden = !value;
  });
  document.querySelectorAll('[data-content-attr]').forEach((element) => {
    const [attribute, path] = element.dataset.contentAttr.split(':');
    const value = getNestedValue(content, path);
    if (typeof value === 'string' && value) {
      const prefix = element.dataset.prefix || '';
      const url = new URL(prefix + value, location.href);
      if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) throw new Error('Invalid content URL');
      element.setAttribute(attribute, prefix + value);
      element.hidden = false;
    } else {
      element.removeAttribute(attribute);
      element.hidden = true;
    }
  });
  document.querySelector('meta[property="og:url"]').content = content.site.url;
  document.querySelector('meta[property="og:image"]').content = new URL(content.assets.socialPreview, content.site.url + '/').href;
  document.querySelector('meta[name="author"]').content = content.site.copyrightName;
}

function getInitialLanguage() {
  let savedLanguage;
  try { savedLanguage = localStorage.getItem('siteLanguage'); } catch {}
  if (supportedLanguages.includes(savedLanguage)) {
    return savedLanguage;
  }

  const browserLanguage = (navigator.language || '').toLowerCase();
  if (browserLanguage.startsWith('uk')) {
    return 'uk';
  }

  return defaultLanguage;
}

function updateActiveLanguageButton(language) {
  languageButtons.forEach((button) => {
    const isActive = button.dataset.langSwitch === language;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function updateMeta(translations) {
  const title = getNestedValue(translations, 'meta.title');
  const description = getNestedValue(translations, 'meta.description');

  if (title) {
    document.title = title;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
  }

  if (description) {
    const metaDescription = document.querySelector('meta[name="description"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (metaDescription) metaDescription.setAttribute('content', description);
    if (ogDescription) ogDescription.setAttribute('content', description);
  }
}

function applyTranslations(language, allTranslations) {
  const translations = allTranslations[language] || allTranslations[defaultLanguage];

  document.documentElement.lang = language;
  updateVcardLinks(language);
  updateMeta(translations);

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n');
    const value = getNestedValue(translations, key);

    const omitted = currentContent.editorial?.fieldStatus?.[`/translations/${language}/${key.replaceAll('.', '/')}`] === 'omit';
    element.hidden = omitted || typeof value !== 'string' || !value;
    element.textContent = element.hidden ? '' : value;
  });

  document.querySelectorAll('[data-i18n-attr]').forEach((element) => {
    const rules = element.getAttribute('data-i18n-attr').split(',');

    rules.forEach((rule) => {
      const [attribute, key] = rule.split(':').map((part) => part.trim());
      const value = getNestedValue(translations, key);

      if (attribute && typeof value === 'string') {
        element.setAttribute(attribute, value);
      }
    });
  });

  try { localStorage.setItem('siteLanguage', language); } catch {}
  updateActiveLanguageButton(language);
}

function updateVcardLinks(language) {
  document.querySelectorAll('[data-vcard]').forEach((link) => {
    link.href = cardUrls[language];
    link.download = currentContent.vcard.path[language].split('/').pop();
    link.hreflang = language;
  });
}

async function setLanguage(language) {
  const request = ++languageRequest;
  const safeLanguage = supportedLanguages.includes(language) ? language : defaultLanguage;
  const errorMessage = document.querySelector('#content-error');
  try {
    const content = await loadContent();
    if (request !== languageRequest) return;
    if (currentContent !== content) {
      for (const lang of supportedLanguages) {
        if (cardUrls[lang]) URL.revokeObjectURL(cardUrls[lang]);
        cardUrls[lang] = URL.createObjectURL(new Blob([createVcard(content, lang)], { type: 'text/vcard;charset=utf-8' }));
      }
      currentContent = content;
      bindContent(content);
    }
    applyTranslations(safeLanguage, content.translations);
    errorMessage.hidden = true;
  } catch (error) {
    errorMessage.hidden = false;
    console.error('Content error:', error);
  }
}

languageButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setLanguage(button.dataset.langSwitch);
  });
});

setLanguage(getInitialLanguage());
