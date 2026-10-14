/* ===========================================================
   Branch Directory — script
   =========================================================== */

/* =========================================================
   BRANCH DIRECTORY — grouped by region
   ========================================================= */
let directorySelectedCode = null;
let directoryCollapsed = {};
let directoryListInitialized = false;
let directorySearchActive = false;
function renderDirectoryList(filterText){
  const list = document.getElementById('directoryList');
  const q = (filterText||'').trim().toLowerCase();
  const filtered = q ? branches.filter(b=>b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q)) : branches;
  if(filtered.length===0){
    list.innerHTML = `<div class="directory-empty">No branches match your search.</div>`;
    return;
  }
  const groups = {};
  filtered.forEach(b=>{
    if(!groups[b.region]) groups[b.region] = [];
    groups[b.region].push(b);
  });
  const regionNames = Object.keys(groups).sort();
  if(!directoryListInitialized){
    regionNames.forEach(region => { directoryCollapsed[region] = true; });
    directoryListInitialized = true;
  }
  if(q){
    regionNames.forEach(region => { directoryCollapsed[region] = false; });
    directorySearchActive = true;
  } else if(directorySearchActive){
    // search was just cleared — go back to the collapsed per-region list
    Object.keys(directoryCollapsed).forEach(region => { directoryCollapsed[region] = true; });
    directorySearchActive = false;
  }
  list.innerHTML = regionNames.map(region=>{
    const items = groups[region].sort((a,b)=>a.name.localeCompare(b.name));
    const isCollapsed = !!directoryCollapsed[region];
    return `
      <div class="directory-group ${isCollapsed?'collapsed':''}" data-region="${region}">
        <div class="directory-group-head">
          <span>${region}</span>
          <span class="dg-count">${items.length} <span class="dg-chev">▾</span></span>
        </div>
        <div class="directory-group-body">
          ${items.map(b=>`
            <div class="region-branch-item ${b.code===directorySelectedCode?'selected':''}" data-code="${escapeHTML(b.code)}">
              <div><div class="rb-name">${escapeHTML(b.name)}</div><div class="rb-code">${escapeHTML(b.code)}</div></div>
            </div>`).join('')}
        </div>
      </div>`;
  }).join('');
  list.querySelectorAll('.directory-group-head').forEach(head=>{
    head.addEventListener('click', ()=>{
      const group = head.closest('.directory-group');
      const region = group.getAttribute('data-region');
      directoryCollapsed[region] = !directoryCollapsed[region];
      group.classList.toggle('collapsed', directoryCollapsed[region]);
    });
  });
  list.querySelectorAll('.region-branch-item').forEach(item=>{
    item.addEventListener('click', (e)=>{
      e.stopPropagation();
      const code = item.getAttribute('data-code');
      const b = branches.find(x=>x.code===code);
      if(b) showDirectoryDetail(b);
    });
  });
}
function showDirectoryDetail(b){
  directorySelectedCode = b.code;
  document.querySelectorAll('#directoryList .region-branch-item').forEach(item=>{
    item.classList.toggle('selected', item.getAttribute('data-code')===b.code);
  });
  const detail = document.getElementById('directoryDetail');
  detail.innerHTML = `
    <div class="dd-name">${escapeHTML(b.name)}</div>
    <div class="dd-code">${escapeHTML(b.code)}</div>
    <div class="info-row"><span class="k">Date Opened</span><span class="v">${b.anniversary||'—'}</span></div>
    <div class="info-row"><span class="k">Region</span><span class="v">${b.region}</span></div>
    <div class="info-row"><span class="k">Address</span><span class="v">${escapeHTML(b.address||'—')}</span></div>
    <div class="info-row"><span class="k">Coordinates</span><span class="v">${b.lat.toFixed(3)}, ${b.lng.toFixed(3)}</span></div>
  `;
}
document.getElementById('directorySearch').addEventListener('input',(e)=>{
  renderDirectoryList(e.target.value);
});


/* =========================================================
   ADD BRANCH — modal form
   ========================================================= */
