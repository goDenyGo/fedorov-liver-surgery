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

const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
if (motion.matches) {
  const header = document.querySelector('.site-header');
  const logo = document.querySelector('.logo-season');
  const contactHeading = document.querySelector('#contact h2');
  const headings = [...document.querySelectorAll('.section-heading h2')];
  const pendingHeadings = new Map(headings.map((heading, index) => [heading, headings[index + 1]]));
  let framePending = false;

  function updateScrollEffects() {
    framePending = false;
    const viewportHeight = window.innerHeight;
    const scrollTop = window.scrollY;
    const pageEnd = document.documentElement.scrollHeight - viewportHeight - 1;
    const headerBottom = header.getBoundingClientRect().bottom;
    const contactArrival = contactHeading.getBoundingClientRect().top + scrollTop - headerBottom;
    const season = Math.min(1, Math.max(0, scrollTop / Math.max(1, contactArrival)));
    const edgeGap = 8;
    for (const [heading, nextHeading] of pendingHeadings) {
      const headingTop = heading.getBoundingClientRect().top + scrollTop;
      const start = headingTop - viewportHeight;
      const beforeHeader = headingTop - headerBottom - edgeGap;
      const beforeNextHeading = nextHeading
        ? nextHeading.getBoundingClientRect().top + scrollTop - viewportHeight - edgeGap
        : pageEnd;
      const finish = Math.min(beforeHeader, beforeNextHeading, pageEnd);
      const progress = Math.min(1, Math.max(0, (scrollTop - start) / Math.max(1, finish - start)));
      heading.style.setProperty('--heading-line-progress', progress);
      if (progress === 1) pendingHeadings.delete(heading);
    }
    logo.style.setProperty('--logo-leaves', Math.min(1, season / 0.6));
    logo.style.setProperty('--logo-fruits', Math.max(0, (season - 0.6) / 0.4));
  }

  function scheduleScrollUpdate() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateScrollEffects);
  }

  window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
  window.addEventListener('resize', scheduleScrollUpdate);
  updateScrollEffects();
}

if ('IntersectionObserver' in window && motion.matches) {
  const revealItems = document.querySelectorAll('#expertise .card, .visit-process li');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('scroll-entered');
        observer.unobserve(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -40px 0px' });
  revealItems.forEach(item => observer.observe(item));
}
