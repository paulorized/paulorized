# CannaBaseAI Design System

A mobile-first, dark-mode cannabis product tracker. Users scan product labels with AI, log their sessions, discover strains via Leafly + AI fallback, and share reviews with a community feed. Built as a Next.js + Tailwind PWA.

## Index

- `README.md` — this file
- `colors_and_type.css` — CSS variables for the full palette + type system
- `fonts/` — webfont files (Montserrat display; Inter fallback for body/UI)
- `assets/` — logos, icons, and visual assets
  - `assets/icons/` — terpene icons + UI glyphs (PNG, `mix-blend-mode: screen`)
  - `assets/logos/` — wordmarks and app icons
- `preview/` — design-system preview cards (swatches, type specimens, component states)
- `ui_kits/mobile/` — mobile PWA UI kit (Scan, Community feed, Strain search, Stats, Profile)
- `SKILL.md` — agent-skill entrypoint

## Sources

This system is derived from the user-provided GitHub repo:

- **Repo:** `paulorized/paulorized` (main branch)
- **Key files read:**
  - `app/layout.tsx` — root layout, header nav, brand wordmark
  - `app/page.tsx` — scan flow entry
  - `app/dashboard/page.tsx` — stats + recharts treatment, stash calculator, KPI cards
  - `app/strain-search/page.tsx` — strain lookup + Leafly-vs-AI badges
  - `app/community/page.tsx` — feed, tiers, user cards, helpful votes
  - `components/review-form.tsx` — rating, effects, flavors, edible/pre-roll/vape sections
  - `app/globals.css`, `public/manifest.json`
- **Icon set:** custom PNGs in the repo's `public/icons/` (terpene-*.png, ui-leaf.png, apple-touch-icon.png, icon-192.png, icon-512.png) — not importable via GitHub's text-file API. **See caveats below.**

---

## Brand at a glance

**Name:** CannaBaseAI (spoken "Canna-Base-A-I"). Wordmark is always tri-colored:
`Canna` → `emerald-400`, `Base` → `purple-400`, `AI` → `yellow-300`. Display font is **Montserrat** (700/800). The three accent colors map to the three product pillars and recur everywhere:

| Pillar    | Color          | Used for                                             |
|-----------|----------------|------------------------------------------------------|
| Canna 🌿  | `emerald-400`  | scans, hybrid strains, primary CTAs, "verified"     |
| Base 💜   | `purple-400`   | indica strains, wishlist, edibles, community stats   |
| AI ✨      | `yellow-300`   | StrainAI feature, sativa strains, ratings, warnings  |

**Base surface:** `zinc-950` (`#09090b`). Everything is built on this; there is a barely-used light mode (`html.light-mode` overrides) — assume dark.

---

## Content fundamentals

**Voice:** Friendly, plainspoken, pro-consumer. Never clinical. Never sales-y. The app talks like a knowledgeable friend at a dispensary counter.

**Casing:**
- Page titles: sentence case → "Strain Search", "Community", "Your top strains"
- Section headers inside pages: SHOUTY sentence case in `tracking-widest text-xs uppercase text-zinc-500` → `PREVIOUSLY SCANNED`, `TYPICAL EFFECTS`, `BEST FOR`
- Buttons: sentence case, verb-first → "Save review", "Add to Wishlist", "Load more", "Scan something →"
- Labels: Title Case for proper nouns, sentence case for prompts

**Person:** Second-person ("you", "your"). First-person is used sparingly for user self-reference only ("Me" tab, "your top strains").

**Emoji:** **Used deliberately** as a content device, NOT as decoration. They carry meaning:
- Tier badges: 🌿 Seedling → 🌱 Grower → 🍃 Connoisseur → 🌳 Legend
- Strain types: ☀️ sativa / 🌙 indica / ⚡ hybrid / 🌿 unknown
- Pre-roll burn: 🐢 slow / 👌 medium / 🔥 fast
- Edible dose feedback: 👌 same / ⬇️ lower / ⬆️ higher
- Body/head/both: 💪 / 🧠 / ✨
- KPI cards: 🌿 Highest THC Flower · 🚬 Highest THC Pre-roll · 🧬 Strains Tried · 🏆 Go-To Product · 🏷️ Top Brand · 💨 Most Popular Type

**Sample copy** (verbatim from source):
- Hero description: "Scan cannabis product labels, track your collection, and log your experience."
- Community subtitle: "See what others are scanning and smoking. Write reviews to earn helpful votes and level up your rank."
- Stash calc: "Your stash, broken down" — "{N}g logged — tap any unit to highlight"
- Strain search placeholder: "e.g. Blue Dream, Cherry, Gelato..."
- Strain-not-found: "We couldn't find info on that strain. Try a different name."
- Review tooltip: "Reviews with notes can be marked helpful by the community — helpful votes level up your rank 🌿→🌳"
- Empty state: "No personal stats yet" / "Start scanning products to see your data here."

