
/* app.js embebido - sessão com sessionStorage, persistência em localStorage */

// --- Storage keys ---
const KEY = 'impk3096_data_v1';
const CFG_KEY = 'impk3096_cfg_v1';

// --- Utilidades ---
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function load() { return JSON.parse(localStorage.getItem(KEY) || '{"users":[],"students":{},"disciplines":[],"grades":{}}'); }
function save(data){ localStorage.setItem(KEY, JSON.stringify(data)); }
function loadCfg(){ return JSON.parse(localStorage.getItem(CFG_KEY) || '{"minAverage":10,"maxSubjectFail":1,"minSubject":8}'); }
function saveCfg(cfg){ localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); }

// --- Inicialização ---
if(!localStorage.getItem(KEY)){
  // cria conta para teste
  const initial = {
    users:[ {username:'JackGood', password:'123456', name:'Administrador'} ],
    students: { '10': [], '11': [], '12': [] },
    disciplines: [],
    grades: {} // grades[studentId] = [{discipline, value}]
  };
  save(initial);
  saveCfg(loadCfg());
}

// --- Login e sessão ---
function createDemoAccount(){
  const data = load();
  const name = prompt('Nome de usuário (ex: professor1)') || 'prof';
  const pass = prompt('Senha (ex: 1234)') || '1234';
  data.users.push({username:name,password:pass,name:name});
  save(data);
  alert('Conta criada: ' + name + ' / ' + pass);
}
function doLogin(){
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const data = load();
  const u = data.users.find(x => x.username === user && x.password === pass);
  if(!u){ alert('Credenciais inválidas'); return; }
  sessionStorage.setItem('impk_user', JSON.stringify({username:u.username, name:u.name}));
  showMain();
}
function logout(){ sessionStorage.removeItem('impk_user'); location.reload(); }

// --- UI handlers ---
function showMain(){
  const user = JSON.parse(sessionStorage.getItem('impk_user') || 'null');
  if(!user) return;
  document.getElementById('login-screen').style.display='none';
  document.getElementById('main-screen').style.display='block';
  document.getElementById('user-badge').textContent = user.name;
  // processar configuração
  const cfg = loadCfg();
  document.getElementById('cfg-min-average').value = cfg.minAverage;
  document.getElementById('cfg-max-subjects-fail').value = cfg.maxSubjectFail;
  document.getElementById('cfg-min-subject').value = cfg.minSubject;
  updateCfgShow();
  renderStudentTable();
  renderDisciplines();
  renderGradeForm();
}

function showSection(id){
  const sections = ['config','cadastro','disciplinas','notas','relatorios','export'];
  sections.forEach(s => document.getElementById(s).style.display = s===id ? 'block' : 'none');
}

// --- Configuração ---
function saveConfig(){
  const cfg = {
    minAverage: parseFloat(document.getElementById('cfg-min-average').value) || 10,
    maxSubjectFail: parseInt(document.getElementById('cfg-max-subjects-fail').value) || 1,
    minSubject: parseFloat(document.getElementById('cfg-min-subject').value) || 8
  };
  saveCfg(cfg);
  updateCfgShow();
  alert('Configuração guardada.');
}
function updateCfgShow(){
  const cfg = loadCfg();
  document.getElementById('show-cfg-min').textContent = cfg.minAverage;
  document.getElementById('show-cfg-maxfail').textContent = cfg.maxSubjectFail;
  document.getElementById('show-cfg-minsub').textContent = cfg.minSubject;
}

