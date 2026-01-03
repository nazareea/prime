// -----------------------------
// Subjects CRUD with Filters
// -----------------------------

window.state = window.state || {};
state.subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
state.teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
state.students = JSON.parse(localStorage.getItem('students') || '[]');

// Save to localStorage
function saveSubjects() {
    localStorage.setItem('subjects', JSON.stringify(state.subjects));
}

// -----------------------------
// Render Subjects Page
// -----------------------------
window.renderSubjectsPage = function() {
    const contain = document.getElementById("content");
    if (!contain) return console.error("No container element with id 'contain'");

    contain.innerHTML = `
    <h2>Subjects</h2>

    <div style="display:flex;gap:8px;flex-wrap:wrap">
        <input id="subName" placeholder="Subject Name">
        <select id="subTeacher"></select>
        <select id="subClass"></select>
        <input type="date" id="subDate">
        <button id="saveSubjectBtn">Add / Save Subject</button>
        <button id="clearSubjectBtn">Clear</button>
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <select id="filterClass"><option value="">All Classes</option></select>
        <select id="filterTeacher"><option value="">All Teachers</option></select>
        <select id="filterSubjectName"><option value="">All Subjects</option></select>
        <input id="filterText" placeholder="Search...">
    </div>

    <table style="margin-top:10px">
    <thead>
    <tr>
        <th>#</th>
        <th>Subject</th>
        <th>Teacher</th>
        <th>Class</th>
        <th>Date</th>
        <th>Actions</th>
    </tr>
    </thead>
    <tbody id="subjectsBody"></tbody>
    </table>
    `;

    populateTeacherOptions();
    populateClassOptions();
    populateFilterOptions();
    renderSubjectsTable();

    document.getElementById('saveSubjectBtn').onclick = saveSubject;
    document.getElementById('clearSubjectBtn').onclick = clearInputs;
    document.getElementById('filterClass').onchange = renderSubjectsTable;
    document.getElementById('filterTeacher').onchange = renderSubjectsTable;
    document.getElementById('filterSubjectName').onchange = renderSubjectsTable;
    document.getElementById('filterText').oninput = renderSubjectsTable;
};

// -----------------------------
// Populate dropdowns
// -----------------------------
function populateTeacherOptions() {
    const sel = document.getElementById('subTeacher');
    sel.innerHTML = '<option value="">Select Teacher</option>';
    state.teachers.forEach(t => {
        const o = document.createElement('option');
        o.value = t.name;
        o.textContent = t.name;
        sel.appendChild(o);
    });
}

function populateClassOptions() {
    const sel = document.getElementById('subClass');
    sel.innerHTML = '<option value="">Select Class</option>';
    const classes = Array.from(new Set(state.students.map(s => s.class).filter(Boolean)));
    classes.forEach(c => {
        const o = document.createElement('option');
        o.value = c;
        o.textContent = c;
        sel.appendChild(o);
    });
}

function populateFilterOptions() {
    const classFilter = document.getElementById('filterClass');
    const teacherFilter = document.getElementById('filterTeacher');
    const subjectFilter = document.getElementById('filterSubjectName');

    // Clear
    classFilter.innerHTML = '<option value="">All Classes</option>';
    teacherFilter.innerHTML = '<option value="">All Teachers</option>';
    subjectFilter.innerHTML = '<option value="">All Subjects</option>';

    const classes = Array.from(new Set(state.students.map(s => s.class).filter(Boolean)));
    classes.forEach(c => classFilter.appendChild(new Option(c, c)));

    const teachers = Array.from(new Set(state.teachers.map(t => t.name).filter(Boolean)));
    teachers.forEach(t => teacherFilter.appendChild(new Option(t, t)));

    const subjects = Array.from(new Set(state.subjects.map(s => s.name).filter(Boolean)));
    subjects.forEach(s => subjectFilter.appendChild(new Option(s, s)));
}

// -----------------------------
// Add / Edit Subject
// -----------------------------
let editSubIndex = null;

function saveSubject() {
    const name = document.getElementById('subName').value.trim();
    const teacher = document.getElementById('subTeacher').value;
    const cls = document.getElementById('subClass').value;
    const date = document.getElementById('subDate').value;

    if (!name || !teacher || !cls || !date) return alert("Fill all fields");

    const subjectObj = { name, teacher, class: cls, date };

    if (editSubIndex !== null) {
        state.subjects[editSubIndex] = subjectObj;
        editSubIndex = null;
    } else {
        state.subjects.push(subjectObj);
    }

    saveSubjects();
    populateFilterOptions();
    renderSubjectsTable();
    clearInputs();
}

// -----------------------------
// Clear inputs
// -----------------------------
function clearInputs() {
    document.getElementById('subName').value = '';
    document.getElementById('subTeacher').value = '';
    document.getElementById('subClass').value = '';
    document.getElementById('subDate').value = '';
    editSubIndex = null;
}

// -----------------------------
// Render table with filters
// -----------------------------
function renderSubjectsTable() {
    const tbody = document.getElementById('subjectsBody');
    tbody.innerHTML = '';

    const classFilter = document.getElementById('filterClass').value;
    const teacherFilter = document.getElementById('filterTeacher').value;
    const subjectFilter = document.getElementById('filterSubjectName').value;
    const textFilter = document.getElementById('filterText').value.toLowerCase();

    state.subjects.forEach((s, i) => {
        if (classFilter && s.class !== classFilter) return;
        if (teacherFilter && s.teacher !== teacherFilter) return;
        if (subjectFilter && s.name !== subjectFilter) return;
        if (textFilter && !(
            s.name.toLowerCase().includes(textFilter) ||
            s.teacher.toLowerCase().includes(textFilter) ||
            s.class.toLowerCase().includes(textFilter)
        )) return;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${s.name}</td>
            <td>${s.teacher}</td>
            <td>${s.class}</td>
            <td>${s.date}</td>
            <td>
                <button onclick="editSubject(${i})">Edit</button>
                <button onclick="deleteSubject(${i})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// -----------------------------
// Edit / Delete
// -----------------------------
window.editSubject = function(i) {
    const s = state.subjects[i];
    document.getElementById('subName').value = s.name;
    document.getElementById('subTeacher').value = s.teacher;
    document.getElementById('subClass').value = s.class;
    document.getElementById('subDate').value = s.date;
    editSubIndex = i;
};

window.deleteSubject = function(i) {
    if (!confirm("Delete this subject?")) return;
    state.subjects.splice(i, 1);
    saveSubjects();
    populateFilterOptions();
    renderSubjectsTable();
};

// -----------------------------
// Open page helper
// -----------------------------
window.openSubjectsPage = function() {
    renderSubjectsPage();
};
