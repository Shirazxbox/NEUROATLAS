/* ==========================================================================
   NEUROATLAS — Chat Module (NeuroAI Assistant + Rich Markdown + Context)
   ========================================================================== */

(function () {
  "use strict";

  const NEURO = window.NEURO;
  const { escapeHtml, t, showToast } = NEURO;

  const chatMessages = document.getElementById("chatMessages");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const clearBtn = document.getElementById("clearChatBtn");
  const promptChipsEl = document.getElementById("promptChips");

  let chatHistory = [];

  function autoResizeInput() {
    if (!chatInput) return;
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 132) + "px";
  }

  function formatInlineMarkdown(escapedLine) {
    return escapedLine
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }

  function formatBotMarkdown(raw) {
    const blocks = [];
    const textWithPlaceholders = String(raw).replace(
      /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g,
      (_, codeLang, code) => {
        const id = blocks.length;
        blocks.push({ lang: codeLang || "code", code: code.replace(/\n$/, "") });
        return `\n@@CODEBLOCK_${id}@@\n`;
      }
    );

    const lines = escapeHtml(textWithPlaceholders).split(/\r?\n/);
    const out = [];
    let listType = null;

    function closeList() {
      if (listType) {
        out.push(`</${listType}>`);
        listType = null;
      }
    }

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        closeList();
        continue;
      }

      const codeMatch = trimmed.match(/^@@CODEBLOCK_(\d+)@@$/);
      if (codeMatch) {
        closeList();
        const b = blocks[+codeMatch[1]];
        out.push(
          `<div class="code-wrap"><div class="code-head"><span>${escapeHtml(
            b.lang
          )}</span><button type="button" class="copy-code-btn">${escapeHtml(
            t("copyCodeBtn")
          )}</button></div><pre>${escapeHtml(b.code)}</pre></div>`
        );
        continue;
      }

      if (/^#{1,4}\s+/.test(trimmed)) {
        closeList();
        const headingText = trimmed.replace(/^#{1,4}\s+/, "");
        out.push(`<h4>${formatInlineMarkdown(headingText)}</h4>`);
        continue;
      }

      if (/^[-*•]\s+/.test(trimmed)) {
        if (listType !== "ul") {
          closeList();
          listType = "ul";
          out.push("<ul>");
        }
        out.push(`<li>${formatInlineMarkdown(trimmed.replace(/^[-*•]\s+/, ""))}</li>`);
        continue;
      }

      if (/^\d+[\.\)]\s+/.test(trimmed)) {
        if (listType !== "ol") {
          closeList();
          listType = "ol";
          out.push("<ol>");
        }
        out.push(`<li>${formatInlineMarkdown(trimmed.replace(/^\d+[\.\)]\s+/, ""))}</li>`);
        continue;
      }

      closeList();
      out.push(`<p>${formatInlineMarkdown(trimmed)}</p>`);
    }

    closeList();
    return `<div class="msg-rich">${out.join("")}</div>`;
  }

  function appendMessage(role, content, meta = "") {
    if (!chatMessages) return null;
    const box = document.createElement("div");
    box.className = `msg ${role === "user" ? "user" : "bot"}`;
    if (role === "user") {
      box.textContent = content;
    } else {
      box.innerHTML = formatBotMarkdown(content);
    }
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
      appendMessage("bot", t("welcomeMsg"));
      return;
    }
    chatHistory.forEach((m) => appendMessage(m.role, m.content, m.meta || ""));
  }

  function renderPromptChips() {
    if (!promptChipsEl) return;
    const prompts = t("prompts");
    const list = Array.isArray(prompts) ? prompts : [];
    promptChipsEl.innerHTML = "";
    list.forEach((p) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = p;
      btn.addEventListener("click", () => sendMessage(p));
      promptChipsEl.appendChild(btn);
    });
  }

  async function sendMessage(rawText, options = {}) {
    const text = String(rawText || "").trim();
    if (!text || !sendBtn || sendBtn.disabled) return;

    if (chatHistory.length === 0 && chatMessages) {
      chatMessages.innerHTML = "";
    }

    const displayLabel = options.displayText || text;
    const historySnapshot = chatHistory.slice(-8).map((item) => ({
      role: item.role,
      content: item.content
    }));

    appendMessage("user", displayLabel);
    if (chatInput && !options.keepInput) {
      chatInput.value = "";
      autoResizeInput();
    }

    sendBtn.disabled = true;
    const typingEl = appendMessage("bot", t("thinking"));

    try {
      const payload = {
        message: text,
        history: historySnapshot,
        lang: NEURO.getLang()
      };
      if (options.context) {
        payload.context = options.context;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (typingEl) typingEl.remove();

      if (!res.ok) {
        appendMessage("bot", data.error || t("chatErrorFallback"));
      } else {
        const reply = data.reply || "";
        const meta = data.provider ? `NeuroAI · ${data.provider}` : "";
        chatHistory.push({ role: "user", content: text });
        chatHistory.push({ role: "assistant", content: reply, meta });
        appendMessage("bot", reply, meta);
      }
    } catch (err) {
      if (typingEl) typingEl.remove();
      appendMessage("bot", `${t("chatErrorFallback")} (${err.message})`);
    } finally {
      sendBtn.disabled = false;
      if (chatInput && window.innerWidth > 1024) {
        chatInput.focus();
      }
    }
  }

  if (chatMessages) {
    chatMessages.addEventListener("click", (e) => {
      const btn = e.target.closest(".copy-code-btn");
      if (!btn) return;
      const pre = btn.closest(".code-wrap")?.querySelector("pre");
      if (!pre || !navigator.clipboard) return;
      navigator.clipboard
        .writeText(pre.textContent)
        .then(() => {
          btn.textContent = t("copiedWord");
          setTimeout(() => {
            btn.textContent = t("copyCodeBtn");
          }, 1400);
        })
        .catch(() => {});
    });
  }

  if (chatForm && chatInput) {
    chatInput.addEventListener("input", autoResizeInput);
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      sendMessage(chatInput.value);
    });
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event("submit"));
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      chatHistory = [];
      renderMessages();
    });
  }

  function askAboutChapter({ title, summary }) {
    if (sendBtn && sendBtn.disabled) {
      showToast(t("thinking"), "error");
      return;
    }
    NEURO.jumpToChat();
    const prompt = `${t("chapterContextPrompt")} "${title}"`;
    setTimeout(() => {
      sendMessage(prompt, {
        displayText: `📘 ${title}`,
        context: summary,
        keepInput: true
      });
    }, 120);
  }

  NEURO.registerModule("chat", {
    askAboutChapter,
    onLanguageChange: () => {
      renderPromptChips();
      if (chatHistory.length === 0) renderMessages();
    }
  });

  renderPromptChips();
  renderMessages();
})();