function getKnownRegions(){
  return [...new Set(branches.map(b=>b.region))].sort();
}
function populateAddBranchRegions(){
  const sel = document.getElementById('abRegion');
  const current = sel.value;
  const regions = getKnownRegions();
  sel.innerHTML = regions.map(r=>`<option value="${escapeHTML(r)}">${escapeHTML(r)}</option>`).join('')
    + `<option value="__add__">+ Add new region…</option>`;
  if(current && regions.includes(current)) sel.value = current;
}
document.getElementById('abRegion').addEventListener('change', function(){
  if(this.value === '__add__'){
    const name = prompt('Enter the new region name:');
    if(name && name.trim()){
      const trimmed = name.trim();
      populateAddBranchRegions();
      if(![...this.options].some(o=>o.value===trimmed)){
        const opt = document.createElement('option');
        opt.value = trimmed; opt.textContent = trimmed;
        this.insertBefore(opt, this.lastElementChild);
      }
      this.value = trimmed;
    } else {
      this.value = getKnownRegions()[0] || '';
    }
  }
});

function openAddBranchModal(){
  if(!can('can_manage_users')){
    showToast('Adding branches requires administrative access.', 'error');
    return;
  }
  document.getElementById('addBranchForm').reset();
  populateAddBranchRegions();
  document.getElementById('addBranchScrim').classList.add('show');
  document.getElementById('addBranchModal').classList.add('show');
}
function closeAddBranchModal(){
  document.getElementById('addBranchScrim').classList.remove('show');
  document.getElementById('addBranchModal').classList.remove('show');
}
document.getElementById('openAddBranchBtn').addEventListener('click', openAddBranchModal);
document.getElementById('addBranchModalClose').addEventListener('click', closeAddBranchModal);
document.getElementById('addBranchCancelBtn').addEventListener('click', closeAddBranchModal);
document.getElementById('addBranchScrim').addEventListener('click', closeAddBranchModal);

document.getElementById('addBranchSaveBtn').addEventListener('click', async function(){
  if(!can('can_manage_users')){
    showToast('Adding branches requires administrative access.', 'error');
    return;
  }
  const code = document.getElementById('abCode').value.trim();
  const name = document.getElementById('abName').value.trim();
  const region = document.getElementById('abRegion').value;
  const anniversary = document.getElementById('abAnniversary').value;
  const lat = parseFloat(document.getElementById('abLat').value);
  const lng = parseFloat(document.getElementById('abLng').value);
  const address = document.getElementById('abAddress').value.trim();
  const manager = document.getElementById('abManager').value.trim();
  const managerPhone = document.getElementById('abManagerPhone').value.trim();
  const managerEmail = document.getElementById('abManagerEmail').value.trim();
  const ops = document.getElementById('abOps').value.trim();
  const opsPhone = document.getElementById('abOpsPhone').value.trim();
  const hotline = document.getElementById('abHotline').value.trim();

  if(!code || !name){ showToast('Branch code and name are required.', 'error'); return; }
  if(!region || region==='__add__'){ showToast('Select or add a region.', 'error'); return; }
  if(isNaN(lat) || isNaN(lng)){ showToast('Enter valid latitude and longitude.', 'error'); return; }
  if(branches.some(b=>b.code.toLowerCase()===code.toLowerCase())){
    showToast(`Branch code "${code}" already exists.`, 'error');
    return;
  }

  const row = {
    code, name, region, lat, lng, status:'open',
    anniversary: anniversary || new Date().toISOString().split('T')[0],
    address: address || `${name} Office`,
    hours: '9:00 AM – 3:00 PM',
    manager: manager || '—', manager_phone: managerPhone || '—', manager_email: managerEmail || '—',
    ops: ops || '—', ops_phone: opsPhone || '—', hotline: hotline || '—'
  };
  const { error: insErr } = await sb.from('branches').insert(row);
  if(insErr){ showToast('Failed to save branch: ' + insErr.message, 'error'); return; }
  await sb.from('branch_history').insert({
    branch_code: code, title: 'Opened', description: 'Branch added to directory',
    actor: `${currentUser.full_name} (Added new branch)`
  });

  await loadBranches();
  const newBranch = branches.find(b=>b.code===code);
  closeAddBranchModal();
  populateBranchSelect();
  renderDirectoryList(document.getElementById('directorySearch').value);
  showDirectoryDetail(newBranch);
  refreshAll();
  showToast(`Branch "${name}" (${code}) added to the directory.`, 'success');
});



