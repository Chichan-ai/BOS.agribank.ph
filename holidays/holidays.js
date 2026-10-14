/* ===========================================================
   Holidays List — script
   =========================================================== */

/* =========================================================
   2026 PHILIPPINE HOLIDAYS — based on HR memo (Proclamation No. 1006)
   Note: local holiday dates are based on 2025 proclamations and may
   change once 2026 official proclamations are issued.
   ========================================================= */
let HOLIDAYS_2026 = [
  // === REGULAR HOLIDAYS (National) ===
  {date:'2026-01-01', name:"New Year's Day", type:'regular', ref:'Proclamation No. 1006', branches:'all'},
  {date:'2026-04-01', name:"Eid'l Fitr", type:'regular', ref:'Proclamation No. 1006', branches:'all'},
  {date:'2026-04-02', name:'Maundy Thursday', type:'regular', ref:'Proclamation No. 1006', branches:'all'},
  {date:'2026-04-03', name:'Good Friday', type:'regular', ref:'Proclamation No. 1006', branches:'all'},
  {date:'2026-04-09', name:'Araw ng Kagitingan', type:'regular', ref:'Proclamation No. 1006', branches:'all'},
  {date:'2026-05-01', name:'Labor Day', type:'regular', ref:'Proclamation No. 1006', branches:'all'},
  {date:'2026-06-06', name:"Eid'l Adha", type:'regular', ref:'Proclamation No. 1006', branches:'all'},
  {date:'2026-06-12', name:'Independence Day', type:'regular', ref:'Proclamation No. 1006', branches:'all'},
  {date:'2026-08-31', name:'National Heroes Day', type:'regular', ref:'Proclamation No. 1006', branches:'all'},
  {date:'2026-11-30', name:'Bonifacio Day', type:'regular', ref:'Proclamation No. 1006', branches:'all'},
  {date:'2026-12-25', name:'Christmas Day', type:'regular', ref:'Proclamation No. 1006', branches:'all'},
  {date:'2026-12-30', name:'Rizal Day', type:'regular', ref:'Proclamation No. 1006', branches:'all'},
  // === SPECIAL (NON-WORKING) DAYS (National) ===
  {date:'2026-08-21', name:'Ninoy Aquino Day', type:'special', ref:'Proclamation No. 1006', branches:'all'},
  {date:'2026-11-01', name:"All Saints' Day", type:'special', ref:'Proclamation No. 1006', branches:'all'},
  {date:'2026-12-08', name:'Feast of the Immaculate Conception of Mary', type:'special', ref:'Proclamation No. 1006', branches:'all'},
  {date:'2026-12-31', name:'Last Day of the Year', type:'special', ref:'Proclamation No. 1006', branches:'all'},
  // === SPECIAL (WORKING) DAY (National) ===
  {date:'2026-02-25', name:'EDSA People Power Revolution Anniversary', type:'working', ref:'Proclamation No. 1006', branches:'all'},
  // === ADDITIONAL SPECIAL (NON-WORKING) DAYS (National) ===
  {date:'2026-02-17', name:'Chinese New Year', type:'additional', ref:'Proclamation No. 1006', branches:'all'},
  {date:'2026-04-04', name:'Black Saturday', type:'additional', ref:'Proclamation No. 1006', branches:'all'},
  {date:'2026-11-02', name:"All Souls' Day", type:'additional', ref:'Proclamation No. 1006', branches:'all'},
  {date:'2026-12-24', name:'Christmas Eve', type:'additional', ref:'Proclamation No. 1006', branches:'all'},
  // === LOCAL HOLIDAYS ===
  {date:'2026-01-10', name:'Founding Anniversary & Hinugyaw Festival', type:'local', ref:'Proclamation No. 758', branches:['BR-2020']},
  {date:'2026-01-19', name:'Kaisa Festival', type:'local', ref:'Proclamation No. 773', branches:['BR-2045']},
  {date:'2026-01-23', name:'Inauguration of the First Philippine Republic', type:'local', ref:'Proclamation No. 769', branches:['BR-2004']},
  {date:'2026-01-27', name:'Isra Wal Miraj', type:'local', ref:'Board Resolution No. 2025-001', branches:['BR-2016']},
  {date:'2026-02-03', name:'Founding Anniversary', type:'local', ref:'Republic Act No. 11375', branches:['BR-2008']},
  {date:'2026-02-11', name:'Governor Evelio B. Javier Day', type:'local', ref:'Republic Act No. 7601', branches:['BR-2018']},
  {date:'2026-02-27', name:'Founding Anniversary & Kalilangan Festival', type:'local', ref:'Proclamation No. 785', branches:['BR-2016']},
  {date:'2026-03-01', name:'Araw ng Dabaw', type:'local', ref:'Republic Act No. 11379', branches:['BR-2015']},
  {date:'2026-03-02', name:'La Union Day', type:'local', ref:'Republic Act No. 12037', branches:['BR-2034']},
  {date:'2026-03-04', name:'Foundation Day', type:'local', ref:'Republic Act No. 7684', branches:['BR-2032']},
  {date:'2026-03-16', name:'Foundation Day', type:'local', ref:'Republic Act No. 9642', branches:[]},
  {date:'2026-03-18', name:'Victory Day', type:'local', ref:'Proclamation No. 430', branches:[]},
  {date:'2026-03-20', name:'Founding Anniversary', type:'local', ref:'Republic Act No. 8945', branches:['BR-2034']},
  {date:'2026-03-21', name:'Founding Anniversary', type:'local', ref:'Republic Act No. 8986', branches:['BR-2011']},
  {date:'2026-03-22', name:'Birth Anniversary of Gen. Emilio Aguinaldo', type:'local', ref:'Proclamation No. 822', branches:['BR-2019']},
  {date:'2026-03-31', name:'Cityhood Anniversary', type:'local', ref:'Executive Order No. 21', branches:['BR-2012']},
  {date:'2026-04-03', name:'Albay Day', type:'local', ref:'Republic Act No. 11119', branches:['BR-2021']},
  {date:'2026-04-05', name:'Founding Anniversary', type:'local', ref:'Republic Act No. 11374', branches:['BR-2047']},
  {date:'2026-04-15', name:'President Manuel Acuña Roxas Memorial Day', type:'local', ref:'Republic Act No. 9217', branches:['BR-2033']},
  {date:'2026-04-19', name:'Charter Anniversary', type:'local', ref:'Proclamation No. 844', branches:['BR-2045']},
  {date:'2026-05-24', name:'Nueva Vizcaya Day', type:'local', ref:'Proclamation No. 2422', branches:['BR-2039']},
  {date:'2026-05-27', name:'Foundation Day', type:'local', ref:'Republic Act No. 9410', branches:['BR-2029']},
  {date:'2026-05-28', name:'Araw ng Lalawigang Tarlac', type:'local', ref:'Proclamation No. 109', branches:['BR-2045']},
  {date:'2026-06-10', name:'Danding Cojuangco Day', type:'local', ref:'Republic Act No. 11729', branches:['BR-2045']},
  {date:'2026-06-11', name:'Founding Anniversary', type:'local', ref:'Proclamation No. 882', branches:['BR-2009']},
  {date:'2026-06-15', name:'Charter Anniversary', type:'local', ref:'Republic Act No. 12248', branches:['BR-2016']},
  {date:'2026-06-18', name:'Charter Anniversary', type:'local', ref:'Republic Act No. 9210', branches:['BR-2029']},
  {date:'2026-06-19', name:'Birth Anniversary of Dr. Jose Rizal', type:'local', ref:'Republic Act No. 11144', branches:['BR-2010']},
  {date:'2026-06-23', name:'Foundation of the First Civil Government of Palawan', type:'local', ref:'Republic Act No. 9748', branches:['BR-2032']},
  {date:'2026-06-24', name:'Tabak Festival', type:'local', ref:'Proclamation No. 902', branches:['BR-2041']},
  {date:'2026-06-24', name:'Bagat-Dagat Festival', type:'local', ref:'Proclamation No. 903', branches:['BR-2027']},
  {date:'2026-06-26', name:'Amun Jadid – Islamic New Year', type:'local', ref:'Board Resolution No. 2025-005', branches:['BR-2016']},
  {date:'2026-06-29', name:'Aggao Nac Cagayan', type:'local', ref:'Proclamation No. 2430', branches:['BR-2046']},
  {date:'2026-07-01', name:'Charter Day', type:'local', ref:'Republic Act No. 8267', branches:['BR-2044']},
  {date:'2026-07-02', name:'Pasig Day', type:'local', ref:'Republic Act No. 12062', branches:['BR-2031']},
  {date:'2026-07-18', name:"T'nalak Festival", type:'local', ref:'Republic Act No. 9654', branches:['BR-2020']},
  {date:'2026-07-19', name:'Padigosan Festival', type:'local', ref:'Proclamation No. 938', branches:[]},
  {date:'2026-07-21', name:'Founding Anniversary', type:'local', ref:'Proclamation No. 940', branches:[]},
  {date:'2026-07-22', name:'Bohol Day', type:'local', ref:'Republic Act No. 7683', branches:['BR-2044']},
  {date:'2026-08-06', name:'Foundation Day', type:'local', ref:'Republic Act No. 7698', branches:['BR-2025']},
  {date:'2026-08-10', name:'Commemoration of Cityhood', type:'local', ref:'Republic Act No. 9776', branches:['BR-2036']},
  {date:'2026-08-15', name:'Pavvurulun Afi Festival', type:'local', ref:'Proclamation No. 980', branches:['BR-2046']},
  {date:'2026-08-15', name:'Founding Anniversary', type:'local', ref:'Proclamation No. 968', branches:['BR-2004']},
  {date:'2026-08-15', name:'Kadayawan Festival', type:'local', ref:'Proclamation No. 826', branches:['BR-2015']},
  {date:'2026-08-16', name:'Pavvurulun Afi Festival', type:'local', ref:'Proclamation No. 619', branches:['BR-2046']},
  {date:'2026-08-19', name:'Birth Anniversary of Former President Manuel L. Quezon', type:'local', ref:'Republic Act No. 6741', branches:[]},
  {date:'2026-08-20', name:'Araw ng Lucena', type:'local', ref:'Proclamation No. 987', branches:['BR-2023']},
  {date:'2026-08-30', name:'Celebration of the Birthday of Marcelo Del Pilar', type:'local', ref:'Republic Act No. 7449', branches:['BR-2004']},
  {date:'2026-08-30', name:'Charter Anniversary', type:'local', ref:'Proclamation No. 989', branches:['BR-2025']},
  {date:'2026-09-02', name:'Nueva Ecija Day', type:'local', ref:'Republic Act No. 7596', branches:['BR-2036','BR-2008']},
  {date:'2026-09-02', name:'Simeon Ola Day', type:'local', ref:'Republic Act No. 11136', branches:['BR-2021']},
  {date:'2026-09-05', name:'Tuna Festival', type:'local', ref:'Proclamation No. 990', branches:['BR-2016']},
  {date:'2026-09-09', name:'Birth Anniversary of Former President Sergio Osmeña', type:'local', ref:'Republic Act No. 6953', branches:['BR-2025']},
  {date:'2026-09-10', name:'Founding Anniversary', type:'local', ref:'Proclamation No. 1008', branches:['BR-2024']},
  {date:'2026-09-16', name:'Observe of 1446 Hijrah', type:'local', ref:'Presidential Decree No. 1083', branches:['BR-2016']},
  {date:'2026-09-19', name:'Feast of Our Lady of Peñafrancia', type:'local', ref:'Resolution No. 2025-09', branches:['BR-2029']},
  {date:'2026-10-02', name:'Solano Day', type:'local', ref:'Proclamation No. 1026', branches:['BR-2039']},
  {date:'2026-11-13', name:'Birth of Speaker Eugenio Perez', type:'local', ref:'Republic Act No. 6721', branches:['BR-2047']},
  {date:'2026-11-15', name:'Founding Anniversary', type:'local', ref:'Republic Act No. 11123', branches:['BR-2037']},
  {date:'2026-11-15', name:'Araw ng Oriental Mindoro', type:'local', ref:'Republic Act No. 12055', branches:['BR-2011']},
];

