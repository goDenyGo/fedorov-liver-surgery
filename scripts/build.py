"""Generate an allowlisted GitHub Pages artifact; no third-party dependencies."""
import json
import shutil
import subprocess
from datetime import datetime
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).resolve().parent.parent
VOID = set('area base br col embed hr img input link meta param source track wbr'.split())

class Element:
    def __init__(self, tag, attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

class Parser(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.root = Element('root')
        self.stack = [self.root]
        self.feed(text)
        if len(self.stack) != 1:
            raise ValueError('Unclosed template tags')
    def handle_starttag(self, tag, attrs):
        node = Element(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)
    handle_startendtag = handle_starttag
    def handle_endtag(self, tag):
        if self.stack[-1].tag != tag:
            raise ValueError(f'Unbalanced template tag: {tag}')
        self.stack.pop()
    def handle_data(self, text):
        self.stack[-1].children.append(text)
    def handle_comment(self, text):
        pass


def serialize(node):
    if isinstance(node, str):
        return escape(node, quote=False)
    children = ''.join(map(serialize, node.children))
    if node.tag == 'root':
        return '<!DOCTYPE html>\n' + children
    attrs = ''.join(' ' + key + ('' if value is None else '="' + escape(str(value), quote=True) + '"') for key, value in node.attrs.items())
    return '<' + node.tag + attrs + '>' + ('' if node.tag in VOID else children + '</' + node.tag + '>')


def nested(data, path):
    for key in path.split('.'):
        data = data[key]
    return data


def value(content, path):
    status = content.get('editorial', {}).get('fieldStatus', {}).get('/' + path.replace('.', '/'))
    return None if status == 'omit' else nested(content, path)


def safe_url(raw, base):
    if not isinstance(raw, str) or not raw or any(ord(c) < 32 for c in raw):
        raise ValueError('Missing or invalid URL')
    url = urljoin(base, raw)
    if urlparse(url).scheme not in ('https', 'http', 'mailto'):
        raise ValueError('Unsupported URL protocol')
    return raw if raw.startswith(('/', '#')) or urlparse(raw).scheme else '/' + raw


def render(content, template, language):
    base = content['site']['url'].rstrip('/') + '/'
    if urlparse(base).scheme != 'https' or not urlparse(base).netloc:
        raise ValueError('site.url must be an absolute HTTPS URL')
    tree = Parser(template).root
    title = value(content, f'translations.{language}.meta.title')
    description = value(content, f'translations.{language}.meta.description')
    if not title or not description:
        raise ValueError('Both languages require a title and description')
    canonical = urljoin(base, language + '/')
    image = urljoin(base, safe_url(content['assets']['socialPreview'], base))
    metadata = [Element('title')]
    metadata[0].children = [title]
    for attr, name, text in [
        ('name', 'description', description), ('name', 'author', content['site']['copyrightName']),
        ('property', 'og:title', title), ('property', 'og:description', description),
        ('property', 'og:type', 'website'), ('property', 'og:url', canonical),
        ('property', 'og:image', image), ('property', 'og:image:alt', 'Denys Fedorov — HPB Surgeon · Liver Transplant Surgeon'),
        ('property', 'og:image:width', '1200'), ('property', 'og:image:height', '630'),
        ('property', 'og:image:type', 'image/png'), ('property', 'og:locale', 'uk_UA' if language == 'uk' else 'en_US'),
        ('name', 'twitter:card', 'summary_large_image'), ('name', 'twitter:title', title),
        ('name', 'twitter:description', description), ('name', 'twitter:image', image),
        ('name', 'twitter:image:alt', 'Denys Fedorov — HPB Surgeon · Liver Transplant Surgeon')]:
        metadata.append(Element('meta', [(attr, name), ('content', text)]))
    metadata.append(Element('link', [('rel', 'canonical'), ('href', canonical)]))
    for lang in ('uk', 'en', 'x-default'):
        metadata.append(Element('link', [('rel', 'alternate'), ('hreflang', lang), ('href', urljoin(base, ('uk' if lang == 'x-default' else lang) + '/'))]))

    def bind(node):
        if isinstance(node, str):
            return
        a = node.attrs
        if node.tag == 'html':
            a['lang'] = language
        if node.tag == 'head':
            node.children.extend(metadata)
        path = a.get('data-i18n')
        if path:
            text = value(content, f'translations.{language}.{path}')
            node.children = [str(text)] if text else []
            if not text:
                a['hidden'] = None
        path = a.get('data-content')
        if path:
            text = value(content, path)
            node.children = [str(text)] if text else []
            if not text:
                a['hidden'] = None
        for key, translated in [('data-content-attr', False), ('data-i18n-attr', True)]:
            if key in a:
                for rule in a[key].split(','):
                    attribute, path = rule.strip().split(':', 1)
                    text = value(content, f'translations.{language}.{path}' if translated else path)
                    if text:
                        a[attribute] = safe_url(a.get('data-prefix', '') + text, base) if attribute in ('href', 'src') else text
                    else:
                        a.pop(attribute, None)
                        if attribute in ('href', 'src'):
                            a['hidden'] = None
        if 'data-vcard' in a:
            path = content['vcard']['path'][language]
            a.update(href='/' + path.lstrip('/'), download=Path(path).name, hreflang=language)
        if 'data-lang-switch' in a:
            if a['data-lang-switch'] == language:
                a['class'] += ' active'
                a['aria-current'] = 'page'
        if a.get('id') == 'year':
            node.children = [str(datetime.now().year)]
        # Local resources must resolve identically from /, /uk/ and /en/.
        for attribute in ('href', 'src'):
            raw = a.get(attribute, '')
            if raw and not raw.startswith(('/', '#')) and not urlparse(raw).scheme:
                a[attribute] = '/' + raw
        for key in list(a):
            if key.startswith('data-') and key != 'data-nosnippet':
                del a[key]
        for child in node.children:
            bind(child)
    bind(tree)
    return serialize(tree)


def build():
    content = json.loads((ROOT / 'data/site-content.json').read_text())
    for path in content['vcard']['path'].values():
        if not isinstance(path, str) or not path.startswith('vcard/') or '..' in Path(path).parts or Path(path).suffix != '.vcf':
            raise ValueError('vCard paths must be local vcard/*.vcf files')
    template = (ROOT / 'templates/page.html').read_text()
    output = ROOT / 'dist'
    if output.exists():
        shutil.rmtree(output)
    output.mkdir()
    for folder in ('css', 'img', 'pdf'):
        # Publish assets only, excluding documentation and OS metadata.
        for source in (ROOT / folder).rglob('*'):
            if source.is_file() and source.suffix.lower() in ('.css', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.pdf', '.ico'):
                dest = output / source.relative_to(ROOT)
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, dest)
    (output / 'js').mkdir()
    shutil.copyfile(ROOT / 'js/main.js', output / 'js/main.js')
    for language in ('uk', 'en'):
        path = output / language / 'index.html'
        path.parent.mkdir()
        path.write_text(render(content, template, language))
    # Keep existing root URLs and #section bookmarks working; canonical points to /uk/.
    (output / 'index.html').write_text(render(content, template, 'uk'))
    subprocess.run(['node', str(ROOT / 'scripts/generate-vcards.mjs'), '--dist'], check=True)
    shutil.copyfile(ROOT / 'CNAME', output / 'CNAME')
    (output / '.nojekyll').touch()
    base = content['site']['url'].rstrip('/')
    (output / 'robots.txt').write_text('User-agent: *\nDisallow: /vcard/\nSitemap: ' + base + '/sitemap.xml\n')
    (output / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join('<url><loc>' + escape(base + '/' + lang + '/') + '</loc></url>' for lang in ('uk', 'en')) + '</urlset>\n')
    print('Built dist/: /, /uk/, /en/, metadata, sitemap and vCards')

if __name__ == '__main__':
    build()
