/* ===========================================================
   Request Form — script
   =========================================================== */

/* =========================================================
   REQUEST FORM
   ========================================================= */
const reqBranchSel = document.getElementById('reqBranch');
function populateBranchSelect(){
  const sorted = [...branches].sort((a,b)=>a.name.localeCompare(b.name));
  // Clear any previously-appended branch options (keep the placeholder option) so
  // re-calling this after adding a new branch doesn't duplicate the whole list.
  Array.from(reqBranchSel.querySelectorAll('option')).forEach(opt=>{
    if(opt.value) opt.remove();
  });
  const currentVal = reqBranchSel.value;
  sorted.forEach(b=>{
    const opt = document.createElement('option');
    opt.value = b.code;
    opt.textContent = b.name;
    reqBranchSel.appendChild(opt);
  });
  if(currentVal && sorted.some(b=>b.code===currentVal)) reqBranchSel.value = currentVal;
}
const branchPreview = document.getElementById('branchPreview');
reqBranchSel.addEventListener('change',()=>{
  const b = branches.find(x=>x.code===reqBranchSel.value);
  if(!b){ branchPreview.classList.remove('show'); return; }
  branchPreview.classList.add('show');
  branchPreview.innerHTML = `<b>${escapeHTML(b.region)}</b> · currently <b>${escapeHTML(b.status.toUpperCase())}</b> · ${escapeHTML(b.address||'—')}`;
  const optClosedLabel = document.getElementById('optClosed');
  const optOpenLabel = document.getElementById('optOpen');
  optClosedLabel.classList.remove('disabled');
  optOpenLabel.classList.remove('disabled');
  optClosedLabel.querySelector('input').disabled = false;
  optOpenLabel.querySelector('input').disabled = false;
  if(b.status==='open'){
    optOpenLabel.classList.add('disabled');
    optOpenLabel.querySelector('input').disabled = true;
    optClosedLabel.querySelector('input').checked = true;
  } else {
    optClosedLabel.classList.add('disabled');
    optClosedLabel.querySelector('input').disabled = true;
    optOpenLabel.querySelector('input').checked = true;
  }
  const now = new Date();
  const localNow = new Date(now.getTime() - now.getTimezoneOffset()*60000).toISOString().slice(0,16);
  document.getElementById('reqClosedFrom').min = localNow;
  document.getElementById('reqClosedFrom').value = '';
  document.getElementById('reqClosedUntil').min = localNow;
  document.getElementById('reqClosedUntil').value = '';
  syncStatusChoiceUI();
});

function syncStatusChoiceUI(){
  const val = (document.querySelector('input[name=reqStatus]:checked')||{}).value;
  document.getElementById('optOpen').classList.toggle('checked', val==='open');
  document.getElementById('optClosed').classList.toggle('checked', val==='closed');
  document.getElementById('categoryGroup').style.display = val==='closed' ? 'block' : 'none';
  document.getElementById('subcategoryGroup').style.display = val==='closed' ? 'block' : 'none';
  document.getElementById('closedFromGroup').style.display = val==='closed' ? 'block' : 'none';
  document.getElementById('closedUntilGroup').style.display = val==='closed' ? 'block' : 'none';
  if(val!=='closed'){
    document.getElementById('newCategoryGroup').style.display = 'none';
    document.getElementById('newSubcategoryGroup').style.display = 'none';
    document.getElementById('reqClosedFrom').value = '';
    document.getElementById('reqClosedUntil').value = '';
  } else {
    populateCategorySelect(true);
    populateSubcategorySelect(true);
  }
}
document.querySelectorAll('input[name=reqStatus]').forEach(r=>r.addEventListener('change', syncStatusChoiceUI));

document.getElementById('reqClosedFrom').addEventListener('change', function(){
  const today = new Date().toISOString().split('T')[0];
  const untilInput = document.getElementById('reqClosedUntil');
  untilInput.min = this.value || today;
  if(untilInput.value && untilInput.value < untilInput.min){
    untilInput.value = '';
  }
});


/* =========================================================
   CLOSURE CATEGORIES & SUBCATEGORIES
   ========================================================= */
