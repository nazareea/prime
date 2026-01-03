/* ======================================
   SCHOOL MANAGEMENT SYSTEM (CLEAN JS)
   Author: You
   Purpose: Simple, clear, maintainable
====================================== */

/* =====================
   GLOBAL CONSTANTS
===================== */
const STORAGE_KEY = "school_management_v1";
const days = ["Sun", "Mon", "Tue", "Wed", "Thu"];

/* =====================
   GLOBAL STATE
   (Single source of truth)
===================== */
let state = {
  students: [],
  teachers: [],
  classes: [],
  attendance: {},
  teacherAttendance: {},
  timetable: {},
  books: []
};

/* =====================
   LOAD / SAVE STATE
===================== */
function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) state = JSON.parse(saved);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateStorageInfo();
}

function updateStorageInfo() {
  const size =
    new Blob([JSON.stringify(state)]).size / 1024;
  const el = document.getElementById("storageInfo");
  if (el) el.textContent = size.toFixed(2) + " KB";
}

/* =====================
   MENU / SIDEBAR
===================== */
function toggleMenu() {
  document.getElementById("app").classList.toggle("open");
}

function initMenu() {
  document.querySelectorAll(".menu-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      navigate(btn.dataset.page);
      toggleMenu();
    });
  });
}

/* =====================
   ROUTER
===================== */
const content = document.getElementById("content");

function navigate(page) {
  document.querySelectorAll(".menu-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.page === page);
  });

  content.innerHTML = "";

  switch (page) {
    case "dashboard":
      renderDashboard();
      break;
    case "students":
      renderStudents();
      break;
    case "teachers":
      renderTeachers();
      break;
    case "classes":
      renderClasses();
      break;
    case "attendance":
      renderAttendance();
      break;
    case "timetable":
      renderTimetable();
      break;
    case "library":
      renderLibrary();
      break;
    case "reports":
      renderReports();
      break;
  }
}

/* =====================
   DASHBOARD
===================== */
function renderDashboard() {
  content.innerHTML = `
    <h2>Dashboard</h2>
    <p>Students: <b>${state.students.length}</b></p>
    <p>Teachers: <b>${state.teachers.length}</b></p>
    <p>Classes: <b>${state.classes.length}</b></p>
    <p>Books: <b>${state.books.length}</b></p>
  `;
}

/* =====================
   STUDENTS (BASIC)
===================== */
function renderStudents() {
  content.innerHTML = `
    <div class="card">
      <h2>Students</h2>
      <div class="form-row">
        <input id="s_name" placeholder="Name"/>
        <input id="s_phone" placeholder="Phone"/>
        <select id="s_class">
          <option value="">Class</option>
        </select>
       <input id="s_fee" type="number" placeholder="Monthly Fee"/>
        <input id="s_date" type="date"/>
        <input id="s_photo" type="file" accept="image/*"/>
        <button id="s_save" class="btn primary">Save</button>
        <button id="s_clear" class="btn">Clear</button>
        <input id="s_search" placeholder="Search name or phone" style="margin-left:auto" />
      </div>
      <div id="studentsList" class="card"></div>
    </div>
  `
  }
/* =====================
   TEACHERS
===================== */
function renderTeachers() {
  content.innerHTML = `
    <h2>Teachers</h2>
    <button onclick="addTeacher()">Add Teacher</button>
    <ul>
      ${state.teachers.map(t => `<li>${t.name}</li>`).join("")}
    </ul>
  `;
}

function addTeacher() {
  const name = prompt("Teacher name:");
  if (!name) return;

  state.teachers.push({
    id: Date.now(),
    name
  });

  saveState();
  renderTeachers();
}

/* =====================
   CLASSES
===================== */
function renderClasses() {
  content.innerHTML = `
    <h2>Classes</h2>
    <button onclick="addClass()">Add Class</button>
    <ul>
      ${state.classes.map(c => `<li>${c.name}</li>`).join("")}
    </ul>
  `;
}

function addClass() {
  const name = prompt("Class name:");
  if (!name) return;

  state.classes.push({
    id: Date.now(),
    name
  });

  saveState();
  renderClasses();
}

/* =====================
   STUDENT ATTENDANCE
===================== */
function renderAttendance() {
  content.innerHTML = `
    <h2>Student Attendance</h2>
    <p>Attendance module ready</p>
  `;
}

/* =====================
   TIMETABLE
===================== */
let selectedDay = "Sun";

function renderTimetable() {
  content.innerHTML = `
    <h2>Timetable</h2>

    <div id="dayNav">
      ${days
        .map(
          d =>
            `<button onclick="selectDay('${d}')"
              class="${d === selectedDay ? "active" : ""}">
              ${d}
            </button>`
        )
        .join("")}
    </div>

    <table border="1" width="100%">
      <tbody id="timetableBody"></tbody>
    </table>
  `;

  renderTimetableDay();
}

function selectDay(day) {
  selectedDay = day;
  renderTimetable();
}

function renderTimetableDay() {
  const body = document.getElementById("timetableBody");
  if (!body) return;

  body.innerHTML = "";

  for (let p = 1; p <= 4; p++) {
    body.innerHTML += `
      <tr>
        <td>Period ${p}</td>
        <td>${selectedDay}</td>
      </tr>
    `;
  }
}

/* =====================
   LIBRARY
===================== */
function renderLibrary() {
  content.innerHTML = `
    <h2>Library</h2>
    <p>Library module ready</p>
  `;
}

/* =====================
   REPORTS
===================== */
function renderReports() {
  content.innerHTML = `
    <h2>Reports</h2>
    <p>Reports module ready</p>
  `;
}

/* =====================
   CLEAR ALL DATA
===================== */
document.getElementById("clearAll").onclick = () => {
  if (!confirm("Clear all data?")) return;

  state = {
    students: [],
    teachers: [],
    classes: [],
    attendance: {},
    teacherAttendance: {},
    timetable: {},
    books: []
  };

  saveState();
  navigate("dashboard");
};

/* =====================
   EXPORT PLACEHOLDERS
===================== */
document.getElementById("exportCsv").onclick = () =>
  alert("CSV export coming soon");

document.getElementById("exportPdf").onclick = () =>
  alert("PDF export coming soon");

/* =====================
   INIT APP
===================== */
loadState();
initMenu();
saveState();
navigate("dashboard");