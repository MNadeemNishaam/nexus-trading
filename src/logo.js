// Nexus Trading monogram (the gold NX mark, from logo/logo.png) and wordmark.

export function monogram({ className = '', alt = '' } = {}) {
  return `<img class="monogram ${className}" src="${import.meta.env.BASE_URL}logo-mark.webp" alt="${alt}" width="367" height="367" decoding="async" draggable="false" />`;
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
