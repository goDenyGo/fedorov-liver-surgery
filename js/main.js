// Mobile navigation, footer year and simple UA/EN localization.

const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('#nav-menu');
const year = document.querySelector('#year');
const languageButtons = document.querySelectorAll('[data-lang-switch]');

const defaultLanguage = 'uk';
const supportedLanguages = ['uk', 'en'];

let translationsCache = null;

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

async function loadTranslations() {
  if (translationsCache) {
    return translationsCache;
  }

  const response = await fetch('data/translations.json');
  if (!response.ok) {
    throw new Error('Cannot load data/translations.json');
  }

  translationsCache = await response.json();
  return translationsCache;
}

function getInitialLanguage() {
  const savedLanguage = localStorage.getItem('siteLanguage');
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
  updateMeta(translations);

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n');
    const value = getNestedValue(translations, key);

    if (typeof value === 'string') {
      element.textContent = value;
    }
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

  localStorage.setItem('siteLanguage', language);
  updateActiveLanguageButton(language);
}

async function setLanguage(language) {
  const safeLanguage = supportedLanguages.includes(language) ? language : defaultLanguage;

  try {
    const allTranslations = await loadTranslations();
    applyTranslations(safeLanguage, allTranslations);
  } catch (error) {
    console.error('Localization error:', error);
  }
}

languageButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setLanguage(button.dataset.langSwitch);
  });
});

setLanguage(getInitialLanguage());
