# CBAMS — modular structure

This is the original single-file `index.html` (CBAMS — Agribank Branch
Operations) split into one folder per feature module, each with its own
`.css` / `.html` / `.js` where the original design actually had
module-specific rules or code.

## How to run it

There's no build step, but the loader uses `fetch()` to pull in each
module's HTML fragment, so **you must serve this folder over HTTP** —
opening `app/index.html` directly via `file://` will fail (browsers block
`fetch()` on local files). Any static server works, e.g.:

```bash
cd app
npx serve .
# or: python3 -m http.server 8000
```

Then open the printed URL in your browser.

## Folder layout

```
app/
  index.html          shell: <head> links every module's CSS, <body> has
                       empty <div data-src="…"> placeholders + <script src="loader.js">
  loader.js            fetches every HTML fragment, injects it into the
                       DOM, then loads every JS module IN ORDER

  core/                shared: Supabase config/client, currentUser state,
                       auth (login/logout), session idle-timeout, can(),
                       showToast(), switchView(), the dashboard/map render
                       functions (renderMetrics, renderPins, renderDonuts…)
    core.css            :root design tokens, reset, buttons, toasts, page
                         header, empty/locked states, session-timeout modal css
    core.html            session-timeout modal markup
    core.js               config/state/auth/session/role-access/toasts/
                          view-switching/render-functions (loads FIRST)
    core-init.js          the original INIT block — calls functions
                          defined by other modules, so it MUST load LAST

  login/               login screen (branch ad carousel, sign-in form)
  header/              topbar, nav dropdowns, account dropdown, view-profile modal
  dashboard/           home view: metric cards, donut charts, map+rail layout
  map/                 Philippines map projection/outline data, zoom/pan
                       (its <svg> markup lives inside dashboard/dashboard.html
                       since the map is embedded in the Dashboard view —
                       see the note at the top of map/map.js)
  branch-directory/    branch directory list, "Add Branch" modal, branch drawer
  request-form/        closure/reopen request form, categories, "My submissions"
  approvals/           pending-requests table + approve/reject actions
  archive/             archive table + status filter
  sms-notification/    SMS notification mockup view/modal
  reports/             maintenance report extraction by date range
  holidays/            holidays list + "Add Holiday" modal
  user-access/         user access settings, access-request approvals, "Add User" modal
```

A few modules (`archive`, `holidays`, `sms-notification`) have a `.css`
file that's just a comment pointing at the shared classes they reuse
(from `core.css`, `approvals.css`, `branch-directory.css`,
`request-form.css`) — the original design never had module-specific
rules for those views, so an empty/near-empty file would be misleading;
the comment documents the real dependency instead of faking one.

## Load order (why it matters)

`loader.js` loads scripts one at a time, in this order:

```
supabase-js (CDN) → core.js → login.js → header.js → map.js →
branch-directory.js → request-form.js → approvals.js → archive.js →
sms-notification.js → reports.js → holidays.js → user-access.js →
core-init.js
```

This mirrors the dependency graph of the original file:

- **`core.js` first** — it defines `sb`, `currentUser`, `can()`,
  `showToast()`, `switchView()`, and the shared render functions that
  other modules' event listeners call.
- **`core-init.js` last** — it's the original `INIT` block, which calls
  `populateBranchSelect()` / `renderPendingList()` / `renderArchiveList()`
  / `renderMySubmissions()` / `populateReportCategoryFilter()` /
  `renderReportTable()` / `bootstrapSession()` — functions defined in
  `request-form.js`, `approvals.js`, `archive.js`, and `reports.js`. If
  it loaded before those, the app would throw `ReferenceError`s on load.
- Everything else loads in roughly the same order it appeared in the
  original file. All HTML fragments are injected **before any script
  runs**, so `document.getElementById(...)` calls at the top of a
  module's script always find their elements.

If you add a new module, keep it between `core.js` and `core-init.js`,
and put it after anything it calls into.

## Known gaps

- Three local images are referenced by relative path and weren't part
  of the uploaded file, so they're not included here — copy them into
  `app/` (same relative paths) to restore the login-page ad photos and
  header logo:
  - `header/header.html` → `ABC-RB  - APPROVED  LOGO - FULL COLOR-04.png`
  - `login/login.html` → `Untitled design (10).png`,
    `ChatGPT Image Jul 23, 2026, 05_33_12 PM.png`,
    `ChatGPT Image Jul 23, 2026, 05_24_35 PM.png`
- The Supabase URL/anon key are still hard-coded in `core/core.js`,
  exactly as they were in the original file.
