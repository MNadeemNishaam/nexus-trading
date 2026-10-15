// Procedural towel illustrations, drawn in SVG so they stay sharp and can be
// animated piece by piece. A shared terry filter gives the looped-pile surface.

let uid = 0;

function terryFilter(id, strength = 1) {
  return `
  <filter id="${id}" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="n"/>
    <feDiffuseLighting in="n" surfaceScale="${1.6 * strength}" lighting-color="#fff" result="lit">
      <feDistantLight azimuth="235" elevation="55"/>
    </feDiffuseLighting>
    <feComposite in="lit" in2="SourceGraphic" operator="arithmetic" k1="1.15" k2="0" k3="0" k4="0" result="tex"/>
    <feComposite in="tex" in2="SourceAlpha" operator="in"/>
  </filter>`;
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) =>
    Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt))));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// A stack of folded towels, seen from the front. `colors` runs bottom to top.
// Each towel shows its rounded folded edge, a woven border band and a soft
// contact shadow on the towel beneath.
export function towelStack(colors, { plush = 1, border = '#c9a45c' } = {}) {
  const id = `ts${++uid}`;
  const w = 300;
  const th = Math.round(40 + plush * 18); // fold thickness grows with weight
  const h = colors.length * th + 40;
  const towels = colors.map((c, i) => {
    const jitter = Math.sin(i * 7.31 + plush * 3) * 7; // folded by hand, not by machine
    const tw = w - Math.abs(Math.cos(i * 3.7)) * 10;
    const x = (w - tw) / 2 + jitter;
    const y = h - 26 - (i + 1) * th;
    const r = th * 0.42;
    return `
    <g class="towel" style="--i:${i}">
      <rect x="${x + 4}" y="${y + th - 6}" width="${tw - 8}" height="8" rx="4" fill="#000" opacity=".28" filter="url(#${id}b)"/>
      <rect x="${x}" y="${y}" width="${tw}" height="${th}" rx="${r}" fill="url(#${id}g${i})"/>
      <rect x="${x}" y="${y}" width="${tw}" height="${th}" rx="${r}" fill="${c}" filter="url(#${id}t)" opacity=".5" style="mix-blend-mode:multiply"/>
      <rect x="${x + tw * 0.14}" y="${y + 1}" width="${tw * 0.07}" height="${th - 2}" fill="url(#${id}d)" opacity=".8"/>
      <rect x="${x + tw * 0.79}" y="${y + 1}" width="${tw * 0.07}" height="${th - 2}" fill="url(#${id}d)" opacity=".8"/>
      <rect x="${x + r * 0.6}" y="${y + 2.5}" width="${tw - r * 1.2}" height="1.2" rx=".6" fill="#fff" opacity=".55"/>
      <rect x="${x}" y="${y}" width="${tw}" height="${th}" rx="${r}" fill="url(#${id}e)"/>
    </g>`;
  }).join('');

  const grads = colors.map((c, i) => `
    <linearGradient id="${id}g${i}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shade(c, 0.3)}"/>
      <stop offset=".3" stop-color="${shade(c, 0.08)}"/>
      <stop offset=".75" stop-color="${c}"/>
      <stop offset="1" stop-color="${shade(c, -0.4)}"/>
    </linearGradient>`).join('');

  return `
<svg class="towel-stack" viewBox="-30 0 360 ${h}" aria-hidden="true">
  <defs>
    ${terryFilter(`${id}t`, 1.3)}
    ${grads}
    <filter id="${id}b" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="3"/></filter>
    <pattern id="${id}d" width="6" height="6" patternUnits="userSpaceOnUse">
      <rect width="6" height="6" fill="${border}" opacity=".35"/>
      <path d="M0 3h6M3 0v6" stroke="${border}" stroke-width="1" opacity=".8"/>
    </pattern>
    <linearGradient id="${id}e" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".22"/>
      <stop offset=".08" stop-color="#000" stop-opacity="0"/>
      <stop offset=".92" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".22"/>
    </linearGradient>
    <radialGradient id="${id}s" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#000" stop-opacity=".55"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse class="towel-shadow" cx="150" cy="${h - 22}" rx="185" ry="16" fill="url(#${id}s)"/>
  ${towels}
</svg>`;
}

