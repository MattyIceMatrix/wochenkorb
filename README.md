# Wochenkorb

Weekly ALDI SÜD + LIDL deals, a budgeted shopping list for four, deal-based recipes with cook mode, and the stores around Bolanden (Kirchheimbolanden) and Kaiserslautern.

Live site: https://mattyicematrix.github.io/wochenkorb/

## How it works
- Static site: `index.html`, `style.css`, `app.js`, `data.js`. No server, no accounts, no tracking.
- `data.js` holds this week's data (`window.__WK_DATA__`): `meta`, `offers`, `staples`, `stores`, `homes`, `recipes`. `app.js` loads it into a small in-page database with its own query builder.
- Each person's list, budget, favorites and menu are stored only in their own browser (`localStorage`).
- A scheduled task replaces `data.js` every Monday morning with the new week's deals and recipes.

## Security
- Content-Security-Policy: scripts only from this site; no network requests from the page; fonts from Google Fonts only.
- All text is escaped before rendering; saved browser data is validated on every load.
- `noindex` so search engines don't list it; `no-referrer` on outgoing links.

## Artifact build
`python3 tools/build_artifact.py` inlines everything into one file for the Claude artifact version.
