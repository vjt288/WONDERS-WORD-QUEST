/* =========================================================
   WONDERS WORD QUEST V9
   QUESTION ENGINE
   - 6 real game modes
   - random word + random mode + random options
   - no same mode twice in a row
   - contextual sentence questions
   - visual clue questions
   - 30-second timer
   - replay / review / mastery preserved
========================================================= */

const DATA_URL = "data.json";
const SAVE_KEY = "wwq_v9_save";

let DATA = null;
let session = null;

const MODES = [
  "picture",
  "meaning",
  "spell",
  "scramble",
  "sentence",
  "attack"
];

const MODE_INFO = {
  picture: ["🖼️ PICTURE MATCH", "看圖像線索 → 找單字"],
  meaning: ["📝 WORD → MEANING", "英文 → 選中文意思"],
  spell: ["🔤 SPELL IT", "中文提示 → 拼出英文"],
  scramble: ["🧩 SCRAMBLE", "重新排列字母"],
  sentence: ["💬 SENTENCE QUEST", "英文情境句 → 選正確單字"],
  attack: ["⚡ WORD ATTACK", "限時快速反應"]
};

let state = {
  name: "",
  gender: "",
  score: 0,
  unlocked: 1,
  stars: {},
  mastery: {},
  chaptersDone: {}
};

const $ = (selector) => document.querySelector(selector);

function shuffle(array) {
  const a = [...array];

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
}

function wordEN(word) {
  return typeof word === "object" ? word.w : word[0];
}

function wordZH(word) {
  return typeof word === "object" ? word.m : word[1];
}

function wordVisual(word) {
  return typeof word === "object" && word.v
    ? word.v
    : "🔤";
}

function wordSentence(word) {
  return typeof word === "object" && word.s
    ? word.s
    : `Choose the word that means "${wordZH(word)}".`;
}

function esc(value) {
  return String(value).replace(
    /[&<>"']/g,
    (match) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[match]
  );
}

function save() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(state)
    );
  } catch (error) {
    console.warn("Save failed.", error);
  }
}

function load() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(SAVE_KEY)
    );

    if (saved) {
      state = {
        ...state,
        ...saved
      };
    }

  } catch (error) {
    console.warn("Load failed.", error);
  }
}

function starText(number) {
  return (
    "★".repeat(number) +
    "☆".repeat(
      Math.max(0, 3 - number)
    )
  );
}

function render(html) {

  const app = $("#app");

  if (app) {

    app.innerHTML =
      `<div class="shell">
        <div class="game">
          ${html}
        </div>
      </div>`;
  }
}

function renderTop(
  title = "WONDERS WORD QUEST"
) {

  return `
    <div class="top">

      <div class="logo">
        ${title}
      </div>

      <div class="score">
        SCORE ${state.score}
      </div>

    </div>
  `;
}

function menuBtn() {

  return `
    <button
      class="secondary"
      onclick="showMap()"
    >
      ← MENU
    </button>
  `;
}

/* =========================================================
   HOME
========================================================= */

function boot() {

  load();

  render(`

    <div class="content center">

      <div class="hero-title">
        WONDERS<br>
        WORD QUEST
      </div>

      <div class="subtitle">
        A 16-BIT ENGLISH RPG ADVENTURE · V9
      </div>

      <div
        class="panel"
        style="
          max-width:800px;
          margin:35px auto
        "
      >

        <h2>
          YOUR HERO
        </h2>

        <input
          id="name"
          class="name"
          placeholder="ENTER YOUR NAME"
          value="${esc(state.name)}"
        >

        <div class="gender-grid">

          <button
            id="boy"
            class="gender ${
              state.gender === "boy"
                ? "selected"
                : ""
            }"
            onclick="
              chooseGender('boy')
            "
          >
            👦 BOY

            ${
              state.gender === "boy"
                ? `
                  <span class="check">
                    ✓ SELECTED
                  </span>
                `
                : ""
            }

          </button>

          <button
            id="girl"
            class="gender ${
              state.gender === "girl"
                ? "selected"
                : ""
            }"
            onclick="
              chooseGender('girl')
            "
          >
            👧 GIRL

            ${
              state.gender === "girl"
                ? `
                  <span class="check">
                    ✓ SELECTED
                  </span>
                `
                : ""
            }

          </button>

        </div>

        <div
          id="heroStatus"
          class="small"
        >
          ${
            state.gender
              ? `Selected: ${state.gender.toUpperCase()}`
              : "Choose your hero"
          }
        </div>

        <button
          class="primary"
          onclick="startAdventure()"
        >
          START ADVENTURE ▶
        </button>

      </div>

    </div>
  `);
}

