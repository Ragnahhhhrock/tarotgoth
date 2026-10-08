# tarotgoth

[tarotgoth.com](https://tarotgoth.com): photograph a tarot spread, get a dark, sarcastic reading.

This repo currently holds the design system, styleguide and site shell.

- `DESIGN.md`: the design system in one page
- `styleguide/`: live styleguide (mobile first, noindex)
- `css/`: tokens and components
- `assets/`: avatar, Open Graph image, Twitter card, icons
- `index.html`: landing page with full metadata
- `scripts/build-social.mjs`: regenerates social images and icons (`npm install && npm run build:social`; needs IM Fell English and Hanken Grotesk installed locally)

Static site, no build step. Preview locally with `python3 -m http.server` and open `http://localhost:8000/styleguide/`.

Contact: contact@tarotgoth.com
