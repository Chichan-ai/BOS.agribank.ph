/* ===========================================================
   Login Page — script
   =========================================================== */

/* =========================================================
   BRANCH ANNIVERSARIES (login page)
   ========================================================= */
function renderBranchAnniversaries(){
  const list = document.getElementById('anniversaryList');
  if(!list) return;
  const WINDOW_DAYS = 30;
  const today = new Date(); today.setHours(0,0,0,0);
  const items = [];
  branches.forEach(b=>{
    if(!b.anniversary) return;
    const anniv = new Date(b.anniversary+'T00:00:00');
    let occurs = new Date(today.getFullYear(), anniv.getMonth(), anniv.getDate());
    let diffDays = Math.round((occurs - today) / 86400000);
    if(diffDays < 0){
      occurs = new Date(today.getFullYear()+1, anniv.getMonth(), anniv.getDate());
      diffDays = Math.round((occurs - today) / 86400000);
    }
    if(diffDays <= WINDOW_DAYS){
      items.push({ branch:b, occurs, diffDays, years: occurs.getFullYear() - anniv.getFullYear(), isToday: diffDays===0 });
    }
  });
  items.sort((a,b)=>a.diffDays-b.diffDays);

  if(items.length === 0){
    list.innerHTML = `<div class="advisory-item"><div class="dot purple">i</div><div><b>No anniversaries this month</b><span>No branch anniversaries in the next ${WINDOW_DAYS} days.</span></div></div>`;
    return;
  }
  const ord = n => { const s=['th','st','nd','rd'], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); };
  list.innerHTML = items.map(it=>{
    const dateLabel = it.occurs.toLocaleDateString('en-US',{month:'long',day:'numeric'});
    const whenLabel = it.isToday ? 'Today' : ('in '+it.diffDays+(it.diffDays===1?' day':' days'));
    const dotClass = it.isToday ? 'red' : 'purple';
    const dotChar = it.isToday ? '★' : it.diffDays;
    return `<div class="advisory-item">
      <div class="dot ${dotClass}">${dotChar}</div>
      <div>
        <b>${escapeHTML(it.branch.name)} — ${ord(it.years)} Anniversary</b>
        <span>${dateLabel} (${whenLabel}) &middot; ${it.branch.region}</span>
      </div>
    </div>`;
  }).join('');
}
renderBranchAnniversaries();

/* =========================================================
   Login page controls (password toggle + announcement slider)
   — moved here from header.js, where they did not belong
   ========================================================= */
const loginToggleBtn = document.getElementById('toggleVis');
const loginPwdInput = document.getElementById('loginPassword');
loginToggleBtn.addEventListener('click', ()=>{
  const show = loginPwdInput.type === 'password';
  loginPwdInput.type = show ? 'text' : 'password';
  loginToggleBtn.textContent = show ? 'Hide Password' : 'Show Password';
});

// auto-sliding announcement panel
const loginMediaTrack = document.getElementById('mediaTrack');
const loginMediaSlides = loginMediaTrack.querySelectorAll('.media-slide');
const loginMediaDots = document.querySelectorAll('#mediaDots span');
const loginSlideCount = loginMediaSlides.length;
let loginSlideCurrent = 0;
function goToSlide(i){
  loginSlideCurrent = i;
  loginMediaSlides.forEach((s, idx) => s.classList.toggle('active', idx === loginSlideCurrent));
  loginMediaDots.forEach((d, idx) => d.classList.toggle('active', idx === loginSlideCurrent));
}
setInterval(() => goToSlide((loginSlideCurrent + 1) % loginSlideCount), 4500);

