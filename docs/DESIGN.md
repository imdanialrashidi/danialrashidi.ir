# Product Design Contract — danialrashidi.ir (Persian personal home)

## Owner direction

Owner-stated choices (from 2026-10-06 brief; preserved across sessions, revised only by explicit owner change):

- Owner-stated style: minimal editorial + modern creative personal website. Professional, personal, calm, visually distinctive, intentionally designed, image-friendly, refined rather than flashy. A real person's digital home, not a portfolio template.
- Exact identity: only permanent name is `دانیال رشیدی`. No university, professor, faculty, student ID, or institutional branding.
- Real links to reuse: `imdanialrashidi.github.io`, `@imdanialrashidi`, `https://t.me/imdanialrashidi`. Email `imdanialrashidi@gmail.com`, GitHub `github.com/imdanialrashidi`, Instagram `instagram.com/imdanialrashidi` (all observed on the English reference site). Do not invent contact details or payment data.
- IA: main `خانه / درباره / پروژه‌ها / سفرها / ارتباط`. `حمایت از پروژه‌ها` is a discoverable secondary destination, not the main focus.
- Homepage story order: strong editorial hero (who / what I build / what kind / where next) → Selected Projects → About snapshot → Travel/photo preview → Instagram → Support → Contact. One obvious primary CTA toward projects, one quieter secondary CTA.
- Must avoid: generic SaaS dashboard layouts; excessive rounded cards; random gradients; glassmorphism; giant decorative blobs; repetitive card grids; excessive badges/statistics; generic hero illustrations; unnecessary animation; overly polished-but-empty copy.
- Themes: Light + Dark, both intentionally designed.
- Motion: subtle and purposeful, with proper `prefers-reduced-motion` behavior.
- Locales: Persian only, RTL, `lang="fa" dir="rtl"`.
- Tech constraint: Astro + TypeScript + Tailwind + Content Collections/Markdown, React islands only where genuinely useful. Static-first, no backend/DB/auth/CMS/runtime AI.
- Responsive baseline: 320 / 360 / 390 / 430 / 768 / 1024 / 1360. Mobile is first-class recomposition, not shrunken desktop.
- Canonical code token source: `src/styles/tokens.css` (proposed; owns resolved values once implemented).
- Owner-stated personal-site upgrades (2026-10-06 fa brief, preserved until explicit change): hero must reserve a real portrait slot for Danial's own photo; every project gets its own image slot; social links get recognizable line icons; add tasteful (باحال ولی سنگین‌نشده) animations; support page shows a real card number driven by ONE variable the owner edits in a single file; ONE config file owns all social/contact links so changing its variables updates the whole site; overall site must feel more like a real person's home (availability, now, human notes). Page changes must feel instant — no visible loading between pages. The header logo must be fixed and become genuinely beautiful. No new colors, fonts, or locales requested — palette/type/motion restraint above still apply; new agent-proposed details are labeled separately in the decision log.

## Experience brief

- Product / surface: danialrashidi.ir — Danial Rashidi's Persian digital home.
- Primary audience: Persian-speaking visitors (friends, collaborators, employers) meeting Danial for the first time, plus returning readers checking projects and travel notes.
- Single job of this surface: in under 30 seconds, answer who Danial is, what he builds, and where to go next — then carry the visitor through projects, a human about-note, travel fragments, and a quiet way to stay in touch or support the work.
- Desired user feeling before → after: before — "another portfolio template?" → after — "this is clearly one person's desk; I know what he cares about and what to open next."
- Success signal: a first-time visitor can name Danial, one thing he builds, and the primary next step (projects) without scrolling past the hero.

## Brand character

- Editorial, not templated — margins, rules, and numbering do the decorating.
- Warm and human, not corporate — paper tones, hand-set Persian, first-person notes.
- Precise, not sterile — one signature gesture, everything else disciplined.
- Quietly confident, not salesy — proof over promise, support page never shouts.

## Reference calibration

| Reference / local image | Owner preference | Adopt / avoid and reason | Inspection status |
|---|---|---|---|
| English reference `https://imdanialrashidi.github.io/` (fetched 2026-10-06) | unspecified (provided as identity reference, explicitly NOT to clone/translate) | Adopt: real project list (Fast English, Noveno, Elsa Hamrah, Isbatab, Mobile Khorsandi, PHP IELTS House), honest "no fabricated UI" stance, direct-email contact, calm shipping tone. Avoid: English IA, card-heavy work grid, generic SaaS feel; Persian site must feel more personal/editorial. | inspected (text fetch, not pixel) |
| No supplied mockups or screenshots | — | No visual cloning; direction below is original. | not inspected (none supplied) |

## Direction

