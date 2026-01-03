
/* ===== MENU ===== */
function toggleMenu(){document.getElementById("sidebar").classList.toggle("show");}

/* ===== DATA ===== */
let classes = JSON.parse(localStorage.getItem("classes")) || [];
let students = JSON.parse(localStorage.getItem("students")) || [];
let teachers = JSON.parse(localStorage.getItem("teachers")) || [];


function saveClasses(){localStorage.setItem("classes", JSON.stringify(classes));}
function saveStudents(){localStorage.setItem("students", JSON.stringify(students));}

/* ===== NAVIGATION ===== */
function go(page,el){
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
  el.classList.add("active");
  if(page==="dashboard") dashboardPage();
  if(page==="students") studentsPage();
  if(page==="attendance") renderAttendancePage();
  if(page==="classes") classesPage();
  if(page==="teachers") teachersPage();
  if(page==="subjects") renderSubjectsPage();
  if(page==="timetable")  renderTimeTablePage();

}

/* ===== DASHBOARD ===== */
function dashboardPage(){
  document.getElementById("content").innerHTML = `
     <div class="card">
      <h2>Dashboard</h2>
      <p><b>Total Students:</b> ${students.length}</p>
      <p><b>Total Fees:</b> ${students.reduce((a,s)=>a+(s.fee||0),0)}</p>
      <p><b>Total Paid:</b> ${students.reduce((a,s)=>a+(s.paid||0),0)}</p>
    </div>`;
}

/* ===== CLASSES ===== */
let classEditIndex = null;
function fillTeachers() {
    const t = document.getElementById("classTeacher");
    if (!t) return;

    t.innerHTML = `<option value="">-- Select Teacher --</option>` +
        teachers.map(teacher => 
            `<option value="${teacher.id}">${teacher.name}</option>`
        ).join("");
}



function openClassForm(editIndex=null){
    classEditIndex = editIndex;
    document.getElementById("classTitle").innerText = editIndex===null ? "Add Class" : "Edit Class";
    document.getElementById("className").value = editIndex===null ? "" : classes[editIndex].name;
    fillTeachers();
    document.getElementById("classTeacher").value = editIndex===null ? "" : classes[editIndex].teacher || "";
    document.getElementById("classModal").style.display="flex";
}
function saveClass() {
    const name = document.getElementById("className").value.trim();
    const teacherId = document.getElementById("classTeacher").value;

    if (!name) return alert("Class name required");

    const obj = {
        name,
        teacherId: teacherId || null
    };

    if (classEditIndex === null) {
        classes.push(obj);
    } else {
        classes[classEditIndex] = obj;
    }

    localStorage.setItem("classes", JSON.stringify(classes));
    document.getElementById("classModal").style.display = "none";
    classesPage();
}

function closeClassForm(){
  document.getElementById("classModal").style.display = "none";
  classEditIndex = null;
}


function editClass(i){
    openClassForm(i);
}

function deleteClass(i){
    if(confirm("Delete this class?")){
        classes.splice(i,1);
        localStorage.setItem("classes", JSON.stringify(classes));
        classesPage();
    }
}
function classesPage() {
    let html = `
        <h2>Classes</h2>
        <button onclick="openClassForm()">➕ Add Class</button>
        <table>
            <thead>
                <tr>
                    <th>Class</th>
                    <th>Teacher</th>
                    <th>Total Students</th>
                    <th>Total Paid</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
            ${classes.map((c,i) => {
                const teacher = teachers.find(t => t.id == c.teacherId);
                const studentCount = students.filter(s => s.class === c.name).length;
                const paidSum = students.filter(s => s.class === c.name).reduce((sum,s) => sum + (s.paid||0), 0);
                return `
                <tr>
                    <td>${c.name}</td>
                    <td>${teacher ? teacher.name : '-'}</td>
                    <td>${studentCount}</td>
                    <td>${paidSum}</td>
                    <td>
                        <button onclick="editClass(${i})">✏ Edit</button>
                        <button onclick="deleteClass(${i})">🗑 Delete</button>
                    </td>
                </tr>`;
            }).join('')}
            </tbody>
        </table>`;
    document.getElementById("content").innerHTML = html;
}


/* ===== STUDENTS ===== */
let editId=null, photoData="", searchText="", selectedClass="", currentList=[];

function studentsPage(){
  if(classes.length===0){
    document.getElementById("content").innerHTML = `
      <div class="card">
        <h2>No Classes Found</h2>
        <p>You must add at least one class before adding students.</p>
        <button onclick="go('classes', document.querySelector('.nav-item:nth-child(3)'))">➕ Add Class</button>
      </div>`;
    return;
  }

  document.getElementById("content").innerHTML = `
<div class="card">
<h2>${editId?"Edit":"Add"} Student</h2>
<input id="s_name" placeholder="Name">
<input id="s_phone" placeholder="Phone">
<input type="file" id="s_photo" accept="image/*">
<img id="photo_preview" width="50" style="display:none;border-radius:50%">
<input id="s_date" type="date">
<select id="s_class">
  <option value="">-- Select Class --</option>
  ${classes.map(c=>`<option value="${c.name}">${c.name}</option>`).join("")}
</select>
<input id="s_fee" type="number" placeholder="Fee">
<button onclick="saveStudent()">${editId?"Update":"Add"}</button>
</div>

<div class="card">
<input placeholder="Search..." oninput="searchStudents(this.value)">
<select onchange="filterClass(this.value)">
<option value="">All Classes</option>
${classes.map(c=>`<option value="${c.name}">${c.name}</option>`).join("")}
</select>

<table>
<tr>
<th>No</th><th>Photo</th><th>Name</th><th>Class</th>
<th>Date</th><th>Fee</th><th>Paid</th><th>Balance</th><th>Actions</th>
</tr>
<tbody id="rows"></tbody>
</table>
</div>`;
  applyFilters();
}