/* Loads holidays from Supabase (public.holidays table). If the table
   doesn't exist yet or is empty, the hardcoded seed list above stays
   in effect so the app keeps working before that migration is run. */
async function loadHolidaysFromDB(){
  const { data: rows, error } = await sb.from('holidays').select('*').order('date');
  if(error || !rows || rows.length === 0) return;
  HOLIDAYS_2026 = rows.map(r => ({
    id: r.id, date: r.date, name: r.name, type: r.type, ref: r.ref || '',
    branches: (r.branches === null || r.branches === undefined) ? 'all' : r.branches
  }));
}

function getHolidaysForBranch(branchCode){
  const today = new Date(); today.setHours(0,0,0,0);
  const endOfYear = new Date('2026-12-31T00:00:00');
  return HOLIDAYS_2026.filter(h=>{
    const hd = new Date(h.date+'T00:00:00');
    if(hd < today || hd > endOfYear) return false;
    if(h.branches === 'all') return true;
    return h.branches.includes(branchCode);
  }).sort((a,b)=> a.date.localeCompare(b.date));
}

function getHolidaysBetween(startDate, endDate, branchCode){
  return HOLIDAYS_2026.filter(h=>{
    const hd = new Date(h.date+'T00:00:00');
    if(hd < startDate || hd > endDate) return false;
    if(h.branches === 'all') return true;
    return h.branches.includes(branchCode);
  }).sort((a,b)=> a.date.localeCompare(b.date));
}

