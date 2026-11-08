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
  const blossoms = [...logo.querySelectorAll('.logo-flower')];
  const blossomFlights = [
    // Lower-left tip, hill beside the trunk, then down from the lowest branch.
    { size: 1.18, angle: -27, left: 204, down: 213, arc: 30, start: 0.55, end: 0.72 },
    { size: 1.4, angle: -12, left: 217, down: 126, arc: 28, start: 0.685, end: 0.85 },
    { size: 1.28, angle: 12, left: 25, down: 53, arc: 10, start: 0.795, end: 0.92 },
  ];
  const lastBlossomLanding = blossomFlights.at(-1).end;
  const hero = document.querySelector('.hero');
  const contactHeading = document.querySelector('#contact h2');
  const contactPanel = document.querySelector('#contact .contact-panel');
  const expertiseGrid = document.querySelector('#expertise .cards');
  const expertiseCards = [...expertiseGrid.querySelectorAll('.card')];
  const cardProgress = expertiseCards.map(() => 0);
  let cardSequence = 0;
  const headings = [...document.querySelectorAll('.section-heading h2')];
  const visitHeading = document.querySelector('#patients h2');
  const desktop = window.matchMedia('(width > 820px)');
  const visitSteps = [...document.querySelectorAll('.visit-process li')];
  const pendingConnectors = new Map(visitSteps.slice(0, -1).map((step, index) => [step, visitSteps[index + 1]]));
  const visualViewport = window.visualViewport;
  const pendingReveals = new Map([
    ...headings.map((heading, index) => [heading, headings[index + 1]]),
    ...visitSteps.map((step, index) => [step, visitSteps[index + 1] ?? contactHeading]),
  ]);
  let framePending = false;

  function progressBetween(value, start, finish) {
    return Math.min(1, Math.max(0, (value - start) / (finish - start)));
  }

  function elementCenter(element) {
    const bounds = element.getBoundingClientRect();
    return bounds.top + bounds.height / 2;
  }

  function updateExpertiseCards(visibleTop, visibleBottom) {
    if (cardSequence === 1) return;

    const grid = expertiseGrid.getBoundingClientRect();
    const viewportSpace = visibleBottom - visibleTop;
    const firstCardCenter = grid.top + expertiseCards[0].offsetHeight / 2;
    const start = firstCardCenter + viewportSpace / 2;
    const finish = Math.max(start + 1, grid.bottom + viewportSpace * 0.15);
    const sequence = progressBetween(visibleBottom, start, finish);
    const revealing = sequence >= cardSequence;
    let remaining = Math.abs(sequence - cardSequence) * expertiseCards.length;

    expertiseCards.forEach((card, index) => {
      const current = cardProgress[index];
      const change = Math.min(remaining, revealing ? 1 - current : current);
      const progress = revealing ? current + change : current - change;
      // Both directions visit the cards in reading order.
      cardProgress[index] = sequence === 0 || sequence === 1 ? sequence : progress;
      card.style.setProperty('--expertise-card-progress', cardProgress[index]);
      remaining -= change;
    });
    cardSequence = sequence;
  }

  function updateScrollEffects() {
    framePending = false;
    const viewportHeight = window.innerHeight;
    const scrollTop = window.scrollY;
    const pageEnd = document.documentElement.scrollHeight - viewportHeight - 1;
    const headerBottom = header.getBoundingClientRect().bottom;
    const edgeGap = 8;
    const visitDeadline = desktop.matches
      ? visitHeading.getBoundingClientRect().top + scrollTop - headerBottom - edgeGap
      : pageEnd;
    const heroExit = hero.getBoundingClientRect().bottom + scrollTop - headerBottom;
    const panelVisible = contactPanel.getBoundingClientRect().bottom + scrollTop - viewportHeight;
    const headingUnderHeader = contactHeading.getBoundingClientRect().top + scrollTop - headerBottom;
    const seasonEnd = Math.min(panelVisible, headingUnderHeader) - edgeGap;
    const season = progressBetween(scrollTop, heroExit, Math.max(heroExit + 1, seasonEnd));
    for (const [element, nextElement] of pendingReveals) {
      const elementTop = element.getBoundingClientRect().top + scrollTop;
      const beforeHeader = elementTop - headerBottom - edgeGap;
      const beforeNextElement = nextElement
        ? nextElement.getBoundingClientRect().top + scrollTop - viewportHeight - edgeGap
        : pageEnd;
      const deadline = visitSteps.includes(element) ? visitDeadline : pageEnd;
      const finish = Math.min(beforeHeader, beforeNextElement, deadline, pageEnd);
      const start = Math.min(elementTop - viewportHeight, finish - 1);
      const progress = progressBetween(scrollTop, start, finish);
      element.style.setProperty('--scroll-reveal-progress', progress);
      if (progress === 1) pendingReveals.delete(element);
    }
    const visibleBottom = visualViewport
      ? Math.min(viewportHeight, visualViewport.offsetTop + visualViewport.height)
      : viewportHeight;
    const visibleTop = Math.max(headerBottom, visualViewport?.offsetTop ?? 0);
    updateExpertiseCards(visibleTop, visibleBottom);
    const visibleMiddle = (visibleTop + visibleBottom) / 2;
    let connectorPosition = visibleMiddle;
    if (desktop.matches && pendingConnectors.size > 0) {
      const first = elementCenter(visitSteps[0]);
      const last = elementCenter(visitSteps.at(-1));
      const finish = Math.min(last - visibleMiddle + scrollTop, visitDeadline);
      const start = Math.min(first - visibleMiddle + scrollTop, finish - (last - first) / 3);
      const sequence = progressBetween(scrollTop, start, finish);
      connectorPosition = first + (last - first) * sequence;
    }
    for (const [step, nextStep] of pendingConnectors) {
      const progress = progressBetween(connectorPosition, elementCenter(step), elementCenter(nextStep));
      step.style.setProperty('--visit-connector-progress', progress);
      if (progress === 1) pendingConnectors.delete(step);
    }
    const bloom = progressBetween(season, 0.32, 0.54);
    logo.style.setProperty('--logo-monogram-opacity', 1 - progressBetween(season, 0, 0.14));
    logo.style.setProperty('--logo-growth-visibility', 'visible');
    logo.style.setProperty('--logo-leaves', progressBetween(season, 0.14, 0.54));
    logo.style.setProperty('--logo-fruits', progressBetween(season, lastBlossomLanding, 1));
    blossoms.forEach((blossom, index) => {
      const flight = blossomFlights[index];
      const fall = progressBetween(season, flight.start, flight.end);
      const drift = -flight.left * fall;
      const drop = flight.down * fall - flight.arc * Math.sin(fall * Math.PI);
      const turn = flight.angle - (75 + 18 * index) * fall;
      blossom.style.setProperty('--logo-flower-opacity', bloom * (1 - progressBetween(fall, 0.76, 1)));
      blossom.style.setProperty('--logo-flower-transform',
        `translate(${drift}px, ${drop}px) rotate(${turn}deg) scale(${bloom * flight.size})`);
    });
  }

  function scheduleScrollUpdate() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateScrollEffects);
  }

  window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
  window.addEventListener('resize', scheduleScrollUpdate);
  visualViewport?.addEventListener('resize', scheduleScrollUpdate);
  updateScrollEffects();
}
