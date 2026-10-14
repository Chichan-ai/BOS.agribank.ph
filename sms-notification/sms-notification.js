/* ===========================================================
   SMS Notification (mockup) — script
   =========================================================== */

/* =========================================================
   SMS NOTIFICATION (MOCKUP)
   ========================================================= */
function renderSmsRecipientTags(){
  const input = document.getElementById('smsRecipients').value;
  const tags = document.getElementById('smsRecipientTags');
  const numbers = input.split(',').map(s=>s.trim()).filter(Boolean);
  tags.innerHTML = numbers.map(n=>`<span class="sms-rcpt-tag">${escapeHTML(n)}</span>`).join('');
}

function buildSmsMessage(){
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const closed = branches.filter(b=>b.status==='closed');
  const open = branches.filter(b=>b.status==='open');
  let list = '';
  if(closed.length === 0){
    list = '(No branches currently closed)';
  } else {
    list = closed.map((b,i)=>{
      const reason = b.hours || 'Suspended until further notice';
      return `${i+1}. ${b.name} (${b.code}) — ${reason.replace('Suspended — ','').replace('Suspended for ','').replace('Suspended until ','').toLowerCase()}`;
    }).join('\n');
  }
  const template = document.getElementById('smsTemplate').value;
  return template
    .replace(/\{\{DATE\}\}/g, dateStr)
    .replace(/\{\{CLOSED_LIST\}\}/g, list)
    .replace(/\{\{CLOSED_COUNT\}\}/g, closed.length)
    .replace(/\{\{TOTAL_COUNT\}\}/g, branches.length);
}

function showSmsModal(){
  const msg = buildSmsMessage();
  document.getElementById('smsBubble').textContent = msg;
  const now = new Date();
  document.getElementById('smsTimestamp').textContent = now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true});
  document.getElementById('smsScrim').classList.add('show');
  document.getElementById('smsModal').classList.add('show');
}

function closeSmsModal(){
  document.getElementById('smsScrim').classList.remove('show');
  document.getElementById('smsModal').classList.remove('show');
}

document.getElementById('smsViewBtn').addEventListener('click', showSmsModal);
document.getElementById('smsModalClose').addEventListener('click', closeSmsModal);
document.getElementById('smsModalCloseBtn').addEventListener('click', closeSmsModal);
document.getElementById('smsScrim').addEventListener('click', closeSmsModal);

document.getElementById('smsTestBtn').addEventListener('click', ()=>{
  showToast('Test SMS sent to ' + document.getElementById('smsRecipients').value.split(',').length + ' recipient(s). (mockup)', 'info');
});

document.getElementById('smsForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  showToast('SMS schedule saved. (mockup)', 'success');
});

document.getElementById('smsRecipients').addEventListener('input', renderSmsRecipientTags);

