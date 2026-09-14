/* =========================================================
   WONDERS WORD QUEST — V9.1
   Complete replacement for js/app.js
   ========================================================= */

const SAVE_KEY = "wwq_v8_save";
const QUESTION_TIME = 30;

const MODES = [
  "picture",
  "meaning",
  "spell",
  "scramble",
  "sentence",
  "attack"
];

let WORDS = {};
let session = null;

let state = {
  player: "",
  character: "boy",
  unlocked: 1,
  completed: {},
  stars: {},
  mastery: {},
  score: 0,
  hints: 3,
  achievements: [],
  bossDefeated: false
};

const $ = (selector) => document.querySelector(selector);

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [
      result[j],
      result[i]
    ];
  }

  return result;
}

function normalizeWord(item) {
  if (Array.isArray(item)) {
    return {
      w: item[0],
      m: item[1],
      v: item[2] || "🔤",
      s: item[3] || ""
    };
  }

  return item || {
    w: "",
    m: "",
    v: "🔤",
    s: ""
  };
}

function wordEN(item) {
  return normalizeWord(item).w;
}

function wordZH(item) {
  return normalizeWord(item).m;
}

function chapterNames() {
  return Object.keys(WORDS);
}

function chapterWords(chapterIndex) {
  const name = chapterNames()[chapterIndex - 1];

  if (!name) return [];

  return WORDS[name].map(normalizeWord);
}

function allWords() {
  return chapterNames().flatMap(
    name => WORDS[name].map(normalizeWord)
  );
}

function save() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(state)
    );
  } catch (error) {
    console.warn("Save unavailable:", error);
  }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);

    if (!raw) return;

    const saved = JSON.parse(raw);

    state = {
      ...state,
      ...saved,

      completed:
        saved.completed || {},

      stars:
        saved.stars || {},

      mastery:
        saved.mastery || {},

      achievements:
        saved.achievements || []
    };

  } catch (error) {
    console.warn("Load unavailable:", error);
  }
}

function masteryKey(word) {
  return String(wordEN(word))
    .toLowerCase();
}

function getMastery(word) {
  const key = masteryKey(word);

  return state.mastery[key] || {
    correct: 0,
    wrong: 0,
    attempts: 0,
    bestTime: 999,
    star: 0
  };
}

function updateMastery(
  word,
  correct,
  elapsed
) {
  const key = masteryKey(word);

  const mastery = getMastery(word);

  mastery.attempts++;

  if (correct) {
    mastery.correct++;

    mastery.bestTime =
      Math.min(
        mastery.bestTime,
        elapsed
      );
  } else {
    mastery.wrong++;
  }

  state.mastery[key] = mastery;
}

function renderTop() {
  const score = $(".score");

  if (score) {
    score.textContent =
      `SCORE ${state.score}`;
  }
}

function setScreen(html) {
  const game = $(".game");

  if (!game) return;

  game.innerHTML = html;

  renderTop();
}

function titleBlock(
  title,
  subtitle = ""
) {
  return `
    <div class="hero-title">
      ${esc(title)}
    </div>

    ${
      subtitle
        ? `
          <div class="subtitle">
            ${esc(subtitle)}
          </div>
        `
        : ""
    }
  `;
}

function boot() {
  load();

  renderHome();
}

function renderHome() {

  setScreen(`

    <div class="top">

      <div class="logo">
        WONDERS WORD QUEST
      </div>

      <div class="score">
        SCORE ${state.score}
      </div>

    </div>


    <div class="content">

      ${titleBlock(
        "WONDERS WORD QUEST",
        "Your English Word Adventure"
      )}


      <div class="panel">

        <p>
          Enter the Wonders World
          and begin your word quest!
        </p>


        <div class="menu-row">

          <button
            class="primary"
            onclick="showName()"
          >
            ▶ START ADVENTURE
          </button>


          <button
            class="secondary"
            onclick="showWorldMap()"
          >
            🗺️ WORLD MAP
          </button>

        </div>


        <div class="menu-row">

          <button
            class="secondary"
            onclick="showReview()"
          >
            🔄 REVIEW QUEST
          </button>


          <button
            class="secondary"
            onclick="showBook()"
          >
            📖 MY WORD BOOK
          </button>

        </div>

      </div>

    </div>


    <div class="footer">
      66 WORDS • 6 CHAPTERS • 6 GAME MODES
    </div>

  `);
}

