/* ===========================================================
   MODULE LOADER
   ---------------------------------------------------------------
   This project has no bundler/build step, so splitting the app
   into per-module .html/.css/.js files needs a small loader:

   1. Fetch every module's HTML fragment (in parallel) and inject
      it into its placeholder <div data-src="..."> in index.html.
   2. Once ALL fragments are in the DOM, load every module's
      script IN ORDER (one at a time, waiting for each to finish)
      so that:
        - functions/variables are defined before other modules'
          top-level code (event listeners, INIT) uses them, and
        - element lookups like document.getElementById(...) that
          run at the top of a script find their elements, because
          the HTML is already in place.

   NOTE: because this uses fetch(), the app must be served over
   http(s):// (e.g. `npx serve app`, VS Code "Live Server", etc.)
   — opening index.html directly via file:// will fail fetch()
   in most browsers due to CORS restrictions on local files.
   =========================================================== */

// Order matters: everything before 'core/core-init.js' only DEFINES
// functions/variables or wires up self-contained event listeners.
// 'request-form.js' and 'reports.js' must load before 'core-init.js'
// because INIT calls functions they define (populateBranchSelect,
// renderPendingList, populateReportCategoryFilter, etc.).
const JS_MODULES = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'core/core.js',
  'login/login.js',
  'header/header.js',
  'map/map.js',
  'branch-directory/branch-directory.js',
  'request-form/request-form.js',
  'approvals/approvals.js',
  'archive/archive.js',
  'sms-notification/sms-notification.js',
  'reports/reports.js',
  'holidays/holidays.js',
  'user-access/user-access.js',
  'core/core-init.js', // must be last
];

async function loadHtmlModules() {
  const containers = Array.from(document.querySelectorAll('[data-src]'));
  await Promise.all(containers.map(async (el) => {
    const res = await fetch(el.getAttribute('data-src'));
    if (!res.ok) throw new Error(`Failed to load ${el.getAttribute('data-src')}: ${res.status}`);
    el.outerHTML = await res.text();
  }));
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.body.appendChild(s);
  });
}

async function loadJsModulesInOrder() {
  for (const src of JS_MODULES) {
    await loadScript(src);
  }
}

(async function bootApp() {
  try {
    await loadHtmlModules();
    await loadJsModulesInOrder();
  } catch (err) {
    console.error('Module loader error:', err);
    document.body.innerHTML =
      '<pre style="padding:24px;color:#c0392b;font-family:monospace;">' +
      'Failed to load the app modules.\n' + (err && err.message ? err.message : err) +
      '\n\nMake sure you are serving this folder over http(s)://, not opening it via file://.' +
      '</pre>';
  }
})();