// --- Estudante ---
function addStudent(){
  const name = document.getElementById('stu-name').value.trim();
  const sex = document.getElementById('stu-sex').value;
  const cls = document.getElementById('stu-class').value;
  const id = document.getElementById('stu-id').value.trim() || uid();
  if(!name){ alert('Nome é obrigatório'); return;}
  const data = load();
  if(!data.students[cls]) data.students[cls]=[];
  if(data.students[cls].length >= 20){ alert('Limite de 20 estudantes atingido nesta turma'); return; }
  // Parte que verifica o id 
  const exists = Object.values(data.students).flat().some(s => s.id === id);
  if(exists){ alert('ID já existe. Escolha outro.'); return; }
  const student = {id, name, sex};
  data.students[cls].push(student);
  save(data);
  document.getElementById('stu-name').value='';
  document.getElementById('stu-id').value='';
  renderStudentTable();
  renderGradeForm();
  alert('Estudante cadastrado.');
}
function renderStudentTable(){
  const cls = document.getElementById('view-class').value;
  const data = load();
  const arr = data.students[cls] || [];
  let html = '<table><thead><tr><th>ID</th><th>Nome</th><th>Sexo</th><th>Accões</th></tr></thead><tbody>';
  for(const s of arr){
    html += `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.sex}</td>
    <td><button onclick="removeStudent('${cls}','${s.id}')">Remover</button></td></tr>`;
  }
  html += '</tbody></table>';
  if(arr.length===0) html = '<div class="small">Nenhum estudante nesta turma.</div>';
  document.getElementById('students-table').innerHTML = html;
}
function removeStudent(cls,id){
  if(!confirm('Remover o estudante?')) return;
  const data = load();
  data.students[cls] = (data.students[cls]||[]).filter(s=>s.id!==id);
  // Função de remover notas !
  const grades = data.grades || {};
  delete grades[id];
  data.grades = grades;
  save(data);
  renderStudentTable();
  renderGradeForm();
  alert('Removido.');
}
function showStudentsList(){ showSection('cadastro'); renderStudentTable(); }

// --- Disciplinas ---
function addDiscipline(){
  const name = document.getElementById('disc-name').value.trim();
  const cls = document.getElementById('disc-class').value;
  if(!name){ alert('Nome da disciplina é obrigatório'); return; }
  const data = load();
  data.disciplines.push({id:uid(), name, class:cls});
  save(data);
  document.getElementById('disc-name').value='';
  renderDisciplines();
  renderGradeForm();
}
function renderDisciplines(){
  const data = load();
  if(!data.disciplines || data.disciplines.length===0){
    document.getElementById('disc-list').innerHTML = '<div class="small">Sem disciplinas.</div>'; return;
  }
  let html = '<table><thead><tr><th>Disciplina</th><th>Turma</th><th>Ações</th></tr></thead><tbody>';
  for(const d of data.disciplines){
    html += `<tr><td>${d.name}</td><td>${d.class}</td><td><button onclick="removeDiscipline('${d.id}')">Remover</button></td></tr>`;
  }
  html += '</tbody></table>';
  document.getElementById('disc-list').innerHTML = html;
}
function removeDiscipline(id){
  if(!confirm('Remover disciplina?')) return;
  const data = load();
  data.disciplines = data.disciplines.filter(d=>d.id!==id);
  save(data);
  renderDisciplines();
  renderGradeForm();
}

// --- Grades ---
function renderGradeForm(){
  const cls = document.getElementById('grade-class').value;
  const data = load();
  const students = data.students[cls] || [];
  const selStu = document.getElementById('grade-student');
  selStu.innerHTML = '';
  for(const s of students) selStu.innerHTML += `<option value="${s.id}">${s.name} (${s.id})</option>`;
  // disciplines for class or 'all'
  const selDisc = document.getElementById('grade-discipline');
  selDisc.innerHTML = '';
  const discs = (data.disciplines || []).filter(d => d.class==='all' || d.class===cls);
  for(const d of discs) selDisc.innerHTML += `<option value="${d.name}">${d.name}</option>`;
}
function saveGrade(){
  const cls = document.getElementById('grade-class').value;
  const studentId = document.getElementById('grade-student').value;
  const discipline = document.getElementById('grade-discipline').value;
  const value = parseFloat(document.getElementById('grade-value').value);
  if(!studentId || !discipline || isNaN(value)){ alert('Preenche todos os campos e valor válido.'); return; }
  const data = load();
  if(!data.grades[studentId]) data.grades[studentId]=[];
  // substitui nota da mesma disciplina se já existir
  data.grades[studentId] = data.grades[studentId].filter(g => g.discipline !== discipline);
  data.grades[studentId].push({discipline,value});
  save(data);
  alert('Nota guardada.');
  viewGrades();
}
function viewGrades(){
  const studentId = document.getElementById('grade-student').value;
  const data = load();
  const arr = data.grades[studentId] || [];
  if(arr.length===0){ document.getElementById('grades-view').innerHTML = '<div class="small">Sem notas para este aluno.</div>'; return; }
  let html = '<table><thead><tr><th>Disciplina</th><th>Nota</th></tr></thead><tbody>';
  for(const g of arr) html += `<tr><td>${g.discipline}</td><td>${g.value}</td></tr>`;
  html += '</tbody></table>';
  document.getElementById('grades-view').innerHTML = html;
}