function chooseGender(gender) {

  state.gender = gender;

  save();

  boot();
}

function startAdventure() {

  const input = $("#name");

  const name = input
    ? input.value.trim()
    : "";

  if (!name || !state.gender) {

    alert(
      "Please enter your name and choose BOY or GIRL."
    );

    return;
  }

  state.name = name;

  save();

  showMap();
}

/* =========================================================
   WORLD MAP
========================================================= */

function showMap() {

  render(`

    ${renderTop("🗺️ WONDERS WORLD")}

    <div class="content">

      <div class="quest-head">

        <h1>
          WONDERS WORLD
        </h1>

        <div class="tag">
          ${
            state.gender === "boy"
              ? "👦"
              : "👧"
          }

          ${esc(state.name)}
        </div>

      </div>

      <div class="chapter-grid">

        ${DATA.chapters
          .map((chapter) => {

            const unlocked =
              chapter.id <= state.unlocked;

            const complete =
              !!state.chaptersDone[
                chapter.id
              ];

            const star =
              state.stars[
                chapter.id
              ] || 0;

            return `

              <button

                class="chapter ${
                  unlocked
                    ? "ready"
                    : "locked"
                }"

                ${
                  unlocked
                    ? `
                      onclick="
                        openChapter(
                          ${chapter.id}
                        )
                      "
                    `
                    : "disabled"
                }

              >

                <h3>
                  CHAPTER ${chapter.id}
                </h3>

                <div>
                  ${esc(chapter.title)}
                </div>

                <div class="stars">
                  ${starText(star)}
                </div>

                <div class="meta">

                  ${chapter.words.length}
                  WORDS

                  ·

                  ${
                    complete
                      ? "✓ COMPLETE"
                      : unlocked
                      ? "READY"
                      : "🔒 LOCKED"
                  }

                </div>

              </button>

            `;

          })
          .join("")}

      </div>

      <div
        class="menu-row"
        style="margin-top:22px"
      >

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

        <button
          class="secondary"
          onclick="boot()"
        >
          👤 HERO
        </button>

      </div>

      <div class="footer">
        V9 · 每次練習都會重新抽單字、題型與選項。
      </div>

    </div>
  `);
}

/* =========================================================
   CHAPTER
========================================================= */

function openChapter(id) {

  const chapter =
    DATA.chapters.find(
      (item) => item.id === id
    );

  if (!chapter) return;

  render(`

    ${renderTop()}

    <div class="content">

      <div class="quest-head">

        ${menuBtn()}

        <div>

          <h1>
            CHAPTER ${id}
          </h1>

          <div class="tag">
            ${esc(chapter.title)}
          </div>

        </div>

      </div>

      <div class="panel center">

        <h2>
          ${esc(
            chapter.theme ||
            chapter.title
          )}
        </h2>

        <p>
          本章 ${chapter.words.length}
          個單字。<br>
          每次挑戰都會重新亂數。
        </p>

        <div class="mode-grid">

          ${shuffle(MODES)
            .map(
              (mode) => `

                <div
                  class="panel mode"
                >

                  <div class="mode-badge">
                    ${MODE_INFO[mode][0]}
                  </div>

                  <small>
                    ${MODE_INFO[mode][1]}
                  </small>

                </div>

              `
            )
            .join("")}

        </div>

        <button
          class="primary"
          onclick="
            startQuest(${id})
          "
        >
          START RANDOM QUEST ▶
        </button>

      </div>

    </div>

  `);
}

