# tarotgoth

[tarotgoth.com](https://tarotgoth.com): photograph a tarot spread, get a dark, sarcastic reading from Vesper.

## How it works

1. The browser shrinks the photo and posts it to `/api/read`.
2. A Cloudflare Pages Function (`functions/api/read.js`) sends it to Claude with Vesper's instructions and a structured tool schema.
3. The spread, cards and reading come back as JSON and the page renders them. Nothing is stored.

## Layout

- `public/`: the static site (app, styleguide, privacy page, assets, fonts). Deployed as the Pages output directory.
- `functions/api/read.js`: the reading API.
- `DESIGN.md`: the design system (paths in it are relative to `public/`).
- `scripts/build-social.mjs`: regenerates social images and icons.
- `tests/`: `node tests/read.test.mjs` (API), `python3 tests/ui.test.py` (browser flow with a mocked API).

## Deploy (Cloudflare Pages)

Connect this repo to a Pages project with:

- Build command: none
- Build output directory: `public`
- Environment variable (secret): `ANTHROPIC_API_KEY`
- Optional: `ANTHROPIC_MODEL` (default `claude-sonnet-5-5`)
- Optional but recommended: a KV namespace bound as `RATE` (caps readings per visitor per day and in total; see `functions/api/read.js`)
- Custom domain: `tarotgoth.com`

Also add a Cloudflare rate limiting rule on `/api/read` (Security, WAF) so a bot can't run up the API bill.

## Local preview

`cd public && python3 -m http.server 8000`, then open http://localhost:8000/. The reading API needs `wrangler pages dev public` and an `ANTHROPIC_API_KEY` in `.dev.vars`.

Contact: contact@tarotgoth.com