// --- Cálculos e Relatórios ---
function calculateAverage(studentId){
  const data = load();
  const grades = data.grades[studentId] || [];
  if(grades.length===0) return {average:null,subjectsFail:0,total:0};
  const total = grades.reduce((s,g)=>s+g.value,0)/grades.length;
  const cfg = loadCfg();
  const fails = grades.filter(g=>g.value < cfg.minSubject).length;
  return {average:parseFloat(total.toFixed(2)), subjectsFail:fails, totalGrades:grades.length};
}
function evaluateTransition(studentId){
  const cfg = loadCfg();
  const calc = calculateAverage(studentId);
  if(calc.average === null) return 'Sem notas';
  if(calc.average >= cfg.minAverage && calc.subjectsFail <= cfg.maxSubjectFail) return 'Transição';
  return 'Não Transição';
}

function renderReport(){
  const cls = document.getElementById('report-class').value;
  const data = load();
  const students = data.students[cls] || [];
  if(students.length===0){ document.getElementById('report-output').innerHTML = '<div class="small">Nenhum estudante nesta turma.</div>'; return; }
  let html = '<table><thead><tr><th>ID</th><th>Nome</th><th>Média</th><th>Fails</th><th>Resultado</th></tr></thead><tbody>';
  for(const s of students){
    const calc = calculateAverage(s.id);
    html += `<tr><td>${s.id}</td><td>${s.name}</td><td>${calc.average===null?'-':calc.average}</td><td>${calc.subjectsFail}</td><td>${evaluateTransition(s.id)}</td></tr>`;
  }
  html += '</tbody></table>';
  document.getElementById('report-output').innerHTML = html;
}

// --- Export / Download ---
function downloadCSV(){
  const cls = document.getElementById('report-class').value;
  const data = load();
  const students = data.students[cls] || [];
  let csv = 'ID,Nome,Sexo,Média,Fails,Resultado\\n';
  for(const s of students){
    const calc = calculateAverage(s.id);
    csv += `${s.id},"${s.name}",${s.sex},${calc.average===null?'':calc.average},${calc.subjectsFail},${evaluateTransition(s.id)}\\n`;
  }
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `turma_${cls}_relatorio.csv`;
  link.click();
}

function exportToWord(){
  const cls = document.getElementById('export-class').value;
  const title = document.getElementById('export-title').value || 'Relatório';
  const data = load();
  const students = data.students[cls] || [];
  let html = `<h1>${title}</h1><h3>Turma: ${cls}.ª Classe</h3>`;
  html += '<table border="1" cellpadding="6" style="border-collapse:collapse;"><tr><th>ID</th><th>Nome</th><th>Média</th><th>Fails</th><th>Resultado</th></tr>';
  for(const s of students){
    const calc = calculateAverage(s.id);
    html += `<tr><td>${s.id}</td><td>${s.name}</td><td>${calc.average===null?'-':calc.average}</td><td>${calc.subjectsFail}</td><td>${evaluateTransition(s.id)}</td></tr>`;
  }
  html += '</table><p>Gerado em: ${new Date().toLocaleString()}</p>';
  // Cria blob tipo Word
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `relatorio_turma_${cls}.doc`;
  link.click();
}

// --- Reset data (apagar tudo) ---
function resetData(){
  if(!confirm('Apagar TODOS os dados (estudantes, disciplinas, notas)? Esta ação não tem undo.')) return;
  localStorage.removeItem(KEY);
  localStorage.removeItem(CFG_KEY);
  location.reload();
}

// --- On load: verifica sessão ---
(function init(){
  const user = sessionStorage.getItem('impk_user');
  if(user){ showMain(); } else { document.getElementById('login-screen').style.display='block'; }
})();