function showName() {

  setScreen(`

    <div class="top">

      <div class="logo">
        WONDERS WORD QUEST
      </div>

      <div class="score">
        SCORE ${state.score}
      </div>

    </div>


    <div class="content">

      ${titleBlock(
        "WHO ARE YOU?",
        "Enter your name and choose your hero."
      )}


      <div class="panel">

        <input
          id="playerName"
          class="name"
          maxlength="20"
          placeholder="YOUR NAME"
        />


        <div class="gender-grid">

          <button
            id="boyBtn"
            class="gender ${
              state.character === "boy"
                ? "selected"
                : ""
            }"
            onclick="chooseCharacter('boy')"
          >
            <span class="check">♂</span>
            <strong>BOY</strong>
          </button>


          <button
            id="girlBtn"
            class="gender ${
              state.character === "girl"
                ? "selected"
                : ""
            }"
            onclick="chooseCharacter('girl')"
          >
            <span class="check">♀</span>
            <strong>GIRL</strong>
          </button>

        </div>


        <button
          class="primary"
          onclick="startAdventure()"
        >
          START QUEST →
        </button>


        <button
          class="secondary"
          onclick="renderHome()"
        >
          ← BACK
        </button>

      </div>

    </div>

  `);
}

function chooseCharacter(character) {

  state.character = character;

  const boy =
    $("#boyBtn");

  const girl =
    $("#girlBtn");

  if (boy) {
    boy.classList.toggle(
      "selected",
      character === "boy"
    );
  }

  if (girl) {
    girl.classList.toggle(
      "selected",
      character === "girl"
    );
  }
}

function startAdventure() {

  const input =
    $("#playerName");

  const name =
    input
      ? input.value.trim()
      : "";

  if (name) {
    state.player = name;
  }

  if (!state.player) {
    state.player = "PLAYER";
  }

  save();

  showWorldMap();
}

function showWorldMap() {

  const names =
    chapterNames();

  const cards =
    names.map((name, index) => {

      const chapter =
        index + 1;

      const unlocked =
        chapter <=
        Math.max(
          1,
          state.unlocked
        );

      const stars =
        state.stars[chapter] || 0;

      const completed =
        !!state.completed[chapter];

      const displayName =
        name.replace(
          /^Chapter \d+\s*[—-]\s*/,
          ""
        );

      return `

        <button
          class="chapter ${
            unlocked
              ? "ready"
              : "locked"
          }"

          ${
            unlocked
              ? `onclick="showChapter(${chapter})"`
              : "disabled"
          }
        >

          <div class="tag">
            CHAPTER ${chapter}
          </div>


          <h3>
            ${esc(displayName)}
          </h3>


          <div class="stars">
            ${
              "★".repeat(stars)
            }${
              "☆".repeat(3 - stars)
            }
          </div>


          <div class="meta">

            ${
              completed
                ? "COMPLETED"
                : unlocked
                  ? "READY"
                  : "LOCKED"
            }

          </div>

        </button>

      `;
    }).join("");


  setScreen(`

    <div class="top">

      <div class="logo">
        WORLD MAP
      </div>

      <div class="score">
        SCORE ${state.score}
      </div>

    </div>


    <div class="content">

      ${titleBlock(
        "WONDERS WORLD",
        "Choose a chapter. Replay completed chapters anytime."
      )}


      <div class="chapter-grid">
        ${cards}
      </div>


      <div class="menu-row">

        <button
          class="secondary"
          onclick="showReview()"
        >
          🔄 REVIEW QUEST
        </button>


        <button
          class="secondary"
          onclick="showBook()"
        >
          📖 WORD BOOK
        </button>


        <button
          class="secondary"
          onclick="renderHome()"
        >
          ← HOME
        </button>

      </div>

    </div>

  `);
}

