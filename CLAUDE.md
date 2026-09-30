# Capri Science Fair 2027, project notes

**Status.** Freshly scaffolded on 2026.09.30, seeded from the 2026 archive. All year-specific values (dates, deadline, spreadsheet, deployment URL, PTA team) are still 2026 values and need to be updated for 2027 before any deployment.

## What was decided at scaffold time

- Fresh new Google Sheet for 2027 sign-ups. The 2026 sheet stays frozen with its final roster.
- Fresh new GitHub repo (target name `localhostusr/capri-science-fair-2027`) so the archived 2026 repo stays untouched.
- Fresh new Apps Script deployment. New project, new Web App URL. Old 2026 URL keeps serving until Chris archives that deployment.
- Some team or branding changes from 2026. Chris to specify in this session (new PTA president, new chair, new theme, new NOTIFY_EMAILS).
- 2027 fair date confirmed. Chris to provide the exact date and time.

## Open decisions to prompt Chris on first

1. Confirmed 2027 fair date, start and end times, and sign-up close deadline (2026 closed at 23:55 the night before).
2. PTA team for 2027 (president, chair, notification recipients, admin sheet access).
3. Theme, or keep 2026's "Science Brings Us Together" and "La Ciencia Nos Une".
4. Create the new Google Sheet (guide Chris through it, capture the new SPREADSHEET_ID).
5. Create the new Apps Script project (guide Chris through it, capture the new Web App URL).
6. Create the new GitHub repo and wire up Pages.
7. Sweep the code for every `2026` and `April 23` and `April 22` reference and update.

## Files touched by the year sweep

Grep for `2026` and `April 23` before deploying:

- `apps-script.gs`. DEADLINE constant, SPREADSHEET_ID constant, ADMIN_EMAILS, NOTIFY_EMAILS.
- `script.js`. CONFIG.DEADLINE, CONFIG.APPS_SCRIPT_URL, updateCountdown fair date, downloadCalendar DTSTART and DTEND, guide URL.
- `index.html`. Event date and time (multiple places), sidebar schedule, confirmation card.
- `guide.html`. Event date, arrival time, schedule times.
- `dashboard.html`. Event date references.
- `inspiration.html`. Event date references.
- `organizer.html`. Event date references.

## Pointers back to 2026

The 2026 build's shipped source, transcripts, and hibernation notes are at:

- `~/Documents/capri-science-fair/`. Read-only source locally. GitHub repo is archived.
- `~/Documents/capri science fair archive 2026/`. Session transcripts and archive README.
- 2026 live site: https://localhostusr.github.io/capri-science-fair/

If any 2026 decision or gotcha is unclear, that is where to look.

## Gotchas preserved from 2026 (still apply for 2027)

1. Apps Script redeploy. Always Manage Deployments, pencil, New version, Deploy. Never "New deployment." Once you cut a fresh 2027 deployment, keep it stable across updates.
2. `setup()` in `apps-script.gs` is currently a disabled no-op. When pointing at a new spreadsheet, either update SPREADSHEET_ID and continue disabling `setup()`, or briefly re-enable it to create the sheet and then disable again.
3. Confirmation emails were intentionally disabled in 2026 to avoid exposing Chris's personal Gmail. Decide fresh for 2027.
4. Form fetch uses `mode: 'no-cors'`. The client cannot read server responses. Optimistic "success" UI shows even when the server rejects (for example past deadline). Acceptable for the fair-day use case.
5. Dashboard CATEGORY_ALIASES normalization exists because 2026 users picked display strings that did not match short keys. If you tighten the form's category options at signup, this map might not be needed for 2027.

## Style and branding baseline from 2026, keep unless changing

- Palette. Capri orange `#e8611a`, Stingray blue `#9cc5d4`, dark `#1a1a1a`. Sharp 2px corners.
- Typography. Outfit (headings), Inter (body), Bangers plus Anton (PTA logo overlay).
- Layout. Rail sidebar with info cards and schedule on left, form and content on right.
- PTA logo. Custom NKOTB-style SVG "P" with stretched capsule bowl, 80s and 90s neon palette (lime `#b8e02a`, cyan `#00e5ff`, hot pink `#ff2d9b`).