let CLOSURE_CATEGORIES = {
  'Natural Disruption': ['Flood','Typhoon','Volcanic Activity','Earthquake','Landslide','Storm Surge','Other'],
  'Political Disruption': ['Rally / Protest','Transport Strike','Election-related','Civil Disturbance','Other'],
  'Disaster': ['Fire','Explosion','Structural Damage','Other'],
  'Security Incident': ['Robbery','Theft','Bomb Threat','Armed Threat','Other'],
  'Operational': ['Power Outage','Connectivity / System Outage','Scheduled System Maintenance','Other'],
  'Other': ['Other']
};

function populateCategorySelect(preserveValue){
  const sel = document.getElementById('reqCategory');
  const current = preserveValue ? sel.value : null;
  sel.innerHTML = '<option value="" disabled>Select category</option>'
    + Object.keys(CLOSURE_CATEGORIES).map(c=>`<option value="${c}">${c}</option>`).join('')
    + `<option value="__add__">+ Add new category…</option>`;
  if(current && CLOSURE_CATEGORIES[current]) sel.value = current;
  else sel.value = '';
}

function populateSubcategorySelect(preserveValue){
  const cat = document.getElementById('reqCategory').value;
  const sel = document.getElementById('reqSubcategory');
  const current = preserveValue ? sel.value : null;
  const subs = CLOSURE_CATEGORIES[cat] || ['Other'];
  sel.innerHTML = '<option value="" disabled>Select subcategory</option>'
    + subs.map(s=>`<option value="${s}">${s}</option>`).join('')
    + `<option value="__add__">+ Add new subcategory…</option>`;
  if(current && subs.includes(current)) sel.value = current;
  else sel.value = '';
}

document.getElementById('reqCategory').addEventListener('change', function(){
  if(this.value === '__add__'){
    document.getElementById('newCategoryGroup').style.display = 'block';
    document.getElementById('subcategoryGroup').style.display = 'none';
    document.getElementById('newSubcategoryGroup').style.display = 'none';
    document.getElementById('newCategoryInput').focus();
  } else {
    document.getElementById('newCategoryGroup').style.display = 'none';
    document.getElementById('subcategoryGroup').style.display = 'block';
    populateSubcategorySelect(false);
  }
});

document.getElementById('addCategoryBtn').addEventListener('click', async function(){
  const input = document.getElementById('newCategoryInput');
  const name = input.value.trim();
  if(!name){ showToast('Enter a category name.', 'error'); return; }
  if(!CLOSURE_CATEGORIES[name]){
    const { data: cat, error } = await sb.from('closure_categories').insert({name}).select().single();
    if(error){ showToast('Failed to add category: ' + error.message, 'error'); return; }
    await sb.from('closure_subcategories').insert({category_id: cat.id, name:'Other'});
    await loadCategories();
  }
  populateCategorySelect(false);
  document.getElementById('reqCategory').value = name;
  input.value = '';
  document.getElementById('newCategoryGroup').style.display = 'none';
  document.getElementById('subcategoryGroup').style.display = 'block';
  populateSubcategorySelect(false);
  showToast(`Category "${name}" added.`, 'success');
});
document.getElementById('cancelCategoryBtn').addEventListener('click', function(){
  document.getElementById('newCategoryInput').value = '';
  document.getElementById('newCategoryGroup').style.display = 'none';
  document.getElementById('reqCategory').value = Object.keys(CLOSURE_CATEGORIES)[0];
  document.getElementById('subcategoryGroup').style.display = 'block';
  populateSubcategorySelect(false);
});

document.getElementById('reqSubcategory').addEventListener('change', function(){
  document.getElementById('newSubcategoryGroup').style.display = this.value==='__add__' ? 'block' : 'none';
  if(this.value==='__add__') document.getElementById('newSubcategoryInput').focus();
});

