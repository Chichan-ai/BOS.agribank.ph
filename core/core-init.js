/* ===========================================================
   Core — INIT (must run LAST, after every other module's script
   has loaded, since it calls functions defined across modules)
   =========================================================== */

/* =========================================================
   INIT
   ========================================================= */
document.getElementById('asOfDate').value = asOfDate;
document.getElementById('asOfDate').addEventListener('change', function(){
  asOfDate = this.value || new Date().toISOString().split('T')[0];
  refreshAll();
});
document.getElementById('asOfTodayBtn').addEventListener('click', function(){
  asOfDate = new Date().toISOString().split('T')[0];
  document.getElementById('asOfDate').value = asOfDate;
  refreshAll();
});

// Render once against empty data so the DOM isn't blank while we
// check for an existing Supabase session (portal stays hidden until login).
refreshAll();
populateBranchSelect();
syncStatusChoiceUI();
renderPendingList();
renderArchiveList();
renderMySubmissions();
updatePendingBadge();
populateReportCategoryFilter();

// If the browser already has a valid Supabase session (e.g. page refresh),
// sign the user back in automatically instead of showing the login form.
bootstrapSession();

