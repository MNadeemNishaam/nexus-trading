# Nexus Trading — website

Luxury towel supply for hotels and villas in Sri Lanka.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production files in dist/
```

`dist/` is a static site — drop it on Netlify, Vercel, Cloudflare Pages or any web host.

## Before launch

Set the real contact details at the top of `src/main.js`:

```js
const CONTACT = {
  whatsapp: '94770000000',      // international format, no + or spaces
  phoneLabel: '+94 77 000 0000',
  email: 'hello@nexustrading.lk',
};
```

The enquiry form composes a WhatsApp message or an email from what the visitor types — no server needed.

## Where things live

- `index.html` — all copy and sections
- `src/style.css` — colours (tokens at the top), type and layout
- `src/main.js` — animations, GSM explorer, embroidery studio, form
- `src/logo.js` — the NX monogram (vector) and wordmark
- `src/fabric.js` — the WebGL fabric behind the hero
- `src/towel.js` — the towel illustrations

## SEO

- Page title, description, canonical URL, sharing tags and structured data (Organization, WebSite, FAQPage) are in the `<head>` of `index.html`. Keep the FAQ structured data in sync with the visible FAQ section.
- `public/robots.txt` and `public/sitemap.xml` — update `<lastmod>` in the sitemap when the content changes.
- `public/og-image.jpg` is the preview image shown when the link is shared (1200 × 630).
- After deploying, submit `https://nexustrading.lk/sitemap.xml` in Google Search Console.
