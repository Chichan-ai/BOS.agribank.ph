/* ===========================================================
   Core / Shared (config, state, auth, toasts, rendering, init) — script
   =========================================================== */

/* =========================================================
   SUPABASE CONFIG — fill these in from
   Project Settings > API in your Supabase dashboard.
   ========================================================= */
/* Escapes user-entered text before it is placed into innerHTML (prevents script injection). */
function escapeHTML(v){return String(v==null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}

const SUPABASE_URL = 'https://naxzbvesadkhkhocgogf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5heHpidmVzYWRraGtob2Nnb2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MTA2NjksImV4cCI6MjEwMjA4NjY2OX0._S8kpfDbhqAl0cvcz1n4MPXPRloV06Phv2N3uGcpVto';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* currentUser replaces the old hardcoded USERS[currentRole] lookup.
   Shape: {id, username, full_name, role, role_label, permissions} */
let currentUser = null;

function normalizeRole(role){
  const value = String(role || '').trim().toLowerCase();
  if(value === 'admin' || value.startsWith('admin ·')) return 'admin';
  if(value.includes('admin ii') || value.startsWith('admin2')) return 'admin2';
  if(value.includes('admin i') || value.startsWith('admin1')) return 'admin1';
  if(value.startsWith('supervisor')) return 'supervisor';
  if(value.startsWith('staff')) return 'staff';
  if(value.startsWith('user')) return 'user';
  return value;
}

function isAdmin1(role = currentUser?.role){
  const normalized = normalizeRole(role);
  return normalized === 'admin' || normalized === 'admin1';
}

function isAdmin2(role = currentUser?.role){
  return normalizeRole(role) === 'admin2';
}

const ROLE_CAPABILITIES = {
  supervisor: new Set(['can_access_dashboard', 'can_view_records', 'can_request', 'can_create_request', 'can_view_branch_directory', 'can_view_reports']),
  staff: new Set(['can_access_dashboard', 'can_view_records']),
  user: new Set(['can_access_dashboard', 'can_view_records']),
};

function can(perm){
  if(!currentUser) return false;
  if(isAdmin1()) return true;
  if(isAdmin2()) return perm !== 'can_approve';
  const permissions = currentUser.permissions || {};
  if(Object.prototype.hasOwnProperty.call(permissions, perm)) return permissions[perm] === true;
  return ROLE_CAPABILITIES[normalizeRole(currentUser.role)]?.has(perm) || false;
}

function canView(view){
  const required = {
    dashboard: 'can_access_dashboard',
    request: 'can_view_records',
    approval: 'can_approve',
    archive: 'can_view_records',
    'branch-directory': 'can_view_branch_directory',
    reports: 'can_view_reports',
    holidays: 'can_view_reports',
    sms: 'can_view_reports',
    'user-access': 'can_access_user_access',
  }[view];
  return required ? can(required) : false;
}


/* =========================================================
   DATA LOADERS — pull live data from Supabase into the same
   in-memory shapes the existing render functions expect.
   ========================================================= */
async function loadBranches(){
  const { data: rows, error } = await sb.from('branches').select('*').order('name');
  if(error){ console.error(error); showToast('Failed to load branches.', 'error'); return; }
  const { data: histRows, error: histErr } = await sb.from('branch_history').select('*').order('occurred_at', {ascending:false});
  if(histErr) console.error(histErr);
  const historyByCode = {};
  (histRows||[]).forEach(h=>{
    (historyByCode[h.branch_code] ||= []).push([h.title, h.description, timeAgo(h.occurred_at), h.actor]);
  });
  branches = rows.map(b=>({
    code:b.code, name:b.name, region:b.region, lat:b.lat, lng:b.lng, status:b.status,
    anniversary:b.anniversary, address:b.address, hours:b.hours,
    manager:b.manager, managerPhone:b.manager_phone, managerEmail:b.manager_email,
    ops:b.ops, opsPhone:b.ops_phone, hotline:b.hotline,
    closedFrom:b.closed_from, closedUntil:b.closed_until, emergency:b.emergency,
    history: historyByCode[b.code] || []
  }));
}

async function loadCategories(){
  const { data: cats, error } = await sb.from('closure_categories').select('id,name');
  if(error){ console.error(error); return; }
  const { data: subs, error: subErr } = await sb.from('closure_subcategories').select('category_id,name');
  if(subErr){ console.error(subErr); return; }
  const next = {};
  cats.forEach(c=>{ next[c.name] = subs.filter(s=>s.category_id===c.id).map(s=>s.name); });
  CLOSURE_CATEGORIES = next;
}

async function loadRequests(){
  const { data: rows, error } = await sb.from('closure_requests')
    .select('*, branch:branch_code(name,region), submitter:submitted_by(full_name,role_label), reviewer:reviewed_by(full_name)')
    .order('submitted_at', {ascending:false});
  if(error){ console.error(error); showToast('Failed to load requests.', 'error'); return; }
  requests = rows.map(r=>({
    id:r.id, branchCode:r.branch_code, branchName:r.branch?.name, region:r.branch?.region,
    requestedStatus:r.requested_status, category:r.category, subcategory:r.subcategory, reason:r.reason,
    closedFrom:r.closed_from, closedUntil:r.closed_until, closedFromTime:r.closed_from_time, closedUntilTime:r.closed_until_time,
    submittedBy:r.submitter?.full_name, submittedByPosition:r.submitter?.role_label, submittedById:r.submitted_by,
    submittedAt:timeAgo(r.submitted_at), submittedAtDate:new Date(r.submitted_at),
    status:r.status, reviewRemarks:r.review_remarks, reviewedBy:r.reviewer?.full_name, reviewedAt:r.reviewed_at ? timeAgo(r.reviewed_at) : null
  }));
}

async function loadAccessUsers(){
  const { data: rows, error } = await sb.from('user_profiles').select('id,username,full_name,role,role_label,permissions').order('username');
  if(error){ console.error(error); return; }
  ACCESS_USERS.length = 0;
  rows.forEach(u=>ACCESS_USERS.push({
    id:u.id, name:u.username, role:u.role_label || u.role,
    roleClass: u.role==='admin' ? 'role-admin' : u.role==='admin1' ? 'role-admin1' : u.role==='admin2' ? 'role-admin2' : u.role==='supervisor' ? 'role-supervisor' : '',
    perms:u.permissions
  }));
}

function timeAgo(iso){
  if(!iso) return '';
  const d = new Date(iso), diffMs = Date.now() - d.getTime(), mins = Math.floor(diffMs/60000);
  if(mins < 1) return 'Just now';
  if(mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins/60);
  if(hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}

async function refreshFromSupabase(){
  await Promise.all([loadBranches(), loadCategories(), loadRequests(), loadHolidaysFromDB()]);
  refreshAll();
  populateBranchSelect();
  populateCategorySelect(false);
  renderPendingList();
  renderArchiveList();
  renderMySubmissions();
  updatePendingBadge();
  populateReportCategoryFilter();
}


/* =========================================================
   AUTH — Supabase Auth replaces the old LOGIN_CREDENTIALS map.
   Sign-in uses email + password.
   ========================================================= */
async function doLogin(email,password){
  const loginError=document.getElementById('loginError');
  const btn=document.querySelector('#loginForm button[type="submit"]');
  const fail=m=>{loginError.textContent=m||'Unable to sign in.';loginError.classList.add('show');};
  if(!email||!password){fail('Please enter your email and password.');return;}
  try{
    if(btn){btn.disabled=true;btn.textContent='Signing in…';}
    loginError.classList.remove('show');
    const {data,error}=await sb.auth.signInWithPassword({email:email.trim(),password});
    if(error||!data?.user){fail(error?.message||'Invalid email or password.');return;}
    await loadCurrentUserProfile(data.user.id);
    if(!currentUser){await sb.auth.signOut();fail('Login succeeded, but no user profile was found. Please contact the administrator.');return;}
    if(currentUser.permissions?.can_login!==true){await sb.auth.signOut();currentUser=null;fail('This account is not permitted to sign in. Please ask an administrator to enable Login access.');return;}
    document.getElementById('login-page').style.display='none';document.getElementById('portal').style.display='flex';document.body.classList.remove('login-active');
    applyRole(currentUser.role);await switchView(defaultViewForRole());await refreshFromSupabase();showToast(`Signed in as ${currentUser.full_name||data.user.email}.`,'success');startIdleTimer();
  }catch(err){console.error('Login error:',err);fail(err?.message||'Unable to sign in. Please try again.');}
  finally{if(btn){btn.disabled=false;btn.textContent='Log in';}}
}

async function loadCurrentUserProfile(userId){
  const { data, error } = await sb.from('user_profiles').select('*').eq('id', userId).single();
  if(error){ console.error(error); currentUser = null; return; }
  currentUser = data;
  currentUser.role = normalizeRole(currentUser.role);
  // user_profiles may not store email (it lives on auth.users) — pull it from the
  // current auth session so View Profile has something to show.
  if(!currentUser.email){
    const { data:{ user } } = await sb.auth.getUser();
    if(user?.email) currentUser.email = user.email;
  }
}

async function doLogout(reason){
  stopIdleTimer();
  await sb.auth.signOut();
  currentUser = null;
  document.getElementById('portal').style.display = 'none';
  document.getElementById('login-page').style.display = 'flex';
  document.body.classList.add('login-active');
  document.getElementById('dd-account').classList.remove('show');
  document.getElementById('loginForm').reset();
  const loginError=document.getElementById('loginError');
  if(reason==='timeout'){loginError.textContent='You were logged out due to inactivity. Please log in again.';loginError.classList.add('show');}
  else{loginError.classList.remove('show');}
}


/* =========================================================
   SESSION IDLE TIMEOUT
   Auto-logs the user out after a period of inactivity, with a
   warning modal + countdown shown before the timeout occurs.
   ========================================================= */
const IDLE_TIMEOUT_MS   = 15 * 60 * 1000;  // 15 min of inactivity before warning
const IDLE_WARNING_MS   = 60 * 1000;       // 60s warning countdown before logout
const IDLE_ACTIVITY_EVENTS = ['mousedown','mousemove','keydown','scroll','touchstart','click'];

let idleWarnTimer = null;
let idleLogoutTimer = null;
let idleCountdownInterval = null;
let idleWarningShownAt = 0;
let idleListenersBound = false;

function resetIdleTimer(){
  // Ignore activity while the warning modal itself is open — the
  // countdown should keep running until the user explicitly responds.
  if(document.getElementById('sessionTimeoutScrim')?.classList.contains('show')) return;
  clearTimeout(idleWarnTimer);
  idleWarnTimer = setTimeout(showIdleWarning, IDLE_TIMEOUT_MS);
}

function startIdleTimer(){
  if(!idleListenersBound){
    IDLE_ACTIVITY_EVENTS.forEach(evt=>document.addEventListener(evt, resetIdleTimer, {passive:true}));
    idleListenersBound = true;
  }
  resetIdleTimer();
}

function stopIdleTimer(){
  clearTimeout(idleWarnTimer);
  clearTimeout(idleLogoutTimer);
  clearInterval(idleCountdownInterval);
  hideIdleWarning();
}

function showIdleWarning(){
  idleWarningShownAt = Date.now();
  document.getElementById('sessionTimeoutScrim').classList.add('show');
  document.getElementById('sessionTimeoutModal').classList.add('show');
  updateIdleCountdown();
  idleCountdownInterval = setInterval(updateIdleCountdown, 250);
  idleLogoutTimer = setTimeout(()=>{ doLogout('timeout'); }, IDLE_WARNING_MS);
}

function hideIdleWarning(){
  document.getElementById('sessionTimeoutScrim')?.classList.remove('show');
  document.getElementById('sessionTimeoutModal')?.classList.remove('show');
}

function updateIdleCountdown(){
  const remainingMs = Math.max(0, IDLE_WARNING_MS - (Date.now() - idleWarningShownAt));
  const totalSec = Math.ceil(remainingMs/1000);
  const m = Math.floor(totalSec/60).toString().padStart(2,'0');
  const s = (totalSec%60).toString().padStart(2,'0');
  const el = document.getElementById('sessionTimeoutCountdown');
  if(el) el.textContent = `${m}:${s}`;
  if(remainingMs<=0) clearInterval(idleCountdownInterval);
}

function stayLoggedIn(){
  clearTimeout(idleLogoutTimer);
  clearInterval(idleCountdownInterval);
  hideIdleWarning();
  resetIdleTimer();
}

document.getElementById('sessionTimeoutStayBtn').addEventListener('click', stayLoggedIn);
document.getElementById('sessionTimeoutLogoutBtn').addEventListener('click', ()=>doLogout());
document.getElementById('sessionTimeoutScrim').addEventListener('click', stayLoggedIn);

/* Auto-resume an existing session on page load (e.g. after refresh) */
async function bootstrapSession(){
  const { data:{ session } } = await sb.auth.getSession();
  if(session?.user){
    await loadCurrentUserProfile(session.user.id);
    if(currentUser && currentUser.permissions?.can_login === true){
      document.getElementById('login-page').style.display = 'none';
      document.getElementById('portal').style.display = 'flex';
      document.body.classList.remove('login-active');
      applyRole(currentUser.role);
      await switchView(defaultViewForRole());
      await refreshFromSupabase();
      startIdleTimer();
      return;
    }
  }
  // No valid session — show the login page (already visible by default)
}

/* =========================================================
   BRANCH DATA
   ========================================================= */
let branches = []; // populated from Supabase — see loadBranches()


/* =========================================================
   ROLE-BASED ACCESS (role + identity now come from currentUser,
   which is populated from Supabase Auth + user_profiles — see
   doLogin/loadCurrentUserProfile/bootstrapSession above)
   ========================================================= */
function applyRole(role){
  role = normalizeRole(role);
  const cssBucket = (isAdmin1(role) || isAdmin2(role)) ? 'admin' : 'user';
  document.body.classList.remove('role-admin','role-user');
  document.body.classList.add('role-'+cssBucket, 'role-'+role);
  const initials = (currentUser.full_name||currentUser.username||'?')
    .split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase();
  document.getElementById('userAvatar').textContent = initials;
  document.getElementById('userNameFull').textContent = currentUser.full_name;
  document.getElementById('userRoleFull').textContent = currentUser.role_label || currentUser.role;
  document.querySelector('.role-dashboard-nav').style.display = can('can_access_dashboard') ? '' : 'none';
  document.querySelector('.role-directory-nav').style.display = can('can_view_branch_directory') ? '' : 'none';
  const canViewMaintenance = can('can_view_reports') || can('can_access_user_access') || can('can_send_sms');
  document.querySelector('.role-maintenance-nav').style.display = canViewMaintenance ? '' : 'none';
  const requestButton = document.getElementById('openRequestFormBtn');
  if(requestButton) requestButton.style.display = (can('can_request') || can('can_create_request')) ? 'inline-flex' : 'none';
  const reportsLink = document.getElementById('link-reports');
  if(reportsLink) reportsLink.style.display = can('can_view_reports') ? '' : 'none';
  const maintenancePermissions = {
    'link-sms': 'can_send_sms',
    'link-holidays': 'can_manage_holidays',
    'link-user-access': 'can_access_user_access',
  };
  document.querySelectorAll('.maintenance-admin-only').forEach(link=>{
    link.style.display = can(maintenancePermissions[link.id]) ? '' : 'none';
  });
  applyApprovalAccess();
  updatePendingBadge();
}

function defaultViewForRole(){
  if(can('can_access_dashboard')) return 'dashboard';
  if(can('can_view_branch_directory')) return 'branch-directory';
  return 'request';
}

// Approval is Admin I's exclusive domain — gate it on the actual
// can_approve permission (not the coarse admin/user CSS bucket), so
// Admin II (User Access) sees the same locked state a non-admin would.
function applyApprovalAccess(){
  const approvalOK = isAdmin1();
  document.getElementById('link-approval').style.display = approvalOK ? 'flex' : 'none';
  document.getElementById('link-approval-locked').style.display = approvalOK ? 'none' : 'flex';
  const adminBlock = document.getElementById('approvalAdminBlock');
  const locked = document.getElementById('approvalLocked');
  if(adminBlock) adminBlock.style.display = approvalOK ? 'block' : 'none';
  if(locked){
    locked.style.display = approvalOK ? 'none' : 'block';
    if(!approvalOK){
      locked.querySelector('p').textContent = 'This account doesn\'t have approval access. Approval rights are limited to Admin I — an Admin II (User Access) can grant the "Approve" permission from User Access Settings.';
    }
  }
  // If a user without approval access is sitting on the approval view, bounce to dashboard
  if(!approvalOK && document.getElementById('view-approval').classList.contains('active')){
    switchView('dashboard');
    showToast('Approval queue requires approval access.', 'info');
  }
}

document.getElementById('loginForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  doLogin(document.getElementById('loginUsername').value, document.getElementById('loginPassword').value);
});

document.getElementById('logoutLink').addEventListener('click', (e)=>{
  e.preventDefault();
  doLogout();
});


/* =========================================================
   TOASTS
   ========================================================= */
function showToast(msg, type){
  type = type || 'info';
  const stack = document.getElementById('toastStack');
  const t = document.createElement('div');
  t.className = 'toast '+type;
  t.innerHTML = `<span class="tdot"></span><span>${escapeHTML(msg)}</span>`;
  stack.appendChild(t);
  setTimeout(()=>{
    t.style.transition='opacity .25s, transform .25s';
    t.style.opacity='0'; t.style.transform='translateY(6px)';
    setTimeout(()=>t.remove(), 260);
  }, 3600);
}


/* =========================================================
   VIEW SWITCHING
   ========================================================= */
async function switchView(name){
  if(!canView(name)){
    showToast('You do not have access to this feature.', 'error');
    return;
  }
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+name).classList.add('active');
  document.getElementById('nav-dashboard').classList.toggle('current', name==='dashboard');
  document.getElementById('nav-directory').classList.toggle('current', name==='branch-directory');
  closeAllDropdowns();
  if(name==='approval'){
    await loadRequests();
    renderPendingList();
    updatePendingBadge();
  }
  if(name==='archive'){
    await loadRequests();
    renderArchiveList();
  }
  if(name==='request'){
    await loadRequests();
    showRequestList();
  }
  if(name==='branch-directory') renderDirectoryList();
  if(name==='reports') populateReportCategoryFilter();
  window.scrollTo({top:0, behavior:'smooth'});
}
document.getElementById('nav-dashboard').addEventListener('click', ()=>switchView('dashboard'));
document.getElementById('nav-directory').addEventListener('click', ()=>switchView('branch-directory'));
document.getElementById('brand-home').addEventListener('click', ()=>switchView('dashboard'));
document.getElementById('link-request').addEventListener('click',(e)=>{
  e.preventDefault();
  e.stopPropagation();
  closeAllDropdowns();
  switchView('request');
});
document.getElementById('link-approval').addEventListener('click',(e)=>{
  e.preventDefault();
  e.stopPropagation();
  closeAllDropdowns();
  switchView('approval');
});
document.getElementById('link-approval-locked').addEventListener('click',(e)=>{
  e.preventDefault();
  showToast('Approval queue requires approval access (Admin I).', 'error');
});
document.getElementById('link-archive').addEventListener('click',(e)=>{
  e.preventDefault();
  e.stopPropagation();
  closeAllDropdowns();
  switchView('archive');
});
document.getElementById('link-sms').addEventListener('click',(e)=>{e.preventDefault(); e.stopPropagation(); switchView('sms'); renderSmsRecipientTags();});
document.getElementById('link-reports').addEventListener('click',(e)=>{e.preventDefault(); e.stopPropagation(); switchView('reports');});


