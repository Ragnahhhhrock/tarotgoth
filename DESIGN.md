# tarotgoth design system

Mobile-first web app. Photograph a tarot spread, get a dark, sarcastic reading from a goth reader.
Live reference: `/styleguide/`. Tokens: `css/tokens.css`. Components: `css/components.css`.

## Product

1. Ingest a photo of a tarot spread (phone camera or camera roll).
2. Identify the spread type.
3. Identify each card, with orientation and position.
4. Deliver a reading from the cards and the spread, in character.

Monetisation: a one-off "Buy me a coffee, $5 AUD" Stripe link, shown after the reading. Contact: contact@tarotgoth.com.

## The reader

**Vesper** (working name). Twenty-something goth woman, black clothes, pale face, black cat. Intelligent, sarcastic, dark sense of humour.
**Omen** (working name). Her black cat, gilt eyes. Appears in loading and empty states, never in the reading text.

Avatar source: `assets/vesper.svg` (400 by 500, flat vector, inside the ogive). Do not redraw her in another style.

## Principles

- **The ogive is the signature.** Reader, upload zone and social images sit inside the pointed gothic arch. Everything else stays near-square so the arch stands out.
- **The reading is the product.** It gets the best typography on the screen.
- **Plain interface, in-character reading.** Buttons, errors and labels are clear. Personality lives in loading lines, empty states and the reading.
- **Dark only.** No light theme.

## Colour

| Token | Hex | Use | Contrast |
| --- | --- | --- | --- |
| `--ink` | `#140E17` | Page background | base |
| `--crypt` | `#1F1724` | Panels, upload zone, card faces | base |
| `--vault` | `#2E2335` | Raised surfaces, dividers | base |
| `--bone` | `#EDE4D6` | Primary text | 15.1:1 on ink |
| `--ash` | `#B0A4B8` | Secondary text | 8.0:1 on ink |
| `--oxblood` | `#8E1B2F` | Fills only (buttons, error edge), bone text on top | 7.1:1 with bone |
| `--rose` | `#EE8CA0` | Links, focus ring, tagline | 8.1:1 on ink |
| `--gilt` | `#C4A265` | Coffee button, card edges, arch outline | 7.9:1 on ink |
| `--line` | `#84758E` | Control borders | 4.4:1 on ink |
| `--pallor` | `#EBE0E1` | The reader's skin | illustration only |

Rules: oxblood is never text. Gilt is for money and card edges only. No gradients in the UI (the avatar and social images carry the only ones). No drop shadows.

## Type

| Role | Face | Size token |
| --- | --- | --- |
| Wordmark | IM Fell English, lowercase | `--step-5` (60px, 80px at 640px+) |
| Hero | IM Fell English | `--step-4` |
| Screen title, verdict (italic) | IM Fell English | `--step-3` |
| Card name, section title | IM Fell English | `--step-2` |
| Reading text | IM Fell English, line height 1.6 | `--step-1` (19px) |
| Interface | Hanken Grotesk 600 | `--step-0` (16px) |
| Caption, fine print | Hanken Grotesk | `--step--1` (14px) |

Both fonts are self-hosted in `/fonts` (OFL). Sentence case everywhere, no all-caps labels. Reading column max 34rem. One italic moment per screen.

## Space, shape, motion

- Space: 4px base. Scale `--s-1` to `--s-8` (4, 8, 12, 16, 24, 32, 48, 72).
- Radii: ogive (signature), card 6px, controls 4px.
- Touch targets 48px minimum, 8px apart. Inputs 16px text so iOS does not zoom.
- Respect `env(safe-area-inset-*)`. Use `100dvh`, not `100vh`.
- Motion: one reveal when the reading arrives, one slow pulse while loading. Both stop under `prefers-reduced-motion`.
- Focus: 3px rose ring, 3px offset, on everything interactive.

## Components

Wordmark, ogive frame, buttons (primary oxblood, secondary outline, coffee gilt, disabled), field and textarea, upload zone, detection summary, tarot card thumbnail (upright and reversed), reading block (verdict, per-card sections, close), loading, error, empty, toast, footer. All demonstrated in `/styleguide/`.

Button rules: one primary per screen. Coffee is never primary and appears only after a reading.

## Voice

Intelligent first, sarcastic second. Dry, not cruel. The joke targets the situation or the cards, never someone's pain.

- Specific beats generic. A joke that fits any card is a weak joke.
- Errors say what happened and what to do, with no apology.
- No em dashes, exclamation marks or emoji.
- **Drop the act** when someone mentions self-harm, abuse, a medical issue or a crisis. Respond plainly with care.
- No predictions about health, money, legal outcomes or death.
- Footer line, once: "For entertainment only. Not medical, legal or financial advice."

Core lines: tagline "Your cards. Her opinion." Primary action "Read my cards". Loading "Squinting at your cards" / "Omen is judging your layout." Error "Can't read that photo".

## Metadata and social

| Item | File | Spec |
| --- | --- | --- |
| Open Graph image | `assets/og-image.png` | 1200 by 630, PNG, alt text in `og:image:alt` |
| Twitter card | `assets/twitter-card.png` | 1200 by 600, `summary_large_image` |
| Favicon | `favicon.svg`, `favicon.ico`, `favicon-32.png` | Ogive and gilt crescent on ink |
| Touch and manifest icons | `assets/apple-touch-icon.png`, `icon-192.png`, `icon-512.png` | |
| Manifest | `site.webmanifest` | standalone, portrait, ink |
| Theme colour | `#140e17` | matches page |

Title under 60 characters, description under 160. Full tag set is in `index.html`. Social images are built by `scripts/build-social.mjs` from `assets/vesper.svg` and the tokens above; keep key content 60px inside every edge.

## Open items

- Stripe link: replace `#stripe-link-goes-here` in the coffee buttons when the app is built.
- X handle: add `twitter:site` in `index.html` once an account exists.
- Confirm or rename Vesper and Omen.
- Deploy: point Cloudflare Pages at this repo (no build step needed; output directory is the repo root).
