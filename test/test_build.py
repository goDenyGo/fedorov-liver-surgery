import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('build', ROOT / 'scripts/build.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)

class BuildTests(unittest.TestCase):
    def setUp(self):
        self.content = json.loads((ROOT / 'data/site-content.json').read_text())
        self.template = (ROOT / 'templates/page.html').read_text()

    def render(self, language='uk'):
        return build.render(self.content, self.template, language)

    def test_both_languages_have_content_and_crawlable_links_without_js(self):
        for lang in ('uk', 'en'):
            html = self.render(lang)
            self.assertIn('<html lang="' + lang + '">', html)
            self.assertIn('<h1>' + self.content['translations'][lang]['hero']['name'] + '</h1>', html)
            self.assertIn(self.content['translations'][lang]['about']['lead'], html)
            self.assertIn('href="/uk/"', html)
            self.assertIn('href="/en/"', html)
            self.assertIn('href="/vcard/denys-fedorov-' + lang + '.vcf"', html)
            self.assertIn('href="https://fedorov.liver.surgery/' + lang + '/"', html)
            self.assertIn('hreflang="x-default"', html)
            self.assertIn('src="/img/denys-fedorov-portrait.jpg"', html)
            self.assertNotIn('data-i18n', html)
            self.assertNotIn('data-content', html)
            self.assertNotIn('data/site-content.json', html)
            self.assertNotIn('tel:', html)
            self.assertIn('data-nosnippet', html)

    def test_edits_escaped_and_omitted_fields_stay_unpublished(self):
        self.content['translations']['uk']['hero']['name'] = '<script>alert("x")</script> & name'
        self.content['translations']['uk']['meta']['title'] = '"<unsafe>&'
        self.content['editorial']['fieldStatus']['/translations/uk/about/lead'] = 'omit'
        self.content['links']['scopus'] = None
        html = self.render()
        self.assertNotIn('<script>alert', html)
        self.assertIn('&lt;script&gt;', html)
        self.assertIn('content="&quot;&lt;unsafe&gt;&amp;"', html)
        self.assertNotIn(self.content['translations']['uk']['about']['lead'], html)
        self.assertNotIn('scopus.com/', html)

    def test_unsafe_links_fail_build(self):
        for url in ('javascript:alert(1)', 'data:text/html,test', 'https://example.com/\nfoo'):
            with self.subTest(url=url):
                self.content['links']['scopus'] = url
                with self.assertRaises(ValueError):
                    self.render()

    def test_artifact_excludes_sources_and_has_local_resources(self):
        build.build()
        output = ROOT / 'dist'
        self.assertFalse((output / 'data').exists())
        self.assertFalse((output / 'templates').exists())
        self.assertFalse((output / 'HANDSOFF.md').exists())
        for lang in ('uk', 'en'):
            html = (output / lang / 'index.html').read_text()
            tree = build.Parser(html).root
            def walk(node):
                if isinstance(node, str):
                    return
                for attr in ('src', 'href'):
                    url = node.attrs.get(attr, '')
                    if url.startswith('/') and not url.startswith('//'):
                        target = output / url.lstrip('/').split('#')[0]
                        self.assertTrue(target.exists(), str(target))
                for child in node.children:
                    walk(child)
            walk(tree)
        self.assertEqual((output / 'index.html').read_text(), (output / 'uk/index.html').read_text())

if __name__ == '__main__':
    unittest.main()