- Visual thesis: a quiet Persian editorial desk — warm paper, ink text, hairline rules, and generous whitespace carry the design; one deep-green seal color and one oversized handwritten-feeling signature give it a single unmistakable owner.
- Signature element: the `دانیال رشیدی` masthead-as-signature — oversized display setting of the name with a hand-drawn-feel underline stroke, repeated at reduced scale as section sign-off ("— دانیال") and footer seal. Section indices (`۰۱ / پروژه‌های منتخب`) set in the margin with a hairline rule are the secondary recognition device.
- Aesthetic risk or intentional restraint: intentional restraint is the risk — no hero illustration, no gradient, no card wall. Personality comes from typography scale, asymmetric editorial rhythm, and one ink-green seal, not decoration. Featured projects get large editorial spreads; everything else stays compact rows.
- What must feel familiar: Persian blog/editorial conventions — right-aligned RTL reading, clear section numbers, quiet footer colophon.
- What must never look generic: rounded-card grids, badge/stat strips, glass panels, gradient blobs, stock illustrations.

## Semantic tokens (agent-proposed; NOT owner-approved hex — to be verified for contrast after implementation)

### Color — Light (default)

| Role / state | Theme | Proposed value | Foreground/background pair | Contrast proof |
|---|---|---|---|---|
| canvas | light | `#FAF7F1` paper | ink `#1C1B19` on canvas | measured 16.10:1 ✓ |
| surface | light | `#FFFFFF` | ink on surface | to measure |
| text | light | `#1C1B19` | on canvas/surface | measured 16.10:1 ✓ |
| muted text | light | `#6E675E` | on canvas | measured 5.22:1 ✓ (AA) |
| action bg / on-action | light | `#1E4D3B` deep green / `#FAF7F1` | button text on action | measured 9.01:1 ✓ |
| accent (numbers, rules detail, hover) | light | `#9A3412` terracotta (text use) | on canvas | measured 6.83:1 ✓ (AA); decorative rules may use lighter `#C9BFAE` (non-text) |
| border / focus | light | border `#E4DAC8` hairline; focus `#1E4D3B` 2px outline | — | non-text 3:1 where required; focus visible |
| danger / success | light | reuse ink + text explanations; no invented status palette | — | — |

### Color — Dark (intentionally designed, not inverted)

| Role / state | Theme | Proposed value | Foreground/background pair | Contrast proof |
|---|---|---|---|---|
| canvas | dark | `#131511` deep ink-green | text `#ECE7DB` on canvas | measured 14.89:1 ✓ |
| surface | dark | `#1B1E1A` | text on surface | to measure |
| text | dark | `#ECE7DB` | on canvas/surface | measured 14.89:1 ✓ |
| muted text | dark | `#A9A294` | on canvas | measured 7.25:1 ✓ (AA) |
| action bg / on-action | dark | `#ECE7DB` paper button / `#131511` text | button text on action | measured 14.89:1 ✓ |
| accent | dark | `#D8A36C` warm sand (large/secondary use; body links use text + underline) | on `#131511` | measured 8.20:1 ✓ |
| border / focus | dark | border `#2C312B`; focus `#ECE7DB` 2px outline | — | focus visible on dark |

### Typography

| Role | Family / fallback | Scale / weight / leading | Purpose |
|---|---|---|---|
| display (Persian name, headlines) | Vazirmatn (OFL, self-hosted via `@fontsource/vazirmatn`) / fallback `Tahoma, "Segoe UI", sans-serif` | display clamp(2.6rem→4.5rem)/800/1.15; H2 clamp(1.5→2.1rem)/700/1.3 | authorship + hierarchy; personality carrier |
| body | Vazirmatn / same fallback | 1rem–1.125rem/400/1.9 (Persian needs tall leading) | reading; max ~65ch |
| utility / data (latin handles, meta, numbers) | `IBM Plex Mono` or system `ui-monospace` for latin + Persian digits where appropriate | 0.8–0.875rem/500/1.6, tracking slight | handles (`imdanialrashidi.github.io`), section indices, dates |

Font source/license: Vazirmatn OFL-1.1, self-hosted (no third-party font CDN at runtime). Fallback preserves hierarchy if webfont fails.

### Geometry and depth

- Spacing/rhythm: 4px base, section rhythm 96px desktop / 64px mobile; hairline 1px rules between editorial blocks, no shadows.
- Grid/content measure: max 1120px container; prose ≤ 65ch; hero asymmetric (RTL: text 7fr / visual 5fr desktop, stacked mobile).
- Radius logic: restrained — 2px for hairline frames, 10px max for photo frames only; no pill cards; buttons 8px.
- Border/shadow logic: borders (1px `border` token) instead of shadows everywhere; images get 1px frame + 12px offset paper shadow in light only; dark uses border only.
- Icon/media treatment: inline SVG line icons (1.5px stroke), no emoji icons; photos keep natural color, slight warm treatment via border/paper frame.

