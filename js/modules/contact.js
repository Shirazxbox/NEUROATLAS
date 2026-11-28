/* ==========================================================================
   NEUROATLAS — Contact Form (Web3Forms), Anti-Bot Email Shield & Profile Meta
   ========================================================================== */

(function () {
  "use strict";

  const NEURO = window.NEURO;
  const { DATA, t, showToast } = NEURO;

  const WEB3FORMS_KEY = "35999110-eef8-4007-8e28-a1307dcf5439";
  const GITHUB_REPO_URL = "https://github.com/Shirazxbox/NEUROATLAS";
  const EMAIL_PARTS = ["nargesbayat2012", "gmail", "com"];

  const ghBtn = document.getElementById("githubProfileBtn");
  if (ghBtn) ghBtn.href = GITHUB_REPO_URL;

  const statCh = document.getElementById("statChapters");
  const statSrc = document.getElementById("statSources");
  if (statCh && DATA.CHAPTERS && DATA.CHAPTERS.length) {
    statCh.textContent = String(DATA.CHAPTERS.length);
  }
  if (statSrc && DATA.SOURCES && DATA.SOURCES.length) {
    statSrc.textContent = String(DATA.SOURCES.length);
  }

  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const botCheck = document.getElementById("botcheck");
      if (botCheck && botCheck.checked) return;

      const btn = document.getElementById("contactSubmitBtn");
      const st = document.getElementById("contactStatus");
      if (btn) btn.disabled = true;
      if (st) st.textContent = t("cSending");

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
          if (st) st.textContent = t("cSent");
          showToast(t("cSent"));
          e.target.reset();
        } else {
          const errMsg = "Error: " + (data.message || "Request failed");
          if (st) st.textContent = errMsg;
          showToast(errMsg, "error");
        }
      } catch {
        if (st) st.textContent = t("cNetErr");
        showToast(t("cNetErr"), "error");
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  const revealEmailBtn = document.getElementById("revealEmailBtn");
  const copyEmailBtn = document.getElementById("copyEmailBtn");
  const emailBox = document.getElementById("emailRevealBox");

  if (revealEmailBtn && emailBox) {
    revealEmailBtn.addEventListener("click", () => {
      emailBox.textContent = `${EMAIL_PARTS[0]} [at] ${EMAIL_PARTS[1]} [dot] ${EMAIL_PARTS[2]}`;
      emailBox.classList.remove("hidden");
      if (copyEmailBtn) copyEmailBtn.classList.remove("hidden");
    });
  }

  if (copyEmailBtn) {
    copyEmailBtn.addEventListener("click", () => {
      if (!navigator.clipboard) return;
      navigator.clipboard
        .writeText(`${EMAIL_PARTS[0]}@${EMAIL_PARTS[1]}.${EMAIL_PARTS[2]}`)
        .then(() => {
          copyEmailBtn.textContent = t("copiedWord");
          showToast(t("copiedWord"));
          setTimeout(() => {
            copyEmailBtn.textContent = t("copyEmailBtn");
          }, 1500);
        })
        .catch(() => {});
    });
  }
})();