function modeIcon(mode) {

  return {

    picture: "🖼️",

    meaning: "📝",

    spell: "🔤",

    scramble: "🧩",

    sentence: "💬",

    attack: "⚡"

  }[mode] || "🎮";
}

function modeLabel(mode) {

  return {

    picture:
      "PICTURE MATCH",

    meaning:
      "WORD → MEANING",

    spell:
      "SPELL IT",

    scramble:
      "SCRAMBLE",

    sentence:
      "SENTENCE QUEST",

    attack:
      "WORD ATTACK"

  }[mode] ||
    String(mode).toUpperCase();
}

function showChapter(chapter) {

  const words =
    chapterWords(chapter);

  const name =
    chapterNames()[chapter - 1] ||
    `Chapter ${chapter}`;

  const displayName =
    name.replace(
      /^Chapter \d+\s*[—-]\s*/,
      ""
    );


  setScreen(`

    <div class="top">

      <div class="logo">
        CHAPTER ${chapter}
      </div>

      <div class="score">
        SCORE ${state.score}
      </div>

    </div>


    <div class="content">

      ${titleBlock(
        displayName,
        `${words.length} words • ${MODES.length} game modes`
      )}


      <div class="panel">

        <div class="mode-grid">

          ${MODES.map(mode => `

            <div class="mode">

              <div class="mode-badge">
                ${modeIcon(mode)}
              </div>

              <strong>
                ${modeLabel(mode)}
              </strong>

            </div>

          `).join("")}

        </div>


        <p>
          Every quest randomizes the words,
          question types, and choices.
        </p>


        <div class="menu-row">

          <button
            class="primary"
            onclick="startQuest(${chapter}, false)"
          >
            ▶ START QUEST
          </button>


          <button
            class="secondary"
            onclick="showWorldMap()"
          >
            ← MAP
          </button>

        </div>

      </div>

    </div>

  `);
}

function chooseNextMode() {

  const previous =
    session.lastMode;

  const candidates =
    MODES.filter(
      mode => mode !== previous
    );

  const mode =
    candidates[
      Math.floor(
        Math.random() *
        candidates.length
      )
    ];

  session.lastMode =
    mode;

  return mode;
}

function chooseNextMode() {
    ...
}


function renderFeedback(
  correct,
  target,
  timedOut
) {

  const word =
    normalizeWord(
      session.words[
        session.q
      ]
    );


  let message =
    "TRY AGAIN!";


  if (timedOut) {

    message =
      "TIME'S UP!";

  } else if (correct) {

    message =
      "CORRECT!";

  }


  setScreen(`

    <div class="top">

      <div class="logo">
        ${esc(
          modeLabel(
            session.mode
          )
        )}
      </div>


      <div class="score">
        SCORE ${state.score}
      </div>

    </div>


    <div class="content">

      <div
        class="panel feedback ${
          correct
            ? "result"
            : ""
        }"
      >

        <div class="big">
          ${message}
        </div>


        <div class="word">
          ${esc(target)}
        </div>


        <div class="small">
          ${esc(word.m)}
        </div>


        ${
          !correct
            ? `
              <p>
                The correct answer is
                <strong>
                  ${esc(target)}
                </strong>.
              </p>
            `
            : ""
        }


        <button
          class="primary"
          onclick="nextQuestion()"
        >
          NEXT →
        </button>

      </div>

    </div>

  `);
}


/* =========================================================
   QUEST 完成
========================================================= */