/* =========================================================
   RENDER FUNCTIONS (callable repeatedly — approvals trigger these)
   ========================================================= */
const tooltip = document.getElementById('tooltip');

let asOfDate = new Date().toISOString().split('T')[0];
function isNonWorkingHoliday(dateStr, branchCode){
  return HOLIDAYS_2026.some(h=>{
    if(h.date !== dateStr || h.type==='working') return false;
    if(h.branches === 'all') return true;
    return h.branches.includes(branchCode);
  });
}

function effectiveStatus(b, dateStr){
  if(isNonWorkingHoliday(dateStr, b.code)) return 'closed';
  if(b.closedFrom && b.closedUntil){
    return (dateStr >= b.closedFrom && dateStr <= b.closedUntil) ? 'closed' : 'open';
  }
  return b.status;
}
function renderMetrics(){
  const total = branches.length;
  const closed = branches.filter(b=>effectiveStatus(b, asOfDate)==='closed');
  const openCount = total - closed.length;

  const openPct = total ? Math.round((openCount / total) * 100) : 0;
  const closedPct = total ? Math.round((closed.length / total) * 100) : 0;
  document.getElementById('openPctValue').textContent = openPct + '%';
  document.getElementById('closedPctValue').textContent = closedPct + '%';
  document.getElementById('openPctDate').textContent = new Date(asOfDate+'T00:00:00')
    .toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}

