const KEY="meuTreinoV1";
const exerciseCatalog = [
"Supino reto","Supino inclinado","Supino declinado","Supino com halteres","Crucifixo com halteres","Crucifixo inclinado","Crossover","Peck deck","Flexão de braço","Paralelas para peito",
"Agachamento livre","Agachamento frontal","Agachamento sumô","Hack squat","Leg press 45°","Leg press horizontal","Cadeira extensora","Afundo","Passada","Agachamento búlgaro","Stiff","Levantamento terra","Levantamento terra romeno","Mesa flexora","Cadeira flexora","Flexão nórdica","Elevação pélvica","Ponte de glúteos","Cadeira abdutora","Cadeira adutora","Panturrilha em pé","Panturrilha sentado",
"Barra fixa","Barra fixa supinada","Puxada frontal","Puxada supinada","Puxada neutra","Pulldown","Remada curvada","Remada cavalinho","Remada unilateral","Remada baixa","Remada na máquina","Remada articulada","Pullover","Face pull","Encolhimento de ombros",
"Desenvolvimento com barra","Desenvolvimento com halteres","Desenvolvimento Arnold","Elevação lateral","Elevação lateral na máquina","Elevação frontal","Crucifixo inverso","Remada alta",
"Rosca direta","Rosca alternada","Rosca martelo","Rosca concentrada","Rosca Scott","Rosca inclinada","Rosca bayesian","Rosca inversa","Rosca 21",
"Tríceps testa","Tríceps francês","Tríceps na polia","Tríceps corda","Tríceps unilateral","Tríceps coice","Supino fechado","Mergulho no banco",
"Abdominal supra","Abdominal infra","Abdominal na máquina","Abdominal na polia","Crunch","Crunch na polia","Prancha","Prancha lateral","Elevação de pernas","Abdominal russo","Escalador",
"Burpee","Polichinelo","Pular corda","Corrida","Caminhada","Bicicleta ergométrica","Elíptico","Remo ergométrico"
];
const defaults=exerciseCatalog;
let data=JSON.parse(localStorage.getItem(KEY)||"null")||{workouts:[],exercises:defaults,measures:[]};
const $=s=>document.querySelector(s);
const today=new Date().toISOString().slice(0,10);
$("#workoutDate").value=today; $("#measureDate").value=today;

function save(){localStorage.setItem(KEY,JSON.stringify(data));renderAll()}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function fmt(n){return new Intl.NumberFormat("pt-BR",{maximumFractionDigits:1}).format(n)}
function totalVolume(w){return (w.exercises||[]).reduce((a,e)=>a+(+e.weight||0)*(+e.reps||0)*(+e.sets||1),0)}
function dateBR(d){return new Date(d+"T12:00:00").toLocaleDateString("pt-BR")}