/* =========================================================
   WEAK WORDS
========================================================= */

function getWeakWords(chapter) {

  return chapter.words.filter(
    (word) => {

      const mastery =
        state.mastery[
          wordEN(word)
        ] || {};

      return (
        (mastery.wrong || 0) > 0
      );
    }
  );
}

/* =========================================================
   QUEST
========================================================= */

function startQuest(
  id,
  review = false
) {

  const chapter =
    DATA.chapters.find(
      (item) => item.id === id
    );

  if (!chapter) return;

  let pool = [
    ...chapter.words
  ];

  if (review) {

    const weak =
      getWeakWords(chapter);

    if (weak.length) {
      pool = weak;
    }
  }

  pool = shuffle(pool);

  const count =
    Math.min(10, pool.length);

  session = {

    id,

    review,

    words:
      pool.slice(0, count),

    q: 0,

    correct: 0,

    modeHistory: [],

    selected: [],

    timer: null,

    left: 30,

    locked: false

  };

  nextQuestion();
}

/* =========================================================
   RANDOM MODE
========================================================= */

function chooseNextMode() {

  const previous =
    session.modeHistory[
      session.modeHistory.length - 1
    ];

  let choices =
    MODES.filter(
      (mode) =>
        mode !== previous
    );

  if (!choices.length) {
    choices = [...MODES];
  }

  return choices[
    Math.floor(
      Math.random() *
      choices.length
    )
  ];
}

/* =========================================================
   NEXT QUESTION
========================================================= */

function nextQuestion() {

  if (
    !session ||
    session.q >=
      session.words.length
  ) {

    finishQuest();

    return;
  }

  const word =
    session.words[
      session.q
    ];

  const mode =
    chooseNextMode();

  session.mode = mode;

  session.modeHistory.push(
    mode
  );

  session.selected = [];

  session.locked = false;

  renderQuestion(
    word,
    mode
  );
}

/* =========================================================
   OPTIONS
========================================================= */

function getOtherWords(
  chapter,
  currentEN,
  count = 3
) {

  return shuffle(
    chapter.words.filter(
      (word) =>
        wordEN(word) !== currentEN
    )
  ).slice(0, count);
}

function makeChoiceButtons(
  options,
  answer
) {

  return `

    <div class="choices">

      ${shuffle(options)
        .map(
          (option) => `

            <button
              class="choice"

              onclick='
                answerValue(
                  ${JSON.stringify(option)},
                  ${JSON.stringify(answer)}
                )
              '
            >
              ${esc(option)}
            </button>

          `
        )
        .join("")}

    </div>

  `;
}

/* =========================================================
   QUESTION RENDER
========================================================= */