function renderPins(){
  pinsLayer.innerHTML = '';
  branches.forEach(b=>{
    const st = effectiveStatus(b, asOfDate);
    const isEmergency = b.emergency && st==='closed';
    const {x,y} = project(b.lat,b.lng);
    const g = document.createElementNS(ns,'g');
    g.setAttribute('class','pin'+(isEmergency?' emergency':''));
    g.setAttribute('transform',`translate(${x},${y})`);
    const halo = document.createElementNS(ns,'circle');
    halo.setAttribute('class','halo'); halo.setAttribute('r','5');
    g.appendChild(halo);
    const core = document.createElementNS(ns,'circle');
    core.setAttribute('class','core'); core.setAttribute('r','4.8');
    core.setAttribute('fill', st==='open' ? '#16a34a' : '#dc2626');
    g.appendChild(core);
    g.addEventListener('mouseenter',()=>{
      tooltip.innerHTML = `<span class="t-name">${escapeHTML(b.name)}</span><span class="t-status ${st}">● ${st.toUpperCase()}</span>`;
      tooltip.style.left = x+'px';
      tooltip.style.top = y+'px';
      tooltip.classList.add('show');
    });
    g.addEventListener('mouseleave',()=>tooltip.classList.remove('show'));
    g.addEventListener('click',()=>openDrawer(b));
    pinsLayer.appendChild(g);
  });
}