document.getElementById('addSubcategoryBtn').addEventListener('click', async function(){
  const cat = document.getElementById('reqCategory').value;
  const input = document.getElementById('newSubcategoryInput');
  const name = input.value.trim();
  if(!name){ showToast('Enter a subcategory name.', 'error'); return; }
  if(!CLOSURE_CATEGORIES[cat] || !CLOSURE_CATEGORIES[cat].includes(name)){
    const { data: catRow, error: catErr } = await sb.from('closure_categories').select('id').eq('name', cat).single();
    if(catErr){ showToast('Failed to find category: ' + catErr.message, 'error'); return; }
    const { error } = await sb.from('closure_subcategories').insert({category_id: catRow.id, name});
    if(error){ showToast('Failed to add subcategory: ' + error.message, 'error'); return; }
    await loadCategories();
  }
  populateSubcategorySelect(false);
  document.getElementById('reqSubcategory').value = name;
  input.value = '';
  document.getElementById('newSubcategoryGroup').style.display = 'none';
  showToast(`Subcategory "${name}" added.`, 'success');
});
document.getElementById('cancelSubcategoryBtn').addEventListener('click', function(){
  document.getElementById('newSubcategoryInput').value = '';
  document.getElementById('newSubcategoryGroup').style.display = 'none';
  document.getElementById('reqSubcategory').value = (CLOSURE_CATEGORIES[document.getElementById('reqCategory').value]||['Other'])[0];
});

populateCategorySelect(false);
populateSubcategorySelect(false);

let reqIdCounter = 1;
let requests = [];

function resetRequestForm(){
  const form = document.getElementById('requestForm');
  const branchSelect = document.getElementById('reqBranch');

  if(form) form.reset();

  if(branchSelect) branchSelect.value = '';

  document.getElementById('reqCategory').value = '';
  document.getElementById('reqSubcategory').value = '';
  document.getElementById('reqReason').value = '';
  document.getElementById('reqClosedFrom').value = '';
  document.getElementById('reqClosedUntil').value = '';

  const openRadio = document.querySelector('input[name="reqStatus"][value="open"]');
  const closedRadio = document.querySelector('input[name="reqStatus"][value="closed"]');
  if(openRadio) openRadio.checked = true;
  if(closedRadio) closedRadio.checked = false;

  branchPreview.classList.remove('show');
  document.getElementById('optClosed').classList.remove('disabled','checked');
  document.getElementById('optOpen').classList.remove('disabled');
  document.getElementById('optClosed').querySelector('input').disabled = false;
  document.getElementById('optOpen').querySelector('input').disabled = false;

  document.getElementById('closedFromGroup').style.display = 'none';
  document.getElementById('closedUntilGroup').style.display = 'none';

  syncStatusChoiceUI();
  populateCategorySelect(false);
  populateSubcategorySelect(false);
}

function showRequestForm(){
  closeAllDropdowns();
  if(!can('can_request') && !can('can_create_request')){
    showToast('This account cannot create requests.', 'error');
    return;
  }
  resetRequestForm();
  populateBranchSelect();
  document.getElementById('requestListModule').style.display = 'none';
  document.getElementById('requestFormModule').classList.add('show');
  window.scrollTo({top:0, behavior:'smooth'});
}

function showRequestList(){
  resetRequestForm();
  document.getElementById('requestFormModule').classList.remove('show');
  document.getElementById('requestListModule').style.display = 'block';
  renderMySubmissions();
  window.scrollTo({top:0, behavior:'smooth'});
}

document.getElementById('openRequestFormBtn').addEventListener('click', showRequestForm);
document.getElementById('backToRequestListBtn').addEventListener('click', showRequestList);