// A flat towel face with a woven border, used for the embroidery preview.
export function towelFace() {
  const id = `tf${++uid}`;
  return `
<svg class="towel-face" viewBox="0 0 400 520" aria-hidden="true">
  <defs>
    ${terryFilter(`${id}t`, 1.4)}
    <linearGradient id="${id}sh" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".35"/>
      <stop offset=".5" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".22"/>
    </linearGradient>
    <pattern id="${id}dobby" width="10" height="10" patternUnits="userSpaceOnUse">
      <rect width="10" height="10" fill="var(--towel)"/>
      <path d="M0 5h10M5 0v10" stroke="#000" stroke-opacity=".12" stroke-width="1"/>
      <path d="M0 0l10 10" stroke="#fff" stroke-opacity=".18" stroke-width="1"/>
    </pattern>
    <pattern id="${id}satin" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)">
      <rect width="3" height="3" fill="var(--thread)"/>
      <rect width="3" height="1" fill="#000" opacity=".22"/>
      <rect y="2" width="3" height=".6" fill="#fff" opacity=".35"/>
    </pattern>
    <filter id="${id}emb" x="-10%" y="-30%" width="120%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.2"/>
      <feOffset dy="1.5" result="b"/>
      <feFlood flood-color="#000" flood-opacity=".35"/>
      <feComposite in2="b" operator="in"/>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect class="tf-body" x="0" y="0" width="400" height="520" rx="6" fill="var(--towel)"/>
  <rect x="0" y="0" width="400" height="520" rx="6" fill="var(--towel)" filter="url(#${id}t)" opacity=".6" style="mix-blend-mode:multiply"/>
  <!-- woven dobby border -->
  <rect x="0" y="392" width="400" height="56" fill="url(#${id}dobby)"/>
  <rect x="0" y="388" width="400" height="3" fill="#000" opacity=".1"/>
  <rect x="0" y="449" width="400" height="3" fill="#000" opacity=".1"/>
  <rect x="0" y="0" width="400" height="520" rx="6" fill="url(#${id}sh)"/>
  <!-- hems -->
  <rect x="0" y="0" width="400" height="10" fill="#000" opacity=".06"/>
  <rect x="0" y="510" width="400" height="10" fill="#000" opacity=".06"/>
  <g filter="url(#${id}emb)">
    <text class="tf-text" x="200" y="300" text-anchor="middle" fill="url(#${id}satin)"></text>
    <text class="tf-sub" x="200" y="338" text-anchor="middle" fill="url(#${id}satin)"></text>
  </g>
</svg>`;
}

// Cross-section of terry pile: loops above and below a ground weave.
// Weight (GSM) drives loop height and density.
export function pilePath(gsm, width = 600, base = 120) {
  const t = (gsm - 300) / 600; // 0..~1
  const count = Math.round(26 + t * 30);
  const hgt = 26 + t * 58;
  const step = width / count;
  let top = '';
  let bot = '';
  for (let i = 0; i < count; i++) {
    const x = i * step;
    const j = Math.sin(i * 12.9898) * 0.5 + 0.5; // stable jitter
    const hh = hgt * (0.82 + j * 0.3);
    top += `M${x.toFixed(1)} ${base} C${(x - step * 0.35).toFixed(1)} ${(base - hh).toFixed(1)} ${(x + step * 1.35).toFixed(1)} ${(base - hh).toFixed(1)} ${(x + step).toFixed(1)} ${base} `;
    if (i === count - 1) continue;
    const xb = x + step / 2;
    const hb = hgt * (0.82 + (1 - j) * 0.3);
    bot += `M${xb.toFixed(1)} ${base} C${(xb - step * 0.35).toFixed(1)} ${(base + hb).toFixed(1)} ${(xb + step * 1.35).toFixed(1)} ${(base + hb).toFixed(1)} ${(xb + step).toFixed(1)} ${base} `;
  }
  return { top, bot, strokeWidth: 1.4 + t * 1.6 };
}