function getNextBusinessDay(fromDate, branchCode){
  const d = new Date(fromDate);
  do { d.setDate(d.getDate()+1); }
  while(isHoliday(d, branchCode) || d.getDay()===0 || d.getDay()===6);
  return d;
}

function isHoliday(date, branchCode){
  const ds = date.toISOString().split('T')[0];
  return HOLIDAYS_2026.some(h=>{
    if(h.date !== ds) return false;
    if(h.branches === 'all') return true;
    return h.branches.includes(branchCode);
  });
}

const HOLIDAY_TYPE_LABELS = {
  regular: 'Regular Holiday',
  special: 'Special (Non-Working) Day',
  additional: 'Additional Special (Non-Working) Day',
  working: 'Special (Working) Day',
  local: 'Local Holiday'
};


/* =========================================================
   HOLIDAYS LIST
   ========================================================= */
let holidayFilter = 'all';

function getHolidayScope(h){
  if(h.branches === 'all') return '<span class="scope-national">National</span>';
  if(!h.branches.length) return '<span class="scope-none">—</span>';
  const names = h.branches.map(code=>{
    const b = branches.find(x=>x.code===code);
    return b ? b.name.replace(' Branch','').replace(' City Branch',' City') : code;
  });
  return '<span class="scope-local">' + names.join(', ') + '</span>';
}