function renderQuestion(
  word,
  mode
) {

  const en =
    wordEN(word);

  const zh =
    wordZH(word);

  const chapter =
    DATA.chapters.find(
      (item) =>
        item.id === session.id
    );

  let body = "";

  /* -------------------------------------------------------
     PICTURE MATCH
  ------------------------------------------------------- */

  if (mode === "picture") {

    const options = [

      en,

      ...getOtherWords(
        chapter,
        en
      ).map(wordEN)

    ];

    body = `

      <div class="question">

        ${esc(
          wordVisual(word)
        )}

      </div>

      <div class="prompt">
        Which word matches the picture clue?
      </div>

      <div class="panel center">

        <div
          style="
            font-size:
              clamp(
                16px,
                1.7vw,
                26px
              );

            color:#d8e8f5;
          "
        >

          ${esc(zh)}

        </div>

        <div
          class="small"
          style="margin-top:10px"
        >

          Look at the visual clue
          and choose the best word.

        </div>

      </div>

      ${makeChoiceButtons(
        options,
        en
      )}

    `;
  }

  /* -------------------------------------------------------
     WORD → MEANING
  ------------------------------------------------------- */

  else if (mode === "meaning") {

    const options = [

      zh,

      ...getOtherWords(
        chapter,
        en
      ).map(wordZH)

    ];

    body = `

      <div class="question">
        ${esc(en)}
      </div>

      <div class="prompt">
        What does this word mean?
      </div>

      ${makeChoiceButtons(
        options,
        zh
      )}

    `;
  }

  /* -------------------------------------------------------
     SPELL
  ------------------------------------------------------- */

  else if (mode === "spell") {

    body = `

      <div class="question">
        ${esc(zh)}
      </div>

      <div class="prompt">
        Spell the English word.
      </div>

      <input
        id="spellInput"
        class="name"

        style="
          margin:20px auto
        "

        autocomplete="off"
        autocapitalize="none"
        spellcheck="false"

        onkeydown="
          if(event.key==='Enter')
            checkSpell()
        "
      >

      <button
        class="primary"
        onclick="checkSpell()"
      >
        CHECK ✓
      </button>

    `;
  }

  /* -------------------------------------------------------
     SCRAMBLE
  ------------------------------------------------------- */

  else if (
    mode === "scramble"
  ) {

    const letters =
      shuffle(
        en
          .replace(/\s/g, "")
          .split("")
      );

    body = `

      <div class="question">
        ${esc(zh)}
      </div>

      <div class="prompt">
        Tap the letters in the correct order.
      </div>

      <div
        id="scrambleAnswer"
        class="answer"
      ></div>

      <div class="scramble">

        ${letters
          .map(
            (letter, index) => `

              <button
                class="letter"
                id="letter${index}"

                onclick="
                  pickLetter(
                    ${index}
                  )
                "
              >
                ${esc(
                  letter.toUpperCase()
                )}
              </button>

            `
          )
          .join("")}

      </div>

      <button
        class="primary"
        onclick="checkScramble()"
      >
        CHECK ✓
      </button>

    `;
  }

  /* -------------------------------------------------------
     SENTENCE QUEST
  ------------------------------------------------------- */

  else if (
    mode === "sentence"
  ) {

    const options = [

      en,

      ...getOtherWords(
        chapter,
        en
      ).map(wordEN)

    ];

    body = `

      <div class="question">

        ${esc(
          wordSentence(word)
        )}

      </div>

      <div class="prompt">
        Which vocabulary word
        completes the idea?
      </div>

      ${makeChoiceButtons(
        options,
        en
      )}

    `;
  }

  /* -------------------------------------------------------
     WORD ATTACK
  ------------------------------------------------------- */

  else {

    const options = [

      en,

      ...getOtherWords(
        chapter,
        en
      ).map(wordEN)

    ];

    body = `

      <div class="question">

        ⚡ ${esc(zh)}

      </div>

      <div class="prompt">
        WORD ATTACK!
        Choose quickly!
      </div>

      ${makeChoiceButtons(
        options,
        en
      )}

    `;
  }

  render(`

    ${renderTop()}

    <div class="content">

      <div class="quest-head">

        <div>
          ${menuBtn()}
        </div>

        <div
          class="timer"
          id="timer"
        >
          30
        </div>

      </div>

      <div class="progress">

        <div
          style="
            width:
              ${
                session.q /
                session.words.length *
                100
              }%
          "
        ></div>

      </div>

      <div
        class="panel"
        style="
          margin-top:18px
        "
      >

        <div class="mode-badge">

          ${MODE_INFO[mode][0]}

        </div>

        ${body}

        <div
          id="feedback"
          class="feedback"
        ></div>

      </div>

      <div
        class="small center"
        style="
          margin-top:12px
        "
      >

        Question
        ${session.q + 1}
        /
        ${session.words.length}

      </div>

    </div>

  `);

  startTimer();
}

/* =========================================================
   TIMER
========================================================= */

