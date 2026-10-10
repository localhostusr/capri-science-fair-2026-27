# Capri Science Fair 2027, project notes

**Status (2026.10.05).** This is the 2026-27 school-year fair: **Thu Nov 19, 2026, 5–7 PM, MPR**, theme "Science in Life!", grades K–6. Key dates (changed by Kris on 2026.10.05): **first approval Thu Oct 22, final approval and sign-up close Thu Nov 12 at 23:55**. Fair night: 3–5 set-up, 5–7 fair with SD Lab Rats demos out front, 6:30–7 Lab Rats show **in the MPR**, 7–7:30 teardown. Coordinator: Kris Thomson (krisdthomson@gmail.com). The STEM teacher (spelled Alisa, Aliza, Alyssa, and "Ms. Holmes" in Kris's emails and packet) will review projects; her name and email go on the posters only after Kris confirms. AnnaRose (PTA president) handles school-wide communication. Repo `localhostusr/capri-science-fair-2026-27`, live at https://localhostusr.github.io/capri-science-fair-2026-27/. The QR code (`qr-code.png`) encodes that URL, so never rename the repo. Posters (EN/ES, letter and 11x17) are in `posters/` (HTML source, rendered with headless Chrome; `?size=tabloid` gives 11x17). Kris's packet with QR codes is in `packet/` (EN only; Spanish waits for Kris's final English). Chris chose to **reuse the 2026 sheet** (same ID `1MdSP6gH…`, renamed "Capri Science Fair 2026-27 — Sign-Ups", 2026 rows deleted on 2026.09.30, tab renamed "Sign-Ups 2026-27"; Summary formulas follow the tab name). **Backend live since 2026.09.30:** the 2026 Apps Script project ("Capri Science Fair 2026", ID `1gjva6nX…`) is on Version 12 (deployed 2026.10.09: saves special-materials answers to columns R/S, formula guard verified live; Version 11 set the Nov 12 23:55 PT deadline and added Kris to NOTIFY_EMAILS). Deployment `AKfycbwRAR60DTotOBdDuemXk3xDd8nd05sr6XYBIvPyojZQS0gYKQaMPZeiz0P3s0vS0y4` is wired into script.js, dashboard, inspiration, and organizer, and `BACKEND_LIVE: true`. The older `AKfycbyajxk_…` URL returns 404, so don't use it. A test sign-up worked end to end and the test row was deleted. Older versions of the sheet (in version history) still hold 2026 data. Schedule details and the poster owner are waiting on Kris.

## Safe-change workflow (live site, no staging)

- GitHub Pages builds from `main` only. Build on a branch, test locally (`python3 -m http.server`), then merge to `main` to go live.
- Restore points are annotated tags. `v2026.09.30-live` = sign-ups open, before round 1. To roll back: `git revert <merge-sha> && git push`, or check out the tag's files.
- The 2026 site (`localhostusr/capri-science-fair`, archived) now redirects every page to the matching 2026-27 page (done 2026.09.30). The original 2026 site is preserved at tag `v2026-final` in that repo.
- Every sub-page shares the sticky bilingual "← Main Page" bar (`home-link.css`). Add it to any new page.
- Use `/plan-improvement <idea>` (`.claude/commands/plan-improvement.md`) for any change.
- Round 2 "audit-upgrades" (2026.10.08): accessibility and validation fixes, bilingual Inspiration, draft autosave (`csf-draft-v1`, 3-day expiry, "Start over"), share button, CSS scroll reveals instead of AOS, View Transitions, installable web app (manifest + `icons/`, no service worker on purpose). The backend (Version 12) saves special-materials answers to sheet columns R/S, trims and caps inputs, neutralizes values starting with `= + - @`, checks required fields server-side, and has `purgeAfterFair()`, which wipes sign-ups and visits on 2026-12-19 (trigger installed and confirmed 2026.10.09; the script project now shows as "Capri Science Fair 2027"). Sheet headers R1/S1 were added 2026.10.09.
- Round 3 "explore-hub" (2026.10.09, **live 2026.10.10**, verified on live desktop + 375px in EN and ES; roll back with `git revert -m 1 e72455b` plus the follow-up merges, or restore tag `v2026.10.09-pre-explore`): two doors under the hero ("Enter the Science Fair" points a laser at Student Name; "Just Curious? Explore the Fair" opens `/#explore`). The hub (`#explore` section in index.html) is built by `buildHub()` in script.js, which **clones** the sidebar's dates, fair-night schedule, info cards, guide links, share button, and the form's donate strip. Edit the sidebar originals and the hub follows. Views are body classes set by `setView()`: `view-explore` (hub only), `view-joined` (after submit: confirmation, then the hub, no sidebar), and `signups-closed` (Enter door hidden). `HUB_MILESTONES` in script.js must match the Important Dates order. The live count shows only at 5+ students. Inspiration idea cards have `id="idea-<category>"` for the hub's chips. Follow-ups (2026.10.10): Enter puts the form header at the top and the laser sweeps across Student Name while the placeholder types itself out (just sweeps the text if a draft is restored). Explore always opens on The Fair tab. Live Stats embeds `dashboard.html?embed=1&v=3` (bump `v` when dashboard.html changes, so cached copies refresh) (no page chrome, logs visits as `dashboard-embed`, frame auto-sizes). The dashboard no longer overflows on phones. Atom easter-egg hints: an atom winks every ~10s, a "What happens if you catch 5 atoms?" question in the hero ticker, and a crosshair plus glow near atoms on desktop (all off under reduced motion). Laser toggle on the "Student Information" title row (emoji only on phones): "I love lasers" (default) or "Enough with the laser pointer", stored in `csf-laser-off`. The dashboard is bilingual (2026.10.10): strings live in its `I18N` table (category names there must match index.html), it reads `csf-lang`, has its own EN/ES toggle when standalone, and the embed follows the main page's toggle via `dashSetLang`. The hero question ticker switches language mid-question.
- Local checks: the W3C upload is blocked by guard.sh, so use the scratchpad `lint.py` structural check, or validate the live URL. Chrome automation `ref` clicks don't fire "Start over", but real clicks do.
- Round 1 (merged 2026.09.30) set the categories to `sports, food, nature, music, games, rides, space, health, engineering, other`. Keep index.html, dashboard.html (`ALL_CATEGORIES`/`I18N.*.categories`/`CATEGORY_ALIASES`), organizer.html, and apps-script.gs `allCats` in sync.

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
