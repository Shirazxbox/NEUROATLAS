/* ==========================================================================
   NEUROATLAS — Central Pluggable Theme Registry (Categorized)
   To add a theme: create /css/themes/<id>.css and add 1 entry below.
   To remove a theme: delete its entry below and delete its .css file.
   ========================================================================== */

(function () {
  "use strict";

  window.NEURO_THEME_GROUPS = {
    classic: {
      en: "Color & Glass Editions",
      fa: "تم‌های رنگی و شیشه‌ای",
      tr: "Renk ve Cam Temaları"
    },
    signature: {
      en: "Signature Studio Styles",
      fa: "استایل‌های اختصاصی و متفاوت",
      tr: "Özel Stüdyo Stilleri"
    }
  };

  window.NEURO_THEMES = [
    {
      id: "cyber",
      group: "classic",
      css: "/css/themes/cyber.css",
      names: {
        en: "Cyber Terminal",
        fa: "ترمینال سایبری",
        tr: "Siber Terminal"
      }
    },
    {
      id: "obsidian",
      group: "classic",
      css: "/css/themes/obsidian.css",
      names: {
        en: "Obsidian Cinema",
        fa: "سینمایی تیره",
        tr: "Sinematik Koyu"
      }
    },
    {
      id: "ocean",
      group: "classic",
      css: "/css/themes/ocean.css",
      names: {
        en: "Ocean Glass",
        fa: "اقیانوس شفاف",
        tr: "Okyanus Camı"
      }
    },
    {
      id: "light",
      group: "classic",
      css: "/css/themes/light.css",
      names: {
        en: "Daylight Lab",
        fa: "آزمایشگاه روشن",
        tr: "Aydınlık Lab"
      }
    },
    {
      id: "paper",
      group: "signature",
      css: "/css/themes/paper.css",
      names: {
        en: "Editorial Paper",
        fa: "اطلس کاغذی",
        tr: "Klasik Kâğıt"
      }
    },
    {
      id: "bauhaus",
      group: "signature",
      css: "/css/themes/bauhaus.css",
      names: {
        en: "Swiss Bauhaus",
        fa: "باوهاوس سوئیسی",
        tr: "İsviçre Bauhaus"
      }
    },
    {
      id: "oscilloscope",
      group: "signature",
      css: "/css/themes/oscilloscope.css",
      names: {
        en: "EEG Oscilloscope",
        fa: "اسیلوسکوپ EEG",
        tr: "EEG Osiloskop"
      }
    },
    {
      id: "botanical",
      group: "signature",
      css: "/css/themes/botanical.css",
      names: {
        en: "Cajal Atelier",
        fa: "آتلیه کاخال",
        tr: "Cajal Atölyesi"
      }
    }
  ];
})();