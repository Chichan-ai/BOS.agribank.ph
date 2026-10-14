/* ===========================================================
   User Access Settings — script
   =========================================================== */

/* =========================================================
   USER ACCESS SETTINGS — backed by Supabase user_profiles.
   ACCESS_USERS is populated by loadAccessUsers() (see top of file).
   ========================================================= */
const ACCESS_USERS = [];

const ACCESS_PERMS = [
  { key:'can_login',              label:'Login' },
  { key:'can_access_dashboard',   label:'Dashboard' },
  { key:'can_request',            label:'Request' },
  { key:'can_approve',            label:'Approve' },
  { key:'can_access_user_access', label:'User Access' },
  { key:'can_view_archive',       label:'Archive' },
  { key:'can_export_data',        label:'Export' },
  { key:'can_manage_users',       label:'Manage Users' },
  { key:'can_view_audit_log',     label:'Audit Log' },
];

function escapeAccessHTML(value){
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[char]));
}

function renderAccessTable(){
  const tbody = document.getElementById('accessTableBody');
  tbody.innerHTML = ACCESS_USERS.map(u=>{
    const roleTag = u.roleClass ? `<span class="au-role ${u.roleClass}">${escapeAccessHTML(u.role)}</span>` : `<span class="au-role">${escapeAccessHTML(u.role)}</span>`;
    const toggles = ACCESS_PERMS.map(p=>{
      const checked = u.perms?.[p.key] ? 'checked' : '';
      return `<td><label class="toggle"><input type="checkbox" ${checked} data-user="${u.id}" data-perm="${p.key}"><span class="slider"></span></label></td>`;
    }).join('');
    const action = isAdmin1()
      ? `<td class="user-access-user-action-cell admin-only"><button type="button" class="btn btn-ghost btn-sm" data-reset-user="${u.id}">Reset Password</button></td>`
      : '';
    return `<tr><td class="au-name">${escapeAccessHTML(u.name)}</td><td>${roleTag}</td>${toggles}${action}</tr>`;
  }).join('');
}

let resetPasswordUserId = null;
function closeResetPasswordModal(){
  resetPasswordUserId = null;
  document.getElementById('resetPasswordScrim').classList.remove('show');
  document.getElementById('resetPasswordModal').classList.remove('show');
}
document.getElementById('accessTableBody').addEventListener('click', e=>{
  const button = e.target.closest('[data-reset-user]');
  if(!button || !isAdmin1()) return;
  const user = ACCESS_USERS.find(u=>u.id===button.dataset.resetUser);
  if(!user) return;
  resetPasswordUserId = user.id;
  document.getElementById('resetPasswordForm').reset();
  document.getElementById('resetPasswordUser').textContent = user.name;
  document.getElementById('resetPasswordScrim').classList.add('show');
  document.getElementById('resetPasswordModal').classList.add('show');
  document.getElementById('resetPasswordInput').focus();
});
document.getElementById('resetPasswordModalClose').addEventListener('click', closeResetPasswordModal);
document.getElementById('resetPasswordCancelBtn').addEventListener('click', closeResetPasswordModal);
document.getElementById('resetPasswordScrim').addEventListener('click', closeResetPasswordModal);
document.getElementById('resetPasswordSaveBtn').addEventListener('click', async function(){
  if(!isAdmin1() || !resetPasswordUserId) return;
  const password = document.getElementById('resetPasswordInput').value;
  if(password.length < 8){ showToast('Password must be at least 8 characters.', 'error'); return; }
  const button = this;
  button.disabled = true;
  try{
    const { data, error } = await sb.functions.invoke('reset-user-password', { body:{ userId:resetPasswordUserId, password } });
    if(error || data?.error) throw error || new Error(data.error);
    showToast('Password reset successfully.', 'success');
    closeResetPasswordModal();
  }catch(err){ showToast('Failed to reset password: ' + (err?.message || 'Unknown error'), 'error'); }
  finally{ button.disabled = false; }
});

