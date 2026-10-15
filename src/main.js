import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { monogram, wordmark } from './logo.js';
import { initFabric } from './fabric.js';
import { towelStack, towelFace, pilePath } from './towel.js';
import { createSnapper } from './snap.js';

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

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

// ---------- Logos ----------
$('[data-logo="stroke"]').innerHTML = monogram({ stroke: true });
$('[data-logo="wordmark"]').innerHTML = wordmark();
$('[data-logo="footer"]').innerHTML = monogram();
$('[data-year]').textContent = new Date().getFullYear();

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

// ---------- Screen snapping ----------
const colPanels = $$('.col-panel');
let colScroll = null; // the pinned horizontal collection, when active

function getStops() {
  return $$('[data-screen]').map((el) => {
    const k = colPanels.indexOf(el);
    if (k >= 0 && colScroll) {
      const st = colScroll.scrollTrigger;
      return { el, y: st.start + ((st.end - st.start) * k) / (colPanels.length - 1) };
    }
    return { el, y: el.getBoundingClientRect().top + scrollY };
  }).flatMap((s) => {
    // A screen taller than the viewport (very short landscape phones) gets
    // extra stops so nothing in it is skipped.
    const extra = s.el.offsetHeight - innerHeight;
    if (extra <= 8 || colPanels.includes(s.el)) return [s];
    const out = [s];
    for (let d = innerHeight * 0.8; d < extra; d += innerHeight * 0.8) out.push({ el: s.el, y: s.y + d });
    out.push({ el: s.el, y: s.y + extra });
    return out;
  });
}

const navLinks = $$('.nav-links a');
const pager = $('.pager');
const snapper = createSnapper({
  getStops,
  reduceMotion,
  onChange: (i, el) => {
    $$('li', pager).forEach((li, j) => li.classList.toggle('on', j === i));
    pager.classList.toggle('is-visible', i > 0);
    const section = el?.closest('[id]');
    navLinks.forEach((a) => a.classList.toggle('is-current', !!section && a.getAttribute('href') === `#${section.id}`));
  },
});

function buildPager() {
  $('ol', pager).innerHTML = snapper.stops.map((_, i) => `<li class="${i === snapper.index ? 'on' : ''}"></li>`).join('');
}

ScrollTrigger.addEventListener('refresh', () => { snapper.realign(); buildPager(); });

$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const href = a.getAttribute('href');
  if (!href.startsWith('#') || href.length < 2) return; // real links (WhatsApp, email) pass through
  e.preventDefault();
  closeMenu();
  if (href === '#top') { snapper.goTo(0); return; }
  const target = $(href);
  if (!target) return;
  const i = snapper.indexOf(target);
  if (i >= 0) snapper.goTo(i);
}));

// ---------- Loader → intro ----------
function intro() {
  const ready = () => {
    document.body.classList.remove('is-loading');
    snapper.refresh();
    buildPager();
    snapper.enable();
  };
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: ready });
  if (reduceMotion) {
    gsap.set(['.hero-canvas', '.hero-sub', '.hero-cta', '.hero-eyebrow'], { opacity: 1 });
    gsap.set('.hero-title .line > span', { y: 0 });
    tl.to('.loader', { opacity: 0, duration: 0.4 }).set('.loader', { display: 'none' });
    return;
  }
  gsap.set(['.hero-sub', '.hero-cta'], { y: 24 });
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
  // Let people move on as soon as the hero headline is up.
  tl.call(ready, null, 3.6);
}

document.fonts.ready.then(() => {
  setupScenes();
  intro();
});

// ---------- Scenes ----------
// Each screen plays its entrance as it arrives, so animations land with the snap.
const onArrive = (trigger, fn, start = 'top 62%') =>
  ScrollTrigger.create({ trigger, start, once: true, onEnter: fn });

