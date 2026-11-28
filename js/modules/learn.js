/* ==========================================================================
   NEUROATLAS — Learning Lab (Flashcards, Quiz, Concept Map, Glossary & Notes)
   ========================================================================== */

(function () {
  "use strict";

  const NEURO = window.NEURO;
  const {
    DATA,
    TRANS,
    escapeHtml,
    t,
    getChapterMeta,
    showToast
  } = NEURO;

  const CHAPTERS = DATA.CHAPTERS || [];
  const MAP = DATA.MAP || [];
  const GLOSSARY = DATA.GLOSSARY || [];
  const FLASH = DATA.FLASH || [];
  const QUIZ = DATA.QUIZ || [];

  const mapGridEl = document.getElementById("mapGrid");
  const mapDetailEl = document.getElementById("mapDetail");
  const glossaryFilterEl = document.getElementById("glossaryFilter");
  const glossaryCountEl = document.getElementById("glossaryCount");
  const glossaryListEl = document.getElementById("glossaryList");

  const flashQEl = document.getElementById("flashQ");
  const flashAEl = document.getElementById("flashA");
  const flipCardBtn = document.getElementById("flipCard");
  const nextCardBtn = document.getElementById("nextCard");

  const quizAreaEl = document.getElementById("quizArea");
  const gradeQuizBtn = document.getElementById("gradeQuiz");
  const quizScoreEl = document.getElementById("quizScore");

  const noteTitleEl = document.getElementById("noteTitle");
  const noteBodyEl = document.getElementById("noteBody");
  const saveNoteBtn = document.getElementById("saveNote");
  const exportNotesBtn = document.getElementById("exportNotes");
  const notesListEl = document.getElementById("notesList");

  let flashIdx = 0;
  let flashShown = false;

  /* ========================================================================
     1. Concept Map
     ======================================================================== */

  function renderMap() {
    if (!mapGridEl || !mapDetailEl) return;
    const lang = NEURO.getLang();
    const tr = TRANS[lang] || null;
    const mapList = (tr && tr.map) || MAP;

    mapGridEl.innerHTML = MAP.map((orig, i) => {
      const m = mapList[i] || orig;
      return `<button type="button" class="map-node" data-map="${i}"><div class="tag">${escapeHtml(
        m[1]
      )}</div><strong>${escapeHtml(m[0])}</strong><div class="muted">${escapeHtml(
        m[2]
      )}</div></button>`;
    }).join("");

    mapDetailEl.textContent = t("mapHint");
    const nodes = mapGridEl.querySelectorAll(".map-node");
    nodes.forEach((btn) => {
      btn.addEventListener("click", () => {
        nodes.forEach((n) => n.classList.toggle("active", n === btn));
        const idx = +btn.dataset.map;
        const orig = MAP[idx];
        const m = mapList[idx] || orig;

        mapDetailEl.innerHTML = `<strong>${escapeHtml(m[0])}:</strong> ${escapeHtml(
          m[2]
        )}<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${(orig[3] || [])
          .map((id) => {
            const ci = CHAPTERS.findIndex((c) => c.id === id);
            return ci >= 0
              ? `<button type="button" class="map-chapter-btn" data-open-ch="${ci}">${escapeHtml(
                  id
                )} · ${escapeHtml(getChapterMeta(CHAPTERS[ci], lang).title)}</button>`
              : "";
          })
          .join("")}</div>`;
      });
    });
  }

  if (mapDetailEl) {
    mapDetailEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-open-ch]");
      if (!btn) return;
      const idx = +btn.dataset.openCh;
      NEURO.switchView("atlas");
      const atlasMod = NEURO.getModule("atlas");
      if (atlasMod.openChapter) atlasMod.openChapter(idx);
    });
  }

  /* ========================================================================
     2. Glossary + Deep Linking from Global Search
     ======================================================================== */

  function renderGlossary() {
    if (!glossaryListEl) return;
    const tr = TRANS[NEURO.getLang()] || null;
    const glossList = (tr && tr.glossary) || GLOSSARY;
    const q = ((glossaryFilterEl && glossaryFilterEl.value) || "").trim().toLowerCase();

    const filtered = glossList.filter((g, i) =>
      (g[0] + " " + g[1] + " " + (GLOSSARY[i] ? GLOSSARY[i][0] : "")).toLowerCase().includes(q)
    );

    if (glossaryCountEl) glossaryCountEl.textContent = `${filtered.length} / ${glossList.length}`;
    glossaryListEl.innerHTML = filtered
      .map(
        (g) =>
          `<div class="callout"><strong>${escapeHtml(g[0])}</strong><p class="muted">${escapeHtml(
            g[1]
          )}</p></div>`
      )
      .join("");
  }

  if (glossaryFilterEl) {
    glossaryFilterEl.addEventListener("input", renderGlossary);
  }

  function focusGlossary(term) {
    if (glossaryFilterEl) {
      glossaryFilterEl.value = term;
    }
    renderGlossary();
    setTimeout(() => {
      if (glossaryListEl) glossaryListEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 90);
  }

  /* ========================================================================
     3. Flashcards & Mini Quiz
     ======================================================================== */

  function drawFlashcard() {
    const tr = TRANS[NEURO.getLang()] || null;
    const flashList = (tr && tr.flash) || FLASH;
    if (!flashList.length || !flashQEl || !flashAEl || !flipCardBtn) return;

    flashQEl.textContent = flashList[flashIdx][0];
    flashAEl.textContent = flashList[flashIdx][1];
    flashAEl.classList.toggle("hidden", !flashShown);
    flipCardBtn.textContent = flashShown ? t("hideAnsBtn") : t("revealAnsBtn");
  }

  if (flipCardBtn) {
    flipCardBtn.addEventListener("click", () => {
      flashShown = !flashShown;
      drawFlashcard();
    });
  }

  if (nextCardBtn) {
    nextCardBtn.addEventListener("click", () => {
      const tr = TRANS[NEURO.getLang()] || null;
      const flashList = (tr && tr.flash) || FLASH;
      if (!flashList.length) return;
      flashIdx = (flashIdx + 1) % flashList.length;
      flashShown = false;
      drawFlashcard();
    });
  }

  function renderQuiz() {
    if (!quizAreaEl || !quizScoreEl) return;
    const tr = TRANS[NEURO.getLang()] || null;
    const quizList = (tr && tr.quiz) || QUIZ;

    quizAreaEl.innerHTML = quizList
      .map(
        (q, i) =>
          `<div class="quiz-q"><strong>${i + 1}. ${escapeHtml(q.q)}</strong>${q.a
            .map(
              (opt, j) =>
                `<label><input type="radio" name="qz${i}" value="${j}"> ${escapeHtml(opt)}</label>`
            )
            .join("")}</div>`
      )
      .join("");
    quizScoreEl.classList.add("hidden");
  }

  if (gradeQuizBtn) {
    gradeQuizBtn.addEventListener("click", () => {
      if (!quizScoreEl) return;
      const tr = TRANS[NEURO.getLang()] || null;
      const quizList = (tr && tr.quiz) || QUIZ;
      let score = 0;

      const notes = quizList.map((q, i) => {
        const chosen = document.querySelector(`input[name="qz${i}"]:checked`);
        const ok = chosen && +chosen.value === QUIZ[i].c;
        if (ok) score++;
        return `${i + 1}. ${ok ? "✓" : "✗"} ${q.why}`;
      });

      quizScoreEl.classList.remove("hidden");
      quizScoreEl.innerHTML = `<strong>${escapeHtml(t("scoreLbl"))} ${score}/${
        quizList.length
      }</strong><br>${notes.map(escapeHtml).join("<br>")}`;
    });
  }

  /* ========================================================================
     4. Local Workspace Notes
     ======================================================================== */

  function renderNotes() {
    if (!notesListEl) return;
    const notes = NEURO.getNotes();
    notesListEl.innerHTML = notes.length
      ? notes
          .map(
            (n, i) =>
              `<div class="callout"><div class="tag">${new Date(
                n.date
              ).toLocaleDateString()}</div><strong>${escapeHtml(
                n.title
              )}</strong><p class="muted" style="white-space:pre-wrap;margin:6px 0">${escapeHtml(
                n.body
              )}</p><button type="button" class="btn-ghost" data-del-note="${i}">${escapeHtml(
                t("deleteBtn")
              )}</button></div>`
          )
          .join("")
      : `<p class="muted">${escapeHtml(t("noNotes"))}</p>`;
  }

  if (notesListEl) {
    notesListEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-del-note]");
      if (!btn) return;
      NEURO.deleteNoteAt(+btn.dataset.delNote);
    });
  }

  if (saveNoteBtn) {
    saveNoteBtn.addEventListener("click", () => {
      if (!noteTitleEl || !noteBodyEl) return;
      const title = noteTitleEl.value.trim();
      const body = noteBodyEl.value.trim();
      if (!title || !body) {
        showToast(t("needNoteToast"), "error");
        return;
      }
      NEURO.addNote(title, body);
      noteTitleEl.value = "";
      noteBodyEl.value = "";
      showToast(t("savedAlert"));
    });
  }

  if (exportNotesBtn) {
    exportNotesBtn.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(NEURO.getNotes(), null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "neuroatlas-notes.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  function refreshAll() {
    renderMap();
    renderGlossary();
    drawFlashcard();
    renderQuiz();
    renderNotes();
  }

  NEURO.registerModule("learn", {
    renderNotes,
    focusGlossary,
    onLanguageChange: refreshAll
  });

  refreshAll();
})();