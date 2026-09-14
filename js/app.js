/* WONDERS WORD QUEST — V14 COMPLETE
   Visual upgrade + player name + world map + quest HUD
   Core learning rules preserved.
*/
const state={
 data:[],player:"",character:null,chapter:0,mode:null,q:0,total:10,
 score:0,combo:0,best:0,hints:2,timer:null,deadline:0,
 mastery:{},unlocked:1,sound:true,selected:[],answer:"",review:false,
 words:[],current:null,currentAnswerType:"word",lock:false
};
const $=s=>document.querySelector(s);
const app=document.getElementById("app");
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
function save(){try{localStorage.setItem("wwq_save",JSON.stringify({...state,timer:null,deadline:0,lock:false}));}catch(e){}}
function load(){try{const x=JSON.parse(localStorage.getItem("wwq_save")||"null");if(x)Object.assign(state,x);}catch(e){}}
function stars(n){n=Math.max(0,Math.min(3,+n||0));return "★".repeat(n)+"☆".repeat(3-n)}
function totalStars(){return Object.values(state.mastery||{}).reduce((s,m)=>s+(m.star||0),0)}
function hud(){
 return `<div class="top">
   <div class="logo">⚔ WONDERS WORD QUEST</div>
   <div class="stats">
    <span class="pill">🎯 ${state.score}</span>
    <span class="pill">⭐ ${totalStars()}</span>
    <span class="pill">🔥 ${state.combo}</span>
   </div>
 </div>`;
}
function screen(html,extraClass=""){
 app.innerHTML=`<div class="game ${extraClass}">${hud()}<main class="main">${html}</main></div>`;
}
function menu(){
 clearInterval(state.timer);
 if(!state.player||state.player==="YOU"){
  screen(`<section class="panel center welcomePanel">
   <div class="magicBook">📖</div>
   <div class="eyebrow">WELCOME, YOUNG EXPLORER</div>
   <h1 class="title">WONDERS<br>WORD QUEST</h1>
   <p class="sub">Your English adventure begins!</p>
   <div class="nameBox">
    <div class="nameLabel">👤 CHALLENGER NAME</div>
    <input id="playerName" autocomplete="name" maxlength="20" placeholder="Enter your name">
    <button class="btn" id="saveName" type="button">START ADVENTURE</button>
   </div>
   <p class="small">Your name and progress are saved automatically.</p>
  </section>`);
  const input=$("#playerName");input.focus();
  const start=()=>{const n=input.value.trim();if(!n){input.focus();input.placeholder="Please enter your name!";return}
    state.player=n;save();chooseCharacter()};
  $("#saveName").onclick=start;
  input.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();start()}};
  return;
 }
 screen(`<section class="panel center menuPanel">
   <div class="eyebrow">WELCOME BACK, ${esc(state.player).toUpperCase()}</div>
   <h1 class="title">WONDERS<br>WORD QUEST</h1>
   <p class="sub">Your English adventure awaits.</p>
   <div class="playerRibbon">👤 <strong>${esc(state.player)}</strong>　 ${state.character?`⚔ ${state.character}`:"Choose your hero"}</div>
   <div class="buttons menuButtons">
    <button class="btn" id="continue" type="button">▶ CONTINUE ADVENTURE</button>
    <button class="btn secondary" id="map" type="button">🗺️ WORLD MAP</button>
    <button class="btn secondary" id="review" type="button">🔄 REVIEW QUEST</button>
    <button class="btn secondary" id="book" type="button">📖 MY WORD BOOK</button>
    <button class="btn secondary" id="ach" type="button">🏆 ACHIEVEMENTS</button>
   </div>
   <p class="small">30 seconds per question · Auto-save · Replay anytime</p>
 </section>`);
 $("#continue").onclick=()=>state.character?worldMap():chooseCharacter();
 $("#map").onclick=worldMap;$("#review").onclick=reviewQuest;$("#book").onclick=wordBook;$("#ach").onclick=achievements;
}
function chooseCharacter(){
 screen(`<section class="panel center"><div class="eyebrow">CHOOSE YOUR HERO</div><h2>READY FOR THE QUEST?</h2>
  <p class="sub">Boy / Girl — equal abilities</p>
  <div class="cards heroCards">
   <div class="card heroCard" id="boy"><div class="heroEmoji">🧑‍🎓</div><h2>BOY</h2><p>Brave Explorer</p></div>
   <div class="card heroCard" id="girl"><div class="heroEmoji">👩‍🎓</div><h2>GIRL</h2><p>Brave Explorer</p></div>
  </div>
  <div class="buttons"><button class="btn secondary" id="back" type="button">← BACK</button></div></section>`);
 $("#boy").onclick=()=>{state.character="BOY";save();worldMap()};
 $("#girl").onclick=()=>{state.character="GIRL";save();worldMap()};
 $("#back").onclick=menu;
}
const chapterIcons=["🎉","👨‍👩‍👧","🐦","🌾","🐎","🏠"];
function worldMap(){
 clearInterval(state.timer);
 const cards=state.data.map((c,i)=>{
  const locked=i+1>state.unlocked;
  const total=c.words.length;
  const got=c.words.filter(w=>(state.mastery[w.word]?.star||0)>0).length;
  const sg=c.words.reduce((a,w)=>a+(state.mastery[w.word]?.star||0),0);
  const rating=Math.min(3,Math.round(sg/Math.max(1,total)));
  const current=!locked&&i===state.chapter;
  return `<div class="mapNode ${locked?"locked":""} ${current?"current":""} ${got===total?"complete":""}" data-i="${i}">
    <div class="mapBadge">${locked?"🔒":chapterIcons[i]}</div>
    <div class="mapInfo"><div class="mapChapter">CHAPTER ${String(i+1).padStart(2,"0")}</div>
      <div class="mapName">${esc(c.name)}</div><div class="mapDesc">${got}/${total} words discovered</div></div>
    <div class="mapStars">${stars(rating)}</div>
  </div>`;
 }).join("");
 screen(`<section class="worldmap">
   <div class="mapArtwork"><img src="assets/images/world_map_v15.svg" alt="Wonders World Map"></div>
   <div class="mapTitle">✦ WONDERS WORLD ✦</div>
   <div class="mapSub">Follow the path. Discover words. Become a Word Quest Hero.</div>
   <div class="mapPath">${cards}</div>
   <div class="buttons mapButtons"><button class="btn secondary" id="back" type="button">← MAIN MENU</button></div>
  </section>`,"mapScreen");
 document.querySelectorAll(".mapNode").forEach(el=>el.onclick=()=>{const i=+el.dataset.i;if(i+1<=state.unlocked)chapter(i)});
 $("#back").onclick=menu;
}
function chapter(i){
 clearInterval(state.timer);state.chapter=i;state.review=false;
 const c=state.data[i],modes=["SPELL IT","PICTURE MATCH","WORD → MEANING","SCRAMBLE","SENTENCE QUEST","WORD ATTACK"];
 screen(`<section class="panel chapterPanel">
  <div class="eyebrow">CHAPTER ${String(i+1).padStart(2,"0")}</div>
  <h1>${esc(c.name)}</h1><div class="notice center">📚 ${c.words.length} words　·　⏱️ 30 seconds / question</div>
  <div class="modegrid">${modes.map((m,j)=>`<button class="btn" data-mode="${j}" type="button">${["🔤","🖼️","📝","🧩","💬","⚡"][j]} ${m}</button>`).join("")}</div>
  <div class="buttons"><button class="btn secondary" id="back" type="button">← WORLD MAP</button></div>
 </section>`);
 document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>startQuest(+b.dataset.mode));
 $("#back").onclick=worldMap;
}
function shuffle(a){return a.map(x=>[Math.random(),x]).sort((x,y)=>x[0]-y[0]).map(x=>x[1])}
function distractors(word,n=3){
 const all=state.data.flatMap(c=>c.words).map(x=>x.word).filter(x=>x!==word);
 return shuffle([...new Set(all)]).slice(0,n);
}
function buildReviewWords(){return state.data.flatMap(c=>c.words).filter(w=>(state.mastery[w.word]?.star||0)<3)}
function startQuest(mode,words=null,isReview=false){
 clearInterval(state.timer);state.mode=mode;state.q=0;state.score=0;state.combo=0;state.review=isReview;
 const pool=words||state.data[state.chapter].words.slice();
 state.words=shuffle(pool).slice(0,Math.min(10,pool.length));state.total=state.words.length;state.lock=false;nextQuestion();
}
function questionFor(w){
 if(state.mode===0)return {title:"SPELL IT",prompt:`Spell this word: <strong>${esc(w.meaning)}</strong>`,kind:"input",answerType:"word"};
 if(state.mode===1)return {title:"PICTURE MATCH",prompt:"Which word matches the picture?",kind:"pic",answerType:"word"};
 if(state.mode===2)return {title:"WORD → MEANING",prompt:`What does <strong>${esc(w.word)}</strong> mean?`,kind:"meaning",answerType:"meaning"};
 if(state.mode===3)return {title:"SCRAMBLE",prompt:"Put the letters in the correct order.",kind:"scramble",answerType:"word"};
 if(state.mode===4)return {title:"SENTENCE QUEST",prompt:`Choose the word that best completes this sentence:<br><strong>“In the story, the characters used the word <em>${esc(w.meaning)}</em> to describe the situation.”</strong>`,kind:"choice",answerType:"word"};
 return {title:"WORD ATTACK",prompt:`Quick! What is the meaning of <strong>${esc(w.word)}</strong>?`,kind:"meaning",answerType:"meaning"};
}
function nextQuestion(){
 clearInterval(state.timer);
 if(state.q>=state.total){finishQuest();return}
 const w=state.words[state.q];state.current=w;state.currentAnswerType=questionFor(w).answerType;state.lock=false;
 const q=questionFor(w);let body="";
 if(q.kind==="pic")body=`<img class="picture" src="${w.image}" alt="Picture clue">`;
 if(q.kind==="input")body=`<input id="answer" class="answerInput" autocomplete="off" autocapitalize="none" placeholder="Type the word"><div class="buttons compact"><button class="btn" id="submitAnswer" type="button">CONFIRM / 確定</button></div>`;
 if(q.kind==="scramble"){
  const letters=shuffle([...w.word.toUpperCase().replace(/[^A-Z]/g,"")]);state.scrambled=letters;state.answer="";
  body=`<div class="scramble">${letters.map((l,i)=>`<button class="letter" data-letter="${i}" type="button">${esc(l)}</button>`).join("")}</div>
   <div class="typedBox" id="typed"></div><div class="buttons compact"><button class="btn" id="submitScramble" type="button">CONFIRM / 確定</button></div>`;
 }
 if(q.kind==="meaning"||q.kind==="choice"||q.kind==="pic"){
  let opts,lookup=state.data.flatMap(c=>c.words);
  if(q.kind==="pic"||q.answerType==="word")opts=shuffle([w.word,...distractors(w.word)]);
  else opts=shuffle([w.meaning,...distractors(w.word).map(x=>lookup.find(z=>z.word===x)?.meaning||x)]);
  body+=`<div class="answers">${opts.map(o=>`<button class="btn answer" type="button" data-answer="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
 }
 screen(`<section class="panel questPanel">
  <div class="questHeader"><span class="pill modePill">${q.title}</span><span class="pill">Q ${state.q+1}/${state.total}</span></div>
  <div class="timerWrap"><div class="timer"><div id="bar"></div></div><span class="timerText" id="timerText">30s</span></div>
  <div class="question">${q.prompt}</div>${body}<div id="feedback" class="feedback"></div>
  <div class="buttons"><button class="btn secondary" id="quit" type="button">QUIT QUEST</button></div>
 </section>`,"questScreen");
 $("#quit").onclick=()=>{clearInterval(state.timer);state.review?reviewQuest():chapter(state.chapter)};
 if(q.kind==="input"){const input=$("#answer");input.focus();input.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();submit(input.value)}};$("#submitAnswer").onclick=()=>submit(input.value)}
 document.querySelectorAll(".answer").forEach(b=>b.onclick=()=>submit(b.dataset.answer));
 if(q.kind==="scramble"){
  document.querySelectorAll(".letter").forEach(b=>b.onclick=()=>{if(b.disabled)return;const i=+b.dataset.letter;b.disabled=true;state.answer+=state.scrambled[i];$("#typed").textContent=state.answer});
  $("#submitScramble").onclick=()=>submit(state.answer);
 }
 startTimer();
}
function startTimer(){
 state.deadline=Date.now()+30000;
 state.timer=setInterval(()=>{
  const left=Math.max(0,state.deadline-Date.now()),pct=left/30000*100,sec=Math.ceil(left/1000);
  const bar=$("#bar");if(bar)bar.style.width=pct+"%";
  const t=$("#timerText");if(t)t.textContent=sec+"s";
  if(left<=0){clearInterval(state.timer);submit("",true)}
 },100);
}
function submit(raw,timeout=false){
 if(state.lock)return;state.lock=true;clearInterval(state.timer);
 const w=state.current,norm=x=>String(x||"").trim().toLowerCase().replace(/\s+/g," ");
 const expected=state.currentAnswerType==="meaning"?w.meaning:w.word,correct=norm(raw)===norm(expected),fb=$("#feedback");
 if(correct){
  state.combo++;state.best=Math.max(state.best,state.combo);
  state.score+=10+Math.min(20,state.combo);
  const old=state.mastery[w.word]?.star||0,star=state.combo>=4?3:state.combo>=2?2:1;
  state.mastery[w.word]={star:Math.max(old,star),seen:(state.mastery[w.word]?.seen||0)+1};
  fb.innerHTML=`✅ CORRECT! <span class="scorePop">+${10+Math.min(20,state.combo)} points</span>`;
 }else{
  state.combo=0;
  fb.innerHTML=timeout?"⏰ TIME'S UP!":"❌ TRY AGAIN NEXT TIME";
  state.mastery[w.word]={star:state.mastery[w.word]?.star||0,seen:(state.mastery[w.word]?.seen||0)+1};
 }
 save();setTimeout(()=>{state.q++;state.lock=false;nextQuestion()},750);
}
function finishQuest(){
 clearInterval(state.timer);
 const done=state.data[state.chapter].words.every(w=>(state.mastery[w.word]?.star||0)>0);
 if(!state.review&&done&&state.chapter+1<state.data.length)state.unlocked=Math.max(state.unlocked,state.chapter+2);
 save();
 screen(`<section class="panel center resultPanel"><div class="magicBook">🏆</div><div class="eyebrow">QUEST COMPLETE</div>
  <h1>🎉 GREAT JOB, ${esc(state.player)}!</h1><div class="bigScore">🎯 ${state.score}</div>
  <div class="resultStats"><span>🔥 Best Combo ${state.best}</span><span>⭐ ${totalStars()} Total Stars</span></div>
  <div class="notice">${state.review?"Review complete!":"Words with progress: "+state.data[state.chapter].words.filter(w=>(state.mastery[w.word]?.star||0)>0).length+"/"+state.data[state.chapter].words.length}</div>
  <div class="buttons"><button class="btn" id="again" type="button">PLAY AGAIN</button><button class="btn secondary" id="map" type="button">WORLD MAP</button><button class="btn secondary" id="menu" type="button">MAIN MENU</button></div>
 </section>`);
 $("#again").onclick=()=>startQuest(state.mode,state.review?buildReviewWords():null,state.review);
 $("#map").onclick=worldMap;$("#menu").onclick=menu;
}
function reviewQuest(){
 clearInterval(state.timer);
 const weak=buildReviewWords();
 if(!weak.length){screen(`<section class="panel center"><div class="magicBook">🌟</div><h1>ALL WORDS ARE STRONG!</h1><p class="sub">目前所有單字都已達 3 星。</p><div class="buttons"><button class="btn" id="back" type="button">MAIN MENU</button></div></section>`);$("#back").onclick=menu;return}
 const modes=["SPELL IT","PICTURE MATCH","WORD → MEANING","SCRAMBLE","SENTENCE QUEST","WORD ATTACK"];
 screen(`<section class="panel"><div class="eyebrow">REVIEW QUEST</div><h1>🔄 Strengthen Your Words</h1><p class="sub">優先複習尚未達 3 星的單字，共 ${weak.length} 個。</p>
  <div class="modegrid">${modes.map((m,j)=>`<button class="btn" data-mode="${j}" type="button">${m}</button>`).join("")}</div>
  <div class="buttons"><button class="btn secondary" id="back" type="button">MAIN MENU</button></div></section>`);
 document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>startQuest(+b.dataset.mode,weak,true));
 $("#back").onclick=menu;
}
function wordBook(){
 const rows=state.data.flatMap(c=>c.words).map(w=>`<div><strong>${esc(w.word)}</strong> <span class="small">— ${esc(w.meaning)}</span> <span class="stars">${stars(state.mastery[w.word]?.star||0)}</span></div>`).join("");
 screen(`<section class="panel"><div class="eyebrow">MY WORD BOOK</div><h1>📖 My Word Book</h1><p class="sub">66 words · your progress is saved automatically</p><div class="wordlist">${rows}</div><div class="buttons"><button class="btn secondary" id="back" type="button">MAIN MENU</button></div></section>`);
 $("#back").onclick=menu;
}
function achievements(){
 const all=state.data.flatMap(c=>c.words),mastered=all.filter(w=>(state.mastery[w.word]?.star||0)>=3).length;
 const discovered=all.filter(w=>(state.mastery[w.word]?.star||0)>0).length;
 const completed=Math.max(0,state.unlocked-1);
 screen(`<section class="panel"><div class="eyebrow">ACHIEVEMENTS</div><h1>🏆 Achievements</h1><div class="cards">
  <div class="card"><h3>FIRST STEP</h3><p>${discovered?"🏅 Unlocked":"🔒 Locked"}</p></div>
  <div class="card"><h3>WORLD EXPLORER</h3><p>${completed}/6 chapters unlocked</p></div>
  <div class="card"><h3>WORD MASTER</h3><p>${mastered}/66 words at 3 stars</p></div>
  <div class="card"><h3>COMBO HERO</h3><p>Best combo: ${state.best}</p></div>
 </div><div class="buttons"><button class="btn secondary" id="back" type="button">MAIN MENU</button></div></section>`);
 $("#back").onclick=menu;
}
async function boot(){
 load();
 try{const r=await fetch("data.json");state.data=await r.json()}catch(e){app.innerHTML='<div style="padding:40px;color:white">無法載入 data.json，請確認整個 WONDERS WORD QUEST 資料夾一起上傳到 GitHub Pages。</div>';return}
 menu();
}
boot();