### Media and art direction

- Language: real photos only where owned; project previews use honest framed panels (no fabricated browser mockups); travel uses small purposeful crops with alt text; missing assets get typographic placeholder panels, never stock illustrations.
- Subject/framing: portraits and desk details at 4:5 or 1:1; project screenshots at NATURAL aspect — whole image visible, no crop (owner request 2026-10-07); travel strips 4:3.
- Asset source: local `src/assets/` only; no hotlinked screenshots (thum.io not used at runtime); provenance noted in code comments.
- Responsive art: images `aspect-ratio` reserved, `loading="lazy"` below fold, `decoding="async"`; hero visual eager + `fetchpriority="high"`.
- Alt-text: meaningful Persian descriptions; decorative signature stroke `aria-hidden`.

## Composition and responsiveness

- Desktop composition: sticky slim masthead (signature right, nav center, theme toggle + Telegram CTA left in RTL); hero asymmetric with margin index; numbered sections separated by hairline rules; featured projects as large 2-col spreads; compact projects as ruled rows; travel as 3-up strip; Instagram as single quiet band; support as bordered note (not hero); contact as large email line + link rows; footer colophon with signature seal.
- Mobile recomposition: single column; masthead condenses to signature + menu button + theme toggle (all ≥44px targets); hero stacks (text first, visual second, cropped 16:10); spreads become stacked image-then-text; travel strip becomes horizontal snap scroll; tables/rows become stacked definition rows; no horizontal page overflow at 320px.
- Dense/long-content: project detail pages use prose measure with sticky side meta that stacks on mobile.
- Supported viewports: 320 / 360 / 390 / 430 / 768 / 1024 / 1360.
- RTL: `dir="rtl"`, logical properties only (`margin-inline-start` etc.), no physical left/right in layout CSS; latin handles keep `dir="ltr"` spans.

## Components and states

| Component / pattern | Variants | Required states | Reuse or change |
|---|---|---|---|
| Masthead + mobile menu | expanded/collapsed | default / hover / focus-visible / open / reduced-motion (no slide) | new |
| Theme toggle | light/dark | default / hover / focus-visible / pressed (`aria-pressed`), persisted `localStorage`, respects `prefers-color-scheme` initially | new |
| Buttons | primary (seal green), quiet (outline/text) | default / hover / focus-visible / active / disabled | new |
| Project spread / row | featured / compact | default / hover (title underline + image shift only) / focus-visible | new |
| Travel strip card | photo / note | default / hover / focus-visible | new |
| Support config panel | configured / unconfigured | unconfigured shows honest "به‌زودی" + contact alternative; never fake numbers | new |
| Contact rows | link rows | default / hover / focus-visible | new |

Journey states: loading (native, no SPA spinner — instant static HTML); empty (travels/support graceful copy, no blank gaps); error (404 page with wayfinding, Persian); success (n/a — no forms); offline (static pages work offline after first load; no SW in v1).

## Motion and feedback

- Orchestrated moment: hero signature underline draws once on first paint (600ms ease-out, CSS only). Disabled under `prefers-reduced-motion` (static underline).
- State-transition motion: 150ms color/underline transitions on links/buttons only; no scroll-jacking, no reveal-on-scroll library.
- Duration/easing tokens: `--dur-fast: 150ms; --dur-slow: 600ms; --ease-out: cubic-bezier(.2,.7,.2,1)`.
- Reduced-motion alternative: `@media (prefers-reduced-motion: reduce)` kills draw + transitions (instant state changes).

## Content voice (no-ai-slop, Persian-first)

