/* ==========================================================================
   NEUROATLAS — Research Module (PubMed, Question Builder, Methods & Sources)
   ========================================================================== */

(function () {
  "use strict";

  const NEURO = window.NEURO;
  const {
    DATA,
    TRANS,
    escapeHtml,
    t,
    sourceNamesHtml,
    showToast
  } = NEURO;

  const METHODS = DATA.METHODS || [];
  const SOURCES = DATA.SOURCES || [];

  const pubmedQueryEl = document.getElementById("pubmedQuery");
  const pubmedBtn = document.getElementById("pubmedBtn");
  const pubmedStatusEl = document.getElementById("pubmedStatus");
  const pubmedResultsEl = document.getElementById("pubmedResults");

  const rdTopicEl = document.getElementById("rdTopic");
  const rdPopEl = document.getElementById("rdPopulation");
  const rdExpEl = document.getElementById("rdExposure");
  const rdOutEl = document.getElementById("rdOutcome");
  const rdMethodEl = document.getElementById("rdMethod");
  const buildQuestionBtn = document.getElementById("buildQuestion");
  const saveQuestionBtn = document.getElementById("saveQuestion");
  const outlineEl = document.getElementById("researchOutline");

  const methodsContentEl = document.getElementById("methodsContent");
  const sourceFilterEl = document.getElementById("sourceFilter");
  const sourceCountEl = document.getElementById("sourceCountLabel");
  const sourceListEl = document.getElementById("sourceList");

  let pubmedItems = [];
  let searchToken = 0;
  const translatingLangs = new Set();
  const pubmedTrCache = {};
  let lastOutline = "";

  /* ========================================================================
     1. Live PubMed Search & Multi-Language Title Comparison
     ======================================================================== */

  async function translateSingleText(text, targetLang) {
    if (targetLang === "en") return text;
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, lang: targetLang, mode: "translate" })
    });
    const data = await res.json();
    if (!res.ok || !data.reply) throw new Error(data.error || "Translation failed");
    return data.reply.trim();
  }

  function renderPubMedResults() {
    if (!pubmedResultsEl) return;
    if (!pubmedItems.length) {
      pubmedResultsEl.innerHTML = "";
      return;
    }

    const lang = NEURO.getLang();
    pubmedResultsEl.innerHTML = pubmedItems
      .map((item, idx) => {
        const activeTitle = (lang !== "en" && item.translations[lang]) || item.titleEn;
        const activeDir = lang !== "en" && item.translations[lang] && lang === "fa" ? "rtl" : "ltr";

        let compareBox = "";
        if (item.compareLang) {
          const cl = item.compareLang;
          const clDir = cl === "fa" ? "rtl" : "ltr";
          const tagLabel =
            cl === "en"
              ? t("compareOriginalTag")
              : cl === "fa"
              ? t("compareFaTag")
              : t("compareTrTag");
          const clText =
            item.loadingLang === cl
              ? "..."
              : item.translations[cl] || (cl === "en" ? item.titleEn : t("autoTrErr"));
          compareBox = `<div class="article-compare-box" dir="${clDir}"><div class="tag">${escapeHtml(
            tagLabel
          )}</div><div>${escapeHtml(clText)}</div></div>`;
        }

        return `<div class="callout">
          <div class="tag">PMID ${escapeHtml(item.id)}</div>
          <strong dir="${activeDir}" style="display:block">${escapeHtml(activeTitle)}</strong>
          <p class="muted" style="margin-top:4px">${escapeHtml(item.metaLine)}</p>
          <div class="pubmed-actions">
            <a class="ext" href="https://pubmed.ncbi.nlm.nih.gov/${escapeHtml(
              item.id
            )}/" target="_blank" rel="noopener">${escapeHtml(t("openPubmed"))}</a>
            <div class="article-lang-pills">
              <span class="article-lang-label">${escapeHtml(t("compareLabel"))}</span>
              <button type="button" class="article-lang-btn ${
                item.compareLang === "en" ? "active" : ""
              }" data-pm-idx="${idx}" data-pm-lang="en">EN</button>
              <button type="button" class="article-lang-btn ${
                item.compareLang === "fa" ? "active" : ""
              }" data-pm-idx="${idx}" data-pm-lang="fa">فا</button>
              <button type="button" class="article-lang-btn ${
                item.compareLang === "tr" ? "active" : ""
              }" data-pm-idx="${idx}" data-pm-lang="tr">TR</button>
            </div>
          </div>
          ${compareBox}
        </div>`;
      })
      .join("");
  }

  async function autoTranslatePubMedList(targetLang, tokenSnapshot) {
    if (!pubmedItems.length || targetLang === "en") return;
    const lockKey = `${tokenSnapshot}_${targetLang}`;
    if (translatingLangs.has(lockKey)) return;

    const missing = pubmedItems.filter((item) => !item.translations[targetLang]);
    if (!missing.length) {
      renderPubMedResults();
      return;
    }

    translatingLangs.add(lockKey);
    if (pubmedStatusEl) pubmedStatusEl.textContent = t("translatingPubmedMsg");

    const numberedPrompt =
      "Translate each numbered neuroscience paper title accurately. Keep exact [1], [2], ... numbering on separate lines:\n\n" +
      missing.map((item, k) => `[${k + 1}] ${item.titleEn}`).join("\n");

    try {
      const batchReply = await translateSingleText(numberedPrompt, targetLang);
      if (tokenSnapshot !== searchToken) return;
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
      // Fallback to individual translation below
    }

    for (const item of missing) {
      if (tokenSnapshot !== searchToken) break;
      if (!item.translations[targetLang]) {
        try {
          const single = await translateSingleText(item.titleEn, targetLang);
          if (tokenSnapshot !== searchToken) break;
          item.translations[targetLang] = single;
          pubmedTrCache[`${targetLang}_${item.id}`] = single;
        } catch {
          break;
        }
      }
    }

    translatingLangs.delete(lockKey);
    if (tokenSnapshot === searchToken) {
      if (pubmedStatusEl) pubmedStatusEl.textContent = `${pubmedItems.length} ${t("pubmedDone")}`;
      renderPubMedResults();
    }
  }

  if (pubmedResultsEl) {
    pubmedResultsEl.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-pm-idx]");
      if (!btn) return;
      const idx = +btn.dataset.pmIdx;
      const targetLang = btn.dataset.pmLang;
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
        // Rendered cleanly via autoTrErr fallback
      } finally {
        item.loadingLang = null;
        renderPubMedResults();
      }
    });
  }

  async function runPubMedSearch() {
    if (!pubmedQueryEl || !pubmedStatusEl || !pubmedResultsEl) return;
    const q = pubmedQueryEl.value.trim();
    if (!q) return;

    const token = ++searchToken;
    pubmedStatusEl.textContent = t("pubmedSearching");
    pubmedResultsEl.innerHTML = "";
    pubmedItems = [];

    try {
      const r1 = await (
        await fetch(
          "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=8&term=" +
            encodeURIComponent(q)
        )
      ).json();
      if (token !== searchToken) return;

      const ids = (r1.esearchresult && r1.esearchresult.idlist) || [];
      if (!ids.length) {
        pubmedStatusEl.textContent = t("pubmedNone");
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
      if (token !== searchToken) return;

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

      pubmedStatusEl.textContent = `${ids.length} ${t("pubmedDone")}`;
      renderPubMedResults();
      if (NEURO.getLang() !== "en") {
        autoTranslatePubMedList(NEURO.getLang(), token);
      }
    } catch {
      if (token === searchToken) {
        pubmedStatusEl.textContent = t("pubmedErr");
      }
    }
  }

  if (pubmedBtn) pubmedBtn.addEventListener("click", runPubMedSearch);
  if (pubmedQueryEl) {
    pubmedQueryEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        runPubMedSearch();
      }
    });
  }

  /* ========================================================================
     2. Research Question Builder
     ======================================================================== */

  function buildOutlineText() {
    if (!rdTopicEl || !outlineEl) return "";
    const topic = rdTopicEl.value.trim();
    if (!topic) {
      showToast(t("needTopicToast"), "error");
      rdTopicEl.focus();
      return "";
    }
    const pop = (rdPopEl && rdPopEl.value.trim()) || "[population]";
    const exp = (rdExpEl && rdExpEl.value.trim()) || "[factor]";
    const out = (rdOutEl && rdOutEl.value.trim()) || "[outcome]";
    const method =
      rdMethodEl && rdMethodEl.selectedIndex >= 0
        ? rdMethodEl.options[rdMethodEl.selectedIndex].text
        : "";
    const lang = NEURO.getLang();

    lastOutline =
      lang === "fa"
        ? `موضوع: ${topic}\nروش پیشنهادی: ${method}\nسوال پژوهش: در ${pop}، چگونه ${exp} با ${out} در زمینه «${topic}» ارتباط دارد؟`
        : lang === "tr"
        ? `Konu: ${topic}\nYöntem: ${method}\nAraştırma Sorusu: ${pop} grubunda, ${topic} bağlamında ${exp} ile ${out} arasındaki ilişki nasıldır?`
        : `Topic: ${topic}\nMethod: ${method}\nDraft Question: In ${pop}, how is ${exp} related to ${out} in the context of ${topic}?`;

    outlineEl.textContent = lastOutline;
    return lastOutline;
  }

  if (buildQuestionBtn) {
    buildQuestionBtn.addEventListener("click", buildOutlineText);
  }

  if (saveQuestionBtn) {
    saveQuestionBtn.addEventListener("click", () => {
      const outline = buildOutlineText();
      if (!outline) return;
      NEURO.addNote(t("outlineTag"), outline);
      showToast(t("savedAlert"));
    });
  }

  /* ========================================================================
     3. Research Methods & 24 Curated Sources
     ======================================================================== */

  function renderMethods() {
    if (!methodsContentEl) return;
    const lang = NEURO.getLang();
    const tr = TRANS[lang] || null;
    const methodsList = (tr && tr.methods) || METHODS;

    methodsContentEl.innerHTML = METHODS.map((orig, i) => {
      const m = methodsList[i] || orig;
      return `<div id="methodCard-${i}" class="callout"><div class="tag">${escapeHtml(
        t("methodWord")
      )} ${String(i + 1).padStart(2, "0")}</div><h3>${escapeHtml(m[0])}</h3><p>${escapeHtml(
        m[1]
      )}</p><p class="muted" style="margin-top:6px"><strong>${escapeHtml(
        t("limitLbl")
      )}</strong> ${escapeHtml(m[2])}</p><div style="margin-top:6px">${sourceNamesHtml([
        orig[3]
      ])}</div></div>`;
    }).join("");
  }

  function renderSources() {
    if (!sourceListEl) return;
    const lang = NEURO.getLang();
    const tr = TRANS[lang] || null;
    const q = ((sourceFilterEl && sourceFilterEl.value) || "").trim().toLowerCase();
    const list = SOURCES.filter((s) => (s.id + " " + s.name + " " + s.use).toLowerCase().includes(q));

    if (sourceCountEl) sourceCountEl.textContent = `${list.length} / ${SOURCES.length}`;
    sourceListEl.innerHTML = list
      .map(
        (s) =>
          `<div id="sourceCard-${escapeHtml(s.id)}" class="callout"><div class="tag">${escapeHtml(
            s.id
          )} · ${escapeHtml(
            (tr && tr.sourceTypes && tr.sourceTypes[s.type]) || s.type
          )}</div><strong>${escapeHtml(s.name)}</strong><p class="muted">${escapeHtml(
            s.use
          )}</p><a class="ext" href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(
            t("openSource")
          )}</a></div>`
      )
      .join("");
  }

  if (sourceFilterEl) {
    sourceFilterEl.addEventListener("input", renderSources);
  }

  function highlightElement(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("is-highlighted");
    setTimeout(() => el.classList.remove("is-highlighted"), 2200);
  }

  function focusMethod(idx) {
    setTimeout(() => highlightElement(document.getElementById(`methodCard-${idx}`)), 90);
  }

  function focusSource(sourceId) {
    if (sourceFilterEl) sourceFilterEl.value = "";
    renderSources();
    setTimeout(() => highlightElement(document.getElementById(`sourceCard-${sourceId}`)), 90);
  }

  function refreshAll() {
    renderMethods();
    renderSources();
    if (pubmedItems.length) {
      renderPubMedResults();
      if (NEURO.getLang() !== "en" && NEURO.getActiveView() === "research") {
        autoTranslatePubMedList(NEURO.getLang(), searchToken);
      }
    }
  }

  NEURO.registerModule("research", {
    focusMethod,
    focusSource,
    onLanguageChange: refreshAll,
    onViewChange: (viewName) => {
      if (viewName === "research" && pubmedItems.length && NEURO.getLang() !== "en") {
        autoTranslatePubMedList(NEURO.getLang(), searchToken);
      }
    }
  });

  refreshAll();
})();