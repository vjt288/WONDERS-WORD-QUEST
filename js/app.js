const DATA_URL="data.json";
let DATA=null;
const SAVE_KEY="wwq_v8_save";
const MODES=["picture","meaning","spell","scramble","sentence","attack"];

const MODE_INFO={
 picture:["🖼️ PICTURE MATCH","看圖／情境提示 → 找單字"],
 meaning:["📝 WORD → MEANING","英文 → 選中文意思"],
 spell:["🔤 SPELL IT","提示 → 拼出英文"],
 scramble:["🧩 SCRAMBLE","重新排列字母"],
 sentence:["💬 SENTENCE QUEST","句子情境 → 找正確單字"],
 attack:["⚡ WORD ATTACK","限時快速反應"]
};

let state={
 name:"",
 gender:"",
 score:0,
 unlocked:1,
 stars:{},
 mastery:{},
 chaptersDone:{}
};

let session=null;

const $=s=>document.querySelector(s);

const shuffle=a=>{
 a=[...a];
 for(let i=a.length-1;i>0;i--){
  const j=Math.floor(Math.random()*(i+1));
  [a[i],a[j]]=[a[j],a[i]];
 }
 return a;
};

function load(){
 try{
  const s=JSON.parse(localStorage.getItem(SAVE_KEY));
  if(s) state={...state,...s};
 }catch(e){}
}

function save(){
 localStorage.setItem(SAVE_KEY,JSON.stringify(state));
}

function stars(n){
 return "★".repeat(n)+"☆".repeat(3-n);
}

function esc(s){
 return String(s).replace(/[&<>"']/g,m=>({
  "&":"&amp;",
  "<":"&lt;",
  ">":"&gt;",
  '"':"&quot;",
  "'":"&#39;"
 }[m]));
}

function render(html){
 $("#app").innerHTML=`<div class="shell"><div class="game">${html}</div></div>`;
}

function top(title="WONDERS WORD QUEST"){
 return `<div class="top"><div class="logo">${title}</div><div class="score">SCORE ${state.score}</div></div>`;
}

function menuBtn(){
 return `<button class="secondary" onclick="showMap()">← MENU</button>`;
}

async function boot(){
 load();

 render(`
 <div class="content center">
  <div class="hero-title">WONDERS<br>WORD QUEST</div>
  <div class="subtitle">A 16-BIT ENGLISH RPG ADVENTURE · V8</div>

  <div class="panel" style="max-width:800px;margin:35px auto">
   <h2>YOUR HERO</h2>

   <input id="name"
    class="name"
    placeholder="ENTER YOUR NAME"
    value="${esc(state.name)}">

   <div class="gender-grid">

    <button id="boy"
     class="gender ${state.gender==="boy"?"selected":""}"
     onclick="chooseGender('boy')">
     👦 BOY
     ${state.gender==="boy"?'<span class="check">✓ SELECTED</span>':""}
    </button>

    <button id="girl"
     class="gender ${state.gender==="girl"?"selected":""}"
     onclick="chooseGender('girl')">
     👧 GIRL
     ${state.gender==="girl"?'<span class="check">✓ SELECTED</span>':""}
    </button>

   </div>

   <div id="heroStatus" class="small">
    ${state.gender?`Selected: ${state.gender.toUpperCase()}`:"Choose your hero"}
   </div>

   <button class="primary" onclick="startAdventure()">
    START ADVENTURE ▶
   </button>
  </div>
 </div>
 `);
}

function chooseGender(g){
 state.gender=g;
 save();
 boot();
}

function startAdventure(){
 const n=$("#name").value.trim();

 if(!n || !state.gender){
  alert("Please enter your name and choose BOY or GIRL.");
  return;
 }

 state.name=n;
 save();
 showMap();
}

