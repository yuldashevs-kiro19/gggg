# KERNELAB

Kernel-level game manipulation storefront — single-page site + admin panel.

## Structure

```
.
├── index.html       # main storefront
├── admin.html       # admin panel (login → dashboard)
├── faq.html         # FAQ page (admin-editable)
├── terms.html       # Terms / Privacy (admin-editable)
├── store.js         # shared data layer (localStorage + IndexedDB)
├── script.js        # main site logic
├── admin.js         # admin panel logic (also inlined inside admin.html)
├── styles.css       # all styles (main + admin + legal pages)
└── assets/
```

## Pages

- `/` — main storefront
- `/admin.html` — admin panel (default password: `admin`, change in Settings)
- `/faq.html` — frequently asked questions
- `/terms.html` — Terms of Service / Privacy Policy

## Admin

Default password is `admin`. Change it under **Settings → Admin Password**.
All site data (products, games, orders, clicks, settings) is persisted in the
visitor's `localStorage` — **no server**. Per-browser, per-device.

## Local development

GitHub Pages serves over HTTPS so everything works out of the box once deployed.
For local development, serve via a small static server (not `file://`):

```bash
# Python
python -m http.server 8000
# Node
npx serve .
```

Then open <http://localhost:8000>.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo
2. Repo → **Settings** → **Pages**
3. **Source**: Deploy from a branch
4. **Branch**: `main` / `/ (root)`
5. Save → site appears at `https://<user>.github.io/<repo>/` within ~1 minute