function finishQuest() {

  clearInterval(
    session.timer
  );


  const total =
    session.words.length;


  const ratio =
    total
      ? session.correct / total
      : 0;


  /*
    星星規則

    1★ = 完成
    2★ = 70% 以上
    3★ = 90% 以上
          且速度夠快
  */

  let stars = 1;


  if (
    ratio >= 0.7
  ) {

    stars = 2;

  }


  if (
    ratio >= 0.9 &&
    session.words.every(
      word =>
        getMastery(word)
          .bestTime <= 20
    )
  ) {

    stars = 3;

  }


  /*
    保留歷史最高星數
  */

  const oldStars =
    state.stars[
      session.chapter
    ] || 0;


  state.stars[
    session.chapter
  ] =
    Math.max(
      oldStars,
      stars
    );


  /*
    完成章節
  */

  state.completed[
    session.chapter
  ] = true;


  /*
    解鎖下一章
  */

  if (
    session.chapter <
    chapterNames().length
  ) {

    state.unlocked =
      Math.max(
        state.unlocked,
        session.chapter + 1
      );

  }


  /*
    成就
  */

  if (
    stars >= 3 &&
    !state.achievements.includes(
      "THREE_STAR"
    )
  ) {

    state.achievements.push(
      "THREE_STAR"
    );

  }


  if (
    session.correct === total &&
    !state.achievements.includes(
      "PERFECT"
    )
  ) {

    state.achievements.push(
      "PERFECT"
    );

  }


  save();


  /*
    下一章按鈕
  */

  let nextButton = "";


  if (
    session.chapter <
    chapterNames().length
  ) {

    nextButton = `

      <button
        class="primary"
        onclick="
          showChapter(
            ${session.chapter + 1}
          )
        "
      >
        NEXT CHAPTER →
      </button>

    `;

  } else {

    nextButton = `

      <button
        class="primary"
        onclick="showWorldMap()"
      >
        🏆 WORLD MAP
      </button>

    `;

  }


  setScreen(`

    <div class="top">

      <div class="logo">
        QUEST COMPLETE
      </div>


      <div class="score">
        SCORE ${state.score}
      </div>

    </div>


    <div class="content">

      <div class="panel result">

        <div class="big">
          QUEST COMPLETE!
        </div>


        <div class="stars">

          ${
            "★".repeat(stars)
          }${
            "☆".repeat(
              3 - stars
            )
          }

        </div>


        <p>
          ${session.correct}
          /
          ${total}
          correct
        </p>


        <p>
          1★ I came •
          2★ I can •
          3★ I'm really strong!
        </p>


        <div class="menu-row">

          ${nextButton}


          <button
            class="secondary"
            onclick="
              showChapter(
                ${session.chapter}
              )
            "
          >
            ↻ PLAY AGAIN
          </button>


          <button
            class="secondary"
            onclick="showWorldMap()"
          >
            🗺️ MAP
          </button>

        </div>

      </div>

    </div>

  `);
}


/* =========================================================
   REVIEW QUEST
========================================================= */

