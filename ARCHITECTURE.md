# Архітектура візитки

## Генерація під час публікації

data/site-content.json + templates/page.html → scripts/build.py → dist/ → GitHub Pages.

Python HTMLParser розбирає контрольований HTML-шаблон; генератор заповнює
data-i18n/data-content та атрибутні прив’язки з анкети й видаляє їх із результату.
Рядки екрануються як текст/HTML-атрибути, URL перевіряються (http/https/mailto),
порожні й omit поля приховуються без публікації їхнього тексту. Відсутні ключі,
невірні метадані або URL зупиняють build. Шаблон не виконує код із JSON.

Генеруються dist/uk/index.html і dist/en/index.html, коренева українська копія,
локалізовані title/description/OG/Twitter, canonical, взаємні hreflang і sitemap.
Canonical кореня веде на /uk/; старі #about/#contact збережені. Перемикач мов —
звичайні посилання, які працюють без JS. Вибір зберігається в URL, а не localStorage;
автоматичного перенаправлення за мовою браузера немає.

Ресурси мають шляхи від кореня домену. Розміщення під шляхом іншого репозиторію
на зразок username.github.io/repository/ не підтримується без зміни генератора;
ціль — чинний custom domain fedorov.liver.surgery.

scripts/generate-vcards.mjs --dist використовує js/vcard.js для генерації UA/EN
vCard та legacy EN-копії в dist/vcard. Кнопки завантажують готові файли;
браузер не читає JSON і не створює blob. CLI без --dist залишено для ручного
оновлення старих копій у вихідному репозиторії; Pages їх не використовує.

## Межа публікації

build.py створює dist/ заново. Копіюються лише дозволені типи ресурсів із
css/, img/, pdf/, js/main.js, CNAME та згенеровані файли. Не копіюються анкета,
editorial, документація, тести, шаблони та серверний код. Це не робить приватними
дані, опубліковані в GitHub-репозиторії або vCard.

js/main.js лише додає клас js та керує мобільним меню. Без нього меню розгорнуте,
контент, мовні переходи й контакти працюють. Copyright year задається під час build.
Необов’язковий HTML/JS від редактора не виконується.

## CI/CD

.github/workflows/pages.yml: push main / pull_request / ручний запуск → тести →
build → upload dist artifact → deploy (лише main, не PR). Build має contents:read;
deploy — pages:write та id-token:write, environment github-pages. Джерело Pages
має бути GitHub Actions (build_type=workflow). Генерація не створює комітів.
При помилці тестів/build deployment не стартує, чинний сайт залишається.
Публікується один артефакт із узгодженими HTML, стилями, картками та зображеннями.

Портал консультацій — окремий приватний проєкт; ця генерація його не охоплює.
Перевірки й локальний запуск описані в README; експлуатація — docs/PUBLISHING.md.
