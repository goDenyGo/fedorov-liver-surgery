document.documentElement.classList.add('js');
// All content and language links work without JavaScript.
const toggle = document.querySelector('.nav-toggle');
const menu = document.querySelector('#nav-menu');
if (toggle && menu) {
  toggle.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', String(menu.classList.toggle('open')));
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}
