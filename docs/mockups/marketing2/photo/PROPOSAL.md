**Last Updated:** 2026-10-27 21:42 EST

# D5 mockup — `photo` (photo-led)

## The idea in 3 lines
The three existing photographs become the emotional anchor, and marketing2's words sit on top of them or beside them.
The glowing shoebox is the hero, the case under the bed sits beside "Help them find a starting point", and the heirloom books sit beside "Leave practical guidance".
The open shoebox then frames "What they'll receive". No product screenshots, and no wording changes beyond alt text.

## Which image goes where, and why
| Page / section | Image | Treatment | Why |
|---|---|---|---|
| `/marketing2` hero | `shoebox-hero.webp` (hero_shoebox, mirrored) | Desktop: photo fills the right 66% and fades into the dark on the left, with the headline on the left. Mobile: photo band across the top 52vh, text below it | The box of keepsakes is the product's metaphor. It is mirrored so the glow sits opposite the text |
| Kitchen story ("Help them find a starting point") | `trunk-under-bed.webp` | Split: 4:5 framed photo on the left, text on the right. The existing `kitchenPunchline` line is reused as the photo caption | "Where to look" next to a case tucked under the bed |
| The Weight ("Leave practical guidance alongside your memories") | `heirloom-books.webp` | Split, reversed: text left, photo right | Records kept over years, the "practical + memories" pairing |
| The Gift ("What they'll receive") | `shoebox-glow.webp` (1024×600 crop of the box opening) | Rounded 1024-wide photo band; the title sits on its lower edge, and the three cards are made opaque and sit below it | The thing they receive is the open box |
| `/marketing2/how` beats 01/02/03 | glow → books → trunk | The icon orbs are replaced by 4:3 framed photos that alternate sides on desktop and sit above the text on mobile | Start (opening the box), build over time (the stack), keep a useful copy (kept safe) |
| `/marketing2/features` hero | `shoebox-glow.webp` | Full-width photo behind "What's inside", with a 50% scrim and a bottom fade | "What's inside" is literally the opened box |
| `/marketing2/features` "And more" | `heirloom-books.webp` | Split with the two existing lines | Breaks up the text-only tail |

The Guide, Pulse, Distinction, Security, signup and footer sections keep their original text-only layout.

## New image files (all in `frontend/static/images/m2/`, served by the app)
Made from the existing PNG originals with macOS `sips` (mirror and crop) and `cwebp` (WebP, quality 72–78):
- `shoebox-hero.webp` — 58 KB (1024², mirrored hero_shoebox)
- `shoebox-glow.webp` — 50 KB (1024×600 crop of hero_shoebox)
- `trunk-under-bed.webp` — 74 KB (1024², premium_hero_shoebox_under_bed_cinematic)
- `heirloom-books.webp` — 61 KB (1024², heirloom_books_placeholder)

That is 243 KB in total, against roughly 0.7 MB for each original PNG.

## What it would take to ship
- Files touched: `frontend/src/routes/marketing2/+page.svelte`, `how/+page.svelte`, `features/+page.svelte`, plus the 4 WebP files. The dictionary is unchanged.
- On the How page, the old icon-orb CSS was removed and two selectors were made `:global`, which keeps `svelte-check` at 0 errors and 0 warnings. The `iconAnimate` function and the `icon` fields are now unused but still in place, and could be removed on ship.
- New alt text is English-only, written as literal strings rather than taken from the dictionary. Shipping should move it into `marketing2Dictionary.ts` for all languages.
- `/` → `/marketing2`: yes, redirect `/` once this is chosen, so the shoebox hero isn't on two different pages. Then retire the old `/` page's image usage.

## Weakest part of this direction
There are only three photographs, and they are AI-generated stills at 1024 px. Every page reuses the same three, so by the How page the shoebox, books and case have all appeared twice.

They also run out halfway down the home page: Guide → Pulse → Distinction → Security is still one long text-only stretch, about 2,000 px at 1440 wide.

At full desktop width the hero is upscaled about 1.4×. It is softened by the fade, but the "photos" inside the box are blurry blobs up close (visible in the Gift band). The trunk and books images are period-styled (a four-poster bed, an antique library), which leans more "estate" than "family".

A real shoot, or 3–4 more commissioned images (hands writing a letter, a kitchen table, a phone check-in), would be needed for this to hold up past the first scroll.

## Screenshots
`marketing2.png`, `how.png`, `features.png` (1440 wide, full page), `marketing2-390.png` (plus `how-390.png`, `features-390.png`). There are no page errors or failed requests, and there is no horizontal overflow at either width.