function addExerciseRow(name="",sets=3,reps=10,weight=0){
  const row=document.createElement("div"); row.className="exercise-row";
  row.innerHTML=`<select class="ex-name">${data.exercises.map(x=>`<option ${x===name?"selected":""}>${esc(x)}</option>`).join("")}</select>
  <input class="ex-sets" type="number" min="1" value="${sets}" placeholder="Séries">
  <input class="ex-reps" type="number" min="1" value="${reps}" placeholder="Reps">
  <input class="ex-weight" type="number" min="0" step=".5" value="${weight}" placeholder="kg">
  <button type="button" class="remove-row">×</button>`;
  row.querySelector(".remove-row").onclick=()=>row.remove();
  $("#exerciseRows").appendChild(row);
}
function renderDashboard(){
  const ws=[...data.workouts].sort((a,b)=>b.date.localeCompare(a.date));
  $("#statWorkouts").textContent=ws.length;
  $("#statVolume").textContent=fmt(ws.reduce((a,w)=>a+totalVolume(w),0))+" kg";
  $("#statMonth").textContent=ws.filter(w=>w.date.slice(0,7)===today.slice(0,7)).length;
  const last=[...data.measures].sort((a,b)=>b.date.localeCompare(a.date))[0];
  $("#statWeight").textContent=last?fmt(last.weight)+" kg":"--";
  $("#weekCount").textContent=ws.filter(w=>(Date.now()-new Date(w.date+"T12:00:00"))/86400000<7).length;
  const unique=[...new Set(ws.map(w=>w.date))];
  let streak=0, d=new Date(); d.setHours(12,0,0,0);
  while(unique.includes(d.toISOString().slice(0,10))){streak++;d.setDate(d.getDate()-1)}
  $("#streakText").textContent=streak+" dia"+(streak===1?"":"s");
  $("#recentWorkouts").innerHTML=ws.slice(0,5).map(w=>`<div class="list-item"><div><strong>${esc(w.name)}</strong><div class="muted">${dateBR(w.date)} · ${w.exercises.length} exercícios</div></div><b>${fmt(totalVolume(w))} kg</b></div>`).join("")||'<div class="empty">Nenhum treino registrado.</div>';
  const prs={};
  ws.forEach(w=>(w.exercises||[]).forEach(e=>prs[e.name]=Math.max(prs[e.name]||0,+e.weight||0)));
  $("#personalRecords").innerHTML=Object.entries(prs).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([n,v])=>`<div class="list-item"><strong>${esc(n)}</strong><b>${fmt(v)} kg</b></div>`).join("")||'<div class="empty">Registre seu primeiro treino.</div>';
  drawChart("volumeChart",ws.slice(0,10).reverse().map(w=>dateBR(w.date).slice(0,5)),ws.slice(0,10).reverse().map(totalVolume),"kg");
  const ms=[...data.measures].sort((a,b)=>a.date.localeCompare(b.date));
  drawChart("weightChart",ms.slice(-10).map(m=>dateBR(m.date).slice(0,5)),ms.slice(-10).map(m=>+m.weight),"kg");
}
function drawChart(id,labels,vals,suffix){
  const c=$( "#"+id ), ctx=c.getContext("2d"), d=devicePixelRatio||1, w=c.clientWidth, h=c.clientHeight;
  c.width=w*d;c.height=h*d;ctx.scale(d,d);ctx.clearRect(0,0,w,h);
  if(!vals.length){ctx.fillStyle="#999";ctx.font="13px system-ui";ctx.fillText("Sem dados suficientes",20,40);return}
  const pad={l:40,r:15,t:20,b:30}, max=Math.max(...vals)*1.15||1, min=Math.min(...vals)*.9;
  ctx.strokeStyle="#e7e9ec";ctx.lineWidth=1;
  for(let i=0;i<4;i++){let y=pad.t+(h-pad.t-pad.b)*i/3;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke()}
  ctx.beginPath(); vals.forEach((v,i)=>{let x=pad.l+(w-pad.l-pad.r)*(vals.length===1?.5:i/(vals.length-1));let y=pad.t+(h-pad.t-pad.b)*(1-(v-min)/((max-min)||1));i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.strokeStyle="#111315";ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle="#777";ctx.font="11px system-ui";labels.forEach((l,i)=>{let x=pad.l+(w-pad.l-pad.r)*(labels.length===1?.5:i/(labels.length-1));ctx.fillText(l,x-12,h-8)});
}
function renderHistory(){
  const ws=[...data.workouts].sort((a,b)=>b.date.localeCompare(a.date));
  $("#historyList").innerHTML=ws.map(w=>`<div class="history-item"><div><strong>${esc(w.name)}</strong><span class="muted">${dateBR(w.date)} · ${w.duration||"--"} min · ${fmt(totalVolume(w))} kg</span></div><button onclick="deleteWorkout('${w.id}')">Excluir</button></div>`).join("")||'<div class="empty">Nenhum treino registrado.</div>';
}
window.deleteWorkout=id=>{if(confirm("Excluir este treino?")){data.workouts=data.workouts.filter(w=>w.id!==id);save()}};
function exerciseGroup(e){
  const x=e.toLowerCase();
  if(/supino|crucifixo|crossover|peck|flexão de braço|paralelas/.test(x)) return "Peito";
  if(/barra fixa|puxada|pulldown|remada|pullover|face pull|encolhimento/.test(x)) return "Costas";
  if(/agachamento|leg press|extensora|afundo|passada|búlgaro|stiff|terra|flexora|pélvica|glúteos|abdutora|adutora|panturrilha/.test(x)) return "Pernas";
  if(/desenvolvimento|elevação lateral|elevação frontal|crucifixo inverso|remada alta/.test(x)) return "Ombros";
  if(/rosca/.test(x)) return "Bíceps";
  if(/tríceps|supino fechado|mergulho/.test(x)) return "Tríceps";
  if(/abdominal|crunch|prancha|elevação de pernas|escalador/.test(x)) return "Abdômen";
  return "Cardio";
}
function renderExercises(){
  const f=$("#muscleFilter")?.value||"Todos";
  const items=data.exercises.map((e,i)=>({e,i})).filter(x=>f==="Todos"||exerciseGroup(x.e)===f);
  $("#exerciseCatalog").innerHTML=items.map(x=>`<span class="tag"><b>${esc(x.e)}</b> <small>${exerciseGroup(x.e)}</small> <button style="border:0;background:none;cursor:pointer" onclick="removeExercise(${x.i})">×</button></span>`).join("")||'<div class="empty">Nenhum exercício nesse grupo.</div>';
  $("#muscleFilter")?.addEventListener("change",renderExercises,{once:true});
}
window.removeExercise=i=>{data.exercises.splice(i,1);save()};
function renderMeasures(){const ms=[...data.measures].sort((a,b)=>b.date.localeCompare(a.date));$("#measureList").innerHTML=ms.map((m,i)=>`<div class="history-item"><div><strong>${dateBR(m.date)}</strong><span class="muted">${fmt(m.weight)} kg${m.waist?` · ${fmt(m.waist)} cm cintura`:""}</span></div><button onclick="deleteMeasure('${m.id}')">Excluir</button></div>`).join("")||'<div class="empty">Nenhuma medida registrada.</div>'}
window.deleteMeasure=id=>{data.measures=data.measures.filter(m=>m.id!==id);save()};
function renderAll(){renderDashboard();renderHistory();renderExercises();renderMeasures()}
$("#addExercise").onclick=()=>addExerciseRow();
$("#workoutForm").onsubmit=e=>{e.preventDefault();const rows=[...document.querySelectorAll(".exercise-row")];if(!rows.length)return alert("Adicione pelo menos um exercício.");data.workouts.push({id:crypto.randomUUID(),date:$("#workoutDate").value,name:$("#workoutName").value,duration:+$("#duration").value||0,exercises:rows.map(r=>({name:r.querySelector(".ex-name").value,sets:+r.querySelector(".ex-sets").value,reps:+r.querySelector(".ex-reps").value,weight:+r.querySelector(".ex-weight").value}))});data.workouts.sort((a,b)=>a.date.localeCompare(b.date));e.target.reset();$("#workoutDate").value=today;$("#exerciseRows").innerHTML="";addExerciseRow();save();show("dashboard")};
$("#saveExercise").onclick=()=>{const v=$("#newExercise").value.trim();if(v&&!data.exercises.includes(v)){data.exercises.push(v);$("#newExercise").value="";save()}};
$("#exerciseCatalog").insertAdjacentHTML("beforebegin",'<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px"><select id="muscleFilter"><option value="Todos">Todos os grupos</option><option>Peito</option><option>Costas</option><option>Pernas</option><option>Ombros</option><option>Bíceps</option><option>Tríceps</option><option>Abdômen</option><option>Cardio</option></select><button class="secondary-btn" id="apiSync">↻ Atualizar exercícios</button></div><p class="muted" style="margin-top:8px">Catálogo em português. A atualização online é opcional e os exercícios entram com nome em português.</p>');
$("#apiSync").onclick=async()=>{
  const btn=$("#apiSync"); btn.disabled=true; btn.textContent="Carregando...";
  try{
    const r=await fetch("https://exercise-api.com/v1/exercises?limit=200&sort=name");
    if(!r.ok) throw new Error("API indisponível");
    const json=await r.json();
    const arr=Array.isArray(json)?json:(json.exercises||json.data||[]);
    const translate={
"Barbell Bench Press":"Supino reto","Bench Press":"Supino reto","Incline Bench Press":"Supino inclinado",
"Decline Bench Press":"Supino declinado","Dumbbell Bench Press":"Supino com halteres","Dumbbell Fly":"Crucifixo com halteres",
"Push Up":"Flexão de braço","Chest Fly":"Crucifixo na máquina","Cable Crossover":"Crossover",
"Barbell Squat":"Agachamento livre","Front Squat":"Agachamento frontal","Goblet Squat":"Agachamento com halter",
"Sumo Squat":"Agachamento sumô","Leg Press":"Leg press","Leg Extension":"Cadeira extensora","Leg Curl":"Cadeira flexora",
"Romanian Deadlift":"Levantamento terra romeno","Deadlift":"Levantamento terra","Lunge":"Afundo","Walking Lunge":"Passada",
"Bulgarian Split Squat":"Agachamento búlgaro","Hip Thrust":"Elevação pélvica","Glute Bridge":"Ponte de glúteos",
"Calf Raise":"Panturrilha em pé","Seated Calf Raise":"Panturrilha sentado","Pull Up":"Barra fixa","Chin Up":"Barra fixa supinada",
"Lat Pulldown":"Puxada frontal","Seated Cable Row":"Remada baixa","Barbell Row":"Remada curvada","One Arm Dumbbell Row":"Remada unilateral",
"Machine Row":"Remada na máquina","Face Pull":"Face pull","Shrug":"Encolhimento de ombros",
"Overhead Press":"Desenvolvimento com barra","Dumbbell Shoulder Press":"Desenvolvimento com halteres","Arnold Press":"Desenvolvimento Arnold",
"Lateral Raise":"Elevação lateral","Front Raise":"Elevação frontal","Reverse Fly":"Crucifixo inverso",
"Barbell Curl":"Rosca direta","Dumbbell Curl":"Rosca alternada","Hammer Curl":"Rosca martelo","Concentration Curl":"Rosca concentrada",
"Preacher Curl":"Rosca Scott","Incline Dumbbell Curl":"Rosca inclinada","Reverse Curl":"Rosca inversa",
"Triceps Extension":"Tríceps francês","Skull Crusher":"Tríceps testa","Triceps Pushdown":"Tríceps na polia",
"Rope Pushdown":"Tríceps corda","Triceps Kickback":"Tríceps coice","Close Grip Bench Press":"Supino fechado",
"Crunch":"Abdominal supra","Leg Raise":"Elevação de pernas","Plank":"Prancha","Side Plank":"Prancha lateral",
"Russian Twist":"Abdominal russo","Mountain Climber":"Escalador","Burpee":"Burpee","Jumping Jack":"Polichinelo",
"Jump Rope":"Pular corda","Running":"Corrida","Walking":"Caminhada","Cycling":"Bicicleta ergométrica","Elliptical":"Elíptico","Rowing":"Remo ergométrico"
};
    const names=arr.map(x=>translate[x.name||x.title]||x.name||x.title).filter(Boolean);
    if(names.length){
      data.exercises=[...new Set([...data.exercises,...names])].sort((a,b)=>a.localeCompare(b));
      save(); alert(`${names.length} exercícios carregados da API.`);
    }else throw new Error("Nenhum exercício retornado");
  }catch(e){
    alert("Não foi possível atualizar os exercícios agora. O catálogo local continua disponível.");
  }finally{btn.disabled=false;btn.textContent="↻ Carregar catálogo da API (opcional)"}
};
$("#saveMeasure").onclick=()=>{const weight=+$("#measureWeight").value;if(!weight)return alert("Informe o peso.");data.measures.push({id:crypto.randomUUID(),date:$("#measureDate").value,weight,waist:+$("#measureWaist").value||0});$("#measureWeight").value="";$("#measureWaist").value="";save()};

const COACH_CHAT_KEY="meuTreinoCoachChatV1";
let coachChat=JSON.parse(localStorage.getItem(COACH_CHAT_KEY)||"[]");

function coachContext(){
  const workouts=[...data.workouts].sort((a,b)=>a.date.localeCompare(b.date));
  const recent=workouts.slice(-20).map(w=>({
    data:w.date,nome:w.name,duracao:w.duration||0,volume:Math.round(totalVolume(w)*10)/10,
    exercicios:(w.exercises||[]).map(e=>({nome:e.name,series:+e.sets||0,repeticoes:+e.reps||0,carga:+e.weight||0}))
  }));
  const records={};
  workouts.forEach(w=>(w.exercises||[]).forEach(e=>{
    const carga=+e.weight||0;
    if(carga>(records[e.name]||0)) records[e.name]=carga;
  }));
  return {
    resumo:{totalTreinos:workouts.length,volumeTotal:Math.round(workouts.reduce((a,w)=>a+totalVolume(w),0)*10)/10},
    melhoresMarcas:records,
    medidas:[...data.measures].sort((a,b)=>a.date.localeCompare(b.date)).slice(-12),
    treinosRecentes:recent
  };
}
function saveCoachChat(){localStorage.setItem(COACH_CHAT_KEY,JSON.stringify(coachChat.slice(-30)))}
function coachBubble(role,text){
  const div=document.createElement("div"); div.className=`coach-message ${role}`;
  div.innerHTML=`<div class="coach-message-label">${role==="user"?"Você":"Coach IA"}</div><div>${esc(text).replace(/\n/g,"<br>")}</div>`;
  $("#coachMessages").appendChild(div); $("#coachMessages").scrollTop=$("#coachMessages").scrollHeight;
}
function renderCoachChat(){
  const box=$("#coachMessages"); if(!box)return; box.innerHTML="";
  if(!coachChat.length) coachBubble("assistant","Olá! Eu sou seu Coach IA. 👋\n\nPosso analisar seus treinos, comparar cargas e volume, identificar exercícios estagnados e sugerir o que faz sentido para o próximo treino.\n\nO que você quer analisar hoje?");
  coachChat.forEach(m=>coachBubble(m.role,m.content));
}
async function sendCoachMessage(message){
  const text=message.trim(); if(!text)return;
  coachChat.push({role:"user",content:text}); saveCoachChat(); renderCoachChat();
  const send=$("#coachSend"); const input=$("#coachInput"); send.disabled=true; send.textContent="..."; input.disabled=true;
  const typing=document.createElement("div"); typing.className="coach-message assistant coach-typing"; typing.innerHTML='<div class="coach-message-label">Coach IA</div><div>Analisando seus treinos...</div>'; $("#coachMessages").appendChild(typing); $("#coachMessages").scrollTop=$("#coachMessages").scrollHeight;
  try{
    const response=await fetch("/.netlify/functions/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text,context:coachContext(),history:coachChat.slice(-10,-1)})});
    const result=await response.json();
    if(!response.ok) throw new Error(result.error||"Não foi possível falar com o Coach IA.");
    typing.remove();
    coachChat.push({role:"assistant",content:result.content||"Não consegui gerar uma resposta agora."}); saveCoachChat(); renderCoachChat();
  }catch(err){
    typing.remove();
    coachChat.push({role:"assistant",content:"Não consegui conectar com a IA agora. Se você ainda não configurou a chave da IA na hospedagem, veja o arquivo README do projeto para ativar o Coach IA.\n\nEnquanto isso, seus treinos continuam salvos normalmente no aplicativo."}); saveCoachChat(); renderCoachChat();
  }finally{send.disabled=false;send.textContent="Enviar";input.disabled=false;input.focus()}
}

$("#coachForm").onsubmit=e=>{e.preventDefault();const input=$("#coachInput");const value=input.value;input.value="";sendCoachMessage(value)};
document.querySelectorAll(".coach-suggestions button").forEach(btn=>btn.onclick=()=>sendCoachMessage(btn.dataset.prompt));

function show(id){document.querySelectorAll(".section").forEach(s=>s.classList.toggle("active",s.id===id));document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.section===id));$("#pageTitle").textContent={dashboard:"Dashboard",treinos:"Registrar treino",historico:"Histórico",exercicios:"Exercícios",medidas:"Medidas",coach:"Coach IA"}[id];if(id==="treinos"&&!$("#exerciseRows").children.length)addExerciseRow()}
document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>show(b.dataset.section));$("#quickWorkout").onclick=()=>show("treinos");
$("#exportBtn").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download="meu-treino-backup.json";a.click()};
$("#importInput").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{data=JSON.parse(r.result);save();alert("Dados importados!")}catch{alert("Arquivo inválido.")}};r.readAsText(f)};
$("#clearBtn").onclick=()=>{if(confirm("Isso apagará todos os treinos e medidas. Continuar?")){data={workouts:[],exercises:defaults,measures:[]};save()}};
window.addEventListener("resize",renderDashboard);addExerciseRow();renderAll();renderCoachChat();