**Tone rules:**
- Never say "cannabis consumption" — say "smoked", "logged", "scanned", "tried".
- Say "logs", not "records" or "entries".
- Say "nugshot" for flower photos (app-specific term).
- Say "stash" for the user's total logged weight.
- Soft em-dashes and ellipses are fine; quote marks around user content use curly `"` `"`.
- Errors are apologetic and short: "Network error. Please try again." / "Could not load stats" / "Try refreshing the page."

---

## Visual foundations

**Grid / layout:**
- Mobile-first. Max content width `max-w-2xl` (672px) centered with `px-4 py-8`.
- Sticky header (`top-0 z-50`) with `bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/60`.
- 8px vertical rhythm (Tailwind spacing-2/3/4/5/6/8).
- Two-row header on logged-in: brand wordmark + bell/avatar on top, nav links below.
- 44px minimum touch targets for buttons.

**Color palette (Tailwind zinc + accents):**
- Surfaces (dark→light): `zinc-950` body · `zinc-900/60` card · `zinc-800` input · `zinc-700` subtle-fg · `zinc-600/500` muted text · `zinc-400/300` primary text · `zinc-100` headline
- Accents come in translucent tiers — `bg-{hue}-500/10` fill + `border-{hue}-500/30` border + `text-{hue}-300` or `{hue}-400` text. This is the pill/chip pattern used EVERYWHERE (effects, flavors, dispensary, edibles, etc.).

**Typography:**
- Display: **Montserrat 700/800** — only for the brand wordmark in the header. Everything else uses the default sans (system stack in the deployed app).
- Sizes: `text-2xl` (24px) page titles · `text-xl` (20px) result titles · `text-sm` (14px) body · `text-xs` (12px) meta · `text-[10px]` / `text-[11px]` for ultra-dense chart labels and uppercase eyebrow labels
- Weights: `font-bold` for numeric KPIs + page titles, `font-semibold` for eyebrows + chip labels, `font-medium` for button text, regular for body
- Eyebrow pattern: `text-xs font-semibold uppercase tracking-widest text-zinc-500/600`
- Italics for user-quoted review notes: `text-sm text-zinc-300 italic` wrapped in curly quotes

**Radii** — notably **large and rounded**, never sharp:
- `rounded-full` → avatars, pills, chips, "tier" dots
- `rounded-2xl` (16px) → cards, KPI tiles, content containers (most common)
- `rounded-xl` (12px) → buttons, inputs, tab rows, secondary containers
- `rounded-lg` (8px) → nav items, small buttons, sort chips
- `rounded-md` (6px) → avoid; not used

**Borders:**
- Hairline `border-zinc-800` for cards at rest.
- `border-zinc-700` for inputs and hoverable surfaces.
- Accent borders use `/25` or `/30` alpha, e.g. `border-emerald-500/30`.
- Card background is always `bg-zinc-900/50` or `bg-zinc-900/60` — translucent over zinc-950 for a subtle layering effect.

**Shadows:**
- Almost never used. The design leans on translucent borders + layered zinc tints instead of shadows.
- Exceptions: dropdowns / suggestion menus get `shadow-xl`. Lightboxes get `shadow-2xl`.

**Transparency & blur:**
- `backdrop-blur-md` on the sticky header.
- `backdrop-blur-sm` on the lightbox overlay (`bg-zinc-950/90`).
- Card backgrounds use alpha (`/50`, `/60`) to let the zinc-950 page bleed through slightly.
- Accent tints always use alpha (`/10` fill, `/20` stronger fill, `/25`–`/40` border).

**Backgrounds & imagery:**
- No hero images, no full-bleed photography. Interior surfaces are solid zinc.
- Icons are PNGs with **`mix-blend-mode: screen`** so they light up over the dark background — this is the signature visual move.
- User-generated "nugshot" photos appear as `rounded-xl` thumbnails with `max-h-64`, `object-cover`, and `border border-zinc-700/60`.
- No gradients for decoration. (The only gradient-feeling surface is the zinc-900 card sitting on zinc-950.)

**Motion / animation:**
- `transition` + default duration (~150ms) on every interactive state — universal.
- `hover:bg-zinc-700` / `hover:text-zinc-200` / `hover:brightness-110` — subtle lightening.
- `hover:opacity-80` on avatars.
- `animate-pulse` skeleton loaders — standard Tailwind.
- Disclosure arrows rotate: `transition-transform duration-200 rotate-180`.
- No spring physics, no custom easing, no bounces.

**Hover states:**
- Cards: lighten border to `zinc-700` and bg to `zinc-900`. Sometimes the border color shifts to an accent: `hover:border-emerald-500/40`.
- Buttons: lighten one step (e.g. `bg-emerald-400` → `hover:bg-emerald-300`).
- Text links: shift from zinc-400/500 → zinc-100/200, or shift to accent color (`hover:text-emerald-400`).

