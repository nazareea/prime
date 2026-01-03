function renderTimeTablePage() {
  // -------- RENDER HTML --------
  document.getElementById("content").innerHTML = `
<div class="container">

  <!-- TOP NAV -->
  <div id="viewNav" style="margin-bottom:10px;">
    <button id="weekViewBtn" class="active">Weekly View</button>
    <button id="dailyViewBtn">Daily View</button>
    <button id="saveTTBtn">💾 Save</button>
  </div>

  <!-- CLASS NAV -->
  <div class="nav" style="margin-bottom:10px;"></div>

  <!-- MAIN -->
  <div class="main">
    <!-- WEEKLY TIMETABLE -->
    <div id="weeklyView">
      <h2>Weekly Timetable</h2>
      <table id="timetable">
        <thead>
          <tr>
            <th>Day</th>
            <th>P1</th><th>P2</th><th>P3</th><th>P4</th>
            <th>P5</th><th>P6</th><th>P7</th><th>P8</th>
          </tr>
        </thead>
        <tbody id="ttBody"></tbody>
      </table>
    </div>

    <!-- DAILY LESSONS -->
    <div id="dailyView" style="display:none;">
      <h2>Daily Lessons</h2>
      <div id="dayNav" style="margin-bottom:10px;">
        <button onclick="selectDay('Sun')">Sun</button>
        <button onclick="selectDay('Mon')">Mon</button>
        <button onclick="selectDay('Tue')">Tue</button>
        <button onclick="selectDay('Wed')">Wed</button>
        <button onclick="selectDay('Thu')">Thu</button>
      </div>
      <table id="daily">
        <thead><tr><th>Period</th></tr></thead>
        <tbody id="dailyBody"></tbody>
      </table>
    </div>

  </div>
</div>
  `;

  // -------- DATA --------
  const days = ["Sun","Mon","Tue","Wed","Thu"];
  const periods = [1,2,3,4,5,6,7,8];
  let selectedDay = "Sun";
  let ttteachers = JSON.parse(localStorage.getItem("teachers")) || [];
  console.log(ttteachers.name)

  // Use your CRUD data
  const classes = Array.from(new Set(state.students.map(s => s.class).filter(Boolean)));
  const teachersArr = state.teachers || [];
  const subjectsArr = state.subjects || [];

  if(classes.length === 0) return;
  let currentClass = classes[0];

  // -------- CLASS NAV --------
  const navContainer = document.querySelector(".nav");
  navContainer.innerHTML = "";
  classes.forEach((clsName,i)=>{
    const h = document.createElement("h3");
    h.dataset.class = clsName;
    h.innerText = clsName;
    if(i===0) h.classList.add("active");
    h.onclick = () => {
      document.querySelector(".nav .active").classList.remove("active");
      h.classList.add("active");
      currentClass = clsName;
      loadTT();
    };
    navContainer.appendChild(h);
  });

  // -------- WEEKLY TIMETABLE --------
  const ttBody = document.getElementById("ttBody");
  ttBody.innerHTML = "";
  days.forEach(day => {
    const tr = document.createElement("tr");
    tr.dataset.day = day;
    tr.innerHTML = `<td>${day}</td>`;

    periods.forEach(p => {
      const classSubjects = subjectsArr.filter(s => s.class === currentClass);
      const subOptions = classSubjects.length
        ? classSubjects.map(s=>`<option value="${s.name}" data-teacher="${s.teacher}">${s.name}</option>`).join("")
        : `<option value="">-</option>`;
      const teachOptions = teachersArr.map(t=>`<option value="${t.name}">${t.name}</option>`).join("");
      const classOptions = classes.map(c=>`<option value="${c}">${c}</option>`).join("");

      tr.innerHTML += `
        <td data-period="${p}">
          <select class="sub" onchange="updateTeacher(this)">${subOptions}</select>
          <select class="teach" onfocus="filterTeachers(this)" onchange="saveTT()">${teachOptions}</select>
          <select class="cls" onchange="saveTT()">${classOptions}</select>
        </td>
      `;
    });

    ttBody.appendChild(tr);
  });
  ttBody.innerHTML += `<tr><td colspan="${periods.length+1}" class="off">Friday & Saturday OFF</td></tr>`;

  // -------- UPDATE TEACHER WHEN SUBJECT CHANGES --------
  window.updateTeacher = function(sel){
    const teacherSel = sel.closest("td").querySelector(".teach");
    const chosenTeacher = sel.selectedOptions[0].dataset.teacher;
    if(chosenTeacher) teacherSel.value = chosenTeacher;
    saveTT();
  };

  // -------- SAVE / LOAD --------
  window.saveTT = function(){
    const data = {};
    document.querySelectorAll("#ttBody tr[data-day]").forEach(r=>{
      const d = r.dataset.day;
      data[d] = [];
      r.querySelectorAll("td[data-period]").forEach(td=>{
        data[d].push({
          subject: td.querySelector(".sub").value,
          teacher: td.querySelector(".teach").value,
          class: td.querySelector(".cls").value
        });
      });
    });
    localStorage.setItem("tt_"+currentClass, JSON.stringify(data));
    renderDaily();
    alert("Timetable saved!");
  };

  function loadTT(){
    const data = JSON.parse(localStorage.getItem("tt_"+currentClass) || "{}");
    document.querySelectorAll("#ttBody tr[data-day]").forEach(r=>{
      const d = r.dataset.day;
      r.querySelectorAll("td[data-period]").forEach((td,i)=>{
        td.querySelector(".sub").value = data[d]?.[i]?.subject || "";
        td.querySelector(".teach").value = data[d]?.[i]?.teacher || "";
        td.querySelector(".cls").value = data[d]?.[i]?.class || currentClass;
      });
    });
  }

  // -------- FILTER TEACHERS (no double booking) --------
  window.filterTeachers = function(sel){
    const td = sel.closest("td");
    const day = td.closest("tr").dataset.day;
    const period = td.dataset.period;
    const used = new Set();
    classes.forEach(clsName=>{
      const d = JSON.parse(localStorage.getItem("tt_"+clsName) || "{}");
      const t = d?.[day]?.[period-1]?.teacher;
      if(t) used.add(t);
    });
    [...sel.options].forEach(o=>{
      o.hidden=false; o.disabled=false;
      if(used.has(o.value) && o.value !== sel.value){
        o.hidden=true; o.disabled=true;
      }
    });
  };

  // -------- DAILY VIEW --------
  const dailyBody = document.getElementById("dailyBody");
  const dailyThead = document.querySelector("#daily thead tr");
  dailyThead.innerHTML = "<th>Period</th>";
  classes.forEach(clsName => dailyThead.innerHTML += `<th>${clsName}</th>`);

  window.selectDay = function(day){
    selectedDay = day;
    document.querySelectorAll("#dayNav button").forEach(b=>b.classList.remove("active"));
    event.target.classList.add("active");
    renderDaily();
  };

  function renderDaily(){
    dailyBody.innerHTML = "";
    for(let p=0; p<periods.length; p++){
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>P${p+1}</td>`;
      classes.forEach(clsName=>{
        const data = JSON.parse(localStorage.getItem("tt_"+clsName) || "{}");
        const lesson = data[selectedDay]?.[p];
        let cell = "";
        if(lesson?.teacher){
          const key = `done_${selectedDay}_${p}_${clsName}`;
          const ch = localStorage.getItem(key)=="1"?"checked":"";
          cell = `
            ${lesson.subject}<br>
            <small>${lesson.teacher} - ${lesson.class}</small><br>
            <input type="checkbox" class="done" ${ch} onchange="localStorage.setItem('${key}',this.checked?1:0)">
          `;
        }
        tr.innerHTML += `<td>${cell}</td>`;
      });
      dailyBody.appendChild(tr);
    }
  }

  // -------- VIEW NAV TOGGLE --------
  const weeklyView = document.getElementById("weeklyView");
  const dailyView = document.getElementById("dailyView");
  const weekBtn = document.getElementById("weekViewBtn");
  const dayBtn = document.getElementById("dailyViewBtn");
  document.getElementById("saveTTBtn").onclick = saveTT;

  weekBtn.onclick = () => {
    weeklyView.style.display = "block";
    dailyView.style.display = "none";
    weekBtn.classList.add("active");
    dayBtn.classList.remove("active");
  };
  dayBtn.onclick = () => {
    weeklyView.style.display = "none";
    dailyView.style.display = "block";
    dayBtn.classList.add("active");
    weekBtn.classList.remove("active");
  };

  // -------- INITIALIZE --------
  loadTT();
  renderDaily();
}