function showReview() {

  /*
    找出需要加強的單字
  */

  const weak =
    allWords()
      .filter(word => {

        const mastery =
          getMastery(word);


        return (
          mastery.wrong > 0 ||
          mastery.star < 2 ||
          mastery.bestTime > 20
        );

      })
      .sort(
        (a, b) => {

          const A =
            getMastery(a);

          const B =
            getMastery(b);


          /*
            優先順序：

            ① 錯很多
            ② 正確率較低
            ③ 花費時間較久
          */

          return (
            (B.wrong - A.wrong) ||
            (A.correct - B.correct) ||
            (B.bestTime - A.bestTime)
          );

        }
      )
      .slice(
        0,
        12
      );


  let rows = "";


  if (
    weak.length
  ) {

    rows =
      weak
        .map(word => {

          const mastery =
            getMastery(word);


          return `

            <div class="question">

              <strong>
                ${esc(
                  wordEN(word)
                )}
              </strong>


              <br>


              <span class="small">

                ${esc(
                  wordZH(word)
                )}

                •

                ${mastery.correct}
                /
                ${mastery.attempts}
                correct

              </span>

            </div>

          `;

        })
        .join("");


  } else {

    rows = `

      <div class="question">

        <strong>
          No weak words yet!
        </strong>


        <br>


        <span class="small">
          Keep adventuring and
          build your word power!
        </span>

      </div>

    `;

  }


  setScreen(`

    <div class="top">

      <div class="logo">
        REVIEW QUEST
      </div>


      <div class="score">
        SCORE ${state.score}
      </div>

    </div>


    <div class="content">

      ${titleBlock(
        "REVIEW QUEST",
        "Practice words that need more attention."
      )}


      <div class="panel">

        ${rows}

      </div>


      <div class="menu-row">

        ${
          chapterNames()
            .map(
              (_, index) => `

                <button
                  class="secondary"
                  onclick="
                    startQuest(
                      ${index + 1},
                      true
                    )
                  "
                >
                  REVIEW CH.${index + 1}
                </button>

              `
            )
            .join("")
        }

      </div>


      <button
        class="secondary"
        onclick="showWorldMap()"
      >
        ← MAP
      </button>

    </div>

  `);
}


/* =========================================================
   MY WORD BOOK
========================================================= */

function showBook() {

  const rows =
    allWords()
      .map(word => {

        const mastery =
          getMastery(word);


        /*
          Word Book 顯示最高星數
        */

        const stars =
          Math.min(
            3,
            mastery.star || 0
          );


        return `

          <div class="question">

            <strong>
              ${esc(
                wordEN(word)
              )}
            </strong>


            —

            ${esc(
              wordZH(word)
            )}


            <span class="stars">

              ${
                "★".repeat(stars)
              }${
                "☆".repeat(
                  3 - stars
                )
              }

            </span>

          </div>

        `;

      })
      .join("");


  setScreen(`

    <div class="top">

      <div class="logo">
        MY WORD BOOK
      </div>


      <div class="score">
        SCORE ${state.score}
      </div>

    </div>


    <div class="content">

      ${titleBlock(
        "MY WORD BOOK",
        "Your 66-word collection"
      )}


      <div class="panel">

        ${rows}

      </div>


      <button
        class="secondary"
        onclick="showWorldMap()"
      >
        ← MAP
      </button>

    </div>

  `);
}


/* =========================================================
   儲存離開前再存一次
========================================================= */

window.addEventListener(
  "beforeunload",
  () => {

    if (
      session &&
      session.timer
    ) {

      clearInterval(
        session.timer
      );

    }


    save();

  }
);

/* =========================================================
   WONDERS WORD QUEST
   V9.1 — DATA INITIALIZATION
========================================================= */

fetch("data.json")

  .then(response => {

    if (!response.ok) {

      throw new Error(
        `data.json HTTP ${response.status}`
      );

    }

    return response.json();

  })


  .then(data => {

    /*
      載入 6 個 Chapter
    */

    WORDS = data;


    /*
      確認資料是否正常
    */

    console.log(
      "WONDERS WORD QUEST DATA LOADED"
    );


    console.log(
      "Chapters:",
      chapterNames().length
    );


    console.log(
      "Words:",
      allWords().length
    );


    /*
      啟動遊戲
    */

    boot();

  })


  .catch(error => {

    console.error(
      "WONDERS WORD QUEST LOAD ERROR:",
      error
    );


    /*
      如果 data.json 找不到，
      顯示明確錯誤
    */

    document.body.innerHTML = `

      <div
        style="
          padding:40px;
          font-family:sans-serif;
          text-align:center;
        "
      >

        <h2>
          WONDERS WORD QUEST
        </h2>


        <p>
          ⚠️ Unable to load data.json
        </p>


        <p>
          ${esc(error.message)}
        </p>


        <p>
          Please make sure
          <strong>data.json</strong>
          is in the same folder as
          <strong>index.html</strong>.
        </p>

      </div>

    `;

  });