function renderRegionList(){
  const regionMap = {};
  branches.forEach(b=>{
    regionMap[b.region] = regionMap[b.region] || {open:0,closed:0};
    regionMap[b.region][effectiveStatus(b, asOfDate)]++;
  });
  const regionList = document.getElementById('regionList');
  regionList.innerHTML = '';
  Object.keys(regionMap).sort().forEach(region=>{
    const counts = regionMap[region];
    const row = document.createElement('div');
    row.className='region-row';
    row.innerHTML = `<span class="name">${region}</span><span class="counts"><b class="o">${counts.open||0} open</b> · <b class="c">${counts.closed||0} closed</b></span>`;
    row.addEventListener('click',()=>openRegionDrawer(region));
    regionList.appendChild(row);
  });
}

function renderAlertFeed(){
  const alertFeed = document.getElementById('alertFeed');
  const closed = branches.filter(b=>effectiveStatus(b, asOfDate)==='closed');
  alertFeed.innerHTML = '';
  if(closed.length===0){
    alertFeed.innerHTML = '<div class="empty">No closed branches on this date.</div>';
  } else {
    closed.forEach(b=>{
      const item = document.createElement('div');
      item.className='alert-item';
      const cat = b.history[0] ? b.history[0][0].replace('Closed — ','') : (b.category||'Closed');
      item.innerHTML = `<div class="a-top"><span>${escapeHTML(b.name)}</span><span class="tag">${escapeHTML(cat)}</span></div>
        <div class="a-meta">${b.region} · since ${b.history[0] ? b.history[0][2].toLowerCase() : ''}</div>`;
      item.addEventListener('click',()=>openDrawer(b));
      alertFeed.appendChild(item);
    });
  }
}

