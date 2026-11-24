/* ==========================================================================
   NEUROATLAS — UI Shell, Hamburger Drawer, Themes, i18n, Gallery & Search
   ========================================================================== */

(function () {
  "use strict";

  const DATA = window.NEUROATLAS_DATA || {};
  const TRANS = window.NEUROATLAS_I18N_DATA || {};
  const CHAPTERS = DATA.CHAPTERS || [];
  const SOURCES = DATA.SOURCES || [];
  const GLOSSARY = DATA.GLOSSARY || [];
  const METHODS = DATA.METHODS || [];

  const SPECIMENS = [
    {
      img: "https://upload.wikimedia.org/wikipedia/commons/3/33/Mouse_Tractography.jpg",
      badge: "DTI · MRI",
      credit: "NIH / NINDS · Public Domain",
      en: ["White Matter Tractography", "Diffusion tensor imaging mapping long-range axonal fiber pathways."],
      fa: ["تراکتوگرافی ماده سفید", "تصویربرداری DTI برای نمایش مسیرهای رشته‌های عصبی در مغز."],
      tr: ["Beyaz Madde Traktografisi", "Uzun menzilli akson yolaklarını haritalayan difüzyon tensör görüntüleme."]
    },
    {
      img: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Hippocampus_mossy_fiber_interneuron.jpg",
      badge: "FLUORESCENCE",
      credit: "NIH / NIAAA · Public Domain",
      en: ["Hippocampal Interneurons", "Fluorescent microscopy of mossy fiber pathways and interneurons in memory circuits."],
      fa: ["نورون‌های رابط هیپوکامپ", "میکروسکوپی فلورسانس از مسیرهای عصبی هیپوکامپ و مدارهای حافظه."],
      tr: ["Hipokampal Ara Nöronlar", "Bellek devrelerindeki yosunsu lif yollarının floresan mikroskopisi."]
    },
    {
      img: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Confocal_image_of_spiny_neuron_-_1.jpg",
      badge: "CONFOCAL",
      credit: "NIH · Margaret I. Davis · Public Domain",
      en: ["Medium Spiny Neuron", "Confocal fluorescence microscopy revealing dense dendritic spines."],
      fa: ["نورون خاردار مخطط", "میکروسکوپ کانفوکال با نمایش دقیق شاخک‌های دندریتی و خارهای عصبی."],
      tr: ["Orta Dikenli Nöron", "Yoğun dendritik dikenleri gösteren konfokal floresan mikroskopisi."]
    },
    {
      img: "https://upload.wikimedia.org/wikipedia/commons/5/5b/Cajal_cortex_drawings.png",
      badge: "ARCHIVE · 1899",
      credit: "S. Ramón y Cajal · Public Domain",
      en: ["Human Cortex Drawings", "Historic anatomical ink illustrations of cortical layers by Santiago Ramón y Cajal."],
      fa: ["طراحی قشر مغز انسان", "طراحی تاریخی سانتیاگو رامون ای کاخال (۱۸۹۹) از لایه‌های قشر مغز."],
      tr: ["İnsan Korteks Çizimleri", "Santiago Ramón y Cajal'ın 1899 tarihli tarihi korteks katmanı çizimleri."]
    }
  ];

  const I18N = {
    en: {
      dir: "ltr",
      tabHome: "Overview & AI",
      tabAtlas: "Atlas (23)",
      tabResearch: "Research & PubMed",
      tabLearn: "Learn & Quiz",
      tabAbout: "About Narges",
      tabContact: "Contact",
      menuLabel: "Navigation",
      themeLabel: "Color Theme",
      langLabel: "Language",
      themeCyber: "Cyber Terminal",
      themeObsidian: "Obsidian Cinema",
      themeOcean: "Ocean Glass",
      themeLight: "Daylight Lab",
      themePaper: "Editorial Paper",
      globalSearchPh: "Search 23 chapters, glossary, methods, or NIH sources…",
      statusChecking: "Checking Python API...",
      statusReady: "Python AI Online",
      statusNoKey: "Server Online (Add API Key)",
      statusOffline: "API Offline",
      connectomeLabel: "Interactive Neural Connectome",
      heroTitle: "NEUROATLAS by Narges Bayat",
      heroDesc: "An evidence-led neuroscience atlas and multilingual Python AI platform built for GenHacks 2026. Explore 23 anatomy chapters, query live PubMed studies, or ask AI anything.",
      heroExploreBtn: "Explore Atlas (23)",
      heroChatBtn: "Ask NeuroAI",
      statCh: "Atlas Chapters",
      statSrc: "NIH/NCBI Sources",
      statLang: "Languages",
      statThemes: "Themes",
      tryAsking: "Quick prompts",
      chatTitle: "NEUROATLAS AI Assistant",
      chatSub: "Python AI · General, coding & science",
      clearBtn: "Clear",
      inputPlaceholder: "Ask any question here...",
      sendBtn: "Send",
      welcomeMsg: "Hi! I am NEUROATLAS, Narges Bayat's Python AI assistant. Ask me anything—science, coding, or everyday questions!",
      thinking: "Thinking...",
      hm1Tag: "01 / KNOWLEDGE ATLAS",
      hm1Title: "23 Neuroscience Chapters",
      hm1Desc: "From neurons and synapses to cognition, sleep, and neuroimaging methods—with review Q&As.",
      hm2Tag: "02 / LIVE EVIDENCE",
      hm2Title: "PubMed & 24 NIH Sources",
      hm2Desc: "Search live NCBI PubMed records and explore curated government and academic references.",
      hm3Tag: "03 / CREATOR & LEARNING",
      hm3Title: "Narges Bayat · Student Builder",
      hm3Desc: "Built with Python for GenHacks 2026. Explore Narges's learning journey, skills, and secure contact.",
      openBtn: "Open →",
      galHeading: "Public Domain Neuroimaging & Microscopy Archive",
      galSub: "Verified open-science specimens from NIH, NIAAA, NINDS, and historical neuroanatomy archives.",
      atlasHeading: "Neuroanatomy & Systems Atlas",
      atlasSub: "Evidence-led educational chapters. Not for medical diagnosis or treatment.",
      filterChaptersPh: "Filter 23 chapters…",
      chaptersToggleShow: "Show 23 Chapters ▾",
      chaptersToggleHide: "Hide Chapters ▴",
      chapterWord: "CHAPTER",
      keyConceptLbl: "Key concept:",
      distinctionLbl: "Important distinction:",
      reviewLbl: "Knowledge review",
      refsLbl: "References:",
      saveWorkBtn: "Save to Workspace",
      prevBtn: "← Previous",
      nextBtn: "Next Chapter →",
      translateChBtn: "Translate this chapter",
      showOrigBtn: "Show English Original",
      translatingMsg: "Translating chapter with Python AI...",
      resHeading: "Literature Search, Methods & Sources",
      resSub: "Explore live NCBI PubMed studies, design testable research questions, and inspect 24 curated sources.",
      subPubmed: "PubMed Search",
      subDiscover: "Research Question Builder",
      subMethods: "Research Methods",
      subSources: "24 Curated Sources",
      pubmedPh: "e.g. hippocampal plasticity, EEG sleep, visual cortex",
      pubmedBtn: "Search PubMed",
      pubmedNote: "Queries live NCBI E-utilities (requires internet).",
      pubmedSearching: "Searching NCBI PubMed…",
      pubmedNone: "No PubMed records found.",
      pubmedDone: "records retrieved from NCBI.",
      pubmedErr: "PubMed search unavailable right now.",
      openPubmed: "Open PubMed record ↗",
      translateStudyBtn: "Translate title",
      rdTopicPh: "Topic (e.g. sleep and memory consolidation)",
      rdPopPh: "Population / model (e.g. adolescents, adults)",
      rdExpPh: "Comparison / factor (e.g. sleep duration)",
      rdOutPh: "Measurement (e.g. recall accuracy, EEG)",
      mOpt1: "Literature review",
      mOpt2: "Behavioral experiment",
      mOpt3: "EEG / electrophysiology",
      mOpt4: "MRI / neuroimaging",
      mOpt5: "Computational analysis",
      buildBtn: "Build Outline",
      outlineTag: "Structured Outline",
      outlineEmpty: "Fill in a topic to generate a structured research outline.",
      methodWord: "METHOD",
      limitLbl: "Interpretation limit:",
      filterSourcesPh: "Filter NIH / NCBI sources…",
      openSource: "Open original source ↗",
      learnHeading: "Active Learning Lab & Workspace",
      learnSub: "Concept map, retrieval flashcards, mini quiz, neuroscience glossary, and local study notes.",
      subFlashQuiz: "Flashcards & Quiz",
      subMap: "Concept Map",
      subGlossary: "Glossary",
      subWorkspace: "Local Workspace",
      flashTag: "Flashcards",
      revealAnsBtn: "Reveal Answer",
      hideAnsBtn: "Hide Answer",
      nextCardBtn: "Next Card",
      quizTag: "Knowledge Check",
      checkAnsBtn: "Check Answers",
      scoreLbl: "Score:",
      mapHint: "Select a concept above to inspect related chapters.",
      filterGlossaryPh: "Filter glossary terms…",
      noteTitlePh: "Note title",
      noteBodyPh: "Write study notes or research ideas (saved in your browser)…",
      saveNoteBtn: "Save Note",
      exportBtn: "Export JSON",
      savedNotesTag: "Saved Notes",
      noNotes: "No saved notes yet.",
      deleteBtn: "Delete",
      savedAlert: "Saved to Workspace!",
      aboutTag: "CREATOR PROFILE · GENHACKS 2026",
      aboutName: "Narges Bayat",
      aboutBio: "Student developer and curious learner exploring Python programming, web engineering, artificial intelligence, and neuroscience. NEUROATLAS combines structured scientific education with an accessible, multilingual Python AI assistant.",
      skillNeuro: "Neuroscience Research",
      githubBtn: "View GitHub Project",
      contactMeBtn: "Send a Message",
      ab1Tag: "LEARNING JOURNEY",
      ab1Title: "Building While Learning",
      ab1Desc: "Started with a prototype HTML atlas and Python launcher, then evolved it into a full-stack serverless web application.",
      ab2Tag: "HACKATHON GOAL",
      ab2Title: "GenHacks 2026",
      ab2Desc: "Designed to make both neuroscience reference materials and general AI assistance available in one lightweight, inclusive interface.",
      ab3Tag: "PRIVACY & ACCESSIBILITY",
      ab3Title: "Inclusive by Design",
      ab3Desc: "Supports English, right-to-left Persian, Turkish, five color themes, and anti-spam contact protection.",
      contactHeading: "Secure Contact",
      contactSub: "Send feedback or questions safely without exposing any personal email address to spam bots.",
      formTag: "ENCRYPTED FORM DELIVERY",
      formTitle: "Send a Message to Narges Bayat",
      cOpt1: "General / Hackathon Feedback",
      cOpt2: "Science / Atlas Question",
      cOpt3: "Bug Report / Suggestion",
      cNamePh: "Your name",
      cEmailPh: "Your email (optional, for a reply)",
      cMsgPh: "Write your message here...",
      cSendBtn: "Send Securely",
      cSending: "Sending...",
      cSent: "Message sent securely! Thank you.",
      cNetErr: "Network error while sending.",
      shieldTag: "ANTI-SPAM EMAIL SHIELD",
      shieldTitle: "Human-Only Email Protection",
      shieldDesc: "To protect against automated spam scrapers, the owner's email is never written inside the page HTML. Humans can click below to reveal a protected version.",
      revealBtn: "Reveal Human-Only Email",
      copyEmailBtn: "Copy Email",
      copiedWord: "Copied!",
      disclaimerNote: "NEUROATLAS is an independent educational platform and is not intended for medical diagnosis or treatment.",
      fabBtn: "Ask AI",
      footerText: "NEUROATLAS · Built with Python by Narges Bayat for GenHacks 2026 · Educational Resource Only",
      noSearchHit: "No local matches.",
      prompts: ["Explain neuroplasticity simply", "Write a Python function example", "What is NEUROATLAS?"]
    },
    fa: {
      dir: "rtl",
      tabHome: "خانه و چت‌بات",
      tabAtlas: "اطلس (۲۳ فصل)",
      tabResearch: "پژوهش و PubMed",
      tabLearn: "یادگیری و آزمون",
      tabAbout: "درباره نرگس",
      tabContact: "تماس امن",
      menuLabel: "منوی بخش‌ها",
      themeLabel: "انتخاب تم",
      langLabel: "انتخاب زبان",
      themeCyber: "ترمینال سایبری",
      themeObsidian: "سینمایی تیره",
      themeOcean: "اقیانوس شفاف",
      themeLight: "آزمایشگاه روشن",
      themePaper: "اطلس کاغذی",
      globalSearchPh: "جستجو در ۲۳ فصل، واژه‌نامه، روش‌های پژوهش و منابع NIH…",
      statusChecking: "در حال بررسی سرور پایتون...",
      statusReady: "هوش مصنوعی پایتون آنلاین است",
      statusNoKey: "سرور آنلاین (کلید API تنظیم نشده)",
      statusOffline: "عدم اتصال به API",
      connectomeLabel: "شبکه عصبی تعاملی (با حرکت موس)",
      heroTitle: "NEUROATLAS · ساخته نرگس بیات",
      heroDesc: "اطلس علمی علوم اعصاب و دستیار هوشمند چندزبانه با پایتون برای مسابقه GenHacks 2026. همین‌جا وارد ۲۳ فصل اطلس شوید، مقالات PubMed را بررسی کنید یا از هوش مصنوعی بپرسید.",
      heroExploreBtn: "مطالعه اطلس (۲۳)",
      heroChatBtn: "گفتگو با هوش مصنوعی",
      statCh: "فصل اطلس",
      statSrc: "منبع NIH/NCBI",
      statLang: "زبان فعال",
      statThemes: "تم انتخابی",
      tryAsking: "پیشنهاد سریع",
      chatTitle: "دستیار هوشمند NEUROATLAS",
      chatSub: "پایتون AI · علوم، کدنویسی و عمومی",
      clearBtn: "پاک کردن",
      inputPlaceholder: "سوال خود را همین‌جا بنویسید...",
      sendBtn: "ارسال",
      welcomeMsg: "سلام! من دستیار هوشمند NEUROATLAS ساخته نرگس بیات هستم. هر سوال علمی، برنامه‌نویسی یا روزمره‌ای دارید مستقیم از من بپرسید!",
      thinking: "در حال فکر کردن...",
      hm1Tag: "۰۱ / اطلس دانش",
      hm1Title: "۲۳ فصل علوم اعصاب",
      hm1Desc: "از سلول‌های عصبی تا حافظه، خواب و تصویربرداری مغز همراه با پرسش و پاسخ.",
      hm2Tag: "۰۲ / شواهد علمی",
      hm2Title: "جستجوی PubMed و ۲۴ منبع",
      hm2Desc: "جستجوی زنده در بانک مقالات دانشگاهی NCBI و دسترسی به ۲۴ منبع معتبر NIH.",
      hm3Tag: "۰۳ / سازنده و یادگیری",
      hm3Title: "نرگس بیات · توسعه‌دهنده دانش‌آموز",
      hm3Desc: "ساخته‌شده با پایتون برای GenHacks 2026. آشنایی با مسیر یادگیری، مهارت‌ها و تماس امن.",
      openBtn: "مشاهده ←",
      galHeading: "آرشیو تصاویر علمی و تصویربرداری عصبی (بدون کپی‌رایت)",
      galSub: "نمونه‌های میکروسکوپی و تصویربرداری معتبر از موسسه ملی سلامت آمریکا (NIH) و آرشیو کاخال.",
      atlasHeading: "اطلس جامع علوم اعصاب",
      atlasSub: "محتوای آموزشی مبتنی بر شواهد علمی؛ برای تشخیص یا درمان پزشکی نیست.",
      filterChaptersPh: "فیلتر ۲۳ فصل اطلس…",
      chaptersToggleShow: "فهرست ۲۳ فصل ▾",
      chaptersToggleHide: "بستن فهرست فصل‌ها ▴",
      chapterWord: "فصل",
      keyConceptLbl: "مفهوم کلیدی:",
      distinctionLbl: "نکته مهم:",
      reviewLbl: "مرور دانش و پرسش‌ها",
      refsLbl: "منابع علمی:",
      saveWorkBtn: "ذخیره در یادداشت‌ها",
      prevBtn: "→ فصل قبلی",
      nextBtn: "فصل بعدی ←",
      translateChBtn: "ترجمه کامل این فصل به فارسی (AI)",
      showOrigBtn: "نمایش متن اصلی انگلیسی",
      translatingMsg: "در حال ترجمه علمی فصل با پایتون AI...",
      resHeading: "جستجوی مقالات، روش‌ها و منابع",
      resSub: "جستجوی زنده در PubMed، طراحی سوال پژوهش و بررسی ۲۴ منبع علمی.",
      subPubmed: "جستجوی PubMed",
      subDiscover: "طراحی سوال پژوهش",
      subMethods: "روش‌های پژوهش",
      subSources: "۲۴ منبع علمی معتبر",
      pubmedPh: "مثال: hippocampal plasticity, EEG sleep",
      pubmedBtn: "جستجو در PubMed",
      pubmedNote: "متصل به بانک زنده NCBI E-utilities (نیازمند اینترنت).",
      pubmedSearching: "در حال جستجو در PubMed…",
      pubmedNone: "مقاله‌ای یافت نشد.",
      pubmedDone: "مقاله از NCBI بازیابی شد.",
      pubmedErr: "جستجوی PubMed در حال حاضر در دسترس نیست.",
      openPubmed: "مشاهده در PubMed ↗",
      translateStudyBtn: "ترجمه عنوان به فارسی (AI)",
      rdTopicPh: "موضوع پژوهش (مثلاً خواب و تثبیت حافظه)",
      rdPopPh: "جامعه یا مدل (مثلاً نوجوانان، بزرگسالان)",
      rdExpPh: "عامل مورد مقایسه (مثلاً مدت خواب)",
      rdOutPh: "معیار سنجش (مثلاً دقت یادآوری، EEG)",
      mOpt1: "مرور ادبیات علمی",
      mOpt2: "آزمایش رفتاری",
      mOpt3: "نوار مغزی / الکتروفیزیولوژی",
      mOpt4: "MRI / تصویربرداری عصبی",
      mOpt5: "تحلیل محاسباتی",
      buildBtn: "ساخت چارچوب پژوهش",
      outlineTag: "چارچوب پیشنهادی پژوهش",
      outlineEmpty: "موضوع را بنویسید تا پیش‌نویس سوال پژوهش ساخته شود.",
      methodWord: "روش پژوهش",
      limitLbl: "محدودیت تفسیر:",
      filterSourcesPh: "جستجو در ۲۴ منبع NIH / NCBI…",
      openSource: "باز کردن منبع اصلی ↗",
      learnHeading: "آزمایشگاه یادگیری و یادداشت‌ها",
      learnSub: "نقشه مفهومی مغز، فلش‌کارت، آزمون کوتاه، واژه‌نامه و دفتر یادداشت شخصی.",
      subFlashQuiz: "فلش‌کارت و آزمون",
      subMap: "نقشه مفهومی",
      subGlossary: "واژه‌نامه تخصصی",
      subWorkspace: "دفتر یادداشت من",
      flashTag: "فلش‌کارت مرور سریع",
      revealAnsBtn: "نمایش پاسخ",
      hideAnsBtn: "مخفی کردن پاسخ",
      nextCardBtn: "کارت بعدی",
      quizTag: "آزمون کوتاه دانش",
      checkAnsBtn: "بررسی پاسخ‌ها",
      scoreLbl: "امتیاز شما:",
      mapHint: "یکی از مفاهیم بالا را انتخاب کنید تا فصل‌های مرتبط نمایش داده شوند.",
      filterGlossaryPh: "جستجو در واژه‌نامه…",
      noteTitlePh: "عنوان یادداشت",
      noteBodyPh: "یادداشت‌های مطالعه یا ایده‌های پژوهشی خود را بنویسید (ذخیره در مرورگر شما)…",
      saveNoteBtn: "ذخیره یادداشت",
      exportBtn: "خروجی JSON",
      savedNotesTag: "یادداشت‌های ذخیره‌شده",
      noNotes: "هنوز یادداشتی ذخیره نشده است.",
      deleteBtn: "حذف",
      savedAlert: "در دفتر یادداشت ذخیره شد!",
      aboutTag: "پروفایل سازنده · هکاتون GENHACKS 2026",
      aboutName: "نرگس بیات",
      aboutBio: "دانش‌آموز و برنامه‌نویس در حال یادگیریِ پایتون، طراحی وب، هوش مصنوعی و علوم اعصاب. پروژه NEUROATLAS آموزش علمی معتبر را با یک دستیار هوشمند چندزبانه پایتونی ترکیب می‌کند.",
      skillNeuro: "پژوهش علوم اعصاب",
      githubBtn: "مشاهده پروژه در GitHub",
      contactMeBtn: "ارسال پیام",
      ab1Tag: "مسیر یادگیری",
      ab1Title: "یادگیری همراه با ساختن",
      ab1Desc: "از یک نمونه اولیه HTML و لانچر پایتون شروع شد و به یک وب‌اپلیکیشن ابری کامل تبدیل گردید.",
      ab2Tag: "هدف مسابقه",
      ab2Title: "مسابقه GenHacks 2026",
      ab2Desc: "طراحی‌شده برای دسترسی آسان و رایگان به آموزش علوم اعصاب و هوش مصنوعی در یک محیط یکپارچه.",
      ab3Tag: "امنیت و دسترسی‌پذیری",
      ab3Title: "طراحی فراگیر",
      ab3Desc: "پشتیبانی کامل از سه زبان (با راست‌چین فارسی)، ۵ تم انتخابی و محافظت از ایمیل در برابر ربات‌های اسپم.",
      contactHeading: "تماس امن",
      contactSub: "بدون لو رفتن ایمیل شخصی در کدهای سایت برای ربات‌های هرزنامه، با خیال راحت پیام بفرستید.",
      formTag: "ارسال امن از طریق فرم",
      formTitle: "ارسال پیام برای نرگس بیات",
      cOpt1: "بازخورد عمومی / هکاتون",
      cOpt2: "سوال علمی / اطلس",
      cOpt3: "گزارش خطا / پیشنهاد",
      cNamePh: "نام شما",
      cEmailPh: "ایمیل شما (اختیاری، برای دریافت پاسخ)",
      cMsgPh: "پیام خود را بنویسید...",
      cSendBtn: "ارسال امن پیام",
      cSending: "در حال ارسال...",
      cSent: "پیام شما با امنیت کامل ارسال شد! سپاسگزاریم.",
      cNetErr: "خطا در اتصال هنگام ارسال.",
      shieldTag: "سپر ضدربات ایمیل",
      shieldTitle: "محافظت هوشمند از ایمیل",
      shieldDesc: "برای جلوگیری از هرزنامه، ایمیل اصلی در HTML سایت نوشته نشده است. کاربران واقعی با کلیک زیر می‌توانند نسخه محافظت‌شده را ببینند.",
      revealBtn: "نمایش ایمیل (ویژه انسان)",
      copyEmailBtn: "کپی ایمیل",
      copiedWord: "کپی شد!",
      disclaimerNote: "NEUROATLAS یک پلتفرم آموزشی مستقل است و جایگزین مشاوره یا تشخیص پزشکی نیست.",
      fabBtn: "سوال از هوش مصنوعی",
      footerText: "NEUROATLAS · ساخته‌شده با پایتون توسط نرگس بیات برای GenHacks 2026 · صرفاً آموزشی",
      noSearchHit: "موردی یافت نشد.",
      prompts: ["انعطاف‌پذیری عصبی چیست؟", "یک مثال تابع در پایتون بنویس", "پروژه NEUROATLAS چیست؟"]
    },
    tr: {
      dir: "ltr",
      tabHome: "Ana Sayfa & AI",
      tabAtlas: "Atlas (23)",
      tabResearch: "Araştırma & PubMed",
      tabLearn: "Öğrenme & Test",
      tabAbout: "Narges Hakkında",
      tabContact: "İletişim",
      menuLabel: "Menü",
      themeLabel: "Renk Teması",
      langLabel: "Dil",
      themeCyber: "Siber Terminal",
      themeObsidian: "Sinematik Koyu",
      themeOcean: "Okyanus Camı",
      themeLight: "Aydınlık Lab",
      themePaper: "Klasik Kâğıt",
      globalSearchPh: "23 bölüm, sözlük, yöntem veya NIH kaynaklarında ara…",
      statusChecking: "Python API kontrol ediliyor...",
      statusReady: "Python AI Çevrimiçi",
      statusNoKey: "Sunucu Açık (API Anahtarı Ekleyin)",
      statusOffline: "API Çevrimdışı",
      connectomeLabel: "Etkileşimli Sinir Ağı",
      heroTitle: "NEUROATLAS · Narges Bayat",
      heroDesc: "GenHacks 2026 için Python ile geliştirilen çok dilli nörobilim atlası ve yapay zekâ platformu. 23 bölümü keşfedin, PubMed tarayın veya AI'ya soru sorun.",
      heroExploreBtn: "Atlası Keşfet (23)",
      heroChatBtn: "AI Asistana Sor",
      statCh: "Atlas Bölümü",
      statSrc: "NIH/NCBI Kaynağı",
      statLang: "Dil Desteği",
      statThemes: "Tema",
      tryAsking: "Hızlı örnekler",
      chatTitle: "NEUROATLAS AI Asistanı",
      chatSub: "Python AI · Genel, kodlama ve bilim",
      clearBtn: "Temizle",
      inputPlaceholder: "Sorunuzu buraya yazın...",
      sendBtn: "Gönder",
      welcomeMsg: "Merhaba! Ben Narges Bayat'ın Python tabanlı yapay zekâ asistanı NEUROATLAS. Bilim, kodlama veya günlük her konuda soru sorabilirsiniz!",
      thinking: "Düşünüyor...",
      hm1Tag: "01 / BİLGİ ATLASI",
      hm1Title: "23 Nörobilim Bölümü",
      hm1Desc: "Nöronlardan bilişe, uykuya ve görüntüleme yöntemlerine kadar soru-cevaplı bölümler.",
      hm2Tag: "02 / CANLI KANIT",
      hm2Title: "PubMed & 24 NIH Kaynağı",
      hm2Desc: "Canlı NCBI PubMed kayıtlarını arayın ve seçilmiş akademik kaynakları inceleyin.",
      hm3Tag: "03 / GELİŞTİRİCİ",
      hm3Title: "Narges Bayat · Öğrenci Geliştirici",
      hm3Desc: "GenHacks 2026 için Python ile geliştirildi. Öğrenme yolculuğunu ve güvenli iletişimi keşfedin.",
      openBtn: "Aç →",
      galHeading: "Kamu Malı Nörogörüntüleme ve Mikroskopi Arşivi",
      galSub: "NIH, NIAAA, NINDS ve tarihi nöroanatomi arşivlerinden doğrulanmış açık bilim örnekleri.",
      atlasHeading: "Nöroanatomi ve Sistemler Atlası",
      atlasSub: "Kanıta dayalı eğitim bölümleri. Tıbbi tanı veya tedavi amaçlı değildir.",
      filterChaptersPh: "23 bölümü filtrele…",
      chaptersToggleShow: "23 Bölümü Göster ▾",
      chaptersToggleHide: "Bölümleri Gizle ▴",
      chapterWord: "BÖLÜM",
      keyConceptLbl: "Temel kavram:",
      distinctionLbl: "Önemli ayrım:",
      reviewLbl: "Bilgi tekrarı",
      refsLbl: "Kaynaklar:",
      saveWorkBtn: "Notlara Kaydet",
      prevBtn: "← Önceki",
      nextBtn: "Sonraki Bölüm →",
      translateChBtn: "Bu bölümü Türkçeye çevir (AI)",
      showOrigBtn: "İngilizce Aslını Göster",
      translatingMsg: "Bölüm Python AI ile çevriliyor...",
      resHeading: "Literatür Arama, Yöntemler ve Kaynaklar",
      resSub: "Canlı NCBI PubMed çalışmalarını arayın ve 24 akademik kaynağı inceleyin.",
      subPubmed: "PubMed Arama",
      subDiscover: "Araştırma Sorusu Oluşturucu",
      subMethods: "Araştırma Yöntemleri",
      subSources: "24 Seçilmiş Kaynak",
      pubmedPh: "örn. hippocampal plasticity, EEG sleep",
      pubmedBtn: "PubMed'de Ara",
      pubmedNote: "Canlı NCBI E-utilities üzerinden sorgular (internet gerekir).",
      pubmedSearching: "NCBI PubMed aranıyor…",
      pubmedNone: "PubMed kaydı bulunamadı.",
      pubmedDone: "kayıt NCBI'dan getirildi.",
      pubmedErr: "PubMed araması şu an kullanılamıyor.",
      openPubmed: "PubMed kaydını aç ↗",
      translateStudyBtn: "Başlığı Türkçeye çevir (AI)",
      rdTopicPh: "Konu (örn. uyku ve bellek pekiştirme)",
      rdPopPh: "Örneklem / model (örn. ergenler, yetişkinler)",
      rdExpPh: "Karşılaştırma / etken (örn. uyku süresi)",
      rdOutPh: "Ölçüm (örn. hatırlama doğruluğu, EEG)",
      mOpt1: "Literatür taraması",
      mOpt2: "Davranışsal deney",
      mOpt3: "EEG / elektrofizyoloji",
      mOpt4: "MRI / nörogörüntüleme",
      mOpt5: "Hesaplamalı analiz",
      buildBtn: "Taslak Oluştur",
      outlineTag: "Yapılandırılmış Taslak",
      outlineEmpty: "Araştırma taslağı oluşturmak için bir konu girin.",
      methodWord: "YÖNTEM",
      limitLbl: "Yorumlama sınırı:",
      filterSourcesPh: "NIH / NCBI kaynaklarını filtrele…",
      openSource: "Orijinal kaynağı aç ↗",
      learnHeading: "Aktif Öğrenme Laboratuvarı",
      learnSub: "Kavram haritası, bilgi kartları, mini test, sözlük ve yerel not alanı.",
      subFlashQuiz: "Bilgi Kartları & Test",
      subMap: "Kavram Haritası",
      subGlossary: "Sözlük",
      subWorkspace: "Çalışma Alanım",
      flashTag: "Bilgi Kartları",
      revealAnsBtn: "Yanıtı Göster",
      hideAnsBtn: "Yanıtı Gizle",
      nextCardBtn: "Sonraki Kart",
      quizTag: "Bilgi Kontrolü",
      checkAnsBtn: "Yanıtları Kontrol Et",
      scoreLbl: "Puan:",
      mapHint: "İlgili bölümleri görmek için yukarıdan bir kavram seçin.",
      filterGlossaryPh: "Sözlük terimlerini filtrele…",
      noteTitlePh: "Not başlığı",
      noteBodyPh: "Çalışma notlarınızı veya fikirlerinizi yazın (tarayıcınızda saklanır)…",
      saveNoteBtn: "Notu Kaydet",
      exportBtn: "JSON Dışa Aktar",
      savedNotesTag: "Kaydedilen Notlar",
      noNotes: "Henüz kayıtlı not yok.",
      deleteBtn: "Sil",
      savedAlert: "Notlara kaydedildi!",
      aboutTag: "GELİŞTİRİCİ PROFİLİ · GENHACKS 2026",
      aboutName: "Narges Bayat",
      aboutBio: "Python programlama, web geliştirme, yapay zekâ ve nörobilim alanlarında öğrenmeye devam eden öğrenci geliştirici. NEUROATLAS, yapılandırılmış bilimsel eğitimi çok dilli bir Python AI asistanıyla birleştirir.",
      skillNeuro: "Nörobilim Araştırmaları",
      githubBtn: "GitHub Projesini Gör",
      contactMeBtn: "Mesaj Gönder",
      ab1Tag: "ÖĞRENME YOLCULUĞU",
      ab1Title: "Üreterek Öğrenme",
      ab1Desc: "Bir HTML prototipi ve Python başlatıcı ile başlayıp tam kapsamlı sunucusuz bir web uygulamasına dönüştü.",
      ab2Tag: "YARIŞMA HEDEFİ",
      ab2Title: "GenHacks 2026",
      ab2Desc: "Hem nörobilim kaynaklarını hem de genel yapay zekâ desteğini tek bir hafif arayüzde sunmak için tasarlandı.",
      ab3Tag: "GİZLİLİK VE ERİŞİM",
      ab3Title: "Kapsayıcı Tasarım",
      ab3Desc: "İngilizce, sağdan sola Farsça, Türkçe, 5 seçilebilir tema ve spam korumalı iletişim sunar.",
      contactHeading: "Güvenli İletişim",
      contactSub: "E-posta adresini spam botlarına açmadan güvenle mesaj gönderin.",
      formTag: "ŞİFRELİ FORM İLETİMİ",
      formTitle: "Narges Bayat'a Mesaj Gönder",
      cOpt1: "Genel / Hackathon Geri Bildirimi",
      cOpt2: "Bilim / Atlas Sorusu",
      cOpt3: "Hata Bildirimi / Öneri",
      cNamePh: "Adınız",
      cEmailPh: "E-postanız (isteğe bağlı)",
      cMsgPh: "Mesajınızı buraya yazın...",
      cSendBtn: "Güvenle Gönder",
      cSending: "Gönderiliyor...",
      cSent: "Mesajınız güvenle gönderildi! Teşekkürler.",
      cNetErr: "Gönderim sırasında ağ hatası.",
      shieldTag: "SPAM KORUMA KALKANI",
      shieldTitle: "Yalnızca İnsanlar İçin E-posta",
      shieldDesc: "Otomatik spam botlarına karşı e-posta adresi HTML içine yazılmaz. Gerçek ziyaretçiler aşağıdaki düğmeye tıklayarak görebilir.",
      revealBtn: "E-postayı Göster (Bot Korumalı)",
      copyEmailBtn: "E-postayı Kopyala",
      copiedWord: "Kopyalandı!",
      disclaimerNote: "NEUROATLAS bağımsız bir eğitim platformudur; tıbbi tanı veya tedavi amacı taşımaz.",
      fabBtn: "AI'ya Sor",
      footerText: "NEUROATLAS · GenHacks 2026 için Narges Bayat tarafından Python ile geliştirildi · Eğitim Amaçlıdır",
      noSearchHit: "Sonuç bulunamadı.",
      prompts: ["Nöroplastisite nedir?", "Basit bir Python fonksiyonu yaz", "NEUROATLAS nedir?"]
    }
  };

  let currentLang = localStorage.getItem("na_lang") || "en";
  if (!I18N[currentLang]) currentLang = "en";
  let currentTheme = localStorage.getItem("na_theme") || "cyber";
  let lastStatusState = "checking";

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const trData = () => TRANS[currentLang] || null;

  function getChapterMeta(c) {
    const t = trData();
    const ch = t && t.chapters && t.chapters[c.id];
    return {
      category: (t && t.categories && t.categories[c.category]) || c.category,
      title: ch ? ch[0] : c.title,
      subtitle: ch ? ch[1] : c.subtitle
    };
  }

  const drawer = document.getElementById("mobileDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const drawerCloseBtn = document.getElementById("drawerCloseBtn");

  function openDrawer() {
    if (!drawer || !drawerBackdrop) return;
    drawer.classList.add("open");
    drawerBackdrop.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    if (hamburgerBtn) hamburgerBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("drawer-open");
  }

  function closeDrawer() {
    if (!drawer || !drawerBackdrop) return;
    drawer.classList.remove("open");
    drawerBackdrop.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    if (hamburgerBtn) hamburgerBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("drawer-open");
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener("click", openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener("click", closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeDrawer);

  function switchView(name) {
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
    document.querySelectorAll(".nav-tab").forEach((t) => t.classList.toggle("active", t.dataset.view === name));
    document.querySelectorAll(".drawer-link").forEach((t) => t.classList.toggle("active", t.dataset.view === name));
    const fab = document.getElementById("fabChat");
    if (fab) fab.classList.toggle("hidden", name === "home");
    closeDrawer();
    if (name === "home") setTimeout(initConnectome, 30);
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
      if (input) input.focus({ preventScroll: true });
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

  const neuralCanvas = document.getElementById("neuralCanvas");
  const nCtx = neuralCanvas ? neuralCanvas.getContext("2d") : null;
  let nNodes = [];
  let nColors = { a: "#22d3ee", b: "#34d399" };
  let nPointer = { x: -999, y: -999 };
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function refreshCanvasColors() {
    const st = getComputedStyle(document.documentElement);
    nColors.a = st.getPropertyValue("--accent").trim() || "#22d3ee";
    nColors.b = st.getPropertyValue("--accent-2").trim() || "#34d399";
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

  const themeSelects = [
    document.getElementById("themeSelect"),
    document.getElementById("drawerThemeSelect")
  ].filter(Boolean);

  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    themeSelects.forEach((sel) => {
      sel.value = theme;
    });
    localStorage.setItem("na_theme", theme);
    setTimeout(() => {
      refreshCanvasColors();
      if (prefersReducedMotion) drawConnectomeFrame();
    }, 30);
  }

  themeSelects.forEach((sel) => {
    sel.addEventListener("change", (e) => applyTheme(e.target.value));
  });

  function renderSpecimens() {
    const gal = document.getElementById("specimenGallery");
    if (!gal) return;
    gal.innerHTML = SPECIMENS.map((s) => {
      const pair = s[currentLang] || s.en;
      return `<article class="card gallery-card">
        <div class="gallery-media">
          <img src="${s.img}" alt="${escapeHtml(pair[0])}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('is-fallback')" />
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
    const d = I18N[currentLang];
    if (!dot || !text) return;
    dot.classList.remove("online");
    if (lastStatusState === "ready") {
      dot.classList.add("online");
      text.textContent = d.statusReady;
    } else if (lastStatusState === "nokey") {
      dot.classList.add("online");
      text.textContent = d.statusNoKey;
    } else if (lastStatusState === "offline") {
      text.textContent = d.statusOffline;
    } else {
      text.textContent = d.statusChecking;
    }
  }

  function applyLanguage(lang) {
    currentLang = I18N[lang] ? lang : "en";
    localStorage.setItem("na_lang", currentLang);
    const d = I18N[currentLang];
    document.documentElement.lang = currentLang;
    document.documentElement.dir = d.dir;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const k = el.getAttribute("data-i18n");
      if (d[k]) el.textContent = d[k];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const k = el.getAttribute("data-i18n-placeholder");
      if (d[k]) el.setAttribute("placeholder", d[k]);
    });
    document.querySelectorAll(".lang-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.lang === currentLang);
    });

    const chips = document.getElementById("promptChips");
    if (chips) {
      chips.innerHTML = "";
      d.prompts.forEach((p) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.textContent = p;
        b.addEventListener("click", () => {
          const input = document.getElementById("chatInput");
          const form = document.getElementById("chatForm");
          if (input && form) {
            input.value = p;
            form.dispatchEvent(new Event("submit"));
          }
        });
        chips.appendChild(b);
      });
    }

    updateStatusText();
    renderSpecimens();

    if (window.NEURO_APP && typeof window.NEURO_APP.onLanguageChange === "function") {
      window.NEURO_APP.onLanguageChange();
    }
  }

  document.querySelectorAll(".lang-btn").forEach((b) => {
    b.addEventListener("click", () => applyLanguage(b.dataset.lang));
  });

  function initGlobalSearch() {
    const input = document.getElementById("globalSearchInput");
    const box = document.getElementById("globalSearchResults");
    const wrap = document.getElementById("globalSearchWrap");
    if (!input || !box || !wrap) return;

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      if (!q) {
        box.hidden = true;
        return;
      }
      const t = trData();
      const idx = [];
      CHAPTERS.forEach((c, i) => {
        const m = getChapterMeta(c);
        idx.push({
          type: I18N[currentLang].tabAtlas,
          title: m.title,
          desc: m.subtitle + " · " + c.intro,
          raw: c.title + " " + c.intro,
          view: "atlas",
          ch: i
        });
      });
      ((t && t.glossary) || GLOSSARY).forEach((g, i) => {
        idx.push({
          type: I18N[currentLang].subGlossary,
          title: g[0],
          desc: g[1],
          raw: (GLOSSARY[i] || []).join(" "),
          view: "learn",
          sub: "glossary"
        });
      });
      SOURCES.forEach((s) => {
        idx.push({
          type: I18N[currentLang].subSources,
          title: s.name,
          desc: s.use,
          raw: s.id,
          view: "research",
          sub: "sources"
        });
      });
      ((t && t.methods) || METHODS).forEach((m, i) => {
        idx.push({
          type: I18N[currentLang].subMethods,
          title: m[0],
          desc: m[1],
          raw: (METHODS[i] || []).join(" "),
          view: "research",
          sub: "methods"
        });
      });

      const hits = idx
        .filter((x) => (x.title + " " + x.desc + " " + x.raw).toLowerCase().includes(q))
        .slice(0, 10);

      box.innerHTML = hits.length
        ? hits
            .map(
              (h, k) =>
                `<button class="search-item" data-hit="${k}"><small>${escapeHtml(h.type)}</small><strong>${escapeHtml(
                  h.title
                )}</strong><span>${escapeHtml(h.desc.slice(0, 130))}…</span></button>`
            )
            .join("")
        : `<div style="padding:12px" class="muted">${escapeHtml(I18N[currentLang].noSearchHit)}</div>`;

      box.hidden = false;

      box.querySelectorAll("[data-hit]").forEach((btn, k) => {
        btn.addEventListener("click", () => {
          const item = hits[k];
          box.hidden = true;
          switchView(item.view);
          if (item.sub) switchSubTab(item.view, item.sub);
          if (item.view === "atlas" && Number.isInteger(item.ch) && window.NEURO_APP?.openChapter) {
            window.NEURO_APP.openChapter(item.ch);
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

  window.switchView = switchView;
  window.switchSubTab = switchSubTab;
  window.jumpToChat = jumpToChat;

  window.NEURO_UI = {
    I18N,
    escapeHtml,
    trData,
    getChapterMeta,
    getLang: () => currentLang,
    getTheme: () => currentTheme,
    applyTheme,
    applyLanguage,
    openDrawer,
    closeDrawer
  };

  initConnectome();
  if (!prefersReducedMotion) requestAnimationFrame(stepConnectome);
  applyTheme(currentTheme);
  applyLanguage(currentLang);
  initGlobalSearch();
  checkApiStatus();
})();