import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { monogram, wordmark } from './logo.js';
import { initFabric } from './fabric.js';
import { towelStack, towelFace, pilePath } from './towel.js';

gsap.registerPlugin(ScrollTrigger, SplitText);
// Mobile browsers resize the viewport as the address bar hides; don't re-layout for that.
ScrollTrigger.config({ ignoreMobileResize: true });

// ------------------------------------------------------------------
// Contact details — replace these with the real ones before launch.
// ------------------------------------------------------------------
const CONTACT = {
  whatsapp: '94767594282',          // international format, no + or spaces
  phoneLabel: '+94 76 759 4282',
  email: 'm.nadeemnishaam@gmail.com',
};

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ---------- Logos ----------
$('[data-logo="stroke"]').innerHTML = monogram({ stroke: true });
$('[data-logo="wordmark"]').innerHTML = wordmark();
$('[data-logo="footer"]').innerHTML = monogram();
$('[data-year]').textContent = new Date().getFullYear();

// ---------- Smooth scroll ----------
const lenis = new Lenis({ duration: 1.25, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: !reduceMotion });
lenis.stop();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const target = a.getAttribute('href');
  if (target.length < 2 && target !== '#top') return;
  e.preventDefault();
  closeMenu();
  lenis.scrollTo(target === '#top' ? 0 : target, { duration: 1.6 });
}));

// ---------- Fabric ----------
const fabric = initFabric($('.hero-canvas'));

// ---------- Towel illustrations ----------
const stacks = {
  essential: { colors: ['#e9e4dc', '#f4f1ec', '#dcd6cc', '#f7f4ef'], plush: 0.2, border: '#bfb6a6' },
  signature: { colors: ['#e8dcc6', '#f3ede2', '#d8c7a8', '#f6f1e8'], plush: 0.6, border: '#c9a45c' },
  reserve: { colors: ['#e9e1d3', '#5b1a2b', '#f5efe4', '#efe6d6'], plush: 1, border: '#d4b06a' },
};
$$('[data-stack]').forEach((el) => {
  const s = stacks[el.dataset.stack];
  el.innerHTML = towelStack(s.colors, s);
});
$('[data-towel-face]').innerHTML = towelFace();

// ---------- Loader → intro ----------
function intro() {
  const tl = gsap.timeline({
    defaults: { ease: 'expo.out' },
    onComplete: () => { document.body.classList.remove('is-loading'); lenis.start(); },
  });
  if (reduceMotion) {
    gsap.set(['.hero-canvas', '.hero-sub', '.hero-cta', '.hero-eyebrow'], { opacity: 1 });
    gsap.set('.hero-title .line > span', { y: 0 });
    tl.to('.loader', { opacity: 0, duration: 0.4 }).set('.loader', { display: 'none' });
    return;
  }
  tl.to('.loader-mark .mono-stroke path', { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.15 })
    .to('.loader-bar i', { scaleX: 1, duration: 1.8, ease: 'power3.inOut' }, 0)
    .to('.loader-word span', { y: 0, duration: 1, stagger: 0.06 }, 0.3)
    .to('.loader-mark .mono-fill', { opacity: 1, duration: 0.8, ease: 'power2.out' }, 1.3)
    .to('.loader-mark .mono-stroke', { opacity: 0, duration: 0.6 }, 1.5)
    .to('.loader-inner', { scale: 0.92, opacity: 0, duration: 0.8, ease: 'power3.in' }, 2.3)
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.2, ease: 'expo.inOut' }, 2.7)
    .set('.loader', { display: 'none' })
    .to('.hero-canvas', { opacity: 1, duration: 2.4, ease: 'power2.out' }, 2.9)
    .fromTo('.nav', { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2 }, 3.3)
    .to('.hero-eyebrow', { opacity: 1, duration: 1 }, 3.3)
    .to('.hero-title .line > span', { y: 0, duration: 1.6, stagger: 0.12 }, 3.2)
    .to('.hero-sub', { opacity: 1, y: 0, duration: 1.4 }, 3.7)
    .to('.hero-cta', { opacity: 1, y: 0, duration: 1.4 }, 3.85)
    .from('.hero-scroll', { opacity: 0, duration: 1 }, 4.2);
  gsap.set(['.hero-sub', '.hero-cta'], { y: 24 });
}

document.fonts.ready.then(() => {
  setupScroll();
  intro();
});