/* ===== PHOTO UPLOAD ===== */
document.addEventListener("change",e=>{
  if(e.target.id==="s_photo"){
    const r=new FileReader();
    r.onload=()=>{photoData=document.getElementById("photo_preview").src=r.result;document.getElementById("photo_preview").style.display="inline";}
    r.readAsDataURL(e.target.files[0]);
  }
});

/* ===== FILTERS ===== */
function searchStudents(t){searchText=t.toLowerCase();applyFilters();}
function filterClass(v){selectedClass=v;applyFilters();}
function applyFilters(){
  currentList=[...students];
  if(searchText) currentList=currentList.filter(s=>s.name.toLowerCase().includes(searchText));
  if(selectedClass) currentList=currentList.filter(s=>s.class===selectedClass);
  renderTable();
}
function renderTable(){
  const rows=document.getElementById("rows");
  rows.innerHTML=currentList.map((s,i)=>{
    const bal=s.fee-s.paid;
    return `<tr>
      <td>${i+1}</td>
      <td><img src="${s.photo}" width="40"></td>
      <td>${s.name}</td>
      <td>${s.class}</td>
      <td>${s.date||""}</td>
      <td>${s.fee}</td>
      <td>${s.paid}</td>
      <td style="color:${bal>0?'red':'green'}">${bal}</td>
      <td>
        <button class="small pay" onclick="openPayment(${s.id})">Pay</button>
        <button class="small" onclick="editStudent(${s.id})">Edit</button>
        <button class="small danger" onclick="deleteStudent(${s.id})">Delete</button>
      </td>
    </tr>`;
  }).join("");
}

/* ===== SAVE / EDIT STUDENT ===== */
function saveStudent(){
  const s_name=document.getElementById("s_name").value.trim();
  const s_phone=document.getElementById("s_phone").value.trim();
  const s_class=document.getElementById("s_class").value;
  const s_date=document.getElementById("s_date").value;
  const s_fee=+document.getElementById("s_fee").value||0;
  if(!s_name || !s_class) return alert("Name and Class required");
  const obj={
    id:editId||Date.now(),
    name:s_name,
    phone:s_phone,
    photo:photoData||"https://via.placeholder.com/40",
    date:s_date,
    class:s_class,
    fee:s_fee,
    paid:editId ? students.find(s=>s.id===editId).paid:0,
    payments:editId ? students.find(s=>s.id===editId).payments:[]
  };
  editId ? students=students.map(s=>s.id===editId?obj:s) : students.push(obj);
  saveStudents(); editId=null; photoData=""; 
  studentsPage();
  
}
function editStudent(id){
  const s=students.find(x=>x.id===id);
  editId=id; photoData=s.photo; studentsPage();
  document.getElementById("s_name").value=s.name;
  document.getElementById("s_phone").value=s.phone;
  document.getElementById("s_date").value=s.date;
  document.getElementById("s_class").value=s.class;
  document.getElementById("s_fee").value=s.fee;
  document.getElementById("photo_preview").src=s.photo;
  document.getElementById("photo_preview").style.display="inline";
}
function deleteStudent(id){if(confirm("Delete?")){students=students.filter(s=>s.id!==id);saveStudents();studentsPage();}}

/* ===== PAYMENT ===== */
function openPayment(id){
  const s=students.find(x=>x.id===id);
  document.body.insertAdjacentHTML("beforeend",`
  <div class="modal" onclick="closeModal(event)">
    <div class="modal-box" onclick="event.stopPropagation()">
      <h3>Payment – ${s.name}</h3>
      <input id="p_amount" type="number" placeholder="Amount">
      <input id="p_date" type="date" value="${new Date().toISOString().slice(0,10)}">
      <input id="p_comment" placeholder="Comment">
      <button onclick="addPayment(${id})">Save</button>
      <button onclick="closeModal()">Close</button>
      <hr>
      ${s.payments.map(p=>`${p.date} - ${p.amount}<br>`).join("")||"No payments"}
    </div>
  </div>`);
}
function closeModal(e){if(!e||e.target.classList.contains("modal")) document.querySelector(".modal")?.remove();}
function addPayment(id){
  const s=students.find(x=>x.id===id);
  const amt=+document.getElementById("p_amount").value;
  if(!amt) return;
  s.paid+=amt;
  s.payments.push({amount:amt,date:document.getElementById("p_date").value,comment:document.getElementById("p_comment").value});
  saveStudents(); closeModal(); studentsPage();
}

/* ===== INIT ===== */
dashboardPage();

