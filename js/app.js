/* ==========================================================================
   NEUROATLAS — Core Application Features
   Chat AI, Auto-Translated 23-Chapter Atlas, PubMed, Learning Lab & Contact
   ========================================================================== */

(function () {
  "use strict";

  const WEB3FORMS_KEY = "35999110-eef8-4007-8e28-a1307dcf5439";
  const GITHUB_REPO_URL = "https://github.com/Shirazxbox/NEUROATLAS";
  const EMAIL_PARTS = ["nargesbayat2012", "gmail", "com"];

  const DATA = window.NEUROATLAS_DATA || {};
  const CHAPTERS = DATA.CHAPTERS || [];
  const SOURCES = DATA.SOURCES || [];
  const GLOSSARY = DATA.GLOSSARY || [];
  const METHODS = DATA.METHODS || [];
  const MAP = DATA.MAP || [];
  const FLASH = DATA.FLASH || [];
  const QUIZ = DATA.QUIZ || [];

  const UI = window.NEURO_UI;
  const { I18N, escapeHtml, trData, getChapterMeta } = UI;
  const lang = () => UI.getLang();

  let chatHistory = [];
  let activeChapterIdx = 0;
  let chapterDisplayLang = lang();
  let chapterCompareOriginal = false;
  let chapterAutoError = "";
  const translatingChapters = new Set();

  let pubmedItems = [];
  let pubmedTranslating = false;
  const pubmedTrCache = {};

  let flashIdx = 0;
  let flashShown = false;
  let lastOutline = "";
  let chaptersOpenMobile = false;

  const ghBtn = document.getElementById("githubProfileBtn");
  if (ghBtn) ghBtn.href = GITHUB_REPO_URL;

  const statCh = document.getElementById("statChapters");
  const statSrc = document.getElementById("statSources");
  if (statCh && CHAPTERS.length) statCh.textContent = CHAPTERS.length;
  if (statSrc && SOURCES.length) statSrc.textContent = SOURCES.length;

  /* ========================================================================
     1. AI Chatbot (General, Coding & Science + Code Copy)
     ======================================================================== */

  const chatMessages = document.getElementById("chatMessages");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");

  function formatChatMessage(raw) {
    const blocks = [];
    let text = String(raw).replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (_, codeLang, code) => {
      const id = blocks.length;
      blocks.push({ lang: codeLang || "code", code: code.replace(/\n$/, "") });
      return `@@CODEBLOCK_${id}@@`;
    });
    text = escapeHtml(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    return text.replace(/@@CODEBLOCK_(\d+)@@/g, (_, i) => {
      const b = blocks[+i];
      return `<div class="code-wrap"><div class="code-head"><span>${escapeHtml(
        b.lang
      )}</span><button type="button" class="copy-code-btn" data-code="${escapeHtml(
        b.code
      )}">Copy</button></div><pre>${escapeHtml(b.code)}</pre></div>`;
    });
  }

  if (chatMessages) {
    chatMessages.addEventListener("click", (e) => {
      const btn = e.target.closest(".copy-code-btn");
      if (!btn) return;
      navigator.clipboard.writeText(btn.dataset.code).then(() => {
        btn.textContent = I18N[lang()].copiedWord;
        setTimeout(() => (btn.textContent = "Copy"), 1400);
      });
    });
  }

  function appendMessage(role, content, meta = "") {
    if (!chatMessages) return null;
    const box = document.createElement("div");
    box.className = `msg ${role === "user" ? "user" : "bot"}`;
    box.innerHTML = formatChatMessage(content);
    if (meta) {
      const m = document.createElement("div");
      m.className = "msg-meta";
      m.textContent = meta;
      box.appendChild(m);
    }
    chatMessages.appendChild(box);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return box;
  }

  function renderMessages() {
    if (!chatMessages) return;
    chatMessages.innerHTML = "";
    if (chatHistory.length === 0) {
      appendMessage("bot", I18N[lang()].welcomeMsg);
      return;
    }
    chatHistory.forEach((m) => appendMessage(m.role, m.content, m.meta || ""));
  }

  if (chatForm && chatInput && sendBtn) {
    chatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text || sendBtn.disabled) return;
      if (chatHistory.length === 0) chatMessages.innerHTML = "";
      chatHistory.push({ role: "user", content: text });
      appendMessage("user", text);
      chatInput.value = "";
      sendBtn.disabled = true;
      const typingEl = appendMessage("bot", I18N[lang()].thinking);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: chatHistory.slice(-10, -1),
            lang: lang()
          })
        });
        const data = await res.json();
        if (typingEl) typingEl.remove();
        if (!res.ok) {
          appendMessage("bot", data.error || "Request failed.");
        } else {
          const reply = data.reply || "";
          const meta = data.provider ? `NEUROATLAS · ${data.provider}` : "";
          chatHistory.push({ role: "assistant", content: reply, meta });
          appendMessage("bot", reply, meta);
        }
      } catch (err) {
        if (typingEl) typingEl.remove();
        appendMessage("bot", "Connection error: " + err.message);
      } finally {
        sendBtn.disabled = false;
        chatInput.focus();
      }
    });

    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event("submit"));
      }
    });
  }

  const clearBtn = document.getElementById("clearChatBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      chatHistory = [];
      renderMessages();
    });
  }

  /* ========================================================================
     2. 23-Chapter Neuroscience Atlas (Auto-Translation + 3-Lang Compare)
     ======================================================================== */

  function sourceNames(ids) {
    return ids
      .map((id) => {
        const s = SOURCES.find((x) => x.id === id);
        return s
          ? `<a class="ext" href="${s.url}" target="_blank" rel="noopener">${s.id} · ${escapeHtml(s.name)}</a>`
          : id;
      })
      .join(" · ");
  }

  function answerForQuestion(chapter, question) {
    const stop = new Set([
      "what", "which", "when", "where", "why", "how", "does", "are", "is",
      "the", "and", "for", "from", "with", "into", "about", "name", "give", "one", "two", "three"
    ]);
    const kws = (question.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 2 && !stop.has(w));
    const ranked = chapter.sections
      .map((s) => ({
        s,
        score: kws.reduce((n, w) => n + ((s[0] + " " + s[1]).toLowerCase().includes(w) ? 1 : 0), 0)
      }))
      .sort((a, b) => b.score - a.score);
    if (!ranked.length || ranked[0].score === 0) return chapter.takeaway + " " + chapter.intro;
    return ranked.slice(0, 2).map((x) => x.s[1]).join(" ");
  }

  const chCacheKey = (id, l) => `na_ch_tr_${l}_${id}`;

  function updateChapterToggleBtn() {
    const toggleBtn = document.getElementById("toggleChaptersBtn");
    const nav = document.getElementById("chapterNav");
    if (!toggleBtn || !nav) return;
    const d = I18N[lang()];
    nav.classList.toggle("collapsed-mobile", !chaptersOpenMobile);
    toggleBtn.textContent = chaptersOpenMobile ? d.chaptersToggleHide : d.chaptersToggleShow;
  }

  const toggleChaptersBtn = document.getElementById("toggleChaptersBtn");
  if (toggleChaptersBtn) {
    toggleChaptersBtn.addEventListener("click", () => {
      chaptersOpenMobile = !chaptersOpenMobile;
      updateChapterToggleBtn();
    });
  }

  function formatTranslatedChapter(raw) {
    return escapeHtml(raw)
      .split(/\n{2,}/)
      .map((block) => {
        const trimmed = block.trim();
        if (!trimmed) return "";
        if (trimmed.startsWith("## ")) {
          return `<h3>${trimmed.slice(3).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")}</h3>`;
        }
        return `<p>${trimmed
          .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
          .replace(/\n/g, "<br>")}</p>`;
      })
      .join("");
  }

  function renderEnglishChapterBody(c, d) {
    return `<p style="margin:14px 0">${escapeHtml(c.intro)}</p>${c.sections
      .map((s) => `<h3>${escapeHtml(s[0])}</h3><p>${escapeHtml(s[1])}</p>`)
      .join("")}<div class="callout"><strong>${escapeHtml(d.keyConceptLbl)}</strong> ${escapeHtml(
      c.takeaway
    )}</div><div class="callout"><strong>${escapeHtml(d.distinctionLbl)}</strong> ${escapeHtml(
      c.misconception
    )}</div><h3>${escapeHtml(d.reviewLbl)}</h3>${c.questions
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
    if (localStorage.getItem(cacheKey) || translatingChapters.has(cacheKey)) return;

    translatingChapters.add(cacheKey);
    chapterAutoError = "";
    if (activeChapterIdx === i && chapterDisplayLang === targetLang) {
      renderChapter(i, false);
    }

    const sourceText = [
      `Title: ${c.title}`,
      `Subtitle: ${c.subtitle}`,
      `Intro: ${c.intro}`,
      ...c.sections.map((s) => `## ${s[0]}\n${s[1]}`),
      `Key Concept: ${c.takeaway}`,
      `Important Distinction: ${c.misconception}`,
      `Review Questions:\n` + c.questions.map((q, j) => `${j + 1}. ${q} -> ${answerForQuestion(c, q)}`).join("\n")
    ].join("\n\n");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: sourceText, lang: targetLang, mode: "translate" })
      });
      const data = await res.json();
      if (!res.ok || !data.reply) throw new Error(data.error || "Translation failed");
      localStorage.setItem(cacheKey, data.reply);
      chapterAutoError = "";
    } catch {
      chapterAutoError = I18N[lang()].autoTrErr;
    } finally {
      translatingChapters.delete(cacheKey);
      if (activeChapterIdx === i && chapterDisplayLang === targetLang) {
        renderChapter(i, false);
      }
    }
  }

  function renderChapter(i, triggerAuto = true) {
    if (!CHAPTERS[i]) return;
    activeChapterIdx = i;
    const siteLang = lang();
    const d = I18N[siteLang];
    const c = CHAPTERS[i];
    const viewLang = chapterDisplayLang;
    const meta = getChapterMeta(c, viewLang);
    const cacheKey = chCacheKey(c.id, viewLang);
    const cached = viewLang !== "en" ? localStorage.getItem(cacheKey) : null;
    const isTranslating = viewLang !== "en" && translatingChapters.has(cacheKey);

    if (
      triggerAuto &&
      viewLang !== "en" &&
      !cached &&
      !isTranslating &&
      UI.getActiveView() === "atlas"
    ) {
      ensureChapterTranslation(i, viewLang);
    }

    const langDir = viewLang === "fa" ? "rtl" : "ltr";
    const langBar = `<div class="article-lang-bar">
      <span class="article-lang-label">${escapeHtml(d.articleLangLabel)}</span>
      <div class="article-lang-pills">
        <button type="button" class="article-lang-btn ${viewLang === "en" ? "active" : ""}" onclick="setChapterLang('en', ${i})">EN</button>
        <button type="button" class="article-lang-btn ${viewLang === "fa" ? "active" : ""}" onclick="setChapterLang('fa', ${i})">فا</button>
        <button type="button" class="article-lang-btn ${viewLang === "tr" ? "active" : ""}" onclick="setChapterLang('tr', ${i})">TR</button>
        ${
          viewLang !== "en"
            ? `<button type="button" class="article-lang-btn ${chapterCompareOriginal ? "active" : ""}" onclick="toggleChapterCompare(${i})">${escapeHtml(
                chapterCompareOriginal ? d.hideCompareBtn : d.sideCompareBtn
              )}</button>`
            : ""
        }
      </div>
    </div>`;

    let statusBanner = "";
    if (isTranslating) {
      statusBanner = `<div class="callout">${escapeHtml(I18N[viewLang].translatingMsg || d.translatingMsg)}</div>`;
    } else if (viewLang !== "en" && !cached && chapterAutoError) {
      statusBanner = `<div class="callout muted">${escapeHtml(chapterAutoError)}</div>`;
    }

    let bodyHtml = "";
    if (viewLang !== "en" && cached) {
      bodyHtml = `<div class="translated-chapter-body" dir="${langDir}">${formatTranslatedChapter(cached)}</div>`;
      if (chapterCompareOriginal) {
        bodyHtml += `<div class="article-compare-box" dir="ltr"><div class="tag">${escapeHtml(
          d.compareOriginalTag
        )}</div><h3 style="margin-top:4px">${escapeHtml(c.title)}</h3>${renderEnglishChapterBody(c, I18N.en)}</div>`;
      }
    } else {
      bodyHtml = `<div dir="ltr">${renderEnglishChapterBody(c, viewLang === "en" ? I18N.en : d)}</div>`;
    }

    const contentEl = document.getElementById("chapterContent");
    if (contentEl) {
      contentEl.innerHTML = `<div class="tag">${escapeHtml(meta.category)} · ${escapeHtml(d.chapterWord)} ${escapeHtml(
        c.id
      )}</div><h2 dir="${langDir}">${escapeHtml(meta.title)}</h2><p class="muted" dir="${langDir}">${escapeHtml(
        meta.subtitle
      )}</p>${langBar}${statusBanner}${bodyHtml}<p class="muted" style="margin-top:16px">${escapeHtml(
        d.refsLbl
      )} ${sourceNames(c.sources)}</p><div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap"><button class="btn-ghost" onclick="saveChapterNote(${i})">${escapeHtml(
        d.saveWorkBtn
      )}</button>${
        i > 0
          ? `<button class="btn-ghost" onclick="openChapterIndex(${i - 1})">${escapeHtml(d.prevBtn)}</button>`
          : ""
      }${
        i < CHAPTERS.length - 1
          ? `<button class="btn-primary" onclick="openChapterIndex(${i + 1})">${escapeHtml(d.nextBtn)}</button>`
          : ""
      }</div>`;
    }

    document.querySelectorAll("#chapterNav .chapter-btn").forEach((b, j) => b.classList.toggle("active", j === i));
  }

  function initAtlas(keepActive = false) {
    const nav = document.getElementById("chapterNav");
    if (!nav) return;
    if (!CHAPTERS.length) {
      nav.innerHTML = "<p class='muted'>Atlas data missing.</p>";
      return;
    }
    const cats = [...new Set(CHAPTERS.map((c) => c.category))];
    const t = trData();
    nav.innerHTML = cats
      .map(
        (cat) =>
          `<div class="chapter-group"><div class="tag" style="margin-top:10px">${escapeHtml(
            (t && t.categories && t.categories[cat]) || cat
          )}</div>${CHAPTERS.map((c, i) =>
            c.category === cat
              ? `<button class="chapter-btn" data-i="${i}">${c.id} · ${escapeHtml(getChapterMeta(c).title)}</button>`
              : ""
          ).join("")}</div>`
      )
      .join("");

    nav.querySelectorAll(".chapter-btn").forEach((b) => {
      b.addEventListener("click", () => {
        chapterDisplayLang = lang();
        chapterCompareOriginal = false;
        chapterAutoError = "";
        renderChapter(+b.dataset.i);
        if (window.innerWidth <= 1024) {
          chaptersOpenMobile = false;
          updateChapterToggleBtn();
        }
      });
    });

    const filter = document.getElementById("chapterFilter");
    const countEl = document.getElementById("chapterFilterCount");
    if (countEl) countEl.textContent = `${CHAPTERS.length}`;
    if (filter) {
      filter.oninput = () => {
        const q = filter.value.trim().toLowerCase();
        let shown = 0;
        nav.querySelectorAll(".chapter-group").forEach((g) => {
          let any = false;
          g.querySelectorAll(".chapter-btn").forEach((b) => {
            const c = CHAPTERS[+b.dataset.i];
            const m = getChapterMeta(c);
            const ok =
              !q ||
              [c.title, m.title, c.category, m.category, c.intro, ...c.key].join(" ").toLowerCase().includes(q);
            b.classList.toggle("chapter-hidden", !ok);
            if (ok) {
              any = true;
              shown++;
            }
          });
          g.classList.toggle("chapter-hidden", !any);
        });
        if (countEl) countEl.textContent = `${shown} / ${CHAPTERS.length}`;
      };
    }

    updateChapterToggleBtn();
    renderChapter(keepActive ? activeChapterIdx : 0);
  }

  /* ========================================================================
     3. PubMed Search (Auto-Translate + 3-Language Comparison) & Notes
     ======================================================================== */

  async function translateSingleText(text, targetLang) {
    if (targetLang === "en") return text;
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, lang: targetLang, mode: "translate" })
    });
    const data = await res.json();
    if (!res.ok || !data.reply) throw new Error(data.error || "Error");
    return data.reply.trim();
  }

  function renderPubMedResults() {
    const out = document.getElementById("pubmedResults");
    if (!out) return;
    if (!pubmedItems.length) {
      out.innerHTML = "";
      return;
    }
    const l = lang();
    const d = I18N[l];

    out.innerHTML = pubmedItems
      .map((item, idx) => {
        const activeTitle = (l !== "en" && item.translations[l]) || item.titleEn;
        const activeDir = l !== "en" && item.translations[l] && l === "fa" ? "rtl" : "ltr";

        let compareBox = "";
        if (item.compareLang) {
          const cl = item.compareLang;
          const clDir = cl === "fa" ? "rtl" : "ltr";
          const tagLabel =
            cl === "en" ? d.compareOriginalTag : cl === "fa" ? d.compareFaTag : d.compareTrTag;
          const clText =
            item.loadingLang === cl
              ? "..."
              : item.translations[cl] || (cl === "en" ? item.titleEn : d.autoTrErr);
          compareBox = `<div class="article-compare-box" dir="${clDir}"><div class="tag">${escapeHtml(
            tagLabel
          )}</div><div>${escapeHtml(clText)}</div></div>`;
        }

        return `<div class="callout">
          <div class="tag">PMID ${escapeHtml(item.id)}</div>
          <strong dir="${activeDir}" style="display:block">${escapeHtml(activeTitle)}</strong>
          <p class="muted" style="margin-top:4px">${escapeHtml(item.metaLine)}</p>
          <div class="pubmed-actions">
            <a class="ext" href="https://pubmed.ncbi.nlm.nih.gov/${escapeHtml(item.id)}/" target="_blank" rel="noopener">${escapeHtml(
          d.openPubmed
        )}</a>
            <div class="article-lang-pills">
              <span class="article-lang-label">${escapeHtml(d.compareLabel)}</span>
              <button type="button" class="article-lang-btn ${item.compareLang === "en" ? "active" : ""}" onclick="comparePubMedLang(${idx}, 'en')">EN</button>
              <button type="button" class="article-lang-btn ${item.compareLang === "fa" ? "active" : ""}" onclick="comparePubMedLang(${idx}, 'fa')">فا</button>
              <button type="button" class="article-lang-btn ${item.compareLang === "tr" ? "active" : ""}" onclick="comparePubMedLang(${idx}, 'tr')">TR</button>
            </div>
          </div>
          ${compareBox}
        </div>`;
      })
      .join("");
  }

  async function autoTranslatePubMedList(targetLang) {
    if (!pubmedItems.length || targetLang === "en" || pubmedTranslating) return;
    const missing = pubmedItems.filter((item) => !item.translations[targetLang]);
    if (!missing.length) {
      renderPubMedResults();
      return;
    }

    pubmedTranslating = true;
    const st = document.getElementById("pubmedStatus");
    const d = I18N[lang()];
    if (st) st.textContent = d.translatingPubmedMsg;

    const numberedPrompt =
      "Translate each numbered neuroscience paper title accurately. Keep exact [1], [2], ... numbering on separate lines:\n\n" +
      missing.map((item, k) => `[${k + 1}] ${item.titleEn}`).join("\n");

    try {
      const batchReply = await translateSingleText(numberedPrompt, targetLang);
      batchReply.split(/\r?\n/).forEach((line) => {
        const m = line.trim().match(/^\[?(\d+)\]?[\.\)\:\-\s]+(.+)$/);
        if (m) {
          const idx = +m[1] - 1;
          if (missing[idx]) {
            const cleaned = m[2].trim();
            missing[idx].translations[targetLang] = cleaned;
            pubmedTrCache[`${targetLang}_${missing[idx].id}`] = cleaned;
          }
        }
      });
    } catch {
      // Fall back below for individual items if batch fails
    }

    for (const item of missing) {
      if (!item.translations[targetLang]) {
        try {
          const single = await translateSingleText(item.titleEn, targetLang);
          item.translations[targetLang] = single;
          pubmedTrCache[`${targetLang}_${item.id}`] = single;
        } catch {
          break;
        }
      }
    }

    pubmedTranslating = false;
    if (st) st.textContent = `${pubmedItems.length} ${I18N[lang()].pubmedDone}`;
    renderPubMedResults();
  }

  window.comparePubMedLang = async (idx, targetLang) => {
    const item = pubmedItems[idx];
    if (!item) return;
    if (item.compareLang === targetLang) {
      item.compareLang = null;
      renderPubMedResults();
      return;
    }
    item.compareLang = targetLang;
    if (targetLang === "en" || item.translations[targetLang]) {
      renderPubMedResults();
      return;
    }
    const cacheKey = `${targetLang}_${item.id}`;
    if (pubmedTrCache[cacheKey]) {
      item.translations[targetLang] = pubmedTrCache[cacheKey];
      renderPubMedResults();
      return;
    }
    item.loadingLang = targetLang;
    renderPubMedResults();
    try {
      const translated = await translateSingleText(item.titleEn, targetLang);
      item.translations[targetLang] = translated;
      pubmedTrCache[cacheKey] = translated;
    } catch {
      // Error handled smoothly in renderPubMedResults
    } finally {
      item.loadingLang = null;
      renderPubMedResults();
    }
  };

  const pubmedBtn = document.getElementById("pubmedBtn");
  const pubmedQueryEl = document.getElementById("pubmedQuery");
  if (pubmedQueryEl && pubmedBtn) {
    pubmedQueryEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        pubmedBtn.click();
      }
    });
  }

  if (pubmedBtn) {
    pubmedBtn.addEventListener("click", async () => {
      const l = lang();
      const d = I18N[l];
      const q = document.getElementById("pubmedQuery").value.trim();
      const st = document.getElementById("pubmedStatus");
      const out = document.getElementById("pubmedResults");
      if (!q) return;
      st.textContent = d.pubmedSearching;
      out.innerHTML = "";
      pubmedItems = [];
      try {
        const r1 = await (
          await fetch(
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=8&term=" +
              encodeURIComponent(q)
          )
        ).json();
        const ids = (r1.esearchresult && r1.esearchresult.idlist) || [];
        if (!ids.length) {
          st.textContent = d.pubmedNone;
          return;
        }
        const r2 = (
          await (
            await fetch(
              "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=" +
                ids.join(",")
            )
          ).json()
        ).result;

        pubmedItems = ids.map((id) => {
          const x = r2[id] || {};
          const titleEn = x.title || "Untitled";
          const translations = { en: titleEn };
          if (pubmedTrCache[`fa_${id}`]) translations.fa = pubmedTrCache[`fa_${id}`];
          if (pubmedTrCache[`tr_${id}`]) translations.tr = pubmedTrCache[`tr_${id}`];
          return {
            id,
            titleEn,
            metaLine: (x.fulljournalname || x.source || "") + (x.pubdate ? " · " + x.pubdate : ""),
            translations,
            compareLang: null,
            loadingLang: null
          };
        });

        st.textContent = `${ids.length} ${d.pubmedDone}`;
        renderPubMedResults();
        if (lang() !== "en") {
          autoTranslatePubMedList(lang());
        }
      } catch {
        st.textContent = d.pubmedErr;
      }
    });
  }

  const getNotes = () => {
    try {
      return JSON.parse(localStorage.getItem("neuroatlas_notes") || "[]");
    } catch {
      return [];
    }
  };

  function renderNotes() {
    const listEl = document.getElementById("notesList");
    if (!listEl) return;
    const d = I18N[lang()];
    const ns = getNotes();
    listEl.innerHTML = ns.length
      ? ns
          .map(
            (n, i) =>
              `<div class="callout"><div class="tag">${new Date(n.date).toLocaleDateString()}</div><strong>${escapeHtml(
                n.title
              )}</strong><p class="muted" style="white-space:pre-wrap;margin:6px 0">${escapeHtml(
                n.body
              )}</p><button class="btn-ghost" onclick="deleteNote(${i})">${escapeHtml(d.deleteBtn)}</button></div>`
          )
          .join("")
      : `<p class='muted'>${escapeHtml(d.noNotes)}</p>`;
  }

  window.deleteNote = (i) => {
    const ns = getNotes();
    ns.splice(i, 1);
    localStorage.setItem("neuroatlas_notes", JSON.stringify(ns));
    renderNotes();
  };

  window.saveChapterNote = (i) => {
    const c = CHAPTERS[i];
    if (!c) return;
    const ns = getNotes();
    ns.unshift({
      title: getChapterMeta(c).title,
      body: c.intro + "\n\nKey takeaway: " + c.takeaway,
      date: new Date().toISOString()
    });
    localStorage.setItem("neuroatlas_notes", JSON.stringify(ns));
    renderNotes();
    alert(I18N[lang()].savedAlert);
  };

  const saveNoteBtn = document.getElementById("saveNote");
  if (saveNoteBtn) {
    saveNoteBtn.addEventListener("click", () => {
      const titleEl = document.getElementById("noteTitle");
      const bodyEl = document.getElementById("noteBody");
      const title = titleEl.value.trim();
      const body = bodyEl.value.trim();
      if (!title || !body) return;
      const ns = getNotes();
      ns.unshift({ title, body, date: new Date().toISOString() });
      localStorage.setItem("neuroatlas_notes", JSON.stringify(ns));
      titleEl.value = "";
      bodyEl.value = "";
      renderNotes();
    });
  }

  const exportBtn = document.getElementById("exportNotes");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(getNotes(), null, 2)], { type: "application/json" }));
      a.download = "neuroatlas-notes.json";
      a.click();
    });
  }

  const buildBtn = document.getElementById("buildQuestion");
  if (buildBtn) {
    buildBtn.addEventListener("click", () => {
      const t = document.getElementById("rdTopic").value.trim();
      if (!t) return;
      const p = document.getElementById("rdPopulation").value.trim() || "[population]";
      const ex = document.getElementById("rdExposure").value.trim() || "[factor]";
      const o = document.getElementById("rdOutcome").value.trim() || "[outcome]";
      const mSel = document.getElementById("rdMethod");
      const m = mSel.options[mSel.selectedIndex].text;
      const l = lang();
      lastOutline =
        l === "fa"
          ? `موضوع: ${t}\nروش پیشنهادی: ${m}\nسوال پژوهش: در ${p}، چگونه ${ex} با ${o} در زمینه «${t}» ارتباط دارد؟`
          : l === "tr"
          ? `Konu: ${t}\nYöntem: ${m}\nAraştırma Sorusu: ${p} grubunda, ${t} bağlamında ${ex} ile ${o} arasındaki ilişki nasıldır?`
          : `Topic: ${t}\nMethod: ${m}\nDraft Question: In ${p}, how is ${ex} related to ${o} in the context of ${t}?`;
      document.getElementById("researchOutline").textContent = lastOutline;
    });
  }

  const saveQuestionBtn = document.getElementById("saveQuestion");
  if (saveQuestionBtn) {
    saveQuestionBtn.addEventListener("click", () => {
      if (!lastOutline) return;
      const ns = getNotes();
      ns.unshift({ title: I18N[lang()].outlineTag, body: lastOutline, date: new Date().toISOString() });
      localStorage.setItem("neuroatlas_notes", JSON.stringify(ns));
      renderNotes();
      alert(I18N[lang()].savedAlert);
    });
  }

  /* ========================================================================
     4. Methods, Sources, Concept Map, Glossary, Flashcards & Quiz
     ======================================================================== */

  function initExtras() {
    const l = lang();
    const d = I18N[l];
    const t = trData();

    const methodsEl = document.getElementById("methodsContent");
    if (methodsEl) {
      const methodsList = (t && t.methods) || METHODS;
      methodsEl.innerHTML = METHODS.map((orig, i) => {
        const m = methodsList[i] || orig;
        return `<div class="callout"><div class="tag">${escapeHtml(d.methodWord)} ${String(i + 1).padStart(
          2,
          "0"
        )}</div><h3>${escapeHtml(m[0])}</h3><p>${escapeHtml(m[1])}</p><p class="muted" style="margin-top:6px"><strong>${escapeHtml(
          d.limitLbl
        )}</strong> ${escapeHtml(m[2])}</p><div style="margin-top:6px">${sourceNames([orig[3]])}</div></div>`;
      }).join("");
    }

    const sourceFilter = document.getElementById("sourceFilter");
    if (sourceFilter) {
      const renderSources = () => {
        const q = (sourceFilter.value || "").toLowerCase();
        const list = SOURCES.filter((s) => (s.id + s.name + s.use).toLowerCase().includes(q));
        document.getElementById("sourceCountLabel").textContent = `${list.length} / ${SOURCES.length}`;
        document.getElementById("sourceList").innerHTML = list
          .map(
            (s) =>
              `<div class="callout"><div class="tag">${escapeHtml(s.id)} · ${escapeHtml(
                (t && t.sourceTypes && t.sourceTypes[s.type]) || s.type
              )}</div><strong>${escapeHtml(s.name)}</strong><p class="muted">${escapeHtml(
                s.use
              )}</p><a class="ext" href="${s.url}" target="_blank" rel="noopener">${escapeHtml(d.openSource)}</a></div>`
          )
          .join("");
      };
      sourceFilter.oninput = renderSources;
      renderSources();
    }

    const mapGrid = document.getElementById("mapGrid");
    if (mapGrid) {
      const mapList = (t && t.map) || MAP;
      mapGrid.innerHTML = MAP.map((orig, i) => {
        const m = mapList[i] || orig;
        return `<button type="button" class="map-node" data-map="${i}"><div class="tag">${escapeHtml(
          m[1]
        )}</div><strong>${escapeHtml(m[0])}</strong><div class="muted">${escapeHtml(m[2])}</div></button>`;
      }).join("");
      const mapNodes = mapGrid.querySelectorAll(".map-node");
      mapNodes.forEach((b) => {
        b.onclick = () => {
          mapNodes.forEach((node) => node.classList.toggle("active", node === b));
          const idx = +b.dataset.map;
          const orig = MAP[idx];
          const m = mapList[idx] || orig;
          document.getElementById("mapDetail").innerHTML = `<strong>${escapeHtml(m[0])}:</strong> ${escapeHtml(
            m[2]
          )}<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${orig[3]
            .map((id) => {
              const ci = CHAPTERS.findIndex((c) => c.id === id);
              return ci >= 0
                ? `<button type="button" class="map-chapter-btn" onclick="window.switchView('atlas');openChapterIndex(${ci})">${id} · ${escapeHtml(
                    getChapterMeta(CHAPTERS[ci]).title
                  )}</button>`
                : "";
            })
            .join("")}</div>`;
        };
      });
    }

    const glossaryFilter = document.getElementById("glossaryFilter");
    if (glossaryFilter) {
      const glossList = (t && t.glossary) || GLOSSARY;
      const renderGlossary = () => {
        const q = (glossaryFilter.value || "").toLowerCase();
        const filtered = glossList.filter((g, i) =>
          (g[0] + " " + g[1] + " " + (GLOSSARY[i] ? GLOSSARY[i][0] : "")).toLowerCase().includes(q)
        );
        document.getElementById("glossaryCount").textContent = `${filtered.length} / ${glossList.length}`;
        document.getElementById("glossaryList").innerHTML = filtered
          .map((g) => `<div class="callout"><strong>${escapeHtml(g[0])}</strong><p class="muted">${escapeHtml(g[1])}</p></div>`)
          .join("");
      };
      glossaryFilter.oninput = renderGlossary;
      renderGlossary();
    }

    const flashList = (t && t.flash) || FLASH;
    if (flashList.length && document.getElementById("flashQ")) {
      const drawF = () => {
        document.getElementById("flashQ").textContent = flashList[flashIdx][0];
        document.getElementById("flashA").textContent = flashList[flashIdx][1];
        document.getElementById("flashA").classList.toggle("hidden", !flashShown);
        document.getElementById("flipCard").textContent = flashShown ? d.hideAnsBtn : d.revealAnsBtn;
      };
      document.getElementById("flipCard").onclick = () => {
        flashShown = !flashShown;
        drawF();
      };
      document.getElementById("nextCard").onclick = () => {
        flashIdx = (flashIdx + 1) % flashList.length;
        flashShown = false;
        drawF();
      };
      drawF();
    }

    const quizArea = document.getElementById("quizArea");
    if (quizArea) {
      const quizList = (t && t.quiz) || QUIZ;
      quizArea.innerHTML = quizList
        .map(
          (q, i) =>
            `<div class="quiz-q"><strong>${i + 1}. ${escapeHtml(q.q)}</strong>${q.a
              .map((opt, j) => `<label><input type="radio" name="qz${i}" value="${j}"> ${escapeHtml(opt)}</label>`)
              .join("")}</div>`
        )
        .join("");
      const scoreBox = document.getElementById("quizScore");
      scoreBox.classList.add("hidden");
      document.getElementById("gradeQuiz").onclick = () => {
        let score = 0;
        const notes = quizList.map((q, i) => {
          const v = document.querySelector(`input[name="qz${i}"]:checked`);
          const ok = v && +v.value === QUIZ[i].c;
          if (ok) score++;
          return `${i + 1}. ${ok ? "✓" : "✗"} ${q.why}`;
        });
        scoreBox.classList.remove("hidden");
        scoreBox.innerHTML = `<strong>${escapeHtml(d.scoreLbl)} ${score}/${quizList.length}</strong><br>${notes
          .map(escapeHtml)
          .join("<br>")}`;
      };
    }
  }

  /* ========================================================================
     5. Secure Web3Forms Contact & Anti-Bot Email Shield
     ======================================================================== */

  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const d = I18N[lang()];
      const st = document.getElementById("contactStatus");
      if (document.getElementById("botcheck").checked) return;
      const btn = document.getElementById("contactSubmitBtn");
      btn.disabled = true;
      st.textContent = d.cSending;
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: WEB3FORMS_KEY,
            subject: "NEUROATLAS: " + document.getElementById("contactCategory").value,
            name: document.getElementById("contactName").value.trim(),
            email: document.getElementById("contactEmail").value.trim() || "noreply@web3forms.com",
            message: document.getElementById("contactMsg").value.trim()
          })
        });
        const data = await res.json();
        if (data.success) {
          st.textContent = d.cSent;
          e.target.reset();
        } else {
          st.textContent = "Error: " + (data.message || "");
        }
      } catch {
        st.textContent = d.cNetErr;
      } finally {
        btn.disabled = false;
      }
    });
  }

  const revealEmailBtn = document.getElementById("revealEmailBtn");
  const copyEmailBtn = document.getElementById("copyEmailBtn");
  if (revealEmailBtn) {
    revealEmailBtn.addEventListener("click", () => {
      const box = document.getElementById("emailRevealBox");
      box.textContent = `${EMAIL_PARTS[0]} [at] ${EMAIL_PARTS[1]} [dot] ${EMAIL_PARTS[2]}`;
      box.classList.remove("hidden");
      if (copyEmailBtn) copyEmailBtn.classList.remove("hidden");
    });
  }
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(`${EMAIL_PARTS[0]}@${EMAIL_PARTS[1]}.${EMAIL_PARTS[2]}`).then(() => {
        copyEmailBtn.textContent = I18N[lang()].copiedWord;
        setTimeout(() => (copyEmailBtn.textContent = I18N[lang()].copyEmailBtn), 1500);
      });
    });
  }

  /* ========================================================================
     6. Global Exports & Language / View Lifecycle Hooks
     ======================================================================== */

  window.setChapterLang = (targetLang, idx) => {
    chapterDisplayLang = targetLang;
    chapterCompareOriginal = false;
    chapterAutoError = "";
    renderChapter(idx, true);
    if (targetLang !== "en") {
      ensureChapterTranslation(idx, targetLang);
    }
  };

  window.toggleChapterCompare = (idx) => {
    chapterCompareOriginal = !chapterCompareOriginal;
    renderChapter(idx, false);
  };

  window.openChapterIndex = (idx) => {
    chapterCompareOriginal = false;
    chapterAutoError = "";
    renderChapter(idx, true);
  };

  function syncAppWithLanguage() {
    chapterDisplayLang = lang();
    chapterCompareOriginal = false;
    chapterAutoError = "";
    updateChapterToggleBtn();
    if (chatHistory.length === 0) renderMessages();
    initAtlas(true);
    initExtras();
    renderNotes();
    if (pubmedItems.length) {
      renderPubMedResults();
      if (lang() !== "en" && UI.getActiveView() === "research") {
        autoTranslatePubMedList(lang());
      }
    }
  }

  window.NEURO_APP = {
    onLanguageChange: syncAppWithLanguage,
    onViewChange: (viewName) => {
      if (viewName === "atlas") {
        if (chapterDisplayLang !== lang()) {
          chapterDisplayLang = lang();
          chapterCompareOriginal = false;
        }
        renderChapter(activeChapterIdx, true);
      } else if (viewName === "research" && pubmedItems.length && lang() !== "en") {
        autoTranslatePubMedList(lang());
      }
    },
    openChapter: (idx) => {
      chapterDisplayLang = lang();
      chapterCompareOriginal = false;
      chapterAutoError = "";
      renderChapter(idx, true);
    }
  };

  syncAppWithLanguage();
})();