function setupScenes() {
  if (reduceMotion) {
    $$('[data-count]').forEach((el) => { el.textContent = el.dataset.count; });
    gsap.set('.statement-text .w, .process-progress i', { opacity: 1, scaleX: 1 });
    setupNavTheme();
    return;
  }

  // Hero recedes as you leave it
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
    if (el.closest('.col-intro')) return; // handled with the collection
    SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 105, duration: 1.3, ease: 'expo.out', stagger: 0.09,
        scrollTrigger: { trigger: el.closest('[data-screen]'), start: 'top 62%', once: true },
      }),
    });
  });

  // Supporting copy fades up a beat later
  $$('[data-screen]').forEach((screen) => {
    const bits = $$(':scope .eyebrow, :scope .lead', screen).filter((b) => !b.closest('.hero, .col-intro, .studio-panel'));
    if (!bits.length) return;
    gsap.from(bits, { y: 24, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.15, scrollTrigger: { trigger: screen, start: 'top 62%', once: true } });
  });

  // Statement: words light up as it arrives
  const st = $('[data-words]');
  SplitText.create(st, { type: 'words', wordsClass: 'w' });
  onArrive('.statement', () => gsap.to(st.querySelectorAll('.w'), { opacity: 1, duration: 0.9, ease: 'power2.out', stagger: 0.045, delay: 0.25 }));

  const mm = gsap.matchMedia();

  // Collection: pinned horizontal journey; one snap stop per panel
  mm.add('(min-width: 861px) and (min-height: 600px)', () => {
    const track = $('.collection-track');
    const distance = () => track.scrollWidth - innerWidth;
    colScroll = gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: { trigger: '.collection', start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: true, invalidateOnRefresh: true },
    });
    introReveal();
    $$('.tier').forEach((tier) => {
      gsap.timeline({ scrollTrigger: { trigger: tier, containerAnimation: colScroll, start: 'left 60%', once: true } })
        .from(tier.querySelectorAll('.towel'), { y: -160, opacity: 0, duration: 1.1, ease: 'bounce.out', stagger: 0.12 })
        .from(tier.querySelector('.towel-shadow'), { opacity: 0, scale: 0.4, transformOrigin: '50% 50%', duration: 1 }, 0)
        .from(tier.querySelectorAll('.tier-copy > *, .tier-specs li'), { x: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.06 }, 0.1);
    });
    return () => { colScroll = null; };
  });
  mm.add('(max-width: 860px), (max-height: 599px)', () => {
    introReveal();
    $$('.tier').forEach((tier) => {
      gsap.timeline({ scrollTrigger: { trigger: tier, start: 'top 62%', once: true } })
        .from(tier.querySelectorAll('.towel'), { y: -110, opacity: 0, duration: 1.1, ease: 'bounce.out', stagger: 0.12 })
        .from(tier.querySelectorAll('.tier-copy > *'), { y: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06 }, 0.15);
    });
  });

  function introReveal() {
    const intro = $('.col-intro');
    const tl = gsap.timeline({ paused: true });
    SplitText.create($('.reveal', intro), {
      type: 'lines', mask: 'lines', linesClass: 'split-line',
      onSplit: (self) => tl.from(self.lines, { yPercent: 105, duration: 1.3, ease: 'expo.out', stagger: 0.09 }, 0),
    });
    tl.from($$('.eyebrow, .lead, .col-hint', intro), { y: 24, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08 }, 0.15);
    onArrive(intro, () => tl.play());
  }

  // Range
  onArrive('.range', () => {
    gsap.from('.range-card', { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.06, delay: 0.1 });
    gsap.from('.rc-shape', { clipPath: 'inset(0 0 100% 0)', duration: 1.5, ease: 'expo.out', stagger: 0.06, delay: 0.25 });
  });

  // Craft
  onArrive('.craft', () => {
    gsap.from('.gsm-readout > *', { y: 36, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, delay: 0.2 });
    gsap.from('.gsm-pile', { opacity: 0, scaleX: 0.6, duration: 1.5, ease: 'expo.out', delay: 0.3 });
    gsap.from('.gsm-control', { opacity: 0, y: 20, duration: 1.2, ease: 'expo.out', delay: 0.45 });
  });

  // Numbers
  onArrive('.specs', () => {
    gsap.from('.spec', { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, delay: 0.1 });
    $$('[data-count]').forEach((el, i) => {
      const obj = { v: 0 };
      gsap.to(obj, { v: +el.dataset.count, duration: 1.8, delay: 0.2 + i * 0.1, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(obj.v); } });
    });
  });

  // Bespoke
  onArrive('.bespoke', () => gsap.from('.bespoke-list li', { y: 36, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.35 }));
  onArrive('.studio-screen', () => {
    gsap.from('.towel-hang', { rotateX: -35, y: 80, opacity: 0, duration: 1.8, ease: 'expo.out', delay: 0.1 });
    gsap.from('.studio-panel > *, .studio > *', { y: 26, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06, delay: 0.25 });
  });

  // Promise
  onArrive('.promise', () => gsap.from('.promise-item', { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.3 }));

  // Process: the line draws across as each step appears
  onArrive('.process', () => {
    gsap.timeline({ delay: 0.3 })
      .to('.process-progress i', { scaleX: 1, duration: 1.8, ease: 'power2.inOut' })
      .from('.step', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.32 }, 0);
  });

  // Contact
  onArrive('.contact', () => gsap.from('.cd-link, .contact-next', { y: 26, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, delay: 0.4 }));
  onArrive('.enquire', () => gsap.from('.enquiry', { y: 60, opacity: 0, duration: 1.4, ease: 'expo.out', delay: 0.1 }));

  // Footer
  onArrive('.footer', () => {
    gsap.from('.footer-big', { yPercent: 30, opacity: 0, letterSpacing: '.3em', duration: 1.8, ease: 'expo.out', delay: 0.1 });
    gsap.from('.footer-mark', { rotate: -90, scale: 0.6, opacity: 0, duration: 1.6, ease: 'expo.out' });
  });

  // Last, so its positions account for the pinned collection above
  setupNavTheme();
}

// ---------- Nav ----------
function setupNavTheme() {
  const nav = $('.nav');
  ScrollTrigger.create({ start: 40, end: 'max', onToggle: (self) => nav.classList.toggle('is-scrolled', self.isActive) });
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
  menu.classList.remove('is-open');
  menu.setAttribute('aria-hidden', 'true');
  toggle.setAttribute('aria-expanded', 'false');
  snapper.enable();
}
toggle.addEventListener('click', () => {
  if (menu.classList.contains('is-open')) { closeMenu(); return; }
  menu.classList.add('is-open');
  menu.setAttribute('aria-hidden', 'false');
  toggle.setAttribute('aria-expanded', 'true');
  snapper.disable();
  gsap.fromTo('.menu nav a, .menu-cta', { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.05, delay: 0.25 });
});

// Keep the current screen in place when the window changes size.
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (document.activeElement?.matches?.('input, textarea, select')) return; // on-screen keyboard
    ScrollTrigger.refresh();
  }, 200);
});

// ---------- GSM explorer ----------
const gsmInput = $('.gsm-control input');
const pileSvg = $('.gsm-pile');
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
const wa = $('[data-contact="whatsapp"]');
wa.href = `https://wa.me/${CONTACT.whatsapp}`;
wa.target = '_blank';
wa.rel = 'noopener';
$('[data-contact="email"]').href = `mailto:${CONTACT.email}`;

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

// Dev-only handle for automated checks
if (import.meta.env.DEV) window.__snap = snapper;
