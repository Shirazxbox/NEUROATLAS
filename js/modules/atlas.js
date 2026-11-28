/* ==========================================================================
   NEUROATLAS — Atlas Module (23 Chapters, Progress, AI Translate & Context)
   ========================================================================== */

(function () {
  "use strict";

  const NEURO = window.NEURO;
  const {
    DATA,
    TRANS,
    I18N,
    escapeHtml,
    t,
    getChapterMeta,
    sourceNamesHtml,
    showToast
  } = NEURO;

  const CHAPTERS = DATA.CHAPTERS || [];
  const chapterNav = document.getElementById("chapterNav");
  const chapterContent = document.getElementById("chapterContent");
  const chapterFilter = document.getElementById("chapterFilter");
  const chapterFilterCount = document.getElementById("chapterFilterCount");
  const toggleChaptersBtn = document.getElementById("toggleChaptersBtn");
  const progressTextEl = document.getElementById("atlasProgressText");
  const progressFillEl = document.getElementById("atlasProgressFill");

  let activeChapterIdx = 0;
  let chapterDisplayLang = NEURO.getLang();
  let chapterCompareOriginal = false;
  let chapterAutoError = "";
  let chaptersOpenMobile = false;
  const translatingChapters = new Set();

  const chCacheKey = (id, lang) => `na_ch_tr_${lang}_${id}`;

  function updateProgressUI() {
    if (!CHAPTERS.length) return;
    const readIds = NEURO.getReadChapterIds();
    const readCount = CHAPTERS.filter((c) => readIds.includes(c.id)).length;
    const pct = Math.round((readCount / CHAPTERS.length) * 100);

    if (progressTextEl) {
      progressTextEl.textContent = `${t("progressLabel")} ${readCount}/${CHAPTERS.length} ${t(
        "chaptersReadUnit"
      )}`;
    }
    if (progressFillEl) {
      progressFillEl.style.width = `${pct}%`;
    }
    if (chapterNav) {
      chapterNav.querySelectorAll(".chapter-btn").forEach((btn) => {
        const ch = CHAPTERS[+btn.dataset.i];
        if (ch) btn.classList.toggle("is-read", readIds.includes(ch.id));
      });
    }
  }

  function updateChapterToggleBtn() {
    if (!toggleChaptersBtn || !chapterNav) return;
    chapterNav.classList.toggle("collapsed-mobile", !chaptersOpenMobile);
    toggleChaptersBtn.textContent = chaptersOpenMobile
      ? t("chaptersToggleHide")
      : t("chaptersToggleShow");
  }

  if (toggleChaptersBtn) {
    toggleChaptersBtn.addEventListener("click", () => {
      chaptersOpenMobile = !chaptersOpenMobile;
      updateChapterToggleBtn();
    });
  }

  function answerForQuestion(chapter, question) {
    const stop = new Set([
      "what", "which", "when", "where", "why", "how", "does", "are", "is",
      "the", "and", "for", "from", "with", "into", "about", "name", "give", "one", "two", "three"
    ]);
    const kws = (question.toLowerCase().match(/[a-z0-9]+/g) || []).filter(
      (w) => w.length > 2 && !stop.has(w)
    );
    const ranked = (chapter.sections || [])
      .map((s) => ({
        s,
        score: kws.reduce((n, w) => n + ((s[0] + " " + s[1]).toLowerCase().includes(w) ? 1 : 0), 0)
      }))
      .sort((a, b) => b.score - a.score);
    if (!ranked.length || ranked[0].score === 0) return `${chapter.takeaway} ${chapter.intro}`;
    return ranked
      .slice(0, 2)
      .map((x) => x.s[1])
      .join(" ");
  }

  function formatTranslatedChapter(raw) {
    return escapeHtml(raw)
      .split(/\n{2,}/)
      .map((block) => {
        const trimmed = block.trim();
        if (!trimmed) return "";
        if (/^#{2,3}\s+/.test(trimmed)) {
          return `<h3>${trimmed
            .replace(/^#{2,3}\s+/, "")
            .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")}</h3>`;
        }
        return `<p>${trimmed
          .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
          .replace(/\n/g, "<br>")}</p>`;
      })
      .join("");
  }

  function renderEnglishChapterBody(c, labels) {
    return `<p style="margin:14px 0">${escapeHtml(c.intro)}</p>${(c.sections || [])
      .map((s) => `<h3>${escapeHtml(s[0])}</h3><p>${escapeHtml(s[1])}</p>`)
      .join("")}<div class="callout"><strong>${escapeHtml(
      labels.keyConceptLbl
    )}</strong> ${escapeHtml(c.takeaway)}</div><div class="callout"><strong>${escapeHtml(
      labels.distinctionLbl
    )}</strong> ${escapeHtml(c.misconception)}</div><h3>${escapeHtml(
      labels.reviewLbl
    )}</h3>${(c.questions || [])
      .map(
        (q, j) =>
          `<details class="qa"><summary>${String(j + 1).padStart(2, "0")} · ${escapeHtml(
            q
          )}</summary><p>${escapeHtml(answerForQuestion(c, q))}</p></details>`
      )
      .join("")}`;
  }

  async function ensureChapterTranslation(i, targetLang) {
    const c = CHAPTERS[i];
    if (!c || targetLang === "en") return;
    const cacheKey = chCacheKey(c.id, targetLang);
    if (NEURO.safeGet(cacheKey) || translatingChapters.has(cacheKey)) return;

    translatingChapters.add(cacheKey);
    chapterAutoError = "";
    if (activeChapterIdx === i && chapterDisplayLang === targetLang) {
      renderChapter(i, false);
    }

    const sourceText = [
      `Title: ${c.title}`,
      `Subtitle: ${c.subtitle}`,
      `Intro: ${c.intro}`,
      ...(c.sections || []).map((s) => `## ${s[0]}\n${s[1]}`),
      `Key Concept: ${c.takeaway}`,
      `Important Distinction: ${c.misconception}`,
      `Review Questions:\n` +
        (c.questions || []).map((q, j) => `${j + 1}. ${q} -> ${answerForQuestion(c, q)}`).join("\n")
    ].join("\n\n");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: sourceText, lang: targetLang, mode: "translate" })
      });
      const data = await res.json();
      if (!res.ok || !data.reply) throw new Error(data.error || "Translation failed");
      NEURO.safeSet(cacheKey, data.reply);
      chapterAutoError = "";
    } catch {
      chapterAutoError = t("autoTrErr");
    } finally {
      translatingChapters.delete(cacheKey);
      if (activeChapterIdx === i && chapterDisplayLang === targetLang) {
        renderChapter(i, false);
      }
    }
  }

  function renderChapter(i, triggerAuto = true) {
    const c = CHAPTERS[i];
    if (!c || !chapterContent) return;

    activeChapterIdx = i;
    if (NEURO.getActiveView() === "atlas") {
      NEURO.markChapterRead(c.id);
      updateProgressUI();
    }

    const siteLang = NEURO.getLang();
    const siteDict = I18N[siteLang] || I18N.en;
    const viewLang = chapterDisplayLang;
    const meta = getChapterMeta(c, viewLang);
    const cacheKey = chCacheKey(c.id, viewLang);
    const cached = viewLang !== "en" ? NEURO.safeGet(cacheKey) : null;
    const isTranslating = viewLang !== "en" && translatingChapters.has(cacheKey);

    if (
      triggerAuto &&
      viewLang !== "en" &&
      !cached &&
      !isTranslating &&
      NEURO.getActiveView() === "atlas"
    ) {
      ensureChapterTranslation(i, viewLang);
    }

    const langDir = viewLang === "fa" ? "rtl" : "ltr";
    const langBar = `<div class="article-lang-bar">
      <span class="article-lang-label">${escapeHtml(t("articleLangLabel"))}</span>
      <div class="article-lang-pills">
        <button type="button" class="article-lang-btn ${viewLang === "en" ? "active" : ""}" data-action="set-lang" data-lang="en">EN</button>
        <button type="button" class="article-lang-btn ${viewLang === "fa" ? "active" : ""}" data-action="set-lang" data-lang="fa">فا</button>
        <button type="button" class="article-lang-btn ${viewLang === "tr" ? "active" : ""}" data-action="set-lang" data-lang="tr">TR</button>
        ${
          viewLang !== "en"
            ? `<button type="button" class="article-lang-btn ${
                chapterCompareOriginal ? "active" : ""
              }" data-action="toggle-compare">${escapeHtml(
                chapterCompareOriginal ? t("hideCompareBtn") : t("sideCompareBtn")
              )}</button>`
            : ""
        }
        ${
          viewLang !== "en" && cached && !isTranslating
            ? `<button type="button" class="article-lang-btn" data-action="retranslate">${escapeHtml(
                t("retranslateBtn")
              )}</button>`
            : ""
        }
      </div>
    </div>`;

    let statusBanner = "";
    if (isTranslating) {
      const waitMsg = (I18N[viewLang] && I18N[viewLang].translatingMsg) || t("translatingMsg");
      statusBanner = `<div class="callout">${escapeHtml(waitMsg)}</div>`;
    } else if (viewLang !== "en" && !cached && chapterAutoError) {
      statusBanner = `<div class="callout muted">${escapeHtml(chapterAutoError)}</div>`;
    }

    let bodyHtml = "";
    if (viewLang !== "en" && cached) {
      bodyHtml = `<div class="translated-chapter-body" dir="${langDir}">${formatTranslatedChapter(
        cached
      )}</div>`;
      if (chapterCompareOriginal) {
        bodyHtml += `<div class="article-compare-box" dir="ltr"><div class="tag">${escapeHtml(
          t("compareOriginalTag")
        )}</div><h3 style="margin-top:4px">${escapeHtml(c.title)}</h3>${renderEnglishChapterBody(
          c,
          I18N.en
        )}</div>`;
      }
    } else {
      bodyHtml = `<div dir="ltr">${renderEnglishChapterBody(
        c,
        viewLang === "en" ? I18N.en : siteDict
      )}</div>`;
    }

    chapterContent.innerHTML = `<div class="tag">${escapeHtml(meta.category)} · ${escapeHtml(
      t("chapterWord")
    )} ${escapeHtml(c.id)}</div><h2 dir="${langDir}">${escapeHtml(
      meta.title
    )}</h2><p class="muted" dir="${langDir}">${escapeHtml(
      meta.subtitle
    )}</p>${langBar}${statusBanner}${bodyHtml}<p class="muted" style="margin-top:16px">${escapeHtml(
      t("refsLbl")
    )} ${sourceNamesHtml(c.sources)}</p><div class="chapter-actions-row">
      <button type="button" class="btn-primary" data-action="ask-ai">${escapeHtml(
        t("askAboutChapterBtn")
      )}</button>
      <button type="button" class="btn-ghost" data-action="save-note">${escapeHtml(
        t("saveWorkBtn")
      )}</button>
      ${
        i > 0
          ? `<button type="button" class="btn-ghost" data-action="goto-chapter" data-idx="${
              i - 1
            }">${escapeHtml(t("prevBtn"))}</button>`
          : ""
      }
      ${
        i < CHAPTERS.length - 1
          ? `<button type="button" class="btn-ghost" data-action="goto-chapter" data-idx="${
              i + 1
            }">${escapeHtml(t("nextBtn"))}</button>`
          : ""
      }
    </div>`;

    if (chapterNav) {
      chapterNav
        .querySelectorAll(".chapter-btn")
        .forEach((b, j) => b.classList.toggle("active", j === i));
    }
  }

  if (chapterContent) {
    chapterContent.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      const c = CHAPTERS[activeChapterIdx];
      if (!c) return;

      if (action === "set-lang") {
        const targetLang = btn.dataset.lang;
        chapterDisplayLang = targetLang;
        chapterCompareOriginal = false;
        chapterAutoError = "";
        renderChapter(activeChapterIdx, true);
        if (targetLang !== "en") ensureChapterTranslation(activeChapterIdx, targetLang);
      } else if (action === "toggle-compare") {
        chapterCompareOriginal = !chapterCompareOriginal;
        renderChapter(activeChapterIdx, false);
      } else if (action === "retranslate") {
        if (chapterDisplayLang !== "en") {
          NEURO.safeRemove(chCacheKey(c.id, chapterDisplayLang));
          ensureChapterTranslation(activeChapterIdx, chapterDisplayLang);
        }
      } else if (action === "save-note") {
        const meta = getChapterMeta(c, chapterDisplayLang);
        const cached = chapterDisplayLang !== "en" ? NEURO.safeGet(chCacheKey(c.id, chapterDisplayLang)) : null;
        const body = cached
          ? cached.slice(0, 1200)
          : `${c.intro}\n\n${t("keyConceptLbl")} ${c.takeaway}`;
        NEURO.addNote(meta.title, body);
        showToast(t("savedAlert"));
      } else if (action === "ask-ai") {
        const meta = getChapterMeta(c, chapterDisplayLang);
        const summary = [
          `Chapter ${c.id}: ${c.title} (${meta.title})`,
          `Intro: ${c.intro}`,
          `Key Concept: ${c.takeaway}`,
          `Important Distinction: ${c.misconception}`
        ].join("\n");
        const chatMod = NEURO.getModule("chat");
        if (chatMod.askAboutChapter) {
          chatMod.askAboutChapter({ title: meta.title, summary });
        }
      } else if (action === "goto-chapter") {
        const nextIdx = +btn.dataset.idx;
        chapterCompareOriginal = false;
        chapterAutoError = "";
        renderChapter(nextIdx, true);
        chapterContent.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  function initAtlas(keepActive = false) {
    if (!chapterNav) return;
    if (!CHAPTERS.length) {
      chapterNav.innerHTML = "<p class='muted'>Atlas data missing.</p>";
      return;
    }

    const lang = NEURO.getLang();
    const tr = TRANS[lang] || null;
    const cats = [...new Set(CHAPTERS.map((c) => c.category))];

    chapterNav.innerHTML = cats
      .map(
        (cat) =>
          `<div class="chapter-group"><div class="tag" style="margin-top:10px">${escapeHtml(
            (tr && tr.categories && tr.categories[cat]) || cat
          )}</div>${CHAPTERS.map((c, i) =>
            c.category === cat
              ? `<button type="button" class="chapter-btn" data-i="${i}"><span>${escapeHtml(
                  c.id
                )} · ${escapeHtml(getChapterMeta(c, lang).title)}</span></button>`
              : ""
          ).join("")}</div>`
      )
      .join("");

    chapterNav.querySelectorAll(".chapter-btn").forEach((b) => {
      b.addEventListener("click", () => {
        chapterDisplayLang = NEURO.getLang();
        chapterCompareOriginal = false;
        chapterAutoError = "";
        renderChapter(+b.dataset.i, true);
        if (window.innerWidth <= 1024) {
          chaptersOpenMobile = false;
          updateChapterToggleBtn();
        }
      });
    });

    if (chapterFilterCount) chapterFilterCount.textContent = String(CHAPTERS.length);
    if (chapterFilter) {
      chapterFilter.oninput = () => {
        const q = chapterFilter.value.trim().toLowerCase();
        let shown = 0;
        chapterNav.querySelectorAll(".chapter-group").forEach((g) => {
          let any = false;
          g.querySelectorAll(".chapter-btn").forEach((b) => {
            const c = CHAPTERS[+b.dataset.i];
            const m = getChapterMeta(c, NEURO.getLang());
            const ok =
              !q ||
              [c.title, m.title, c.category, m.category, c.intro, ...(c.key || [])]
                .join(" ")
                .toLowerCase()
                .includes(q);
            b.classList.toggle("chapter-hidden", !ok);
            if (ok) {
              any = true;
              shown++;
            }
          });
          g.classList.toggle("chapter-hidden", !any);
        });
        if (chapterFilterCount) chapterFilterCount.textContent = `${shown} / ${CHAPTERS.length}`;
      };
    }

    updateChapterToggleBtn();
    updateProgressUI();
    renderChapter(keepActive ? activeChapterIdx : 0, true);
  }

  function openChapter(idx) {
    chapterDisplayLang = NEURO.getLang();
    chapterCompareOriginal = false;
    chapterAutoError = "";
    renderChapter(idx, true);
  }

  NEURO.registerModule("atlas", {
    openChapter,
    onLanguageChange: () => {
      chapterDisplayLang = NEURO.getLang();
      chapterCompareOriginal = false;
      chapterAutoError = "";
      initAtlas(true);
    },
    onViewChange: (viewName) => {
      if (viewName === "atlas") {
        if (chapterDisplayLang !== NEURO.getLang()) {
          chapterDisplayLang = NEURO.getLang();
          chapterCompareOriginal = false;
        }
        renderChapter(activeChapterIdx, true);
      }
    }
  });

  initAtlas(false);
})();