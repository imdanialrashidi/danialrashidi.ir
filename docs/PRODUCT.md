# Product

Own the problem, users, and outcomes. Keep this short and current.

## Problem

Danial Rashidi's work is spread across an English reference site, GitHub,
Instagram, and Telegram. A Persian-speaking visitor has no single place that
explains who he is, shows the real projects with real screenshots, and offers a
direct next step. The old English site also does not reflect the intended
Persian, RTL, editorial identity.

## Users

- **Primary:** Persian-speaking friends, collaborators, employers, and clients
  meeting Danial for the first time.
- **Secondary:** returning readers checking projects, travel notes, or contact
  links.
- **Operator:** Danial, who edits configuration and Markdown content and deploys
  through GitHub Pages.

## Outcomes

- In under 30 seconds, a first-time visitor can name Danial, one thing he
  builds, and the primary next step (projects).
- Projects read as real work: real screenshots, honest status, live links, and
  current years.
- The human side is present without performance: a short about note, travel
  fragments, and a quiet support path.
- Contact and support are direct and honest; no invented numbers, testimonials,
  or payment rails.

## Non-goals

- Backend, database, auth, CMS, forms, or runtime AI.
- Blog/notes section, English locale, or live Instagram embed.
- Analytics, tracking, or third-party embeds that threaten the performance
  budget.
- E-commerce or payment processing; support is configuration-driven.

## Success signals

- The live site serves the accepted routes with no console errors, failed
  requests, or horizontal overflow at 390 and 320 CSS px in the browser QA
  report.
- Lab LCP target ≤ 2.5 s; static HTML; no third-party embeds.
- WCAG 2.2 AA: keyboard access, visible focus, 44px touch targets, text contrast
  ≥ 4.5:1, meaning never carried by color alone.
- Qualitative: a visitor can explain what Danial builds and where to go next
  after the hero without scrolling.

## Constraints

- Fully static Astro build deployed to GitHub Pages; Node.js >=22.19.0.
- Persian only, RTL, `lang="fa" dir="rtl"`; self-hosted Vazirmatn with no
  third-party font CDN.
- Content and images are owner-supplied; do not invent projects, screenshots,
  contact details, or payment data.
- The support card is public site data, not a secret; it is still excluded from
  docs and examples.
- No new colors, fonts, or locales without an explicit owner decision.

## Open decisions

| Decision | Options | Owner | Status |
| --- | --- | --- | --- |
| Support payment rails | card only / additional methods | Danial | card configured; methods open |
| Blog or notes section | add / stay out of scope | Danial | open |
| More travel photos | add via `image:` pattern / keep three | Danial | open |

## Related documents

- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- Interfaces and behavior: [DESIGN.md](DESIGN.md)
- Verification: [QUALITY.md](QUALITY.md)