document.getElementById('link-user-access').addEventListener('click', async (e)=>{
  e.preventDefault();
  e.stopPropagation();
  if(!can('can_access_user_access')){ showToast('User Access requires admin access.', 'error'); return; }
  switchView('user-access');
  await loadAccessUsers();
  renderAccessTable();
  const approvalsBlock = document.getElementById('userAccessApprovalsBlock');
  if(isAdmin1()){
    approvalsBlock.style.display = 'block';
    await loadUserAccessRequests();
    renderUserAccessRequestsTable();
  } else {
    approvalsBlock.style.display = 'none';
  }
});

// Persist permission toggle edits straight to user_profiles.permissions —
// EXCEPT when the caller isn't the main admin, in which case the change is
// queued in user_access_requests for the main admin to approve first.
document.getElementById('accessTableBody').addEventListener('change', async (e)=>{
  const input = e.target.closest('input[type=checkbox][data-user][data-perm]');
  if(!input) return;
  if(!can('can_manage_users')){
    showToast('You do not have permission to manage users.', 'error');
    input.checked = !input.checked;
    return;
  }
  const userId = input.dataset.user, perm = input.dataset.perm;
  const user = ACCESS_USERS.find(u=>u.id===userId);
  if(!user) return;
  const permLabel = ACCESS_PERMS.find(p=>p.key===perm)?.label || perm;
  const newValue = input.checked;

  if(!isAdmin1()){
    input.checked = !newValue; // don't reflect it in the table until the main admin approves it
    const { error } = await sb.from('user_access_requests').insert({
      type: 'permission_change',
      target_user_id: userId,
      target_user_name: user.name,
      payload: { perm, perm_label: permLabel, value: newValue },
      requested_by: currentUser.id,
      requested_by_name: currentUser.full_name || currentUser.username,
      status: 'pending'
    });
    if(error){ showToast('Failed to submit change: ' + error.message, 'error'); return; }
    showToast(`Submitted for approval: "${permLabel}" ${newValue ? 'on' : 'off'} for ${user.name}.`, 'success');
    return;
  }

  const nextPerms = { ...user.perms, [perm]: newValue };
  const { error } = await sb.from('user_profiles').update({ permissions: nextPerms }).eq('id', userId);
  if(error){
    showToast('Failed to update permission: ' + error.message, 'error');
    input.checked = !newValue;
    return;
  }
  user.perms = nextPerms;
  showToast(`Updated "${permLabel}" for ${user.name}.`, 'success');
});


/* =========================================================
   USER ACCESS APPROVALS — main admin reviews permission
   changes and new-user requests submitted by Admin II.
   ========================================================= */
const USER_ACCESS_REQUESTS = [];

async function loadUserAccessRequests(){
  const { data: rows, error } = await sb.from('user_access_requests')
    .select('*').eq('status', 'pending').order('created_at', { ascending: false });
  if(error){ console.error(error); showToast('Failed to load pending user access requests.', 'error'); return; }
  USER_ACCESS_REQUESTS.length = 0;
  rows.forEach(r=>USER_ACCESS_REQUESTS.push(r));
}

function userAccessRequestDetailHTML(r){
  if(r.type === 'create_user'){
    const p = r.payload || {};
    return `Create user <strong>${escapeAccessHTML(p.fullName || p.username)}</strong> (${escapeAccessHTML(p.username)}) — role: ${escapeAccessHTML(p.roleLabel || p.role)}`;
  }
  const p = r.payload || {};
  return `${p.value ? 'Grant' : 'Revoke'} <strong>${escapeAccessHTML(p.perm_label)}</strong> for ${escapeAccessHTML(r.target_user_name || 'user')}`;
}

