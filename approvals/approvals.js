/* ===========================================================
   Approvals — script
   =========================================================== */

/* =========================================================
   APPROVE / REJECT — this is what auto-updates the map + feed
   ========================================================= */
async function approveRequest(id, remarks){
  const req = requests.find(r=>r.id===id);
  if(!req || req.status!=='pending') return;
  const b = branches.find(x=>x.code===req.branchCode);
  if(!b){ showToast('Branch not found.', 'error'); return; }
  if(!can('can_approve')){ showToast('You do not have approval access.', 'error'); return; }
  const reviewer = currentUser.full_name;
  let historyTitle, historyDesc, branchUpdate;
  if(req.requestedStatus==='closed'){
    const catLabel = req.category || 'Other';
    const subLabel = req.subcategory || '';
    const untilDate = req.closedUntil ? fmtDateTime(req.closedUntil, req.closedUntilTime) : '';
    const hours = subLabel==='Scheduled System Maintenance' ? 'Suspended for scheduled maintenance'
      : subLabel==='Power Outage' ? 'Suspended — power outage'
      : subLabel==='Connectivity / System Outage' ? 'Suspended — network outage'
      : subLabel==='Flood' ? 'Suspended — flooding'
      : untilDate ? `Suspended until ${untilDate}`
      : 'Suspended until further notice';
    branchUpdate = {
      status:'closed', closed_from: req.closedFrom, closed_until: req.closedUntil,
      hours, emergency: subLabel !== 'Scheduled System Maintenance'
    };
    historyTitle = `Closed — ${catLabel}`;
    historyDesc = subLabel ? `[${subLabel}] ${req.reason}` : req.reason;
  } else {
    branchUpdate = { status:'open', closed_from:null, closed_until:null, hours:'9:00 AM – 3:00 PM', emergency:false };
    historyTitle = 'Opened';
    historyDesc = req.reason || 'Regular operating hours resumed';
  }

  const { error: bErr } = await sb.from('branches').update(branchUpdate).eq('code', b.code);
  if(bErr){ showToast('Failed to update branch: ' + bErr.message, 'error'); return; }
  await sb.from('branch_history').insert({
    branch_code: b.code, title: historyTitle, description: historyDesc,
    actor: `${reviewer} (Approved ${req.id})`
  });
  const { error: rErr } = await sb.from('closure_requests').update({
    status:'approved', reviewed_by: currentUser.id, reviewed_at: new Date().toISOString()
  }).eq('id', id);
  if(rErr){ showToast('Failed to update request: ' + rErr.message, 'error'); return; }

  await Promise.all([loadBranches(), loadRequests()]);
  refreshAll();
  renderPendingList();
  updatePendingBadge();
  showToast(`${req.branchName} updated on the map and alert feed.`, 'success');
}

function submitApproval(id){
  const input = document.getElementById('approvalRemarks');
  closeRequestDetails();
  approveRequest(id, input?.value || '');
}

function submitRejection(id){
  const input = document.getElementById('approvalRemarks');
  if(!input || !input.value.trim()){
    input?.focus();
    showToast('Remarks are required before rejecting the request.', 'error');
    return;
  }
  closeRequestDetails();
  rejectRequest(id, input.value);
}

async function rejectRequest(id, remarks){
  const req = requests.find(r=>r.id===id);
  if(!req || req.status!=='pending') return;
  if(!can('can_approve')){ showToast('You do not have approval access.', 'error'); return; }
  if(!remarks || !remarks.trim()){ showToast('Remarks are required before rejecting the request.', 'error'); return; }
  const { error } = await sb.from('closure_requests').update({
    status:'rejected', review_remarks:remarks.trim(), reviewed_by: currentUser.id, reviewed_at: new Date().toISOString()
  }).eq('id', id);
  if(error){ showToast('Failed to reject request: ' + error.message, 'error'); return; }
  await loadRequests();
  renderPendingList();
  updatePendingBadge();
  showToast(`Request ${req.id} rejected.`, 'info');
}


// Moved from the original REQUEST FORM section — pending-requests table
// on the Approvals view. Uses requestTableRowHTML() from request-form.js.
function renderPendingList(){
  const pending = requests.filter(r=>r.status==='pending');
  const tbody = document.getElementById('pendingTableBody');
  const empty = document.getElementById('pendingTableEmpty');
  if(!tbody || !empty) return;

  if(pending.length===0){
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = pending.map(r=>requestTableRowHTML(r,'approval')).join('');
}
