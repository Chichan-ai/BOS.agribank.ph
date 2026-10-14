/* ===========================================================
   Header & Navigation — script
   =========================================================== */

/* =========================================================
   VIEW PROFILE — read-only modal populated from currentUser
   ========================================================= */
function openProfileModal(){
  if(!currentUser) return;
  document.getElementById('profFullName').textContent = currentUser.full_name || '—';
  document.getElementById('profUsername').textContent = currentUser.username || '—';
  document.getElementById('profEmail').textContent = currentUser.email || '—';
  document.getElementById('profRole').textContent = currentUser.role_label || currentUser.role || '—';
  const perms = currentUser.permissions || {};
  const permsEl = document.getElementById('profPerms');
  const granted = ACCESS_PERMS.filter(p => perms[p.key]).map(p => p.label);
  permsEl.innerHTML = granted.length
    ? granted.map(l => `<div>✓ ${l}</div>`).join('')
    : '<div>No permissions granted.</div>';
  document.getElementById('profileScrim').classList.add('show');
  document.getElementById('profileModal').classList.add('show');
  document.getElementById('dd-account').classList.remove('show');
}
function closeProfileModal(){
  document.getElementById('profileScrim').classList.remove('show');
  document.getElementById('profileModal').classList.remove('show');
}
document.getElementById('link-view-profile').addEventListener('click', (e)=>{
  e.preventDefault(); e.stopPropagation();
  openProfileModal();
});
document.getElementById('profileModalClose').addEventListener('click', closeProfileModal);
document.getElementById('profileCloseBtn').addEventListener('click', closeProfileModal);
document.getElementById('profileScrim').addEventListener('click', closeProfileModal);



/* =========================================================
   NAV DROPDOWNS
   ========================================================= */
function closeAllDropdowns(){
  document.querySelectorAll('.dropdown.show').forEach(d=>d.classList.remove('show'));
  document.querySelectorAll('.navitem.open').forEach(n=>n.classList.remove('open'));
  document.getElementById('dd-account').classList.remove('show');
}
function wireDropdown(navId, ddId){
  const nav = document.getElementById(navId), dd = document.getElementById(ddId);
  nav.addEventListener('click',(e)=>{
    e.stopPropagation();
    const willOpen = !dd.classList.contains('show');
    closeAllDropdowns();
    if(willOpen){ dd.classList.add('show'); nav.classList.add('open'); }
  });
}
wireDropdown('nav-records','dd-records');
wireDropdown('nav-forms','dd-forms');

const accCell = document.getElementById('account-cell');
const accDD = document.getElementById('dd-account');
accCell.addEventListener('click',(e)=>{ e.stopPropagation(); accDD.classList.toggle('show'); });
document.addEventListener('click', closeAllDropdowns);



/* =========================================================
   CHANGE PASSWORD — verifies the current password, then updates it
   through Supabase Auth (the signed-in user changes their own password)
   ========================================================= */
function openPwModal(){
  ['pwCurrent','pwNew','pwConfirm'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('pwError').textContent='';
  document.getElementById('dd-account').classList.remove('show');
  document.getElementById('pwScrim').classList.add('show');
  document.getElementById('pwModal').classList.add('show');
  document.getElementById('pwCurrent').focus();
}
function closePwModal(){
  document.getElementById('pwScrim').classList.remove('show');
  document.getElementById('pwModal').classList.remove('show');
}
async function savePassword(){
  const cur=document.getElementById('pwCurrent').value;
  const next=document.getElementById('pwNew').value;
  const conf=document.getElementById('pwConfirm').value;
  const err=document.getElementById('pwError');
  const btn=document.getElementById('pwSaveBtn');
  if(!cur||!next||!conf){ err.textContent='Please fill in all fields.'; return; }
  if(next.length<8){ err.textContent='New password must be at least 8 characters.'; return; }
  if(next!==conf){ err.textContent='New passwords do not match.'; return; }
  if(next===cur){ err.textContent='New password must be different from the current one.'; return; }
  err.textContent=''; btn.disabled=true; btn.textContent='Updating…';
  try{
    let email=currentUser?.email;
    if(!email){ const { data:{ user } } = await sb.auth.getUser(); email=user?.email; }
    if(!email){ err.textContent='Could not identify your account. Please sign in again.'; return; }
    const { error:badCur } = await sb.auth.signInWithPassword({ email, password:cur });
    if(badCur){ err.textContent='Current password is incorrect.'; return; }
    const { error } = await sb.auth.updateUser({ password:next });
    if(error){ err.textContent=error.message||'Could not update password.'; return; }
    closePwModal();
    showToast('Password updated.','success');
  }catch(e){
    console.error(e); err.textContent='Something went wrong. Please try again.';
  }finally{
    btn.disabled=false; btn.textContent='Update Password';
  }
}
document.getElementById('link-change-password').addEventListener('click',(e)=>{
  e.preventDefault(); e.stopPropagation(); openPwModal();
});
document.getElementById('pwSaveBtn').addEventListener('click',savePassword);
document.getElementById('pwCancelBtn').addEventListener('click',closePwModal);
document.getElementById('pwModalClose').addEventListener('click',closePwModal);
document.getElementById('pwScrim').addEventListener('click',closePwModal);
['pwCurrent','pwNew','pwConfirm'].forEach(id=>document.getElementById(id).addEventListener('keydown',(e)=>{ if(e.key==='Enter') savePassword(); }));