function showMap(){

 render(`
 ${top("🗺️ WONDERS WORLD")}

 <div class="content">

  <div class="quest-head">
   <h1>WONDERS WORLD</h1>
   <div class="tag">
    ${state.gender==="boy"?"👦":"👧"} ${esc(state.name)}
   </div>
  </div>

  <div class="chapter-grid">

   ${DATA.chapters.map(c=>{

    const unlocked=c.id<=state.unlocked;
    const done=!!state.chaptersDone[c.id];
    const st=state.stars[c.id]||0;

    return `
    <button
     class="chapter ${unlocked?"ready":"locked"}"
     ${unlocked?`onclick="openChapter(${c.id})"`:"disabled"}>

     <h3>CHAPTER ${c.id}</h3>
     <div>${esc(c.title)}</div>
     <div class="stars">${stars(st)}</div>

     <div class="meta">
      ${c.words.length} WORDS ·
      ${done?"✓ COMPLETE":unlocked?"READY":"🔒 LOCKED"}
     </div>

    </button>
    `;

   }).join("")}

  </div>

  <div class="menu-row" style="margin-top:22px">

   <button class="secondary" onclick="showReview()">
    🔄 REVIEW QUEST
   </button>

   <button class="secondary" onclick="showBook()">
    📖 MY WORD BOOK
   </button>

   <button class="secondary" onclick="boot()">
    👤 HERO
   </button>

  </div>

  <div class="footer">
   V8：每次練習都會重新抽單字、題型與選項。
  </div>

 </div>
 `);
}

function openChapter(id){

 const c=DATA.chapters.find(x=>x.id===id);
 const modePool=shuffle(MODES);

 render(`
 ${top()}

 <div class="content">

  <div class="quest-head">
   <div>${menuBtn()}</div>

   <div>
    <h1>CHAPTER ${id}</h1>
    <div class="tag">${esc(c.title)}</div>
   </div>
  </div>

  <div class="panel center">

   <h2>${esc(c.theme)}</h2>

   <p>
    本章 ${c.words.length} 個單字，
    每次闖關都會重新亂數。
   </p>

   <div class="mode-grid">

    ${modePool.map(m=>`
     <div class="panel mode">
      <div class="mode-badge">${MODE_INFO[m][0]}</div>
      <small>${MODE_INFO[m][1]}</small>
     </div>
    `).join("")}

   </div>

   <button class="primary" onclick="startQuest(${id})">
    START RANDOM QUEST ▶
   </button>

  </div>

 </div>
 `);
}

function startQuest(id,review=false){

 const c=DATA.chapters.find(x=>x.id===id);

 let pool=review
  ? c.words.filter(w=>(state.mastery[w[0]]||{}).wrong>0)
  : c.words;

 if(!pool.length) pool=c.words;

 pool=shuffle(pool);

 const count=Math.min(10,pool.length);

 session={
  id,
  review,
  words:pool.slice(0,count),
  q:0,
  score:0,
  correct:0,
  usedHint:false,
  modeSeq:shuffle(MODES),
  selected:[],
  started:Date.now()
 };

 nextQuestion();
}

function nextQuestion(){

 if(session.q>=session.words.length){
  finishQuest();
  return;
 }

 const word=session.words[session.q];

 const mode=
  session.modeSeq[
   session.q%session.modeSeq.length
  ];

 session.mode=mode;
 session.selected=[];

 renderQuestion(word,mode);
}