/* =========================================================
   DRAWER
   ========================================================= */
const drawer = document.getElementById('drawer');
const scrim = document.getElementById('scrim');
function openDrawer(b){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  document.querySelector('.tab[data-tab="directory"]').classList.add('active');
  document.getElementById('pane-directory').classList.add('active');
  document.querySelector('.tabs').style.display='';

  document.getElementById('dCode').textContent = b.code;
  document.getElementById('dName').textContent = b.name;
  const pill = document.getElementById('dStatus');
  pill.className = 'status-pill '+b.status;
  document.getElementById('dStatusText').textContent = b.status==='open' ? 'Open' : 'Closed';

  document.getElementById('dManager').textContent = b.manager||'—';
  document.getElementById('dManagerPhone').textContent = b.managerPhone||'—';
  document.getElementById('dManagerEmail').textContent = b.managerEmail||'—';
  document.getElementById('dOps').textContent = b.ops||'—';
  document.getElementById('dOpsPhone').textContent = b.opsPhone||'—';
  document.getElementById('dHotline').textContent = b.hotline||'—';

  document.getElementById('lRegion').textContent = b.region;
  document.getElementById('lAddress').textContent = b.address||'—';
  document.getElementById('lCoords').textContent = b.lat.toFixed(3)+', '+b.lng.toFixed(3);
  document.getElementById('lHours').textContent = b.hours||'—';

  const hist = document.getElementById('historyList');
  hist.innerHTML='';
  (b.history||[]).forEach(([title,reason,when,by])=>{
    const item = document.createElement('div');
    item.className='hist-item';
    item.innerHTML = `<div class="h-title">${escapeHTML(title)}</div><div class="h-meta">${escapeHTML(reason)} — ${escapeHTML(when)} · ${escapeHTML(by)}</div>`;
    hist.appendChild(item);
  });

  drawer.classList.add('show');
  scrim.classList.add('show');
}
function openRegionDrawer(regionName){
  const regionBranches = branches.filter(b=>b.region===regionName);
  const openCount = regionBranches.filter(b=>b.status==='open').length;
  const closedCount = regionBranches.filter(b=>b.status==='closed').length;

  document.getElementById('dCode').textContent = regionBranches.length+' branches';
  document.getElementById('dName').textContent = regionName;
  const pill = document.getElementById('dStatus');
  pill.className = 'status-pill open';
  document.getElementById('dStatusText').textContent = openCount+' open · '+closedCount+' closed';

  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  document.querySelector('.tabs').style.display='none';

  document.getElementById('pane-region').innerHTML =
    `<div class="region-drawer-hint">Click a branch to view its full details.</div>` +
    regionBranches.sort((a,b)=>a.name.localeCompare(b.name)).map(b=>
      `<div class="region-branch-item" data-code="${escapeHTML(b.code)}">
        <div><div class="rb-name">${escapeHTML(b.name)}</div><div class="rb-code">${escapeHTML(b.code)}</div></div>
        <span class="rb-status ${b.status}">${b.status==='open'?'Open':'Closed'}</span>
      </div>`
    ).join('');

  document.getElementById('pane-region').querySelectorAll('.region-branch-item').forEach(item=>{
    item.addEventListener('click',()=>{
      const code = item.getAttribute('data-code');
      const b = branches.find(x=>x.code===code);
      if(b) openDrawer(b);
    });
  });

  document.getElementById('pane-region').classList.add('active');

  drawer.classList.add('show');
  scrim.classList.add('show');
}
document.getElementById('closeDrawer').addEventListener('click',closeDrawer);
scrim.addEventListener('click',closeDrawer);
function closeDrawer(){ drawer.classList.remove('show'); scrim.classList.remove('show'); }

document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('pane-'+tab.dataset.tab).classList.add('active');
  });
});