document.getElementById('requestForm').addEventListener('submit', async function(e){
  e.preventDefault();
  const branchCode = reqBranchSel.value;
  const b = branches.find(x=>x.code===branchCode);
  const statusInput = document.querySelector('input[name=reqStatus]:checked');
  if(!b){ showToast('Select a branch first.', 'error'); return; }
  if(!statusInput){ showToast('Choose whether the branch is closing or reopening.', 'error'); return; }
  const reason = document.getElementById('reqReason').value.trim();
  if(!reason){ showToast('Add a short description of what happened.', 'error'); return; }

  const requestedStatus = statusInput.value;
  const category = requestedStatus==='closed' ? document.getElementById('reqCategory').value : null;
  const subcategory = requestedStatus==='closed' ? document.getElementById('reqSubcategory').value : null;
  const closedFromDateTime = requestedStatus==='closed' ? document.getElementById('reqClosedFrom').value : null;
  const closedUntilDateTime = requestedStatus==='closed' ? document.getElementById('reqClosedUntil').value : null;

  // Store the date and time separately because the existing Supabase schema
  // uses closed_from/closed_until plus closed_from_time/closed_until_time.
  const splitDateTimeLocal = (value) => {
    if(!value) return {date:null,time:null};
    const parts = value.split('T');
    return {date:parts[0] || null, time:(parts[1] || '').slice(0,5) || null};
  };
  const fromParts = splitDateTimeLocal(closedFromDateTime);
  const untilParts = splitDateTimeLocal(closedUntilDateTime);
  const closedFrom = fromParts.date;
  const closedUntil = untilParts.date;
  const closedFromTime = fromParts.time;
  const closedUntilTime = untilParts.time;
  if(requestedStatus==='closed' && category==='__add__'){
    showToast('Finish adding the new category, or choose an existing one.', 'error');
    return;
  }
  if(requestedStatus==='closed' && subcategory==='__add__'){
    showToast('Finish adding the new subcategory, or choose an existing one.', 'error');
    return;
  }
  if(requestedStatus==='closed' && !closedFrom){
    showToast('Select a "Closed from" date.', 'error');
    return;
  }
  if(requestedStatus==='closed' && !closedUntil){
    showToast('Select a "Closed until" date.', 'error');
    return;
  }

  const id = null; // Supabase generates the unique REQ-#### ID
  const { data: createdRequest, error } = await sb.from('closure_requests')
    .insert({
      branch_code: b.code, requested_status: requestedStatus,
      category, subcategory, reason,
      closed_from: closedFrom || null, closed_until: closedUntil || null,
      closed_from_time: closedFromTime, closed_until_time: closedUntilTime,
      status: 'pending', submitted_by: currentUser.id
    })
    .select('id')
    .single();

  if(error){
    showToast('Failed to submit request: ' + error.message, 'error');
    return;
  }
  await loadRequests();
  showToast(`Request ${createdRequest.id} submitted for approval.`, 'success');
  updatePendingBadge();
  renderMySubmissions();
  showRequestList();
});
document.getElementById('reqResetBtn').addEventListener('click', ()=>{
  setTimeout(()=>{
    branchPreview.classList.remove('show');
    document.getElementById('optClosed').classList.remove('disabled');
    document.getElementById('optOpen').classList.remove('disabled');
    document.getElementById('optClosed').querySelector('input').disabled = false;
    document.getElementById('optOpen').querySelector('input').disabled = false;
    document.getElementById('reqClosedFrom').value = '';
    document.getElementById('reqClosedUntil').value = '';
    syncStatusChoiceUI();
  }, 0);
});

function fmtDateTime(dateStr, timeStr){
  if(!dateStr) return '—';

  let d = null;
  const raw = String(dateStr).trim();
  const rawTime = timeStr ? String(timeStr).trim() : '';

  // Supabase may return a date, a timestamp, or an ISO timestamp.
  if(raw.includes('T') || raw.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(raw)){
    d = new Date(raw);
  } else if(/^\d{4}-\d{2}-\d{2}$/.test(raw)){
    const safeTime = rawTime ? rawTime.slice(0,8) : '00:00';
    d = new Date(`${raw}T${safeTime}`);
  } else {
    d = new Date(raw);
  }

  if(Number.isNaN(d.getTime())) return '—';

  const datePart = d.toLocaleDateString('en-US',{
    month:'short',day:'numeric',year:'numeric'
  });

  const hasTime = !!rawTime || raw.includes('T') || raw.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(raw);
  if(!hasTime) return datePart;

  const timePart = d.toLocaleTimeString('en-US',{
    hour:'numeric',minute:'2-digit',hour12:true
  });
  return `${datePart}, ${timePart}`;
}

function requestLabel(r){
  return r.requestedStatus === 'closed' ? 'Report Closed' : 'Report Reopened';
}

function requestDetailsLabel(r){
  if(r.requestedStatus === 'closed'){
    return [r.category, r.subcategory].filter(Boolean).join(' · ') || 'Branch closure';
  }
  return 'Branch reopening';
}

function requestStatusPill(r){
  return r.status === 'pending'
    ? '<span class="pill pending">PENDING</span>'
    : r.status === 'approved'
      ? '<span class="pill approved">APPROVED</span>'
      : '<span class="pill rejected">REJECTED</span>';
}