function renderQuestion(word,mode){

 const [en,zh]=word;
 const c=DATA.chapters.find(x=>x.id===session.id);

 let body="";

 if(mode==="meaning"){

  const opts=shuffle([
   zh,
   ...shuffle(
    c.words.filter(w=>w[0]!==en)
   ).slice(0,3).map(w=>w[1])
  ]);

  body=`
   <div class="question">${esc(en)}</div>
   <div class="prompt">Choose the meaning.</div>

   <div class="choices">

    ${opts.map(o=>`
     <button class="choice"
      onclick="answer(
       '${btoa(unescape(encodeURIComponent(o)))}',
       '${btoa(unescape(encodeURIComponent(zh)))}'
      )">
      ${esc(o)}
     </button>
    `).join("")}

   </div>
  `;
 }

 else if(mode==="picture"){

  body=`
   <div class="question">🖼️</div>

   <div class="prompt">
    Which word matches this clue?
   </div>

   <div class="panel center">
    <div style="font-size:30px">${esc(zh)}</div>
    <p class="small">
     Picture-style clue · choose the English word.
    </p>
   </div>

   <div class="choices">

    ${shuffle([
     en,
     ...shuffle(
      c.words.filter(w=>w[0]!==en)
     ).slice(0,3).map(w=>w[0])
    ]).map(o=>`
     <button class="choice"
      onclick="answer(
       '${btoa(unescape(encodeURIComponent(o)))}',
       '${btoa(unescape(encodeURIComponent(en)))}'
      )">
      ${esc(o)}
     </button>
    `).join("")}

   </div>
  `;
 }

 else if(mode==="spell"){

  body=`
   <div class="question">${esc(zh)}</div>

   <div class="prompt">
    Type the English word.
   </div>

   <input
    id="spellInput"
    class="name"
    style="margin:20px auto"
    autocomplete="off">

   <button class="primary" onclick="checkSpell()">
    CHECK ✓
   </button>
  `;
 }

 else if(mode==="scramble"){

  let letters=
   shuffle(
    en.replace(/\s/g,"").split("")
   );

  body=`
   <div class="question">${esc(zh)}</div>

   <div class="prompt">
    Tap letters in the correct order.
   </div>

   <div id="scrambleAnswer" class="answer"></div>

   <div class="scramble">

    ${letters.map((l,i)=>`
     <button
      class="letter"
      id="l${i}"
      onclick="pickLetter('${esc(l)}',${i})">
      ${esc(l.toUpperCase())}
     </button>
    `).join("")}

   </div>

   <button class="primary" onclick="checkScramble()">
    CHECK ✓
   </button>
  `;
 }

 else if(mode==="sentence"){

  const templates=[
   `Maria saw the ______ in the street.`,
   `The story says to ______ with others.`,
   `You might feel ______ before a big event.`,
   `They were ______ to join the celebration.`
  ];

  const clue=
   templates[session.q%templates.length];

  body=`
   <div class="question">${esc(clue)}</div>

   <div class="prompt">
    Choose the word that fits best.
   </div>

   <div class="choices">

    ${shuffle([
     en,
     ...shuffle(
      c.words.filter(w=>w[0]!==en)
     ).slice(0,3).map(w=>w[0])
    ]).map(o=>`
     <button class="choice"
      onclick="answer(
       '${btoa(unescape(encodeURIComponent(o)))}',
       '${btoa(unescape(encodeURIComponent(en)))}'
      )">
      ${esc(o)}
     </button>
    `).join("")}

   </div>
  `;
 }

 else{

  body=`
   <div class="question">⚡ ${esc(zh)}</div>

   <div class="prompt">
    WORD ATTACK! Choose the correct word fast.
   </div>

   <div class="choices">

    ${shuffle([
     en,
     ...shuffle(
      c.words.filter(w=>w[0]!==en)
     ).slice(0,3).map(w=>w[0])
    ]).map(o=>`
     <button class="choice"
      onclick="answer(
       '${btoa(unescape(encodeURIComponent(o)))}',
       '${btoa(unescape(encodeURIComponent(en)))}'
      )">
      ${esc(o)}
     </button>
    `).join("")}

   </div>
  `;
 }

 render(`
 ${top()}

 <div class="content">

  <div class="quest-head">
   ${menuBtn()}
   <div class="timer" id="timer">30</div>
  </div>

  <div class="progress">
   <div style="width:${session.q/session.words.length*100}%"></div>
  </div>

  <div class="panel" style="margin-top:18px">

   <div class="mode-badge">
    ${MODE_INFO[mode][0]}
   </div>

   ${body}

   <div id="feedback" class="feedback"></div>

  </div>

  <div class="small center" style="margin-top:12px">
   Question ${session.q+1} / ${session.words.length}
  </div>

 </div>
 `);

 startTimer();
}

function startTimer(){

 clearInterval(session.timer);

 session.left=30;

 session.timer=setInterval(()=>{

  session.left--;

  const t=$("#timer");

  if(t) t.textContent=session.left;

  if(session.left<=0){
   clearInterval(session.timer);
   answer(null,null,true);
  }

 },1000);
}

function decode(s){

 try{
  return decodeURIComponent(escape(atob(s)));
 }catch(e){
  return s;
 }
}

function answer(a,b,timeout=false){

 clearInterval(session.timer);

 const got=
  a===null?null:decode(a);

 const correct=decode(b);

 handleAnswer(got,correct,timeout);
}

function handleAnswer(got,correct,timeout=false){

 const ok=
  !timeout &&
  got===correct;

 const key=
  session.words[session.q][0];

 state.mastery[key]=
  state.mastery[key]||
  {correct:0,wrong:0};

 if(ok){

  state.mastery[key].correct++;
  state.score+=100;

 }else{

  state.mastery[key].wrong++;
  state.score=
   Math.max(0,state.score-20);

 }

 session.correct+=ok?1:0;

 save();

 const f=$("#feedback");

 if(f){

  f.textContent=
   timeout
    ?`⏰ Time up! Answer: ${correct}`
    :ok
      ?"✅ Correct!"
      :`❌ Correct answer: ${correct}`;
 }

 setTimeout(()=>{

  session.q++;
  nextQuestion();

 },650);
}