function renderUserAccessRequestsTable(){
  const tbody = document.getElementById('userAccessRequestsTableBody');
  const empty = document.getElementById('userAccessRequestsEmpty');
  if(USER_ACCESS_REQUESTS.length === 0){
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  tbody.innerHTML = USER_ACCESS_REQUESTS.map(r=>`
    <tr>
      <td>${r.type === 'create_user' ? 'New User' : 'Permission Change'}</td>
      <td>${escapeAccessHTML(r.requested_by_name || '—')}</td>
      <td class="details-cell">${userAccessRequestDetailHTML(r)}</td>
      <td class="submitted-cell">${timeAgo(r.created_at)}</td>
      <td class="row-actions user-access-action-cell">
        <button class="btn btn-approve btn-sm" onclick="approveUserAccessRequest('${r.id}')">Approve</button>
        <button class="btn btn-ghost btn-sm" onclick="rejectUserAccessRequest('${r.id}')">Reject</button>
      </td>
    </tr>`).join('');
}

async function approveUserAccessRequest(id){
  if(!isAdmin1()){ showToast('Only Admin I can approve user access requests.', 'error'); return; }
  const req = USER_ACCESS_REQUESTS.find(r=>r.id===id);
  if(!req) return;

  if(req.type === 'permission_change'){
    const target = ACCESS_USERS.find(u=>u.id===req.target_user_id);
    const basePerms = target ? target.perms : (await sb.from('user_profiles').select('permissions').eq('id', req.target_user_id).single()).data?.permissions || {};
    const nextPerms = { ...basePerms, [req.payload.perm]: req.payload.value };
    const { error } = await sb.from('user_profiles').update({ permissions: nextPerms }).eq('id', req.target_user_id);
    if(error){ showToast('Failed to apply permission change: ' + error.message, 'error'); return; }
  } else if(req.type === 'create_user'){
    const p = req.payload;
    const { data, error } = await sb.functions.invoke('create-user', {
      body: { fullName:p.fullName, username:p.username, email:p.email, password:p.password, role:p.role, roleLabel:p.roleLabel }
    });
    if(error || !data?.user?.id){
      showToast('Failed to create user: ' + (data?.error || error?.message || 'Unknown error'), 'error');
      return;
    }
  }

  const { error: reviewErr } = await sb.from('user_access_requests')
    .update({ status:'approved', reviewed_by: currentUser.id, reviewed_at: new Date().toISOString() })
    .eq('id', id);
  if(reviewErr) console.error(reviewErr);

  showToast('Request approved.', 'success');
  await loadAccessUsers(); renderAccessTable();
  await loadUserAccessRequests(); renderUserAccessRequestsTable();
}

async function rejectUserAccessRequest(id){
  if(!isAdmin1()){ showToast('Only Admin I can review user access requests.', 'error'); return; }
  const { error } = await sb.from('user_access_requests')
    .update({ status:'rejected', reviewed_by: currentUser.id, reviewed_at: new Date().toISOString() })
    .eq('id', id);
  if(error){ showToast('Failed to reject request: ' + error.message, 'error'); return; }
  showToast('Request rejected.', 'info');
  await loadUserAccessRequests(); renderUserAccessRequestsTable();
}


/* =========================================================
   ADD USER — modal form
   Client-side supabase.auth.signUp() switches the browser's active
   session to the newly created user, so we snapshot the admin's
   session first and restore it right after signUp resolves.
   ========================================================= */
const DEFAULT_PERMS_BY_ROLE = {
  staff: { can_login:true, can_access_dashboard:true, can_request:true, can_approve:false, can_access_user_access:false, can_view_archive:true, can_export_data:false, can_manage_users:false, can_view_audit_log:false },
  supervisor: { can_login:true, can_access_dashboard:true, can_request:true, can_approve:true, can_access_user_access:false, can_view_archive:true, can_export_data:true, can_manage_users:false, can_view_audit_log:false },
  // Admin I — Approval: reviews/approves or rejects branch status requests. Cannot touch User Access or create/manage users.
  admin1: { can_login:true, can_access_dashboard:true, can_request:true, can_approve:true, can_access_user_access:false, can_view_archive:true, can_export_data:true, can_manage_users:false, can_view_audit_log:true },
  // Admin II — User Access: configures permissions and creates users. Cannot approve/reject requests.
  admin2: { can_login:true, can_access_dashboard:true, can_request:true, can_approve:false, can_access_user_access:true, can_view_archive:true, can_export_data:true, can_manage_users:true, can_view_audit_log:true },
  // Legacy super-admin role, kept for existing accounts — has full access via the can() bypass below.
  admin: { can_login:true, can_access_dashboard:true, can_request:true, can_approve:true, can_access_user_access:true, can_view_archive:true, can_export_data:true, can_manage_users:true, can_view_audit_log:true },
};

function openAddUserModal(){
  if(!can('can_manage_users')){ showToast('Adding users requires admin access.', 'error'); return; }
  document.getElementById('addUserForm').reset();
  document.getElementById('addUserScrim').classList.add('show');
  document.getElementById('addUserModal').classList.add('show');
}
function closeAddUserModal(){
  document.getElementById('addUserScrim').classList.remove('show');
  document.getElementById('addUserModal').classList.remove('show');
}
document.getElementById('openAddUserBtn').addEventListener('click', openAddUserModal);
document.getElementById('addUserModalClose').addEventListener('click', closeAddUserModal);
document.getElementById('addUserCancelBtn').addEventListener('click', closeAddUserModal);
document.getElementById('addUserScrim').addEventListener('click', closeAddUserModal);

document.getElementById('addUserSaveBtn').addEventListener('click', async function(){
  if(!can('can_manage_users')){
    showToast('Adding users requires admin access.', 'error');
    return;
  }

  const fullName = document.getElementById('auFullName').value.trim();
  const username = document.getElementById('auUsername').value.trim().toLowerCase();
  const email = document.getElementById('auEmail').value.trim().toLowerCase();
  const password = document.getElementById('auPassword').value;
  const role = document.getElementById('auRole').value;
  const ROLE_LABEL_DEFAULTS = { staff:'Staff', supervisor:'Supervisor', admin1:'Admin I — Approval', admin2:'Admin II — User Access', admin:'Admin' };
  const roleLabel = document.getElementById('auRoleLabel').value.trim() ||
    (ROLE_LABEL_DEFAULTS[role] || (role.charAt(0).toUpperCase()+role.slice(1)));

  if(!fullName || !username || !email || !password || !role){
    showToast('Full name, username, email, password, and role are all required.', 'error');
    return;
  }
  if(!/^[a-z0-9._-]{3,30}$/.test(username)){
    showToast('Username must be 3–30 characters and use only letters, numbers, dot, underscore, or hyphen.', 'error');
    return;
  }
  if(password.length < 8){
    showToast('Temporary password must be at least 8 characters.', 'error');
    return;
  }
  if(!/^\S+@\S+\.\S+$/.test(email)){
    showToast('Please enter a valid email address.', 'error');
    return;
  }

  const saveBtn = this;
  saveBtn.disabled = true;
  saveBtn.textContent = isAdmin1() ? 'Creating…' : 'Submitting…';

  try {
    if(!isAdmin1()){
      // Admin II (and anyone else with can_manage_users but not the main
      // admin) can't create the account directly — it's queued for the
      // main admin to review and approve.
      const { error } = await sb.from('user_access_requests').insert({
        type: 'create_user',
        payload: { fullName, username, email, password, role, roleLabel },
        requested_by: currentUser.id,
        requested_by_name: currentUser.full_name || currentUser.username,
        status: 'pending'
      });
      if(error) throw error;
      showToast(`User "${fullName}" (${username}) submitted for the main admin's approval.`, 'success');
      closeAddUserModal();
      return;
    }

    // IMPORTANT: Do not call sb.auth.signUp() here.
    // signUp() is a client-side self-registration flow and can replace
    // the admin's active session with the newly created account.
    // The secure solution is a Supabase Edge Function using auth.admin.createUser().
    const permissions = DEFAULT_PERMS_BY_ROLE[role] || DEFAULT_PERMS_BY_ROLE.staff;

    const { data, error } = await sb.functions.invoke('create-user', {
      body: {
        fullName,
        username,
        email,
        password,
        role,
        roleLabel,
        permissions
      }
    });

    if(error) throw error;
    if(!data?.user?.id) throw new Error(data?.error || 'User was not created.');

    showToast(`User "${fullName}" (${username}) created successfully.`, 'success');
    closeAddUserModal();
    await loadAccessUsers();
    renderAccessTable();
  } catch(err) {
    console.error('Create user error:', err);
    const message = err?.context?.body?.error || err?.message || 'Unknown error';
    showToast('Failed to create user: ' + message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Create User';
  }
});


