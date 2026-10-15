// Nexus Trading monogram — an interlaced N and X, redrawn as vector art.
// The thin X stroke passes over the heavy N diagonal; a mask cuts the gap
// so the weave reads on any background.

let uid = 0;

export function monogram({ className = '', stroke = false } = {}) {
  const id = `nx${++uid}`;
  return `
<svg class="monogram ${className}" viewBox="0 0 240 240" aria-hidden="true">
  <defs>
    <linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="40" y1="30" x2="200" y2="210">
      <stop offset="0" stop-color="#f6e7bf"/>
      <stop offset=".35" stop-color="#d4b06a"/>
      <stop offset=".6" stop-color="#9c7637"/>
      <stop offset=".82" stop-color="#e3c98c"/>
      <stop offset="1" stop-color="#b48a45"/>
    </linearGradient>
    <mask id="${id}m" maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="240">
      <rect width="240" height="240" fill="#fff"/>
      <polygon points="185.5,0 206.5,0 54.5,240 33.5,240" fill="#000"/>
    </mask>
  </defs>
  <g class="mono-fill" fill="url(#${id}g)">
    <!-- N: stems, serifs and heavy diagonal (cut where the X crosses over) -->
    <rect x="52" y="40" width="11" height="160"/>
    <rect x="177" y="40" width="11" height="160"/>
    <rect x="40" y="194" width="36" height="6"/>
    <rect x="164" y="40" width="36" height="6"/>
    <g mask="url(#${id}m)">
      <polygon points="52,40 86,40 188,200 154,200"/>
      <rect x="40" y="40" width="46" height="6"/>
      <rect x="154" y="194" width="46" height="6"/>
    </g>
    <!-- X: a double hairline laced over the N -->
    <polygon points="164,40 169,40 68,200 63,200"/>
    <polygon points="172,40 177,40 76,200 71,200"/>
  </g>
  ${stroke ? `
  <g class="mono-stroke" fill="none" stroke="#d4b06a" stroke-width="1">
    <path d="M52 40h11v160h-11z M177 40h11v160h-11z M40 194h36v6h-36z M164 40h36v6h-36z"/>
    <path d="M40 40h46l102 154h12v6h-46l-102-154h-12z"/>
    <path d="M164 40h5l-101 160h-5z M172 40h5l-101 160h-5z"/>
  </g>` : ''}
</svg>`;
}

export function wordmark({ className = '' } = {}) {
  return `
<span class="wordmark ${className}">
  ${monogram()}
  <span class="wordmark-text">
    <span class="wm-name">NEXUS</span>
    <span class="wm-sub">TRADING</span>
  </span>
</span>`;
}
