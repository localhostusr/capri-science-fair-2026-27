---
description: Plan a site improvement safely in plan mode (live site, real families' data)
argument-hint: <the improvement you want, in plain words>
---

# Plan an improvement to the Capri Science Fair site

The improvement to plan: **$ARGUMENTS**

If $ARGUMENTS is empty, ask Chris which improvement to plan and stop.

If you are not already in plan mode, enter it now (EnterPlanMode). Make no edits until Chris approves the plan. The one exception is the plan file.

## Why this needs care

This is a **live production site with no staging environment**. Families are signing up through a QR code that is already printed on posters. A push to `main` goes live on GitHub Pages within about a minute. The backend writes children's and parents' personal data to a real Google Sheet. So every plan must answer: *what could this break for a family signing up tonight, and how would we know?*

## Step 1: Load context (read-only)

1. Read `CLAUDE.md` fully, especially **Status**, **Gotchas**, and **Style and branding**.
2. Check the live state before assuming anything:
   - `git log --oneline -10` and `git status`
   - `curl -sL "<APPS_SCRIPT_URL>?action=stats"` (the URL is in `script.js` CONFIG). This confirms the backend is up and shows how many real sign-ups exist.
3. Read every file the improvement touches, plus its neighbors. Search for existing functions, CSS classes, and patterns to reuse: `setLang`/`data-en`/`data-es` for i18n, the `.info-card`/`.sidebar-guide` components, `CONFIG`, and the `doGet` action router in `apps-script.gs`. Do not invent a parallel pattern when one exists.

## Step 2: Frame the improvement

Write down, briefly:

- **Who it's for:** families (often on phones, some Spanish-first), Kris the coordinator, or Chris the admin.
- **The problem it solves**, in one sentence. If you can't name one, say so and suggest dropping or reshaping the idea.
- **Success criteria:** 2–4 observable checks. For example, "a duplicate sign-up shows an error instead of a success card."
- **Out of scope:** what this plan deliberately does not do.

Ask Chris (AskUserQuestion) about anything that changes the design and can't be settled from the code. Recommend an option instead of listing neutral choices.

## Step 3: Risk review (answer each one, even with "n/a")

| Risk | Question to answer in the plan |
|---|---|
| **Live URL / QR** | Does anything change the site URL, repo name, or page paths families bookmark? This is never allowed. `index.html` must stay the entry point. |
| **Sign-up flow** | Can this break or hide the form, the submit button, or the success card? How do we test the full flow? |
| **Backend** | Does this touch `apps-script.gs`? If so, test first through Apps Script **Deploy → Test deployments** (the `/dev` URL, which is owner-only). Then Chris ships with **Manage deployments → pencil → New version**, never "New deployment". The Web App URL must not change. |
| **Sheet schema** | Does it add, reorder, or rename columns or tabs? `appendRow` order, `getSheetByName('Sign-Ups 2026-27')`, the Summary formulas, and the dashboard stats all depend on it. Only append new columns at the end. |
| **Privacy (children's data)** | Does any personal data (names, emails, phones) reach a public page, a URL, the console, or a third party? Public pages may show only aggregate counts. Check the promised 30-day deletion after the fair. |
| **Bilingual parity** | Every new user-facing string needs both `data-en` and `data-es`. List the Spanish strings in the plan for Chris to review. |
| **Deadline / dates** | Does it behave correctly before Nov 5, after Nov 5 (form closed), on Nov 19 (fair day), and after the fair? |
| **no-cors** | The POST uses `mode: 'no-cors'`, so the client can't read responses. Does the feature assume it can? |
| **Mobile** | Most visitors come from a QR scan on a phone. Does it work at 375px width with no horizontal scroll? |
| **Rollback** | How do we undo it? Usually `git revert <sha> && git push`, plus redeploying the previous Apps Script version. |

## Step 4: Design

- Give the recommended approach, with a one-line reason for rejecting the main alternative.
- Prefer the smallest change that meets the success criteria. No new frameworks, build steps, or dependencies. The site is plain HTML/CSS/JS served by GitHub Pages.
- Match existing style: palette `#e8611a` / `#9cc5d4` / `#1a1a1a`, 2px corners, Outfit/Inter, and the comment density and naming of the surrounding code.
- If the change is big, split it into phases that can each ship on their own. Phase 1 must leave the site working if we stop there.

## Step 5: Write the plan file

Keep it scannable:

1. **Context**: why, for whom, and the success criteria.
2. **Changes**: grouped by file, with the functions and components reused. Describe repeated patterns once.
3. **New strings (EN / ES)**: a table.
4. **Backend and sheet changes**: exact redeploy steps for Chris, or "none".
5. **Risks**: the Step 3 table condensed to the rows that apply, each with its mitigation.
6. **Verification**: see Step 6.
7. **Rollback**: exact commands and steps.
8. **What Chris must do by hand**: anything in Google (Apps Script, Sheet sharing) that can't be done from here.

## Step 6: Verification standard (every plan includes the relevant items)

- [ ] Test locally before pushing: `python3 -m http.server 8000` in the project folder, then open it in Chrome.
- [ ] EN and ES toggle: every new element switches language, and none is left in English.
- [ ] Phone width (375px) and desktop, with no console errors (`read_console_messages`).
- [ ] The full sign-up path still works. If the backend changed or the form was touched, submit one test entry named `TEST DELETE ME` with `test@example.com`, confirm the sheet row, **delete the row**, and tell Chris a notification email may arrive.
- [ ] `grep -n "April\|Quad\|Brings Us\|Pudvah\|capri-science-fair/"` finds nothing new that's stale.
- [ ] After pushing: poll the live URL until the change appears, then check it in Chrome. The QR URL still loads `index.html`.
- [ ] `node --check script.js` passes.

## Step 7: Exit

Call ExitPlanMode for approval. After approval, implement exactly the approved plan. Commit in small steps with clear messages, push only after local verification, and report the results. Name any skipped check plainly.
