
const state={
  data:[], player:"", character:null, chapter:0, mode:null, q:0, total:10,
  score:0, combo:0, best:0, hints:2, timer:null, deadline:0,
  mastery:{}, unlocked:1, sound:true, selected:[], answer:"", review:false
};
const $=s=>document.querySelector(s);
const app=document.getElementById("app");
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function save(){try{localStorage.setItem("wwq_save",JSON.stringify({...state,timer:null,deadline:0}));}catch(e){}}
function load(){try{const x=JSON.parse(localStorage.getItem("wwq_save")||"null");if(x)Object.assign(state,x);}catch(e){}}
function stars(n){return "★".repeat(n)+"☆".repeat(3-n)}
function screen(html){app.innerHTML=`<div class="game"><div class="top"><div class="logo">⚔ WONDERS WORD QUEST</div><div class="stats"><span class="pill">⭐ ${state.score}</span><span class="pill">🔥 ${state.combo}</span></div></div><main class="main">${html}</main></div>`;}
function menu(){
  // First-time player setup: ask for a name before entering the adventure.
  if(!state.player || state.player==="YOU"){
    screen(`<section class="panel center"><h1 class="title">WONDERS<br>WORD QUEST</h1>
      <p class="sub">Welcome, young explorer!</p>
      <div class="notice">👤 Please enter your name / 請輸入你的名字</div>
      <input id="playerName" autocomplete="name" maxlength="20"
        style="display:block;width:min(520px,90%);margin:18px auto;padding:16px;border-radius:12px;font-size:24px;text-align:center"
        placeholder="Your Name">
      <div class="buttons"><button class="btn" id="saveName" type="button">START ADVENTURE / 開始冒險</button></div>
      <p class="small">名字會自動保存，之後進入遊戲會直接顯示。</p></section>`);
    const input=$("#playerName");
    input.focus();
    const start=()=>{
      const name=input.value.trim();
      if(!name){
        input.focus();
        input.placeholder="Please enter your name!";
        return;
      }
      state.player=name;
      save();
      chooseCharacter();
    };
    $("#saveName").onclick=start;
    input.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();start();}};
    return;
  }

  screen(`<section class="panel"><h1 class="title">WONDERS<br>WORD QUEST</h1><p class="sub">Your English adventure begins!</p>
   <div class="notice center">👤 ${esc(state.player)}　 ${state.character?("🧑 "+state.character):"尚未選擇角色"}</div>
   <div class="buttons">
   <button class="btn" id="continue" type="button">▶ CONTINUE ADVENTURE</button>
   <button class="btn secondary" id="map" type="button">🗺️ WORLD MAP</button>
   <button class="btn secondary" id="review" type="button">🔄 REVIEW QUEST</button>
   <button class="btn secondary" id="book" type="button">📖 MY WORD BOOK</button>
   <button class="btn secondary" id="ach" type="button">🏆 ACHIEVEMENTS</button>
   </div>
   <p class="small center">每題 30 秒｜完成關卡會自動保存｜可重玩並隨機出題</p></section>`);
  $("#continue").onclick=()=>state.character?worldMap():chooseCharacter();
  $("#map").onclick=worldMap;$("#review").onclick=reviewQuest;$("#book").onclick=wordBook;$("#ach").onclick=achievements;
}
function chooseCharacter(){
 screen(`<section class="panel"><h2 class="center">CHOOSE YOUR HERO</h2><p class="sub">Boy / Girl — equal abilities</p>
 <div class="cards">
 <div class="card center" id="boy"><div style="font-size:80px">🧑‍🎓</div><h2>BOY</h2><p>Brave Explorer</p></div>
 <div class="card center" id="girl"><div style="font-size:80px">👩‍🎓</div><h2>GIRL</h2><p>Brave Explorer</p></div>
 </div><div class="buttons"><button class="btn secondary" id="back">← BACK</button></div></section>`);
 $("#boy").onclick=()=>{state.character="BOY";save();worldMap()};$("#girl").onclick=()=>{state.character="GIRL";save();worldMap()};$("#back").onclick=menu;
}
function worldMap(){
 const cards=state.data.map((c,i)=>{
  const locked=i+1>state.unlocked; let total=c.words.length, got=c.words.filter(w=>(state.mastery[w.word]?.star||0)>0).length;
  let starsGot=c.words.reduce((a,w)=>a+(state.mastery[w.word]?.star||0),0);
  return `<div class="card ${locked?"locked":""}" data-i="${i}"><h3>CHAPTER ${i+1}</h3><h2>${esc(c.name)}</h2><p>${locked?"🔒 LOCKED":"🗺️ UNLOCKED"}</p><p>${got}/${total} words</p><div class="stars">${stars(Math.min(3,Math.round(starsGot/Math.max(1,total))))}</div></div>`;
 }).join("");
 screen(`<section class="panel"><h2 class="center">🗺️ WONDERS WORLD</h2><p class="sub">完成前一章後解鎖下一章</p><div class="cards">${cards}</div>
 <div class="buttons"><button class="btn secondary" id="back">← MAIN MENU</button></div></section>`);
 document.querySelectorAll("[data-i]").forEach(el=>el.onclick=()=>{let i=+el.dataset.i;if(i+1<=state.unlocked)chapter(i)});
 $("#back").onclick=menu;
}
function chapter(i){
 state.chapter=i; const c=state.data[i];
 const modes=["SPELL IT","PICTURE MATCH","WORD → MEANING","SCRAMBLE","SENTENCE QUEST","WORD ATTACK"];
 screen(`<section class="panel"><h2 class="center">CHAPTER ${i+1}</h2><h1 class="center">${esc(c.name)}</h1>
 <div class="notice center">📚 ${c.words.length} words　⏱️ 30 seconds / question</div>
 <div class="modegrid">${modes.map((m,j)=>`<button class="btn" data-mode="${j}">${["🔤","🖼️","📝","🧩","💬","⚡"][j]} ${m}</button>`).join("")}</div>
 <div class="buttons"><button class="btn secondary" id="back">← WORLD MAP</button></div></section>`);
 document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>startQuest(+b.dataset.mode));
 $("#back").onclick=worldMap;
}
function poolWords(){
 const c=state.data[state.chapter].words;
 if(!state.review)return c.slice();
 const weak=c.filter(w=>(state.mastery[w.word]?.star||0)<3);
 return weak.length?weak:c.slice();
}
function startQuest(mode){
 state.mode=mode;state.q=0;state.score=0;state.combo=0;state.total=Math.min(10,poolWords().length);state.review=false;nextQuestion();
}
function chooseWords(){
 let a=poolWords();a.sort(()=>Math.random()-.5);return a.slice(0,state.total);
}
function shuffle(a){return a.map(x=>[Math.random(),x]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);}
function distractors(word,n=3){
 const all=state.data.flatMap(c=>c.words).map(x=>x.word).filter(x=>x!==word);
 return shuffle([...new Set(all)]).slice(0,n);
}
function questionFor(w){
 if(state.mode===0)return {title:"SPELL IT",prompt:`Spell this word: <strong>${esc(w.meaning)}</strong>`,kind:"input",answerType:"word"};
 if(state.mode===1)return {title:"PICTURE MATCH",prompt:`Which word matches the picture?`,kind:"pic",answerType:"word"};
 if(state.mode===2)return {title:"WORD → MEANING",prompt:`What does <strong>${esc(w.word)}</strong> mean?`,kind:"meaning",answerType:"meaning"};
 if(state.mode===3)return {title:"SCRAMBLE",prompt:"Put the letters in the correct order.",kind:"scramble",answerType:"word"};
 if(state.mode===4)return {title:"SENTENCE QUEST",prompt:`Choose the word that best completes this sentence:<br><strong>“In the story, the characters used the word <em>${esc(w.meaning)}</em> to describe the situation.”</strong>`,kind:"choice",answerType:"word"};
 return {title:"WORD ATTACK",prompt:`Quick! What is the meaning of <strong>${esc(w.word)}</strong>?`,kind:"meaning",answerType:"meaning"};
}
function nextQuestion(){
 clearInterval(state.timer);
 if(state.q>=state.total){finishQuest();return}
 if(state.q===0)state.words=chooseWords();
 const w=state.words[state.q];state.current=w;
 const q=questionFor(w);
 state.currentAnswerType=q.answerType;
 let body="";
 if(q.kind==="pic") body=`<img class="picture" src="${w.image}" alt="${esc(w.word)}">`;
 if(q.kind==="input") body=`<input id="answer" autocomplete="off" autocapitalize="none" style="display:block;width:min(600px,95%);margin:15px auto;padding:16px;border-radius:12px;font-size:24px;text-align:center" placeholder="Type the word">
 <div class="buttons"><button class="btn" id="submitAnswer" type="button">CONFIRM / 確定</button></div>`;
 if(q.kind==="scramble"){
   const letters=shuffle([...w.word.toUpperCase().replace(/[^A-Z]/g,"")]); state.scrambled=letters;
   body=`<div class="scramble">${letters.map((l,i)=>`<button class="letter" data-letter="${i}">${esc(l)}</button>`).join("")}</div><div class="center"><strong id="typed"></strong></div><div class="buttons"><button class="btn" id="submitScramble" type="button">CONFIRM / 確定</button></div>`;
 }
 if(q.kind==="meaning"||q.kind==="choice"||q.kind==="pic"){
   let opts;
   if(q.kind==="pic"){
     // Picture Match: choose among English words.
     opts=shuffle([w.word,...distractors(w.word)]);
   }else if(q.answerType==="word"){
     // Sentence Quest: choose among English words.
     opts=shuffle([w.word,...distractors(w.word)]);
   }else{
     // Word → Meaning / Word Attack: choose among Chinese meanings.
     const lookup=state.data.flatMap(c=>c.words);
     opts=shuffle([w.meaning,...distractors(w.word).map(x=>lookup.find(z=>z.word===x)?.meaning||x)]);
   }
   body+=`<div class="answers">${opts.map(o=>`<button class="btn answer" type="button" data-answer="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
 }
 screen(`<section class="panel"><div class="row"><span class="pill">${q.title}</span><span class="pill">Q ${state.q+1}/${state.total}</span></div>
 <div class="timer"><div id="bar"></div></div><div class="question">${q.prompt}</div>${body}<div id="feedback" class="feedback"></div>
 <div class="buttons"><button class="btn secondary" id="quit">QUIT QUEST</button></div></section>`);
 $("#quit").onclick=()=>{clearInterval(state.timer);chapter(state.chapter)};
 if(q.kind==="input"){
   const input=$("#answer");
   input.focus();
   input.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();submit(input.value)}};
   const submitBtn=$("#submitAnswer");
   if(submitBtn) submitBtn.onclick=()=>submit(input.value);
 }
 document.querySelectorAll(".answer").forEach(b=>b.onclick=()=>submit(b.dataset.answer));
 if(q.kind==="scramble"){
   state.answer="";
   document.querySelectorAll(".letter").forEach(b=>b.onclick=()=>{let i=+b.dataset.letter;if(b.disabled)return;b.disabled=true;state.answer+=state.scrambled[i];$("#typed").textContent=state.answer;});
   $("#submitScramble").onclick=()=>submit(state.answer);
 }
 startTimer();
}
function startTimer(){
 state.deadline=Date.now()+30000;
 state.timer=setInterval(()=>{
   const left=Math.max(0,state.deadline-Date.now()),pct=left/30000*100;
   const bar=$("#bar");if(bar)bar.style.width=pct+"%";
   if(left<=0){clearInterval(state.timer);submit("",true)}
 },100);
}
function submit(raw,timeout=false){
 if(state.lock)return;state.lock=true;clearInterval(state.timer);
 const w=state.current;
 const norm=x=>String(x||"").trim().toLowerCase().replace(/\s+/g," ");
 const expected=state.currentAnswerType==="meaning"?w.meaning:w.word;
 const correct=norm(raw)===norm(expected);
 const fb=$("#feedback");
 if(correct){state.combo++;state.best=Math.max(state.best,state.combo);state.score+=10+Math.min(20,state.combo);fb.innerHTML="✅ CORRECT!";fb.style.color="#78e08f";
   const old=state.mastery[w.word]?.star||0; const star=state.combo>=4?3:state.combo>=2?2:1; state.mastery[w.word]={star:Math.max(old,star),seen:(state.mastery[w.word]?.seen||0)+1};
 }else{state.combo=0;fb.innerHTML=timeout?"⏰ TIME'S UP!":"❌ TRY AGAIN NEXT TIME";fb.style.color="#ff8a8a";
   state.mastery[w.word]={star:state.mastery[w.word]?.star||0,seen:(state.mastery[w.word]?.seen||0)+1};
 }
 save();
 setTimeout(()=>{state.q++;state.lock=false;nextQuestion()},750);
}
function finishQuest(){
 clearInterval(state.timer);
 const done=state.data[state.chapter].words.every(w=>(state.mastery[w.word]?.star||0)>0);
 if(done && state.chapter+1<state.data.length)state.unlocked=Math.max(state.unlocked,state.chapter+2);
 save();
 screen(`<section class="panel center"><h1>🎉 QUEST COMPLETE!</h1><p class="question">Score: ${state.score}</p><p>Combo Best: ${state.best}</p><div class="notice">⭐ Words with progress: ${state.data[state.chapter].words.filter(w=>(state.mastery[w.word]?.star||0)>0).length}/${state.data[state.chapter].words.length}</div>
 <div class="buttons"><button class="btn" id="again">PLAY AGAIN</button><button class="btn secondary" id="map">WORLD MAP</button><button class="btn secondary" id="menu">MAIN MENU</button></div></section>`);
 $("#again").onclick=()=>chapter(state.chapter);$("#map").onclick=worldMap;$("#menu").onclick=menu;
}
function reviewQuest(){
 state.review=true;
 const weak=state.data.flatMap(c=>c.words).filter(w=>(state.mastery[w.word]?.star||0)<3);
 if(!weak.length){screen(`<section class="panel center"><h1>🌟 ALL WORDS ARE STRONG!</h1><p>目前所有單字都已達 3 星。</p><div class="buttons"><button class="btn" id="back">MAIN MENU</button></div></section>`);$("#back").onclick=menu;return}
 const modes=["SPELL IT","PICTURE MATCH","WORD → MEANING","SCRAMBLE","SENTENCE QUEST","WORD ATTACK"];
 screen(`<section class="panel"><h2>🔄 REVIEW QUEST</h2><p class="sub">優先複習尚未達 3 星的單字，共 ${weak.length} 個。</p><div class="modegrid">${modes.map((m,j)=>`<button class="btn" data-mode="${j}">${m}</button>`).join("")}</div><div class="buttons"><button class="btn secondary" id="back">MAIN MENU</button></div></section>`);
 document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{state.mode=+b.dataset.mode;state.chapter=0;state.q=0;state.score=0;state.combo=0;state.total=Math.min(10,weak.length);state.words=shuffle(weak).slice(0,state.total);state.review=true;nextQuestion()});
 $("#back").onclick=menu;
}
function wordBook(){
 const rows=state.data.flatMap(c=>c.words).map(w=>`<div>${esc(w.word)} <span class="small">— ${esc(w.meaning)}</span>　<span class="stars">${stars(state.mastery[w.word]?.star||0)}</span></div>`).join("");
 screen(`<section class="panel"><h2>📖 MY WORD BOOK</h2><p class="sub">66 words｜你的學習進度會自動保存</p><div class="wordlist">${rows}</div><div class="buttons"><button class="btn secondary" id="back">MAIN MENU</button></div></section>`);
 $("#back").onclick=menu;
}
function achievements(){
 const mastered=state.data.flatMap(c=>c.words).filter(w=>(state.mastery[w.word]?.star||0)>=3).length;
 const completed=state.data.filter((c,i)=>i<state.unlocked-1).length;
 screen(`<section class="panel"><h2>🏆 ACHIEVEMENTS</h2><div class="cards">
 <div class="card"><h3>FIRST STEP</h3><p>${Object.keys(state.mastery).length? "🏅 Unlocked":"🔒 Locked"}</p></div>
 <div class="card"><h3>WORLD EXPLORER</h3><p>${completed}/6 chapters unlocked</p></div>
 <div class="card"><h3>WORD MASTER</h3><p>${mastered}/66 words at 3 stars</p></div>
 <div class="card"><h3>COMBO HERO</h3><p>Best combo: ${state.best}</p></div>
 </div><div class="buttons"><button class="btn secondary" id="back">MAIN MENU</button></div></section>`);
 $("#back").onclick=menu;
}
async function boot(){
 load();
 try{
   const r=await fetch("data.json");state.data=await r.json();
 }catch(e){
   app.innerHTML='<div style="padding:40px;color:white">無法載入 data.json，請確認整個 WONDERS WORD QUEST 資料夾一起上傳到 GitHub Pages。</div>';return;
 }
 menu();
}
boot();
