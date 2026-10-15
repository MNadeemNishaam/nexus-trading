// Full-screen section snapping that reads intent, not raw scroll distance.
//
//  • A short scroll or swipe moves exactly one screen.
//  • A trackpad flick's momentum is absorbed, so it never overshoots.
//  • Swiping again (a fresh surge on top of momentum), or a mouse wheel that
//    keeps turning, carries on to the next screen — so a long, fast scroll
//    keeps travelling down the page.
//  • On touch, a quick flick jumps two or three screens; a gentle swipe, one.
//
// Stops are supplied by the page (`getStops` → [{ y, el }]), so pinned scenes
// can contribute several stops of their own.

import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

const FORM_FIELDS = 'input, textarea, select, [contenteditable="true"]';
const typing = () => document.activeElement?.matches?.('input:not([type="range"]):not([type="checkbox"]), textarea, select, [contenteditable="true"]');

export function createSnapper({ getStops, onChange = () => {}, reduceMotion = false }) {
  let stops = [];
  let els = [];
  let index = 0;
  let tween = null;
  let target = 0;
  let enabled = false;
  let queued = 0;
  const debug = {}; // extra screens requested while a move is still running

  // ---------- positions ----------
  function refresh() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const list = getStops()
      .map((s) => ({ y: Math.round(Math.min(max, Math.max(0, s.y))), el: s.el }))
      .sort((a, b) => a.y - b.y)
      .filter((s, i, a) => i === 0 || s.y - a[i - 1].y > 4);
    stops = list.map((s) => s.y);
    els = list.map((s) => s.el);
    index = nearest(scrollY);
  }
  function nearest(y) {
    let best = 0;
    stops.forEach((s, i) => { if (Math.abs(s - y) < Math.abs(stops[best] - y)) best = i; });
    return best;
  }
  const clamp = (i) => Math.max(0, Math.min(stops.length - 1, i));

  // ---------- movement ----------
  function goTo(i, { duration } = {}) {
    i = clamp(i);
    const from = tween ? target : index;
    if (i === from && tween) return;
    const screens = Math.abs(i - index) || 1;
    target = i;
    index = i;
    onChange(i, els[i]);
    tween?.kill();
    if (reduceMotion) { window.scrollTo(0, stops[i]); tween = null; return; }
    tween = gsap.to(window, {
      scrollTo: { y: stops[i], autoKill: false },
      duration: duration ?? Math.min(1.5, 0.95 + (screens - 1) * 0.18),
      ease: 'power3.inOut',
      onComplete: () => {
        tween = null;
        if (queued) { const dir = Math.sign(queued); queued -= dir; goTo(index + dir); return; }
        continueIfStillScrolling();
      },
    });
  }
  const step = (dir, n = 1) => goTo((tween ? target : index) + dir * n);

  // ---------- wheel / trackpad ----------
  const hist = []; // recent |delta| samples
  let lastWheel = 0;
  let gestureDir = 0;
  let gestureAcc = 0;
  let gestureFired = false;

  function onWheel(e) {
    if (e.ctrlKey) return; // ctrl+wheel is pinch-zoom
    if (e.target.closest?.('textarea')) return;
    e.preventDefault(); // the page only ever moves screen by screen
    if (!enabled) return;
    let dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
    if (Math.abs(e.deltaX) > Math.abs(dy)) return;
    const now = performance.now();
    const mag = Math.abs(dy);
    const dir = Math.sign(dy);
    if (!dir) return;

    const fresh = now - lastWheel > 180 || dir !== gestureDir;
    lastWheel = now;
    const prev = hist.slice(-6).map((h) => h.m);
    hist.push({ t: now, m: mag, d: dir });
    while (hist.length && now - hist[0].t > 600) hist.shift();

    if (fresh) { gestureDir = dir; gestureAcc = 0; gestureFired = false; }
    gestureAcc += mag;

    // A new swipe while momentum is still flowing shows up as a sudden surge.
    const prevMax = prev.length ? Math.max(...prev) : 0;
    const surge = !fresh && prev.length >= 3 && mag > 18 && mag > prevMax * 1.6 + 6;

    if (surge) {
      gestureAcc = mag;
      if (tween) queued = Math.max(-1, Math.min(1, queued + dir)); else step(dir);
      return;
    }
    if (!gestureFired && gestureAcc > 6) {
      gestureFired = true;
      if (!tween) { step(dir); return; }
      if (dir !== Math.sign(stops[target] - scrollY)) { queued = 0; step(dir); return; } // reversed mid-move
      queued = dir; // a second, separate swipe: carry on once this move lands
    }
  }

  // When a move lands, keep going only if the wheel is still being driven hard
  // and not just coasting down (momentum decays; a turning wheel does not).
  function continueIfStillScrolling() {
    const now = performance.now();
    const recent = hist.filter((h) => now - h.t < 240 && h.d === gestureDir);
    if (recent.length < 2 || now - recent[recent.length - 1].t > 120) return; // the wheel has stopped
    const sum = recent.reduce((a, h) => a + h.m, 0);
    const half = Math.floor(recent.length / 2);
    const early = recent.slice(0, half).reduce((a, h) => a + h.m, 0) / half;
    const late = recent.slice(half).reduce((a, h) => a + h.m, 0) / (recent.length - half);
    if (sum > 180 && late >= early * 0.85) step(gestureDir);
  }

  // ---------- touch ----------
  let touch = null;
  function onTouchStart(e) {
    if (!enabled || e.touches.length > 1 || e.target.closest(`${FORM_FIELDS}, [data-no-snap]`) || typing()) { touch = null; return; }
    const t = e.touches[0];
    touch = { x: t.clientX, y: t.clientY, samples: [{ y: t.clientY, t: performance.now() }], axis: null };
  }
  function onTouchMove(e) {
    if (!touch) return;
    const t = e.touches[0];
    const dx = t.clientX - touch.x;
    const dy = t.clientY - touch.y;
    if (!touch.axis && Math.hypot(dx, dy) > 6) touch.axis = Math.abs(dy) >= Math.abs(dx) ? 'y' : 'x';
    if (touch.axis === 'x') return; // let horizontal gestures through
    e.preventDefault();
    touch.samples.push({ y: t.clientY, t: performance.now() });
    if (touch.samples.length > 8) touch.samples.shift();
  }
  function onTouchEnd() {
    if (!touch || touch.axis !== 'y') { touch = null; return; }
    const s = touch.samples;
    const last = s[s.length - 1];
    const dist = touch.y - last.y; // positive = finger moved up = go down
    const ref = s.find((p) => last.t - p.t < 110) || s[0];
    const v = (ref.y - last.y) / Math.max(16, last.t - ref.t); // px per ms
    touch = null;
    debug.touch = { v: +v.toFixed(2), dist: Math.round(dist) };
    if (Math.abs(dist) < 36 && Math.abs(v) < 0.3) return; // a tap or a twitch
    const speed = Math.abs(v);
    const far = Math.abs(dist) > 120;
    const n = far && speed > 3.4 ? 3 : far && speed > 2.2 ? 2 : 1;
    step(Math.sign(Math.abs(v) > 0.3 ? v : dist), n);
  }

  // ---------- keyboard ----------
  function onKey(e) {
    if (!enabled || e.target.closest?.(FORM_FIELDS) || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    let handled = true;
    if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) step(1);
    else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) step(-1);
    else if (k === 'Home') goTo(0);
    else if (k === 'End') goTo(stops.length - 1);
    else handled = false;
    if (handled) e.preventDefault();
  }

  // Scrollbar drags, find-in-page and tabbing move the page natively; settle
  // onto the nearest screen once they stop (but never while typing in a form,
  // where the on-screen keyboard is shifting things around).
  let settleTimer;
  function onScroll() {
    if (tween || !enabled) return;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      if (tween || typing()) return;
      const i = nearest(scrollY);
      if (Math.abs(stops[i] - scrollY) > 2) goTo(i, { duration: 0.6 }); else if (i !== index) { index = i; onChange(i, els[i]); }
    }, 160);
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd);
  window.addEventListener('keydown', onKey);
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('focusout', () => setTimeout(() => { if (!typing()) onScroll(); }, 350));

  return {
    refresh,
    goTo,
    step,
    goToY: (y) => goTo(nearest(y)),
    get index() { return index; },
    get stops() { return stops; },
    get els() { return els; },
    debug,
    indexOf(el) { const i = els.findIndex((e) => e === el || el.contains(e)); return i; },
    enable() { enabled = true; },
    disable() { enabled = false; },
    // After a resize, stay on the same screen rather than whatever is nearest.
    realign() {
      const keep = index;
      refresh();
      index = clamp(keep);
      if (!tween) window.scrollTo(0, stops[index] ?? 0);
    },
  };
}
