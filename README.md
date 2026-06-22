# fedorov.liver.surgery

Static bilingual personal website for GitHub Pages.

## Structure

```text
fedorov-liver-surgery/
├── README.md
├── index.html
├── CNAME
├── css/
│   └── style.css
├── js/
│   └── main.js
├── data/
│   └── translations.json
├── img/
│   ├── favicon.svg
│   ├── profile-placeholder.svg
│   └── og-image.png
├── pdf/
└── vcard/
    └── denys-fedorov.vcf
```

## How bilingual mode works

The website uses one `index.html` and one translation file:

```text
data/translations.json
```

The language switcher is controlled by JavaScript in:

```text
js/main.js
```

Text blocks in `index.html` are marked like this:

```html
<h2 data-i18n="about.title">Про мене</h2>
```

The key `about.title` is taken from `data/translations.json`.

## How to edit text

Most visible text should be edited in:

```text
data/translations.json
```

There are two sections:

```json
"uk": { ... }
"en": { ... }
```

Edit both language versions and push changes to GitHub.

## Local preview

Do not open `index.html` directly as a file, because translation loading uses `fetch()`.

Run a local server from the project folder:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Publishing to GitHub Pages

If GitHub Pages is configured to publish from `main` and `/root`, push changes:

```bash
git add .
git commit -m "Update bilingual website"
git push
```

If your Pages settings use `/docs`, move the site files into a `docs/` folder or change GitHub Pages settings to `/root`.

## Custom domain

The `CNAME` file contains:

```text
fedorov.liver.surgery
```