**Press / active states:**
- Buttons rely on `:disabled` + `disabled:opacity-50` for loading; no explicit active-press scale.
- Selected toggle chips swap from `border-zinc-700 bg-zinc-900` to `border-{accent}-500/50 bg-{accent}-500/20 text-{accent}-300`.

**Focus:**
- `focus:border-emerald-500 focus:outline-none` on inputs. No ring.

**Layout rules for fixed elements:**
- Sticky header only; no bottom nav. Navigation is a second row in the header.
- Lightbox is `fixed inset-0 z-50` with a close button at top-right.

---

## Iconography

CannaBaseAI uses **three icon sources**, each for a specific purpose:

1. **Custom PNG set** (`public/icons/` in the repo) — the signature visual. Rendered with `mix-blend-mode: screen` so white/colored pixels glow on dark surfaces. This is where all **terpene icons** live:
   - `terpene-myrcene.png`, `terpene-limonene.png`, `terpene-caryophyllene.png`, `terpene-linalool.png`, `terpene-pinene.png`, `terpene-terpinolene.png`, `terpene-ocimene.png`, `terpene-humulene.png`, `terpene-bisabolol.png`, `terpene-nerolidol.png`
   - `ui-leaf.png` — fallback UI glyph
   - `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` — PWA app icons
   - Terpene icons render at `w-4 h-4` in inline chips, `w-5 h-5` in the terpene panel.

2. **Inline SVGs in React** — small, purposeful, `strokeWidth={2}` flat icons for UI chrome:
   - Map pin for dispensaries: a teardrop path
   - Bookmark for wishlist: `path d="M19 21l-7-5-7 5V5..."`
   - Thumbs-up for helpful: standard heroicons silhouette
   - Person silhouette for avatar fallback
   - X/close for lightbox
   - All hand-written as `<svg width={N} height={N} viewBox stroke fill>`
   - Coded colors via `stroke="currentColor"`.

3. **Emoji as semantic icons** (see Content Fundamentals) — not decorative.

**Unicode** is used occasionally in place of icons where typographic: `★` for stars, `&#10003;` (✓), `&#10007;` (✗), `▾` for disclosure, `·` as a separator.

**Substitution flag:** The repo's binary PNG icons could not be programmatically imported via the GitHub tools (text-file API). In `assets/icons/` we provide CSS recreations + placeholder strokes. **Please upload the real PNGs** (see CAVEATS section) so terpene panels render accurately.

---

## Key UI patterns

- **Tri-color wordmark** — emerald/purple/yellow "CannaBaseAI" in bold Montserrat.
- **Accent-tinted chips** — filterable tags as pill-shaped `border + bg` pairs in the accent for their category (emerald for effects, amber for flavors, purple for edibles, rose for dispensaries, etc.).
- **KPI grid** — 2-column responsive grid of `rounded-2xl bg-zinc-900/50 border-zinc-800` cards with uppercase eyebrow, big number, small caption.
- **Expandable feed cards** — header → quote → tags → action row with "Helpful / Details / Tier badge / Delete", optional details panel with terpene icons, smoke quality tiles, and full effects/flavors.
- **Progress bars** — `h-2 rounded-full bg-zinc-800` track with colored fill using inline `background: hex`.
- **Recharts dark styling** — `stroke="#27272a"` grid, `#71717a` ticks, `#18181b` tooltip with `border: 1px solid #3f3f46`, accent-matched bar/line fills (`#10b981` emerald, `#8b5cf6` purple, `#f59e0b` amber).
- **Tier system** — avatar with emoji badge in bottom-right corner (`absolute -bottom-1 -right-1`).

---

## CAVEATS / asks for you

1. **Real icon PNGs not available.** GitHub's text-file API can't fetch binary images; `public/icons/` wasn't importable. The system uses CSS recreations plus inline SVG placeholders. Please upload the real PNGs (terpene set + PWA icons) so terpene panels + app icon look native.
2. **No Figma / brand book was attached** — everything is reverse-engineered from code. Brand rules (wordmark spacing, minimum size, incorrect usage) are best-guess. Upload a brand guide if one exists.
3. **Font substitution.** The repo uses `Montserrat` via `next/font`. We've pulled Montserrat from Google Fonts at 700/800. Body/UI text has no explicit font in the code (system stack); we're substituting **Inter** as a reasonable default — let me know if you have a specific body font preference.
4. **Mobile-only product.** We haven't built a marketing website or desktop UI kit — the product is one surface. Confirm if you'd like additional kits.

**Iterate with me:** reply with the real icon set + any brand guide, and I'll regenerate the swatches/cards so they match perfectly.