const DONUT_REASON_COLORS = {
  'Calamity':'#e67e22','Flooding':'#2980b9','Power Outage':'#f1c40f','Connectivity':'#8e44ad',
  'System Maintenance':'#16a085','Security Incident':'#c0392b','Holiday':'#3498db','Other':'#7f8c8d',
  'Natural Disruption':'#e67e22','Political Disruption':'#9b59b6','Disaster':'#d35400','Operational':'#16a085'
};

function getClosureCategory(b, dateStr){
  if(b.history && b.history[0] && b.history[0][0].indexOf('Closed') === 0){
    return b.history[0][0].replace('Closed — ','').trim();
  }
  if(isNonWorkingHoliday(dateStr, b.code)) return 'Holiday';
  return b.category || 'Other';
}

function drawDonut(svgEl, segments){
  const r = 50, cx = 64, cy = 64, sw = 18;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((s,d)=>s+d.value,0);
  let html = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#eef1f6" stroke-width="${sw}"></circle>`;
  let offset = 0;
  segments.forEach(seg=>{
    if(!seg.value) return;
    const frac = total ? seg.value/total : 0;
    const len = frac * circumference;
    html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="${sw}" stroke-dasharray="${len.toFixed(2)} ${(circumference-len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"><title>${seg.label}: ${seg.value}</title></circle>`;
    offset += len;
  });
  svgEl.innerHTML = html;
}

function renderDonutLegend(containerEl, segments, total){
  if(!segments.length || total === 0){
    containerEl.innerHTML = '<div class="donut-empty">No data</div>';
    return;
  }
  containerEl.innerHTML = segments.filter(s=>s.value>0).map(s=>{
    return `<div class="donut-legend-item"><span class="sw" style="background:${s.color}"></span><span class="lbl">${s.label}</span><span class="val">${s.value}</span></div>`;
  }).join('');
}

function renderDonuts(){
  const total=branches.length;
  const closedList=branches.filter(b=>effectiveStatus(b,asOfDate)==='closed');
  const openCount=total-closedList.length;
  const statusSegments=[{label:'Open',value:openCount,color:'var(--open)'},{label:'Closed',value:closedList.length,color:'var(--closed)'}];
  drawDonut(document.getElementById('donutStatusSvg'),statusSegments);
  renderDonutLegend(document.getElementById('donutStatusLegend'),statusSegments,total);
  document.getElementById('donutStatusValue').textContent=total;
  const reasonCounts={};
  closedList.forEach(b=>{const cat=getClosureCategory(b,asOfDate);reasonCounts[cat]=(reasonCounts[cat]||0)+1;});
  const entries=Object.keys(reasonCounts).map(cat=>[cat,reasonCounts[cat]]).sort((a,b)=>b[1]-a[1]);
  const chart=document.getElementById('reasonBarChart');
  chart.innerHTML='';
  if(!entries.length){chart.innerHTML='<div class="reason-bar-empty">No closed branches</div>';return;}
  const max=Math.max(...entries.map(x=>x[1]),1);
  entries.forEach(([label,count])=>{
    const row=document.createElement('div');row.className='reason-bar-row';row.title=`${label}: ${count}`;
    const l=document.createElement('div');l.className='reason-bar-label';l.textContent=label;
    const track=document.createElement('div');track.className='reason-bar-track';
    const fill=document.createElement('div');fill.className='reason-bar-fill';fill.style.width=`${Math.max(count/max*100,2)}%`;track.appendChild(fill);
    const c=document.createElement('div');c.className='reason-bar-count';c.textContent=count;
    row.append(l,track,c);chart.appendChild(row);
  });
}
function refreshAll(){
  renderMetrics();
  renderDonuts();
  renderPins();
  renderRegionList();
  renderAlertFeed();
}