- Vocabulary/tone: first-person, concrete, calm. Name real things (Noveno, the four client sites). No "تحول‌آفرین / پیشگام / توانمندسازی" puffery. Short sentences mixed with longer explanatory ones; Persian punctuation natural.
- Action labels: `دیدن پروژه‌ها` (primary), `بیشتر درباره‌ی من` (secondary), `خواندن سفرها`, `دنبال کردن در اینستاگرام`, `گفت‌وگو در تلگرام`.
- Error/empty: honest and useful ("این سفر هنوز عکسی ندارد — در اینستاگرام ببینید.").
- Fixtures: 5 real projects (Noveno featured + 4 client sites, each with a real screenshot) with year/status/tech/live/featured; 3 travel notes (owner's picks: Yakh-Morad cave mapping 1404, Dareh-Marg canyoning 1404, Dalakhani canyoning 1403 — old Tochal/Masuleh/Maranjab removed per owner 2026-10-07); trip photos wired via `image:` when the owner drops files in `public/images/travels/`; support methods from `src/config/support.ts` (empty by default → honest empty state).

## Quality budgets

- Accessibility: WCAG 2.2 AA; text ≥ 4.5:1 (large ≥ 3:1); focus visible; 44px touch targets; keyboard-operable menu/toggle; meaning never color-only.
- Performance: static HTML, zero client JS except theme-toggle + menu (~2KB); images local + lazy; LCP target ≤ 2.5s lab; no third-party embeds (no heavy Instagram embed).
- SEO: per-page title/description/canonical/OG, `sitemap.xml`, `robots.txt`, favicon (inline SVG seal), `lang="fa" dir="rtl"`, absolute canonical `https://danialrashidi.ir/`.
- Browsers/inputs: evergreen Chromium/Firefox/Safari, keyboard + touch + mouse.

## Screen acceptance

| Flow / screen | Critical states | Viewports/locales | Visual proof |
|---|---|---|---|
| Home (hero → projects → about → travel → instagram → support → contact) | default, dark, 320px, reduced-motion | 390 + 1360, fa/RTL | desktop + mobile screenshots, inspected |
| About | default, dark | 390 + 1360 | snapshots |
| Projects index + one detail | featured/compact, dark | 390 + 1360 | snapshots |
| Travels + Instagram band | default, images lazy | 390 + 1360 | snapshots |
| Support | configured + unconfigured (honest empty) | 390 + 1360 | snapshots |
| Contact section + 404 | default, focus/keyboard | 390 + 1360 | keyboard pass |

## Decisions intentionally deferred

- Real portrait photography — DONE 2026-10-07: owner supplied `public/images/Danial_photo.jpg` (855×1138 studio headshot); wired via `PROFILE.photoSrc`, used in hero + about + `og:image`. `public/images/profile.svg` retired as fallback. Travel covers still SVG starters until owner supplies trip photos.
- Payment rails for support (config-driven; no numbers invented).
- Blog/notes section (not in this slice).

## Agent-proposed details for this slice (NOT owner-approved; reversible)

- Single source of truth stays `src/config/site.ts` (profile + socials + contact), payment stays `src/config/support.ts` (`SUPPORT_CARD` + `SUPPORT_METHODS`, both empty by default). Components never hard-code links or card data.
- Image slots: `public/images/profile.svg` (owner replaces with `profile.jpg` + one variable), `public/images/projects/<slug>.svg` + `public/images/travels/<key>.svg` wired via new optional `image:` frontmatter; `ProjectImage`/`TravelImage` render real `<img>` when set, honest typographic panel otherwise. No hotlinked screenshots, no stock.
- Icons: inline SVG line set (1.5px) in `SocialIcons.astro` — GitHub/Telegram/Instagram/Email/X/Web — reused in hero, contact, footer, Instagram band.
- Motion (restrained, reduced-motion-safe): signature draw (existing) + staggered hero entrance + IntersectionObserver `.reveal` + availability pulse + frame hover lift. No scroll-jacking, no library.
- Instant navigation (agent-proposed; owner asked "no loading, direct"): Astro `<ClientRouter />` — same-document view transitions with a soft fade; full reload stays as the no-JS/unsupported fallback. One shared inline script registers document-level handlers once (window guard) and re-inits `.reveal` + theme-toggle state on `astro:page-load`; `::view-transition` animations are killed under `prefers-reduced-motion`.
- Header wordmark (agent-proposed; owner asked "fix + beautify", then rejected the boxed seal as generic): `BrandMark.astro` — NO boxed mark; the name itself is the logo in extrabold, underlined by a miniature of the signature stroke + mono domain. The signature stroke redraws once on hover. Reused in masthead + footer.

## Decision log

| Date | Decision | Evidence / rationale | Revisit when |
|---|---|---|---|
| 2026-10-06 | Editorial-desk thesis + signature masthead as the single signature device; deep-green seal + paper palette (proposed hex, contrast to be measured) | Owner brief demands personal/editorial, anti-template; green + paper gives calm Persian-editorial feel distinct from SaaS blue | When contrast measurement fails or owner picks exact colors |
| 2026-10-06 | Vazirmatn self-hosted, Tahoma fallback; mono for latin handles | Persian readability + offline/static budget; OFL license | If font budget exceeds performance target |
| 2026-10-06 | No Instagram embed; static preview + CTA to real profile | Owner performance constraint; third-party embeds banned for LCP | If owner requests live feed (re-evaluate budget) |
| 2026-10-06 | Vazirmatn self-hosted via @fontsource/vazirmatn (400/500/700/800) imported in Base.astro; fake local-only @font-face removed after screenshot showed fallback rendering | First-pass screenshots rendered Tahoma fallback; re-capture after fix shows Vazirmatn | If font subset budget (>800KB dist) becomes a problem |
