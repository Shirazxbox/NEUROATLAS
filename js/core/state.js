/* ==========================================================================
   NEUROATLAS — Core Shared State, Storage, Toast & Module Event Bus
   ========================================================================== */

(function () {
  "use strict";

  const DATA = window.NEUROATLAS_DATA || {};
  const TRANS = window.NEUROATLAS_I18N_DATA || {};
  const I18N = window.NEURO_I18N || { en: {} };
  const THEMES = window.NEURO_THEMES || [];
  const THEME_GROUPS = window.NEURO_THEME_GROUPS || {};
  const SPECIMENS = window.NEURO_SPECIMENS || [];

  const STORAGE_KEYS = {
    lang: "na_lang",
    theme: "na_theme",
    notes: "neuroatlas_notes",
    readChapters: "na_read_chapters"
  };

  function safeGet(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  function safeRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  }

  const savedLang = safeGet(STORAGE_KEYS.lang, "en");
  let currentLang = I18N[savedLang] ? savedLang : "en";

  const defaultThemeId = THEMES.some((th) => th.id === "botanical")
    ? "botanical"
    : THEMES.length
    ? THEMES[0].id
    : "botanical";
  const savedTheme = safeGet(STORAGE_KEYS.theme, defaultThemeId);
  let currentTheme = THEMES.some((th) => th.id === savedTheme) ? savedTheme : defaultThemeId;

  let currentView = "home";
  const modules = {};

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  function t(key) {
    const dict = I18N[currentLang] || I18N.en || {};
    return dict[key] !== undefined ? dict[key] : (I18N.en && I18N.en[key]) || key;
  }

  function getChapterMeta(chapter, targetLang = currentLang) {
    const tr = TRANS[targetLang] || null;
    const ch = tr && tr.chapters && tr.chapters[chapter.id];
    return {
      category: (tr && tr.categories && tr.categories[chapter.category]) || chapter.category,
      title: ch ? ch[0] : chapter.title,
      subtitle: ch ? ch[1] : chapter.subtitle
    };
  }

  function sourceNamesHtml(ids) {
    const sources = DATA.SOURCES || [];
    return (ids || [])
      .map((id) => {
        const src = sources.find((x) => x.id === id);
        return src
          ? `<a class="ext" href="${escapeHtml(src.url)}" target="_blank" rel="noopener">${escapeHtml(
              src.id
            )} · ${escapeHtml(src.name)}</a>`
          : escapeHtml(id);
      })
      .join(" · ");
  }

  function showToast(message, type = "info") {
    let region = document.getElementById("toastRegion");
    if (!region) {
      region = document.createElement("div");
      region.id = "toastRegion";
      region.className = "toast-region";
      region.setAttribute("aria-live", "polite");
      document.body.appendChild(region);
    }
    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "toast--error" : ""}`;
    toast.textContent = message;
    region.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3200);
  }

  function getNotes() {
    try {
      const parsed = JSON.parse(safeGet(STORAGE_KEYS.notes, "[]"));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveNotes(list) {
    safeSet(STORAGE_KEYS.notes, JSON.stringify(list));
  }

  function addNote(title, body) {
    const notes = getNotes();
    notes.unshift({ title, body, date: new Date().toISOString() });
    saveNotes(notes);
    if (modules.learn && typeof modules.learn.renderNotes === "function") {
      modules.learn.renderNotes();
    }
  }

  function deleteNoteAt(index) {
    const notes = getNotes();
    notes.splice(index, 1);
    saveNotes(notes);
    if (modules.learn && typeof modules.learn.renderNotes === "function") {
      modules.learn.renderNotes();
    }
  }

  function getReadChapterIds() {
    try {
      const parsed = JSON.parse(safeGet(STORAGE_KEYS.readChapters, "[]"));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function markChapterRead(chapterId) {
    const list = getReadChapterIds();
    if (!list.includes(chapterId)) {
      list.push(chapterId);
      safeSet(STORAGE_KEYS.readChapters, JSON.stringify(list));
    }
    return list;
  }

  function registerModule(name, api) {
    modules[name] = api || {};
  }

  function notifyLanguageChange() {
    Object.values(modules).forEach((mod) => {
      if (typeof mod.onLanguageChange === "function") mod.onLanguageChange();
    });
  }

  function notifyViewChange(viewName) {
    Object.values(modules).forEach((mod) => {
      if (typeof mod.onViewChange === "function") mod.onViewChange(viewName);
    });
  }

  window.NEURO = {
    DATA,
    TRANS,
    I18N,
    THEMES,
    THEME_GROUPS,
    SPECIMENS,
    safeGet,
    safeSet,
    safeRemove,
    escapeHtml,
    t,
    getChapterMeta,
    sourceNamesHtml,
    showToast,
    getNotes,
    addNote,
    deleteNoteAt,
    getReadChapterIds,
    markChapterRead,
    registerModule,
    notifyLanguageChange,
    notifyViewChange,
    getModule: (name) => modules[name] || {},
    getLang: () => currentLang,
    setLang: (lang) => {
      currentLang = I18N[lang] ? lang : "en";
      safeSet(STORAGE_KEYS.lang, currentLang);
      return currentLang;
    },
    getTheme: () => currentTheme,
    setTheme: (themeId) => {
      currentTheme = THEMES.some((th) => th.id === themeId) ? themeId : defaultThemeId;
      safeSet(STORAGE_KEYS.theme, currentTheme);
      return currentTheme;
    },
    getActiveView: () => currentView,
    setActiveView: (name) => {
      currentView = name;
    }
  };
})();