function renderHolidaysList(){
  const filtered = holidayFilter === 'all'
    ? [...HOLIDAYS_2026]
    : HOLIDAYS_2026.filter(h=>h.type===holidayFilter);
  filtered.sort((a,b)=> a.date.localeCompare(b.date));
  const tbody = document.getElementById('holidayTableBody');
  if(filtered.length === 0){
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted);font-size:12px;">No holidays match this filter.</td></tr>';
    return;
  }
  const fmtDate = (ds) => new Date(ds+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  tbody.innerHTML = filtered.map(h=>
    `<tr>
      <td class="ht-date">${fmtDate(h.date)}</td>
      <td class="ht-name">${escapeHTML(h.name)}</td>
      <td class="ht-type"><span class="hi-type ${h.type}">${HOLIDAY_TYPE_LABELS[h.type]||h.type}</span></td>
      <td class="ht-ref">${h.ref}</td>
      <td class="ht-scope">${getHolidayScope(h)}</td>
    </tr>`
  ).join('');
}

document.getElementById('link-holidays').addEventListener('click', async (e)=>{
  e.preventDefault();
  e.stopPropagation();
  switchView('holidays');
  await loadHolidaysFromDB();
  renderHolidaysList();
});

document.querySelectorAll('#holidayFilterRow .filter-chip').forEach(chip=>{
  chip.addEventListener('click',()=>{
    document.querySelectorAll('#holidayFilterRow .filter-chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    holidayFilter = chip.dataset.filter;
    renderHolidaysList();
  });
});


/* =========================================================
   ADD HOLIDAY — modal form, backed by Supabase public.holidays
   ========================================================= */
function populateAddHolidayBranches(){
  const sel = document.getElementById('ahBranches');
  sel.innerHTML = branches.map(b=>`<option value="${escapeHTML(b.code)}">${escapeHTML(b.name)} (${escapeHTML(b.code)})</option>`).join('');
}
document.getElementById('ahScope').addEventListener('change', function(){
  document.getElementById('ahBranchesGroup').style.display = this.value === 'local' ? 'block' : 'none';
});
function openAddHolidayModal(){
  if(!can('can_manage_users')){ showToast('Adding holidays requires admin access.', 'error'); return; }
  document.getElementById('addHolidayForm').reset();
  document.getElementById('ahBranchesGroup').style.display = 'none';
  populateAddHolidayBranches();
  document.getElementById('addHolidayScrim').classList.add('show');
  document.getElementById('addHolidayModal').classList.add('show');
}
function closeAddHolidayModal(){
  document.getElementById('addHolidayScrim').classList.remove('show');
  document.getElementById('addHolidayModal').classList.remove('show');
}
document.getElementById('openAddHolidayBtn').addEventListener('click', openAddHolidayModal);
document.getElementById('addHolidayModalClose').addEventListener('click', closeAddHolidayModal);
document.getElementById('addHolidayCancelBtn').addEventListener('click', closeAddHolidayModal);
document.getElementById('addHolidayScrim').addEventListener('click', closeAddHolidayModal);

document.getElementById('addHolidaySaveBtn').addEventListener('click', async function(){
  const date = document.getElementById('ahDate').value;
  const type = document.getElementById('ahType').value;
  const name = document.getElementById('ahName').value.trim();
  const ref = document.getElementById('ahRef').value.trim();
  const scope = document.getElementById('ahScope').value;
  const selectedBranches = Array.from(document.getElementById('ahBranches').selectedOptions).map(o=>o.value);

  if(!date || !type || !name){ showToast('Date, type, and holiday name are required.', 'error'); return; }

  const row = { date, type, name, ref: ref || null, branches: scope === 'all' ? null : selectedBranches };

  const saveBtn = this;
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';
  const { error } = await sb.from('holidays').insert(row);
  saveBtn.disabled = false;
  saveBtn.textContent = 'Save Holiday';

  if(error){
    showToast('Failed to save holiday: ' + error.message, 'error');
    return;
  }

  await loadHolidaysFromDB();
  closeAddHolidayModal();
  renderHolidaysList();
  refreshAll(); // branch statuses/labels can depend on isNonWorkingHoliday()
  showToast(`Holiday "${name}" added.`, 'success');
});