function startTimer() {

  clearInterval(
    session.timer
  );

  session.left = 30;

  const timer =
    $("#timer");

  if (timer) {
    timer.textContent = "30";
  }

  session.timer =
    setInterval(() => {

      session.left--;

      const el =
        $("#timer");

      if (el) {
        el.textContent =
          session.left;
      }

      if (
        session.left <= 0
      ) {

        clearInterval(
          session.timer
        );

        handleAnswer(
          null,
          null,
          true
        );
      }

    }, 1000);
}

/* =========================================================
   ANSWER
========================================================= */

function answerValue(
  got,
  correct
) {

  if (session.locked)
    return;

  clearInterval(
    session.timer
  );

  handleAnswer(
    String(got),
    String(correct),
    false
  );
}

function handleAnswer(
  got,
  correct,
  timeout = false
) {

  if (
    !session ||
    session.locked
  ) return;

  session.locked = true;

  clearInterval(
    session.timer
  );

  const currentWord =
    session.words[
      session.q
    ];

  const key =
    wordEN(currentWord);

  if (!state.mastery[key]) {

    state.mastery[key] = {

      correct: 0,
      wrong: 0,
      attempts: 0

    };
  }

  const mastery =
    state.mastery[key];

  mastery.attempts++;

  const actualAnswer =
    timeout
      ? key
      : correct;

  const ok =
    !timeout &&
    String(got)
      .trim()
      .toLowerCase() ===

    String(correct)
      .trim()
      .toLowerCase();

  if (ok) {

    mastery.correct++;

    state.score += 100;

    session.correct++;

  } else {

    mastery.wrong++;

    state.score =
      Math.max(
        0,
        state.score - 20
      );
  }

  save();

  const feedback =
    $("#feedback");

  if (feedback) {

    feedback.textContent =
      timeout

        ? `⏰ Time up! Answer: ${actualAnswer}`

        : ok

        ? "✅ Correct!"

        : `❌ Correct answer: ${actualAnswer}`;
  }

  setTimeout(() => {

    session.q++;

    nextQuestion();

  }, 650);
}

/* =========================================================
   SPELL CHECK
========================================================= */

function checkSpell() {

  const input =
    $("#spellInput");

  if (!input) return;

  handleAnswer(

    input.value
      .trim()
      .toLowerCase(),

    wordEN(
      session.words[
        session.q
      ]
    )
      .toLowerCase(),

    false

  );
}

/* =========================================================
   SCRAMBLE
========================================================= */

function pickLetter(index) {

  if (
    session.locked ||
    session.selected.includes(index)
  ) return;

  session.selected.push(index);

  const button =
    $(`#letter${index}`);

  if (button) {
    button.disabled = true;
  }

  const answer =
    session.selected
      .map(
        (i) =>
          $(`#letter${i}`)
            .textContent
            .toLowerCase()
      )
      .join("");

  const output =
    $("#scrambleAnswer");

  if (output) {
    output.textContent =
      answer;
  }
}

function checkScramble() {

  const target =
    wordEN(
      session.words[
        session.q
      ]
    )
      .replace(/\s/g, "")
      .toLowerCase();

  const got =
    session.selected
      .map(
        (i) =>
          $(`#letter${i}`)
            .textContent
            .toLowerCase()
      )
      .join("");

  handleAnswer(
    got,
    target,
    false
  );
}

/* =========================================================
   FINISH
========================================================= */

