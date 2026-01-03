/* -------------------------
   Global State & Storage
-------------------------*/
let state = {
    students: JSON.parse(localStorage.getItem('students') || '[]'),
    teachers: JSON.parse(localStorage.getItem('teachers') || '[]'),
    attendance: JSON.parse(localStorage.getItem('attendance') || '{}')
};

function saveState() {
    localStorage.setItem('students', JSON.stringify(state.students));
    localStorage.setItem('teachers', JSON.stringify(state.teachers));
    localStorage.setItem('attendance', JSON.stringify(state.attendance));
}

/* -------------------------
   Utilities
-------------------------*/
function escapeHtml(s) {
    return String(s || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

/* -------------------------
   Main Content Container
-------------------------*/
const content = document.getElementById('content');
let markMode = false;
let currentAttType = 'students'; // 'students' or 'teachers'

/* -------------------------
   Attendance Page
-------------------------*/
function renderAttendancePage() {
    content.innerHTML = `
    <h2>Attendance</h2>

    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
        <button id="att_toggle_students" class="btn primary">Students</button>
        <button id="att_toggle_teachers" class="btn">Teachers</button>
    </div>

    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
        <select id="att_class"><option value="">Select class</option></select>
        <input id="att_month" type="month" value="${new Date().toISOString().slice(0,7)}" />
        <button id="att_toggle_mark" class="btn">Enable Mark Mode</button>
        <button id="att_save" class="btn primary">Save Attendance</button>
        <button id="att_export" class="btn">Export Attendance CSV</button>
        <button id="att_markall_present" class="btn">Mark Day Present</button>
        <button id="att_markall_absent" class="btn">Mark Day Absent</button>
    </div>

    <div class="card attendance-grid" id="att_grid"></div>
    `;

    setAttTypeButtons();

    document.getElementById('att_toggle_students').onclick = () => { currentAttType='students'; setAttTypeButtons(); populateClassDropdown(); loadAttendanceGrid(); };
    document.getElementById('att_toggle_teachers').onclick = () => { currentAttType='teachers'; setAttTypeButtons(); populateClassDropdown(); loadAttendanceGrid(); };

    document.getElementById('att_toggle_mark').onclick = toggleMarkMode;
    document.getElementById('att_save').onclick = saveAttendanceFromGrid;
    document.getElementById('att_export').onclick = () => exportCSV('attendance');
    document.getElementById('att_class').onchange = loadAttendanceGrid;
    document.getElementById('att_month').onchange = loadAttendanceGrid;
    document.getElementById('att_markall_present').onclick = () => bulkMarkDay(true);
    document.getElementById('att_markall_absent').onclick = () => bulkMarkDay(false);

    markMode = false;
    populateClassDropdown();
    loadAttendanceGrid();
}

function setAttTypeButtons() {
    document.getElementById('att_toggle_students').classList.toggle('primary', currentAttType==='students');
    document.getElementById('att_toggle_teachers').classList.toggle('primary', currentAttType==='teachers');
}

function populateClassDropdown() {
    const sel = document.getElementById('att_class');
    sel.innerHTML = '<option value="">Select class</option>';
    let items = [];
    if(currentAttType==='students') {
        items = Array.from(new Set(state.students.map(s=>s.class).filter(Boolean)));
    } else {
        items = Array.from(new Set(state.teachers.map(t=>t.subject || 'Unassigned'))); // or t.class if you have teacher-class mapping
    }
    items.forEach(c => {
        const o = document.createElement('option');
        o.value = c;
        o.textContent = c;
        sel.appendChild(o);
    });
}

function toggleMarkMode() {
    markMode = !markMode;
    document.getElementById('att_toggle_mark').textContent = markMode ? 'Disable Mark Mode' : 'Enable Mark Mode';
    loadAttendanceGrid();
}

function loadAttendanceGrid() {
    const cls = document.getElementById('att_class').value;
    const month = document.getElementById('att_month').value;
    const grid = document.getElementById('att_grid'); 
    grid.innerHTML = '';
    if(!cls){ grid.innerHTML = '<div class="small">Choose class</div>'; return; }
    if(!month){ grid.innerHTML = '<div class="small">Choose month</div>'; return; }
    const [y,m] = month.split('-').map(Number); 
    const daysInMonth = new Date(y, m, 0).getDate();

    if(!state.attendance[month]) state.attendance[month] = {};
    if(!state.attendance[month][currentAttType]) state.attendance[month][currentAttType] = {};
    if(!state.attendance[month][currentAttType][cls]) state.attendance[month][currentAttType][cls] = {};

    // header
    const header = document.createElement('div'); 
    header.className='grid-row'; 
    header.style.fontWeight='700'; 
    header.innerHTML = '<div style="min-width:260px">'+(currentAttType==='students'?'Student':'Teacher')+'</div>';
    for(let d=1; d<=daysInMonth; d++){ 
        const iso = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; 
        const dayName = new Date(iso+'T00:00:00').toLocaleDateString(undefined,{weekday:'short'}); 
        const isFri = dayName.toLowerCase().startsWith('fri'); 
        header.innerHTML += `<div class="grid-day">${d}${isFri?'<div class="small" style="color:red">Fri</div>':''}</div>`; 
    }
    grid.appendChild(header);

    let items = currentAttType==='students'? state.students : state.teachers;
    if(currentAttType==='teachers'){
        items = items.filter(t => (t.subject||'Unassigned')===cls);
    } else {
        items = items.filter(s => s.class===cls);
    }
    items.sort((a,b)=> (a.name||'').localeCompare(b.name||''));

    if(items.length===0){ grid.innerHTML += '<div class="small">No '+currentAttType+' in this selection</div>'; return; }

    items.forEach(st=>{
        const row = document.createElement('div'); 
        row.className='grid-row'; 
        row.style.alignItems='center'; 
        row.innerHTML = `<div style="min-width:260px"><strong>${escapeHtml(st.name)}</strong><div class="small">${st.id} • ${escapeHtml(st.phone||'')}</div></div>`;
        for(let d=1; d<=daysInMonth; d++){
            const iso = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const dn = new Date(iso+'T00:00:00').toLocaleDateString(undefined,{weekday:'short'});
            const cell = document.createElement('div'); cell.className='grid-day';
            if(dn.toLowerCase().startsWith('fri')){ 
                cell.innerHTML = '—'; cell.title='Friday (off)'; 
            } else {
                const checked = !!(state.attendance[month][currentAttType][cls][iso] && state.attendance[month][currentAttType][cls][iso][st.id]);
                const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = checked; cb.dataset.iso = iso; cb.dataset.stu = st.id; cb.disabled = !markMode;
                cell.appendChild(cb);
            }
            row.appendChild(cell);
        }
        grid.appendChild(row);
    });
}

function bulkMarkDay(present=true){
    const cls = document.getElementById('att_class').value; 
    const month = document.getElementById('att_month').value; 
    if(!cls || !month) return alert('Choose class & month'); 
    const [y,m] = month.split('-').map(Number); 
    const daysInMonth = new Date(y,m,0).getDate();
    const dayStr = prompt(`Enter day number to mark (1-${daysInMonth})`);
    if(!dayStr) return; 
    const d = Number(dayStr); 
    if(isNaN(d) || d<1 || d>daysInMonth) return alert('Invalid day'); 
    const iso = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

    if(!state.attendance[month]) state.attendance[month]={};
    if(!state.attendance[month][currentAttType]) state.attendance[month][currentAttType]={};
    if(!state.attendance[month][currentAttType][cls]) state.attendance[month][currentAttType][cls]={};

    let items = currentAttType==='students'? state.students.filter(s=>s.class===cls) : state.teachers.filter(t=> (t.subject||'Unassigned')===cls);

    items.forEach(s=>{
        if(present){
            state.attendance[month][currentAttType][cls][iso] = state.attendance[month][currentAttType][cls][iso] || {};
            state.attendance[month][currentAttType][cls][iso][s.id] = true;
        } else {
            if(state.attendance[month][currentAttType][cls][iso]) delete state.attendance[month][currentAttType][cls][iso][s.id];
        }
    });

    saveState(); 
    loadAttendanceGrid(); 
    alert('Bulk mark applied');
}

function saveAttendanceFromGrid(){
    const cls = document.getElementById('att_class').value; 
    const month = document.getElementById('att_month').value; 
    if(!cls || !month) return alert('Choose class & month'); 

    if(!state.attendance[month]) state.attendance[month]={};
    if(!state.attendance[month][currentAttType]) state.attendance[month][currentAttType]={};
    if(!state.attendance[month][currentAttType][cls]) state.attendance[month][currentAttType][cls]={};

    document.querySelectorAll('#att_grid input[type=checkbox]').forEach(cb=>{
        const iso=cb.dataset.iso; const stu=cb.dataset.stu; 
        if(!iso || !stu) return; 
        if(!state.attendance[month][currentAttType][cls][iso]) state.attendance[month][currentAttType][cls][iso]={};
        if(cb.checked) state.attendance[month][currentAttType][cls][iso][stu]=true; 
        else delete state.attendance[month][currentAttType][cls][iso][stu];
    });

    saveState(); 
    alert('Attendance saved');
}

/* -------------------------
   CSV Export
-------------------------*/
function exportCSV(type){
    if(type!=='attendance') return;

    let rows=[['month','type','class','date','id','name','present']];
    for(const month in state.attendance){
        for(const attType in state.attendance[month]){
            for(const cls in state.attendance[month][attType]){
                for(const date in state.attendance[month][attType][cls]){
                    const map = state.attendance[month][attType][cls][date];
                    let items = attType==='students'? state.students.filter(s=>s.class===cls) : state.teachers.filter(t=> (t.subject||'Unassigned')===cls);
                    items.forEach(s=>rows.push([month,attType,cls,date,s.id,s.name,map && map[s.id]?1:0]));
                }
            }
        }
    }

    const csv = rows.map(r=> r.map(c=> `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); 
    const url=URL.createObjectURL(blob); 
    const a=document.createElement('a'); 
    a.href=url; a.download='attendance.csv'; 
    document.body.appendChild(a); 
    a.click(); 
    a.remove(); 
    URL.revokeObjectURL(url);
}

/* -------------------------
   Expose globally
-------------------------*/
window.renderAttendancePage = renderAttendancePage;
window.bulkMarkDay = bulkMarkDay;
window.saveAttendanceFromGrid = saveAttendanceFromGrid;
window.toggleMarkMode = toggleMarkMode;
window.exportCSV = exportCSV;
window.state = state;
window.saveState = saveState;
