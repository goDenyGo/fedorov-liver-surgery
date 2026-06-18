# fedorov.liver.surgery — static GitHub Pages site

Готовий статичний сайт-візитка для розгортання на GitHub Pages.

## Структура

```text
fedorov-liver-surgery-site/
├── README.md
└── docs/
    ├── index.html          # головна сторінка сайту
    ├── CNAME               # custom domain для GitHub Pages
    ├── css/
    │   └── style.css       # стилі
    ├── js/
    │   └── main.js         # мінімальний JavaScript
    ├── img/
    │   ├── favicon.svg
    │   ├── profile-placeholder.svg
    │   └── og-image.png
    ├── pdf/                # сюди можна додати CV/PDF
    └── vcard/
        └── denys-fedorov.vcf
```

GitHub Pages треба налаштувати на публікацію з папки `docs`.

## Як редагувати

1. Основний текст, кнопки та посилання: `docs/index.html`.
2. Дизайн, кольори, відступи: `docs/css/style.css`.
3. Скрипти: `docs/js/main.js`.
4. Фото: покладіть своє фото в `docs/img/`, наприклад `photo.jpg`, і в `index.html` замініть:

```html
<img src="img/profile-placeholder.svg" ...>
```

на:

```html
<img src="img/photo.jpg" ...>
```

5. Контакт для збереження в телефон: `docs/vcard/denys-fedorov.vcf`.
6. Домен: `docs/CNAME`.

## Розгортання на GitHub Pages

1. Створіть новий публічний репозиторій на GitHub, наприклад `fedorov-liver-surgery`.
2. Завантажте всі файли цього проєкту в репозиторій.
3. Відкрийте `Settings → Pages`.
4. У `Build and deployment` виберіть:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/docs`
5. У полі `Custom domain` має бути `fedorov.liver.surgery`.
6. У DNS для домену `liver.surgery` додайте запис:

```text
Type: CNAME
Name/Host: fedorov
Value: YOUR-GITHUB-USERNAME.github.io
```

7. Після активації домену увімкніть `Enforce HTTPS`.

## Локальний перегляд

У папці проєкту виконайте:

```bash
python3 -m http.server 8000 --directory docs
```

Потім відкрийте:

```text
http://localhost:8000
```