function finishQuest() {

  clearInterval(
    session.timer
  );

  const total =
    session.words.length;

  const percent =
    total
      ? Math.round(
          session.correct /
          total *
          100
        )
      : 0;

  const earned =
    percent >= 90
      ? 3
      : percent >= 70
      ? 2
      : 1;

  const oldStars =
    state.stars[
      session.id
    ] || 0;

  if (
    earned >
    oldStars
  ) {

    state.stars[
      session.id
    ] = earned;
  }

  state.chaptersDone[
    session.id
  ] = true;

  if (
    session.id ===
      state.unlocked &&

    state.unlocked <
      DATA.chapters.length
  ) {

    state.unlocked++;
  }

  save();

  render(`

    ${renderTop()}

    <div class="content result">

      <div class="panel">

        <div class="big">
          ${starText(earned)}
        </div>

        <h1>
          ${
            session.review
              ? "REVIEW COMPLETE"
              : "QUEST COMPLETE"
          }
        </h1>

        <p>
          Correct:
          ${session.correct}/${total}
          (${percent}%)
        </p>

        <p>
          下一次會重新抽單字、
          題型與選項。
        </p>

        <div class="menu-row">

          <button
            class="primary"
            onclick="
              openChapter(
                ${session.id}
              )
            "
          >
            PLAY AGAIN 🔀
          </button>

          <button
            class="secondary"
            onclick="showMap()"
          >
            WORLD MAP
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

  const weakCount =
    Object.values(
      state.mastery
    )
      .filter(
        (m) =>
          (m.wrong || 0) > 0
      )
      .length;

  render(`

    ${renderTop()}

    <div class="content">

      <div class="quest-head">

        ${menuBtn()}

        <h1>
          🔄 REVIEW QUEST
        </h1>

      </div>

      <div class="panel center">

        <h2>
          SMART RANDOM REVIEW
        </h2>

        <p>
          系統會優先抽曾答錯的單字。<br>
          題型與選項也會重新亂數。
        </p>

        <div class="tag">
          Weak words:
          ${weakCount}
        </div>

        <div
          class="chapter-grid"
          style="
            margin-top:18px
          "
        >

          ${DATA.chapters
            .filter(
              (chapter) =>
                chapter.id <=
                state.unlocked
            )
            .map(
              (chapter) => `

                <button
                  class="chapter ready"

                  onclick="
                    startQuest(
                      ${chapter.id},
                      true
                    )
                  "
                >

                  <h3>
                    CHAPTER
                    ${chapter.id}
                  </h3>

                  <div>
                    ${esc(
                      chapter.title
                    )}
                  </div>

                  <div class="meta">
                    REVIEW
                    ${chapter.words.length}
                    WORDS
                  </div>

                </button>

              `
            )
            .join("")}

        </div>

      </div>

    </div>

  `);
}

/* =========================================================
   WORD BOOK
========================================================= */

function showBook() {

  const words =
    DATA.chapters.flatMap(
      (chapter) =>
        chapter.words
    );

  render(`

    ${renderTop()}

    <div class="content">

      <div class="quest-head">

        ${menuBtn()}

        <h1>
          📖 MY WORD BOOK
        </h1>

      </div>

      <div class="wordbook">

        ${words
          .map((word) => {

            const en =
              wordEN(word);

            const zh =
              wordZH(word);

            const mastery =
              state.mastery[en]
              || {};

            const correct =
              mastery.correct
              || 0;

            return `

              <div class="word">

                <strong>
                  ${esc(en)}
                </strong>

                <span>
                  ${esc(zh)}
                </span>

                <div class="stars">

                  ${
                    correct >= 3
                      ? "★★★"
                      : correct >= 1
                      ? "★★☆"
                      : "★☆☆"
                  }

                </div>

              </div>

            `;

          })
          .join("")}

      </div>

    </div>

  `);
}

/* =========================================================
   START
========================================================= */

load();

fetch(
  DATA_URL,
  {
    cache: "no-store"
  }
)

  .then((response) => {

    if (!response.ok) {

      throw new Error(
        `data.json failed to load: ${response.status}`
      );
    }

    return response.json();
  })

  .then((data) => {

    DATA = data;

    boot();

  })

  .catch((error) => {

    console.error(error);

    const app =
      $("#app");

    if (app) {

      app.innerHTML = `

        <div
          style="
            padding:40px;
            color:white;
            font-family:Arial,sans-serif
          "
        >

          <h2>
            Unable to load game data.
          </h2>

          <p>
            ${esc(error.message)}
          </p>

          <p>
            Please refresh the page.
          </p>

        </div>

      `;
    }

  });