function requestTableRowHTML(r, mode){
  return `<tr>
    <td class="view-col">
      <button type="button" class="btn btn-view btn-sm" onclick="openRequestDetails('${r.id}','${mode}')">View</button>
    </td>
    <td><span class="request-id-cell">${r.id}</span></td>
    <td>
      <div class="branch-name-cell">${escapeHTML(r.branchName || '—')}</div>
      <div class="branch-code-cell">${escapeHTML(r.branchCode || '')}${r.region ? ' · '+escapeHTML(r.region) : ''}</div>
    </td>
    <td class="request-action-cell">${requestLabel(r)}</td>
    <td class="details-cell">
      <div class="details-main">${requestDetailsLabel(r)}</div>
      ${r.requestedStatus === 'closed' && r.closedFrom ? `<div class="details-sub">From ${fmtDateTime(r.closedFrom, r.closedFromTime)}${r.closedUntil ? ' · Until '+fmtDateTime(r.closedUntil, r.closedUntilTime) : ''}</div>` : ''}
    </td>
    <td class="submitted-cell">${escapeHTML(r.submittedAt || '—')}</td>
    <td>${requestStatusPill(r)}</td>
    <td>${escapeHTML(r.reviewedBy || '—')}</td>
  </tr>`;
}

function renderMySubmissions(){
  const mine = requests
    .filter(r=>r.submittedById===currentUser?.id && r.status==='pending')
    .sort((a,b)=>(b.submittedAtDate||0)-(a.submittedAtDate||0));

  const tbody = document.getElementById('mySubmissionsTableBody');
  const empty = document.getElementById('mySubmissionsEmpty');
  if(!tbody || !empty) return;

  if(mine.length===0){
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = mine.map(r=>{
    const requestLabelText = requestLabel(r);
    const details = requestDetailsLabel(r);
    const status = requestStatusPill(r);

    return `<tr>
      <td><span class="request-id">${r.id}</span></td>
      <td>
        <div class="request-branch-name">${escapeHTML(r.branchName || '—')}</div>
        <div class="request-branch-code">${escapeHTML(r.branchCode || '')}${r.region ? ' · '+escapeHTML(r.region) : ''}</div>
      </td>
      <td class="request-action-cell">${requestLabelText}</td>
      <td>${details}</td>
      <td>${escapeHTML(r.submittedAt || '—')}</td>
      <td>${status}</td>
    </tr>`;
  }).join('');
}

// renderPendingList() now lives in approvals/approvals.js
// renderArchiveList() now lives in archive/archive.js
// (both still use requestTableRowHTML() defined in this file)

function openRequestDetails(id, mode){
  const r = requests.find(x=>x.id===id);
  if(!r) return;

  const modal = document.getElementById('requestDetailModal');
  const scrim = document.getElementById('requestDetailScrim');
  const grid = document.getElementById('requestDetailGrid');
  const foot = document.getElementById('requestDetailFoot');

  document.getElementById('requestDetailTitle').textContent = 'Request Details';
  document.getElementById('requestDetailSubtitle').textContent =
    `${r.id} · ${r.branchName || 'Unknown Branch'}${r.branchCode ? ' ('+r.branchCode+')' : ''}`;

  const status = requestStatusPill(r);
  const change = r.requestedStatus === 'closed'
    ? `OPEN → CLOSED${r.category ? ' · '+r.category : ''}${r.subcategory ? ' · '+r.subcategory : ''}`
    : 'CLOSED → OPEN';

  grid.innerHTML = `
    <div class="request-detail-item">
      <div class="label">Request ID</div>
      <div class="value">${r.id}</div>
    </div>
    <div class="request-detail-item">
      <div class="label">Status</div>
      <div class="value">${status}</div>
    </div>
    <div class="request-detail-item">
      <div class="label">Branch</div>
      <div class="value">${escapeHTML(r.branchName || '—')}${r.branchCode ? ' · '+r.branchCode : ''}</div>
    </div>
    <div class="request-detail-item">
      <div class="label">Region</div>
      <div class="value">${escapeHTML(r.region || '—')}</div>
    </div>
    <div class="request-detail-item">
      <div class="label">Request</div>
      <div class="value">${requestLabel(r)}</div>
    </div>
    <div class="request-detail-item">
      <div class="label">Status Change</div>
      <div class="value">${change}</div>
    </div>
    <div class="request-detail-item">
      <div class="label">Category</div>
      <div class="value">${escapeHTML(r.category || '—')}</div>
    </div>
    <div class="request-detail-item">
      <div class="label">Subcategory</div>
      <div class="value">${escapeHTML(r.subcategory || '—')}</div>
    </div>
    <div class="request-detail-item">
      <div class="label">Closed From (Date &amp; Time)</div>
      <div class="value">${r.closedFrom ? fmtDateTime(r.closedFrom,r.closedFromTime) : '—'}</div>
    </div>
    <div class="request-detail-item">
      <div class="label">Closed Until (Date &amp; Time)</div>
      <div class="value">${r.closedUntil ? fmtDateTime(r.closedUntil,r.closedUntilTime) : '—'}</div>
    </div>
    <div class="request-detail-item">
      <div class="label">Submitted By</div>
      <div class="value">${escapeHTML(r.submittedBy || '—')}${r.submittedByPosition ? ' · '+r.submittedByPosition : ''}</div>
    </div>
    <div class="request-detail-item">
      <div class="label">Date Submitted</div>
      <div class="value">${escapeHTML(r.submittedAt || '—')}</div>
    </div>
    <div class="request-detail-item">
      <div class="label">Reviewed By</div>
      <div class="value">${escapeHTML(r.reviewedBy || '—')}</div>
    </div>
    <div class="request-detail-item">
      <div class="label">Reviewed At</div>
      <div class="value">${escapeHTML(r.reviewedAt || '—')}</div>
    </div>
    <div class="request-detail-item full">
      <div class="label">Approval Remarks</div>
      <div class="value reason">${escapeHTML(r.reviewRemarks || '—')}</div>
    </div>
    <div class="request-detail-item full">
      <div class="label">Details / Reason</div>
      <div class="value reason">${escapeHTML(r.reason || '—')}</div>
    </div>`;

  const showActions = mode === 'approval' && r.status === 'pending' && can('can_approve');
  if(showActions){
    foot.innerHTML = `
      <div class="approval-remarks">
        <label for="approvalRemarks">Remarks <span class="required-mark" aria-hidden="true">*</span> <span class="remarks-note">required for rejection</span></label>
        <textarea id="approvalRemarks" rows="2" maxlength="500" placeholder="Enter remarks when rejecting"></textarea>
      </div>
      <div class="request-detail-actions">
        <button type="button" class="btn btn-ghost" id="requestDetailCloseBtn">Close</button>
        <button type="button" class="btn btn-danger btn-sm" onclick="submitRejection('${r.id}')">Reject</button>
        <button type="button" class="btn btn-approve btn-sm" onclick="submitApproval('${r.id}')">Approve</button>
      </div>`;
  } else {
    foot.innerHTML = `<button type="button" class="btn btn-ghost" id="requestDetailCloseBtn">Close</button>`;
  }
  foot.querySelector('#requestDetailCloseBtn')?.addEventListener('click', closeRequestDetails);

  modal.classList.add('show');
  scrim.classList.add('show');
}

function closeRequestDetails(){
  document.getElementById('requestDetailModal')?.classList.remove('show');
  document.getElementById('requestDetailScrim')?.classList.remove('show');
}

document.getElementById('requestDetailClose')?.addEventListener('click', closeRequestDetails);
document.getElementById('requestDetailCloseBtn')?.addEventListener('click', closeRequestDetails);
document.getElementById('requestDetailScrim')?.addEventListener('click', closeRequestDetails);

function updatePendingBadge(){
  const n = requests.filter(r=>r.status==='pending').length;
  const badge = document.getElementById('pendingCountBadge');
  if(n>0){ badge.style.display='inline-flex'; badge.textContent = n; }
  else { badge.style.display='none'; }
}

// Keep the Approval queue synchronized across users/tabs.
// A new request remains pending in the database and is immediately reflected
// in the approver's queue.
const closureRequestChannel = sb.channel('closure-requests-live')
  .on('postgres_changes',
    { event:'*', schema:'public', table:'closure_requests' },
    async () => {
      await loadRequests();
      renderPendingList();
      renderArchiveList();
      renderMySubmissions();
      updatePendingBadge();
    }
  )
  .subscribe();
