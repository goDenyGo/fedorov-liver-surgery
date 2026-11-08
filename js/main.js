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

const revealItems = document.querySelectorAll('.visit-process li, #expertise .card');
if ('IntersectionObserver' in window &&
    window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('scroll-entered');
        observer.unobserve(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -15% 0px' });
  revealItems.forEach(item => observer.observe(item));
}