function checkSpell(){

 const v=
  $("#spellInput").value
   .trim()
   .toLowerCase();

 handleAnswer(
  v,
  session.words[session.q][0].toLowerCase(),
  false
 );
}

function pickLetter(l,i){

 if(session.selected.includes(i)) return;

 session.selected.push(i);

 const el=$("#l"+i);

 if(el) el.disabled=true;

 $("#scrambleAnswer").textContent=
  session.selected
   .map(x=>$("#l"+x).textContent.toLowerCase())
   .join("");
}

function checkScramble(){

 const target=
  session.words[session.q][0]
   .replace(/\s/g,"")
   .toLowerCase();

 const got=
  session.selected
   .map(x=>$("#l"+x).textContent.toLowerCase())
   .join("");

 handleAnswer(got,target,false);
}

function finishQuest(){

 clearInterval(session.timer);

 const pct=
  Math.round(
   session.correct/
   session.words.length*100
  );

 let earned=
  pct>=90?3:
  pct>=70?2:1;

 const old=
  state.stars[session.id]||0;

 if(earned>old)
  state.stars[session.id]=earned;

 state.chaptersDone[session.id]=true;

 if(
  session.id===state.unlocked &&
  state.unlocked<6
 ){
  state.unlocked++;
 }

 save();

 render(`
 ${top()}

 <div class="content result">

  <div class="panel">

   <div class="big">${stars(earned)}</div>

   <h1>
    ${session.review?
     "REVIEW COMPLETE":
     "QUEST COMPLETE"}
   </h1>

   <p>
    Correct:
    ${session.correct} /
    ${session.words.length}
    (${pct}%)
   </p>

   <p>
    本次題目、題型與選項下次都會重新亂數。
   </p>

   <div class="menu-row">

    <button class="primary"
     onclick="openChapter(${session.id})">
     PLAY AGAIN 🔀
    </button>

    <button class="secondary"
     onclick="showMap()">
     WORLD MAP
    </button>

   </div>

  </div>

 </div>
 `);
}

function showReview(){

 const weak=
  Object.entries(state.mastery)
   .filter(([k,v])=>v.wrong>0)
   .map(([k])=>k);

 render(`
 ${top()}

 <div class="content">

  <div class="quest-head">
   ${menuBtn()}
   <h1>🔄 REVIEW QUEST</h1>
  </div>

  <div class="panel center">

   <h2>Smart Random Review</h2>

   <p>
    系統會優先抽曾答錯的單字；
    每次都重新洗牌。
   </p>

   <div class="tag">
    Weak words: ${weak.length}
   </div>

   <div class="chapter-grid" style="margin-top:18px">

    ${DATA.chapters.map(c=>`

     <button class="chapter ready"
      onclick="startQuest(${c.id},true)">

      <h3>CHAPTER ${c.id}</h3>

      <div>${esc(c.title)}</div>

      <div class="meta">
       Review ${c.words.length} words
      </div>

     </button>

    `).join("")}

   </div>

  </div>

 </div>
 `);
}

function showBook(){

 const words=
  DATA.chapters.flatMap(c=>c.words);

 render(`
 ${top()}

 <div class="content">

  <div class="quest-head">
   ${menuBtn()}
   <h1>📖 MY WORD BOOK</h1>
  </div>

  <div class="wordbook">

   ${words.map(([e,z])=>{

    const m=state.mastery[e]||{};
    const n=m.correct||0;

    return `
     <div class="word">
      <strong>${esc(e)}</strong>
      <span>${esc(z)}</span>

      <div class="stars">
       ${n>=3?"★★★":n>=1?"★★☆":"★☆☆"}
      </div>

     </div>
    `;

   }).join("")}

  </div>

 </div>
 `);
}

load();

fetch(DATA_URL)
 .then(r=>r.json())
 .then(d=>{
  DATA=d;
  boot();
 })
 .catch(e=>{
  document.body.innerHTML=
   "<h2 style='padding:30px'>Unable to load game data.</h2>";
 });
