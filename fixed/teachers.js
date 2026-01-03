 /* ===============================
   TEACHERS MODULE
   =============================== */

/* teachers[] is declared in index.html */
function saveTeachers() {
  localStorage.setItem("teachers", JSON.stringify(teachers));
}

/* ---------- STATE ---------- */
let tEditId = null;
let tPhoto = "";

let tSearch = "";
let tFilterSubject = "";
let tFilterClass = "";
let tSortBy = "";

/* ---------- OPTIONS ---------- */
const SUBJECTS = ["Math", "English", "Science", "Arabic", "History"];

/* ---------- PAGE ---------- */
function teachersPage() {
  const content = document.getElementById("content");

  content.innerHTML = `
  <div class="card">
    <h2>${tEditId ? "Edit" : "Add"} Teacher</h2>

    <input id="t_name" placeholder="Name">
    <input id="t_phone" placeholder="Phone">

    <input type="file" id="t_photo" accept="image/*"><br>
    <img id="t_preview" width="50" style="display:none;border-radius:50%"><br>

    <select id="t_subject">
      <option value="">-- Select Subject --</option>
      ${SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join("")}
    </select>

    <select id="t_class">
      <option value="">-- Select Class --</option>
      ${classes.map(c => `<option value="${c.name}">${c.name}</option>`).join("")}
    </select>

    <input id="t_date" type="date">
    <input id="t_salary" type="number" placeholder="Salary">

    <button onclick="saveTeacher()">${tEditId ? "Update" : "Add"}</button>
  </div>

  <div class="card">
    <input placeholder="Search by name"
      oninput="tSearch=this.value.toLowerCase();applyTeacherFilters()">

    <select onchange="tFilterSubject=this.value;applyTeacherFilters()">
      <option value="">All Subjects</option>
      ${SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join("")}
    </select>

    <select onchange="tFilterClass=this.value;applyTeacherFilters()">
      <option value="">All Classes</option>
      ${classes.map(c => `<option value="${c.name}">${c.name}</option>`).join("")}
    </select>

    <select onchange="tSortBy=this.value;applyTeacherFilters()">
      <option value="">Sort By</option>
      <option value="name">Name</option>
      <option value="subject">Subject</option>
      <option value="className">Class</option>
    </select>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Photo</th>
          <th>Name</th>
          <th>Subject</th>
          <th>Class</th>
          <th>Date</th>
          <th>Salary</th>
          <th>Paid</th>
          <th>Balance</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="teacherRows"></tbody>
    </table>
  </div>
  `;

  applyTeacherFilters();
}

/* ---------- PHOTO ---------- */
document.addEventListener("change", e => {
  if (e.target.id === "t_photo") {
    const r = new FileReader();
    r.onload = () => {
      tPhoto = r.result;
      const img = document.getElementById("t_preview");
      if (img) {
        img.src = tPhoto;
        img.style.display = "inline";
      }
    };
    r.readAsDataURL(e.target.files[0]);
  }
});

/* ---------- SAVE ---------- */
function saveTeacher() {
  const name = t_name.value.trim();
  const phone = t_phone.value.trim();
  const subject = t_subject.value;
  const className = t_class.value;
  const date = t_date.value;
  const salary = +t_salary.value || 0;

  if (!name || !subject) return alert("Name and Subject are required");

  const old = teachers.find(t => t.id === tEditId) || {};

  const obj = {
    id: tEditId || Date.now(),
    name,
    phone,
    subject,
    className,
    date,
    salary,
    photo: tPhoto || old.photo || "https://via.placeholder.com/40",
    paid: old.paid || 0,
    payments: old.payments || []
  };

  tEditId
    ? teachers = teachers.map(t => t.id === tEditId ? obj : t)
    : teachers.push(obj);

  saveTeachers();
  resetTeacherForm();
  teachersPage();
}

/* ---------- EDIT ---------- */
function editTeacher(id) {
  const t = teachers.find(x => x.id === id);
  if (!t) return;

  tEditId = id;
  tPhoto = t.photo;
  teachersPage();

  t_name.value = t.name;
  t_phone.value = t.phone;
  t_subject.value = t.subject;
  t_class.value = t.className;
  t_date.value = t.date;
  t_salary.value = t.salary;

  t_preview.src = t.photo;
  t_preview.style.display = "inline";
}

/* ---------- DELETE ---------- */
function deleteTeacher(id) {
  if (confirm("Delete this teacher?")) {
    teachers = teachers.filter(t => t.id !== id);
    saveTeachers();
    teachersPage();
  }
}

/* ---------- PAYMENT ---------- */
function openTeacherPayment(id) {
  const t = teachers.find(x => x.id === id);

  document.body.insertAdjacentHTML("beforeend", `
  <div class="modal" onclick="closeTeacherModal(event)">
    <div class="modal-box" onclick="event.stopPropagation()">
      <h3>Payment – ${t.name}</h3>

      <input id="tp_amount" type="number" placeholder="Amount">
      <input id="tp_date" type="date" value="${new Date().toISOString().slice(0,10)}">
      <input id="tp_comment" placeholder="Comment">

      <button onclick="addTeacherPayment(${id})">Save</button>
      <button onclick="closeTeacherModal()">Close</button>

      <hr>
      ${t.payments.map(p =>
        `${p.date} - ${p.amount} (${p.comment || ""})<br>`
      ).join("") || "No payments"}
    </div>
  </div>
  `);
}

function addTeacherPayment(id) {
  const t = teachers.find(x => x.id === id);
  const amt = +tp_amount.value;
  if (!amt) return;

  t.paid += amt;
  t.payments.push({
    amount: amt,
    date: tp_date.value,
    comment: tp_comment.value
  });

  saveTeachers();
  closeTeacherModal();
  teachersPage();
}

function closeTeacherModal(e) {
  if (!e || e.target.classList.contains("modal"))
    document.querySelector(".modal")?.remove();
}

/* ---------- FILTER & SORT ---------- */
function applyTeacherFilters() {
  let list = [...teachers];

  if (tSearch)
    list = list.filter(t => t.name.toLowerCase().includes(tSearch));

  if (tFilterSubject)
    list = list.filter(t => t.subject === tFilterSubject);

  if (tFilterClass)
    list = list.filter(t => t.className === tFilterClass);

  if (tSortBy)
    list.sort((a, b) =>
      (a[tSortBy] || "").localeCompare(b[tSortBy] || "")
    );

  renderTeacherTable(list);
}

/* ---------- RENDER ---------- */
function renderTeacherTable(list) {
  const tbody = document.getElementById("teacherRows");
  if (!tbody) return;

  tbody.innerHTML = list.map((t, i) => {
    const bal = t.salary - t.paid;
    return `
    <tr>
      <td>${i + 1}</td>
      <td><img src="${t.photo}" width="40"></td>
      <td>${t.name}</td>
      <td>${t.subject}</td>
      <td>${t.className || "-"}</td>
      <td>${t.date || ""}</td>
      <td>${t.salary}</td>
      <td>${t.paid}</td>
      <td style="color:${bal > 0 ? "red" : "green"}">${bal}</td>
      <td>
        <button class="pay" onclick="openTeacherPayment(${t.id})">Pay</button>
        <button onclick="editTeacher(${t.id})">Edit</button>
        <button class="danger" onclick="deleteTeacher(${t.id})">Delete</button>
      </td>
    </tr>`;
  }).join("");
}

/* ---------- RESET ---------- */
function resetTeacherForm() {
  tEditId = null;
  tPhoto = "";
}

