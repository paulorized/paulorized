# CannaBaseAI Mobile UI Kit

Pixel-faithful recreation of the CannaBaseAI PWA, built as a click-thru prototype.

## Screens

Click the footer nav to switch between:

1. **Scan** — multi-step scan flow entry (upload → extracting → results).
2. **Community** — feed with tier badges, star ratings, effects/flavors, helpful votes.
3. **StrainAI** — strain lookup with Leafly-verified vs AI-estimate badges, THC range, effects, wishlist.
4. **Stats** — dashboard with KPIs, terpene profile, stash calculator, strain-type pie.
5. **Review** — the review form with rating, effects, flavors, would-buy-again, notes.

## Files

- `index.html` — the interactive prototype (loads the JSX below via Babel)
- `app.jsx` — the `App` shell: header wordmark, nav row, screen router
- `scan.jsx` — Scan screen
- `community.jsx` — Feed card + tier legend
- `strain-search.jsx` — Strain lookup
- `stats.jsx` — Stats dashboard (KPIs + stash calculator + terpene profile)
- `review.jsx` — Review form

## Source fidelity

Every component was built by reading the original TSX:

- `app/layout.tsx` → `AppShell` header with tri-color wordmark + 6-link nav
- `app/community/page.tsx` → `FeedCard`, `Stars`, `Avatar`, `TierLegend`
- `app/strain-search/page.tsx` → `StrainResultCard`, strain-type badges, Leafly vs AI pill
- `app/dashboard/page.tsx` → `StatCard`, `StashCalculator`, `TerpeneStatsPanel`
- `components/review-form.tsx` → `ReviewForm` (rating, effects, flavors, pre-roll toggles, would-buy-again, notes)

Styles are hand-rolled CSS using tokens from `../../colors_and_type.css` so the kit is
Tailwind-free but visually identical to the production Tailwind classes.