// ---------- Scroll scenes ----------
function setupScroll() {
  if (reduceMotion) {
    setupStatic();
    return;
  }

  // Hero recedes as you scroll away
  gsap.to('.hero-content', {
    yPercent: -18, opacity: 0, scale: 0.96, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  ScrollTrigger.create({
    trigger: '.hero', start: 'top top', end: 'bottom top',
    onUpdate: (self) => { if (fabric) fabric.scroll = self.progress; },
  });

  // Headings rise line by line
  $$('.reveal').forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 105, duration: 1.4, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 85%' },
      }),
    });
  });

  // Leads, eyebrows fade up
  $$('.section-head .lead, .bespoke-copy .lead, .contact-copy .lead, .col-intro .lead, .section-head .eyebrow, .bespoke-copy .eyebrow, .contact-copy .eyebrow, .process-head .eyebrow, .statement .eyebrow').forEach((el) => {
    gsap.from(el, { y: 30, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  // Statement: words light up as you read
  const st = $('[data-words]');
  SplitText.create(st, { type: 'words', wordsClass: 'w' });
  gsap.to(st.querySelectorAll('.w'), {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: st, start: 'top 75%', end: 'bottom 45%', scrub: 0.6 },
  });

  const mm = gsap.matchMedia();

  // Collection: pinned horizontal journey on wide screens
  mm.add('(min-width: 861px) and (min-height: 600px)', () => {
    const track = $('.collection-track');
    const distance = () => track.scrollWidth - innerWidth;
    const scroller = gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        trigger: '.collection', start: 'top top', end: () => `+=${distance()}`,
        pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
      },
    });
    $$('.tier').forEach((tier) => {
      const towels = tier.querySelectorAll('.towel');
      gsap.timeline({
        scrollTrigger: { trigger: tier, containerAnimation: scroller, start: 'left 75%', toggleActions: 'play none none reverse' },
      })
        .from(towels, { y: -160, opacity: 0, duration: 1.1, ease: 'bounce.out', stagger: 0.14 })
        .from(tier.querySelector('.towel-shadow'), { opacity: 0, scale: 0.4, transformOrigin: '50% 50%', duration: 1 }, 0)
        .from(tier.querySelectorAll('.tier-copy > *, .tier-specs li'), { x: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.06 }, 0.1);
      gsap.fromTo(tier.querySelector('.tier-visual'), { xPercent: 8 }, {
        xPercent: -8, ease: 'none',
        scrollTrigger: { trigger: tier, containerAnimation: scroller, start: 'left right', end: 'right left', scrub: true },
      });
    });
  });
  mm.add('(max-width: 860px), (max-height: 599px)', () => {
    $$('.tier').forEach((tier) => {
      gsap.from(tier.querySelectorAll('.towel'), {
        y: -120, opacity: 0, duration: 1.1, ease: 'bounce.out', stagger: 0.14,
        scrollTrigger: { trigger: tier, start: 'top 70%' },
      });
      gsap.from(tier.querySelectorAll('.tier-copy > *'), {
        y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.06,
        scrollTrigger: { trigger: tier.querySelector('.tier-copy'), start: 'top 85%' },
      });
    });
  });

  // Range cards
  gsap.from('.range-card', {
    y: 80, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: { each: 0.08, grid: 'auto', from: 'start' },
    scrollTrigger: { trigger: '.range-grid', start: 'top 80%' },
  });
  // clip-path, not transforms: the shapes are centred with CSS translate
  gsap.from('.rc-shape', {
    clipPath: 'inset(0 0 100% 0)', duration: 1.6, ease: 'expo.out', stagger: 0.08,
    scrollTrigger: { trigger: '.range-grid', start: 'top 75%' },
  });

  // GSM block
  gsap.from('.gsm-pile', { opacity: 0, scaleX: 0.6, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.gsm', start: 'top 75%' } });
  gsap.from('.gsm-readout > *', { y: 40, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.gsm', start: 'top 80%' } });

  // Counters
  $$('[data-count]').forEach((el) => {
    const obj = { v: 0 };
    gsap.to(obj, {
      v: +el.dataset.count, duration: 2, ease: 'power3.out',
      onUpdate: () => { el.textContent = Math.round(obj.v); },
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });
  gsap.from('.spec', { y: 50, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.craft-specs', start: 'top 85%' } });

  // Bespoke
  gsap.from('.towel-hang', {
    rotateX: -35, y: 120, opacity: 0, duration: 2, ease: 'expo.out',
    scrollTrigger: { trigger: '.bespoke-visual', start: 'top 80%' },
  });
  gsap.from('.studio > *', { y: 30, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.studio', start: 'top 85%' } });
  gsap.from('.bespoke-list li', { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.bespoke-list', start: 'top 90%' } });

  // Promise
  $$('.promise-item').forEach((el, i) => {
    gsap.from(el, { y: 60, opacity: 0, duration: 1.4, ease: 'expo.out', delay: (i % 2) * 0.12, scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  gsap.fromTo('.marquee-track', { x: 0 }, {
    xPercent: -8, ease: 'none',
    scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  // Process: each step lights up as it crosses centre
  $$('.step').forEach((step) => {
    ScrollTrigger.create({ trigger: step, start: 'top 60%', end: 'bottom 40%', toggleClass: 'is-active' });
  });
  gsap.to('.process-progress i', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: '.process-steps', start: 'top 60%', end: 'bottom 60%', scrub: true },
  });

  // Contact
  gsap.from('.enquiry', { y: 80, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.enquiry', start: 'top 85%' } });
  gsap.from('.cd-link', { y: 30, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.contact-direct', start: 'top 92%' } });

  // Footer
  gsap.from('.footer-big', {
    yPercent: 40, opacity: 0, letterSpacing: '.3em', duration: 2, ease: 'expo.out',
    scrollTrigger: { trigger: '.footer', start: 'top 80%' },
  });
  gsap.from('.footer-mark', { rotate: -90, scale: 0.6, opacity: 0, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 85%' } });

  setupNav();
}

function setupStatic() {
  $$('[data-count]').forEach((el) => { el.textContent = el.dataset.count; });
  $$('.step').forEach((s) => s.classList.add('is-active'));
  $$('.statement-text').forEach((el) => { el.style.opacity = 1; });
  setupNav();
}

// ---------- Nav ----------
function setupNav() {
  const nav = $('.nav');
  let last = 0;
  lenis.on('scroll', ({ scroll }) => {
    nav.classList.toggle('is-scrolled', scroll > 40);
    const menuOpen = $('.menu').classList.contains('is-open');
    nav.classList.toggle('is-hidden', !menuOpen && scroll > last && scroll > innerHeight * 0.8);
    last = scroll;
  });
  $$('[data-theme]').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec, start: 'top 40px', end: 'bottom 40px',
      onToggle: (self) => { if (self.isActive) nav.classList.toggle('is-light', sec.dataset.theme === 'light'); },
    });
  });
}

const toggle = $('.nav-toggle');
const menu = $('.menu');
function closeMenu() {
  if (!menu.classList.contains('is-open')) return;
  lenis.start();
  menu.classList.remove('is-open');
  menu.setAttribute('aria-hidden', 'true');
  toggle.setAttribute('aria-expanded', 'false');
}
toggle.addEventListener('click', () => {
  const open = !menu.classList.contains('is-open');
  menu.classList.toggle('is-open', open);
  menu.setAttribute('aria-hidden', String(!open));
  toggle.setAttribute('aria-expanded', String(open));
  $('.nav').classList.toggle('is-light', false);
  if (open) {
    lenis.stop();
    gsap.fromTo('.menu a', { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.05, delay: 0.25 });
  } else {
    lenis.start();
  }
});

// ---------- GSM explorer ----------
const gsmInput = $('.gsm-control input');
const pileTop = $('.pile-top');
const pileBot = $('.pile-bot');
const tiers = [
  { max: 499, name: 'Essential', use: 'Pools, gyms and high-turnover rooms. Light, fast-drying, hard-wearing.' },
  { max: 549, name: 'Essential +', use: 'Staff areas, beach clubs and busy city hotels.' },
  { max: 649, name: 'Signature', use: 'Guest rooms in four- and five-star hotels.' },
  { max: 699, name: 'Signature +', use: 'Premium rooms and boutique hotels.' },
  { max: 800, name: 'Reserve', use: 'Suites, spas and private villas. Deep, heavy, unforgettable.' },
];
const gsmState = { v: 600 };
const pileSvg = $('.gsm-pile');
let pileW = 600;
function sizePile() {
  pileW = Math.max(280, Math.round(pileSvg.clientWidth)) || 600;
  pileSvg.setAttribute('viewBox', `0 0 ${pileW} 240`);
  $('.pile-ground', pileSvg).setAttribute('width', pileW);
}
function drawPile(v) {
  const { top, bot, strokeWidth } = pilePath(v, pileW);
  pileTop.setAttribute('d', top);
  pileBot.setAttribute('d', bot);
  pileTop.setAttribute('stroke-width', strokeWidth);
  pileBot.setAttribute('stroke-width', strokeWidth);
  $('[data-gsm-value]').textContent = Math.round(v);
}
function setGsm(v) {
  const tier = tiers.find((t) => v <= t.max);
  const tierEl = $('[data-gsm-tier]');
  if (tierEl.textContent !== tier.name) {
    gsap.fromTo([tierEl, '[data-gsm-use]'], { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.05 });
    tierEl.textContent = tier.name;
    $('[data-gsm-use]').textContent = tier.use;
  }
  gsmInput.style.setProperty('--p', `${((v - 400) / 400) * 100}%`);
  gsap.to(gsmState, { v, duration: 0.6, ease: 'power3.out', onUpdate: () => drawPile(gsmState.v) });
}
gsmInput.addEventListener('input', () => setGsm(+gsmInput.value));
sizePile();
drawPile(600);
setGsm(600);
let pileTimer;
window.addEventListener('resize', () => {
  clearTimeout(pileTimer);
  pileTimer = setTimeout(() => { sizePile(); drawPile(gsmState.v); }, 150);
});

// ---------- Embroidery studio ----------
const face = $('.towel-face');
const tfText = $('.tf-text', face);
const tfSub = $('.tf-sub', face);
const nameIn = $('[data-emb-name]');
const subIn = $('[data-emb-sub]');
function fitName() {
  tfText.textContent = nameIn.value.trim() || 'Your Property';
  tfSub.textContent = subIn.value.trim();
  tfText.style.fontSize = '';
  const max = 330;
  const w = tfText.getComputedTextLength();
  if (w > max) tfText.style.fontSize = `${parseFloat(getComputedStyle(tfText).fontSize) * (max / w)}px`;
}
nameIn.addEventListener('input', fitName);
subIn.addEventListener('input', fitName);
document.fonts.ready.then(fitName);

$$('[data-swatch]').forEach((group) => {
  group.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $$('button', group).forEach((x) => x.classList.toggle('on', x === b));
    face.style.setProperty(group.dataset.swatch === 'towel' ? '--towel' : '--thread', b.dataset.v);
    gsap.fromTo('.towel-hang', { scale: 0.985 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1, .5)' });
  });
});
$('[data-font]').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  $$('[data-font] button').forEach((x) => x.classList.toggle('on', x === b));
  face.dataset.font = b.dataset.v;
  fitName();
});

// Towel tilts gently toward the cursor
if (finePointer && !reduceMotion) {
  const hang = $('.towel-hang');
  const visual = $('.bespoke-visual');
  const rx = gsap.quickTo(hang, 'rotateX', { duration: 1, ease: 'power3.out' });
  const ry = gsap.quickTo(hang, 'rotateY', { duration: 1, ease: 'power3.out' });
  visual.addEventListener('pointermove', (e) => {
    const r = visual.getBoundingClientRect();
    ry(((e.clientX - r.left) / r.width - 0.5) * 14);
    rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
  });
  visual.addEventListener('pointerleave', () => { rx(0); ry(0); });
}

// ---------- Cursor & magnetic buttons ----------
if (finePointer && !reduceMotion) {
  const cursor = $('.cursor');
  const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
  const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
  window.addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); });
  document.addEventListener('pointerover', (e) => {
    cursor.classList.toggle('is-hover', !!e.target.closest('a, button, input[type="range"], .range-card, label'));
  });

  $$('.magnetic').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, .4)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, .4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.25);
      y((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => { x(0); y(0); });
  });
}

// ---------- Contact ----------
$('[data-contact-label="phone"]').textContent = CONTACT.phoneLabel;
$('[data-contact-label="email"]').textContent = CONTACT.email;
$('[data-contact="whatsapp"]').href = `https://wa.me/${CONTACT.whatsapp}`;
$('[data-contact="email"]').href = `mailto:${CONTACT.email}`;
$$('[data-contact]').forEach((a) => { if (a.dataset.contact === 'whatsapp') { a.target = '_blank'; a.rel = 'noopener'; } });

const form = $('.enquiry');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const via = e.submitter?.dataset.send || 'whatsapp';
  const data = new FormData(form);
  const note = $('.form-note');
  let ok = true;
  ['name', 'property'].forEach((k) => {
    const field = form.elements[k].closest('.field');
    const bad = !String(data.get(k) || '').trim();
    field.classList.toggle('is-invalid', bad);
    if (bad) ok = false;
  });
  if (!ok) { note.textContent = 'Please add your name and property.'; return; }

  const lines = [
    'Hello Nexus Trading,',
    '',
    `Name: ${data.get('name')}`,
    `Property: ${data.get('property')} (${data.get('type')})`,
    data.get('rooms') ? `Rooms: ${data.get('rooms')}` : '',
    data.getAll('tier').length ? `Interested in: ${data.getAll('tier').join(', ')}` : '',
    data.get('message') ? `\n${data.get('message')}` : '',
  ].filter(Boolean).join('\n');

  if (via === 'email') {
    location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(`Towel enquiry — ${data.get('property')}`)}&body=${encodeURIComponent(lines)}`;
  } else {
    window.open(`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(lines)}`, '_blank', 'noopener');
  }
  note.textContent = 'Thank you — we usually reply within a day.';
});
