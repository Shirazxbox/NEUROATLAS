/* ==========================================================================
   NEUROATLAS — Core UI Shell, Pluggable Theme Loader, Drawer, Connectome & Search
   ========================================================================== */

(function () {
  "use strict";

  const NEURO = window.NEURO;
  const {
    DATA,
    TRANS,
    THEMES,
    THEME_GROUPS,
    SPECIMENS,
    escapeHtml,
    t,
    getChapterMeta
  } = NEURO;

  let lastStatusState = "checking";
  let lastFocusedBeforeDrawer = null;

  /* ========================================================================
     1. Mobile Slide-Out Drawer with Keyboard Focus Trap
     ======================================================================== */

  const drawer = document.getElementById("mobileDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const drawerCloseBtn = document.getElementById("drawerCloseBtn");

  function openDrawer() {
    if (!drawer || !drawerBackdrop) return;
    lastFocusedBeforeDrawer = document.activeElement;
    drawer.classList.add("open");
    drawerBackdrop.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    if (hamburgerBtn) hamburgerBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("drawer-open");
    if (drawerCloseBtn) {
      setTimeout(() => drawerCloseBtn.focus(), 40);
    }
  }

  function closeDrawer() {
    if (!drawer || !drawerBackdrop || !drawer.classList.contains("open")) return;
    drawer.classList.remove("open");
    drawerBackdrop.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    if (hamburgerBtn) hamburgerBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("drawer-open");
    if (lastFocusedBeforeDrawer && typeof lastFocusedBeforeDrawer.focus === "function") {
      lastFocusedBeforeDrawer.focus();
      lastFocusedBeforeDrawer = null;
    }
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener("click", openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener("click", closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeDrawer);

  if (drawer) {
    drawer.addEventListener("keydown", (e) => {
      if (e.key !== "Tab" || !drawer.classList.contains("open")) return;
      const focusable = drawer.querySelectorAll(
        'button:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ========================================================================
     2. View & Sub-Tab Navigation
     ======================================================================== */

  function switchView(name) {
    NEURO.setActiveView(name);
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
    document.querySelectorAll(".nav-tab").forEach((el) => el.classList.toggle("active", el.dataset.view === name));
    document.querySelectorAll(".drawer-link").forEach((el) => el.classList.toggle("active", el.dataset.view === name));
    closeDrawer();
    if (name === "home") setTimeout(initConnectome, 30);
    NEURO.notifyViewChange(name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function switchSubTab(viewName, subName) {
    const viewEl = document.getElementById("view-" + viewName);
    if (!viewEl) return;
    viewEl.querySelectorAll(".sub-tab").forEach((b) => b.classList.toggle("active", b.dataset.sub === subName));
    viewEl.querySelectorAll(".sub-panel").forEach((p) => p.classList.toggle("active", p.id === "sub-" + subName));
  }

  function jumpToChat() {
    switchView("home");
    setTimeout(() => {
      const panel = document.getElementById("chatPanel");
      const input = document.getElementById("chatInput");
      if (panel) {
        panel.scrollIntoView({
          behavior: "smooth",
          block: window.innerWidth <= 1024 ? "start" : "nearest"
        });
      }
      if (input && window.innerWidth > 1024) input.focus({ preventScroll: true });
    }, 60);
  }

  document.querySelectorAll(".nav-tab, .drawer-link").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  document.querySelectorAll(".sub-tabs").forEach((group) => {
    const pv = group.closest(".view");
    group.querySelectorAll(".sub-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        group.querySelectorAll(".sub-tab").forEach((b) => b.classList.toggle("active", b === btn));
        pv.querySelectorAll(".sub-panel").forEach((p) => p.classList.toggle("active", p.id === "sub-" + btn.dataset.sub));
      });
    });
  });

  const mobileSearchBtn = document.getElementById("mobileSearchBtn");
  if (mobileSearchBtn) {
    mobileSearchBtn.addEventListener("click", () => {
      closeDrawer();
      const input = document.getElementById("globalSearchInput");
      if (input) {
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => input.focus(), 180);
      }
    });
  }

  const fabEl = document.getElementById("fabChat");
  const chatInputEl = document.getElementById("chatInput");
  if (fabEl && chatInputEl) {
    chatInputEl.addEventListener("focus", () => fabEl.classList.add("is-typing-hide"));
    chatInputEl.addEventListener("blur", () => fabEl.classList.remove("is-typing-hide"));
  }

  /* ========================================================================
     3. Interactive Neural Connectome Canvas
     ======================================================================== */

  const neuralCanvas = document.getElementById("neuralCanvas");
  const nCtx = neuralCanvas ? neuralCanvas.getContext("2d") : null;
  let nNodes = [];
  const nColors = { a: "#22d3ee", b: "#34d399" };
  const nPointer = { x: -999, y: -999 };
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function refreshCanvasColors() {
    const st = getComputedStyle(document.documentElement);
    nColors.a = st.getPropertyValue("--accent").trim() || "#22d3ee";
    nColors.b = st.getPropertyValue("--accent-2").trim() || "#34d399";
    if (prefersReducedMotion) drawConnectomeFrame();
  }

  function initConnectome() {
    if (!neuralCanvas || !nCtx) return;
    const rect = neuralCanvas.parentElement.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    neuralCanvas.width = rect.width * dpr;
    neuralCanvas.height = rect.height * dpr;
    nCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    nNodes = Array.from({ length: 24 }, (_, idx) => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: 2 + (idx % 3)
    }));
    if (prefersReducedMotion) drawConnectomeFrame();
  }

  function drawConnectomeFrame() {
    if (!neuralCanvas || !nCtx) return;
    const w = neuralCanvas.parentElement.clientWidth || 400;
    const h = neuralCanvas.parentElement.clientHeight || 120;
    nCtx.clearRect(0, 0, w, h);
    for (let i = 0; i < nNodes.length; i++) {
      const a = nNodes[i];
      if (!prefersReducedMotion) {
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 6 || a.x > w - 6) a.vx *= -1;
        if (a.y < 6 || a.y > h - 6) a.vy *= -1;
      }
      for (let j = i + 1; j < nNodes.length; j++) {
        const b = nNodes[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 95) {
          nCtx.strokeStyle = nColors.a;
          nCtx.globalAlpha = (1 - dist / 95) * 0.36;
          nCtx.lineWidth = 1;
          nCtx.beginPath();
          nCtx.moveTo(a.x, a.y);
          nCtx.lineTo(b.x, b.y);
          nCtx.stroke();
        }
      }
      const mDist = Math.hypot(a.x - nPointer.x, a.y - nPointer.y);
      if (mDist < 110) {
        nCtx.strokeStyle = nColors.b;
        nCtx.globalAlpha = (1 - mDist / 110) * 0.75;
        nCtx.beginPath();
        nCtx.moveTo(a.x, a.y);
        nCtx.lineTo(nPointer.x, nPointer.y);
        nCtx.stroke();
      }
      nCtx.globalAlpha = 0.85;
      nCtx.fillStyle = i % 2 ? nColors.b : nColors.a;
      nCtx.beginPath();
      nCtx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      nCtx.fill();
    }
    nCtx.globalAlpha = 1;
  }

  function stepConnectome() {
    drawConnectomeFrame();
    if (!prefersReducedMotion) requestAnimationFrame(stepConnectome);
  }

  if (neuralCanvas && neuralCanvas.parentElement) {
    neuralCanvas.parentElement.addEventListener("mousemove", (e) => {
      const r = neuralCanvas.getBoundingClientRect();
      nPointer.x = e.clientX - r.left;
      nPointer.y = e.clientY - r.top;
    });
    neuralCanvas.parentElement.addEventListener("mouseleave", () => {
      nPointer.x = -999;
      nPointer.y = -999;
    });
  }

  window.addEventListener("resize", () => {
    initConnectome();
    if (window.innerWidth > 1080) closeDrawer();
  });

  /* ========================================================================
     4. Pluggable Theme Selector Builder & Dynamic CSS Loader
     ======================================================================== */

  const themeSelects = [
    document.getElementById("themeSelect"),
    document.getElementById("drawerThemeSelect")
  ].filter(Boolean);

  function renderThemeOptions() {
    const lang = NEURO.getLang();
    const activeTheme = NEURO.getTheme();
    const grouped = new Map();

    THEMES.forEach((th) => {
      const g = th.group || "classic";
      if (!grouped.has(g)) grouped.set(g, []);
      grouped.get(g).push(th);
    });

    const html = [...grouped.entries()]
      .map(([groupKey, list]) => {
        const groupObj = THEME_GROUPS[groupKey];
        const label = (groupObj && (groupObj[lang] || groupObj.en)) || groupKey;
        const opts = list
          .map((th) => {
            const name = (th.names && (th.names[lang] || th.names.en)) || th.id;
            return `<option value="${escapeHtml(th.id)}">${escapeHtml(name)}</option>`;
          })
          .join("");
        return `<optgroup label="${escapeHtml(label)}">${opts}</optgroup>`;
      })
      .join("");

    themeSelects.forEach((sel) => {
      sel.innerHTML = html;
      sel.value = activeTheme;
    });

    const statThemes = document.getElementById("statThemes");
    if (statThemes && THEMES.length) {
      statThemes.textContent = String(THEMES.length);
    }
  }

  function applyTheme(themeId) {
    const validId = NEURO.setTheme(themeId);
    const themeObj = THEMES.find((x) => x.id === validId);
    document.documentElement.setAttribute("data-theme", validId);

    themeSelects.forEach((sel) => {
      sel.value = validId;
    });

    const linkEl = document.getElementById("themeStylesheet");
    if (linkEl && themeObj && linkEl.getAttribute("href") !== themeObj.css) {
      linkEl.addEventListener("load", refreshCanvasColors, { once: true });
      linkEl.setAttribute("href", themeObj.css);
    } else {
      setTimeout(refreshCanvasColors, 30);
    }
  }

  themeSelects.forEach((sel) => {
    sel.addEventListener("change", (e) => applyTheme(e.target.value));
  });

  /* ========================================================================
     5. Specimens Gallery, API Status & Language Switching
     ======================================================================== */

  function renderSpecimens() {
    const gal = document.getElementById("specimenGallery");
    if (!gal) return;
    const lang = NEURO.getLang();
    gal.innerHTML = SPECIMENS.map((s) => {
      const pair = s[lang] || s.en;
      return `<article class="card gallery-card">
        <div class="gallery-media">
          <img src="${escapeHtml(s.img)}" alt="${escapeHtml(pair[0])}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('is-fallback')" />
          <div class="gallery-fallback" aria-hidden="true">
            <svg width="72" height="72" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="24" stroke="currentColor" stroke-width="1.6" stroke-dasharray="4 3"/>
              <circle cx="28" cy="34" r="4" fill="currentColor"/><circle cx="52" cy="34" r="4" fill="currentColor"/><circle cx="40" cy="52" r="4.5" fill="currentColor"/>
              <path d="M28 34L52 34L40 52Z" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </div>
          <span class="gallery-pill">${escapeHtml(s.badge)}</span>
        </div>
        <div class="gallery-body">
          <h4>${escapeHtml(pair[0])}</h4>
          <p>${escapeHtml(pair[1])}</p>
          <div class="gallery-credit">${escapeHtml(s.credit)}</div>
        </div>
      </article>`;
    }).join("");
  }

  function updateStatusText() {
    const dot = document.getElementById("statusDot");
    const text = document.getElementById("statusText");
    if (!dot || !text) return;
    dot.classList.remove("online");
    if (lastStatusState === "ready") {
      dot.classList.add("online");
      text.textContent = t("statusReady");
    } else if (lastStatusState === "nokey") {
      dot.classList.add("online");
      text.textContent = t("statusNoKey");
    } else if (lastStatusState === "offline") {
      text.textContent = t("statusOffline");
    } else {
      text.textContent = t("statusChecking");
    }
  }

  function applyLanguage(lang) {
    const activeLang = NEURO.setLang(lang);
    closeDrawer();
    document.documentElement.lang = activeLang;
    document.documentElement.dir = t("dir");

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const k = el.getAttribute("data-i18n");
      const val = t(k);
      if (val) el.textContent = val;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const k = el.getAttribute("data-i18n-placeholder");
      const val = t(k);
      if (val) el.setAttribute("placeholder", val);
    });

    document.querySelectorAll(".lang-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.lang === activeLang);
    });

    renderThemeOptions();
    updateStatusText();
    renderSpecimens();
    NEURO.notifyLanguageChange();
  }

  document.querySelectorAll(".lang-btn").forEach((b) => {
    b.addEventListener("click", () => applyLanguage(b.dataset.lang));
  });

  /* ========================================================================
     6. Global Search with Deep Linking to Exact Terms / Methods / Sources
     ======================================================================== */

  function initGlobalSearch() {
    const input = document.getElementById("globalSearchInput");
    const box = document.getElementById("globalSearchResults");
    const wrap = document.getElementById("globalSearchWrap");
    if (!input || !box || !wrap) return;

    const CHAPTERS = DATA.CHAPTERS || [];
    const SOURCES = DATA.SOURCES || [];
    const GLOSSARY = DATA.GLOSSARY || [];
    const METHODS = DATA.METHODS || [];

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      if (!q) {
        box.hidden = true;
        return;
      }

      const lang = NEURO.getLang();
      const tr = TRANS[lang] || null;
      const idx = [];

      CHAPTERS.forEach((c, i) => {
        const m = getChapterMeta(c, lang);
        idx.push({
          type: t("tabAtlas"),
          title: m.title,
          desc: m.subtitle + " · " + c.intro,
          raw: c.title + " " + c.intro + " " + (c.key || []).join(" "),
          view: "atlas",
          ch: i
        });
      });

      ((tr && tr.glossary) || GLOSSARY).forEach((g, i) => {
        idx.push({
          type: t("subGlossary"),
          title: g[0],
          desc: g[1],
          raw: (GLOSSARY[i] || []).join(" "),
          view: "learn",
          sub: "glossary",
          term: g[0]
        });
      });

      SOURCES.forEach((s) => {
        idx.push({
          type: t("subSources"),
          title: s.name,
          desc: s.use,
          raw: s.id,
          view: "research",
          sub: "sources",
          sourceId: s.id
        });
      });

      ((tr && tr.methods) || METHODS).forEach((m, i) => {
        idx.push({
          type: t("subMethods"),
          title: m[0],
          desc: m[1],
          raw: (METHODS[i] || []).join(" "),
          view: "research",
          sub: "methods",
          methodIdx: i
        });
      });

      const hits = idx
        .filter((x) => (x.title + " " + x.desc + " " + x.raw).toLowerCase().includes(q))
        .slice(0, 10);

      box.innerHTML = hits.length
        ? hits
            .map(
              (h, k) =>
                `<button type="button" class="search-item" data-hit="${k}"><small>${escapeHtml(
                  h.type
                )}</small><strong>${escapeHtml(h.title)}</strong><span>${escapeHtml(
                  h.desc.slice(0, 130)
                )}…</span></button>`
            )
            .join("")
        : `<div style="padding:12px" class="muted">${escapeHtml(t("noSearchHit"))}</div>`;

      box.hidden = false;

      box.querySelectorAll("[data-hit]").forEach((btn, k) => {
        btn.addEventListener("click", () => {
          const item = hits[k];
          box.hidden = true;
          switchView(item.view);
          if (item.sub) switchSubTab(item.view, item.sub);

          if (item.view === "atlas" && Number.isInteger(item.ch)) {
            const atlasMod = NEURO.getModule("atlas");
            if (atlasMod.openChapter) atlasMod.openChapter(item.ch);
          } else if (item.sub === "glossary" && item.term) {
            const learnMod = NEURO.getModule("learn");
            if (learnMod.focusGlossary) learnMod.focusGlossary(item.term);
          } else if (item.sub === "methods" && Number.isInteger(item.methodIdx)) {
            const resMod = NEURO.getModule("research");
            if (resMod.focusMethod) resMod.focusMethod(item.methodIdx);
          } else if (item.sub === "sources" && item.sourceId) {
            const resMod = NEURO.getModule("research");
            if (resMod.focusSource) resMod.focusSource(item.sourceId);
          }
        });
      });
    });

    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) box.hidden = true;
    });

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.focus();
      }
      if (e.key === "Escape") {
        box.hidden = true;
        closeDrawer();
      }
    });
  }

  async function checkApiStatus() {
    try {
      const r = await fetch("/api/status");
      if (!r.ok) throw new Error();
      const d = await r.json();
      lastStatusState = d.ai_ready ? "ready" : "nokey";
    } catch {
      lastStatusState = "offline";
    }
    updateStatusText();
  }

  NEURO.switchView = switchView;
  NEURO.switchSubTab = switchSubTab;
  NEURO.jumpToChat = jumpToChat;

  window.switchView = switchView;
  window.switchSubTab = switchSubTab;
  window.jumpToChat = jumpToChat;

  initConnectome();
  if (!prefersReducedMotion) requestAnimationFrame(stepConnectome);
  applyTheme(NEURO.getTheme());
  applyLanguage(NEURO.getLang());
  initGlobalSearch();
  checkApiStatus();
})();