# NEUROATLAS 🧠✨

**An Evidence-Led Neuroscience Atlas & Multilingual Python AI Platform**  
Built by **Narges Bayat** for **GenHacks 2026**

🌐 **Live Demo:** [https://neuroatlas-alpha.vercel.app/](https://neuroatlas-alpha.vercel.app/)  
💻 **GitHub Repository:** [https://github.com/Shirazxbox/NEUROATLAS](https://github.com/Shirazxbox/NEUROATLAS)  
🏆 **Hackathon:** [GenHacks 2026 on Devpost](https://genhacks-open.devpost.com/)

---

## Overview

**NEUROATLAS** combines structured, reference-backed neuroscience education with a fast, multilingual Python AI assistant in a single lightweight web application. Designed to be accessible across devices and languages, it helps students and curious learners explore neuroanatomy, query live biomedical literature on PubMed, test their knowledge, and ask science, coding, or everyday questions directly.

> **Educational Notice:** NEUROATLAS is an independent educational resource and is **not** intended for medical diagnosis or treatment.

---

## Key Features

- **23 Structured Neuroscience Chapters:** Covering cellular neurobiology, synaptic transmission, sensory/motor systems, memory, sleep, and neuroimaging methods—each paired with key concepts, common distinctions, and interactive review Q&As.
- **Multilingual Support (EN · فارسی RTL · TR):** Full UI and curated educational datasets localized in **English**, **Persian (right-to-left)**, and **Turkish**, plus **on-demand AI chapter & PubMed title translation**.
- **Python AI Assistant (`mode="chat"` & `mode="translate"`):** Direct chat on the homepage with syntax-formatted code blocks, copy buttons, quick prompt chips, and multi-provider fallback across **Gemini** and **Groq** models.
- **Live NCBI PubMed Integration & 24 Curated Sources:** Real-time search via NCBI E-utilities alongside 24 NIH/NCBI academic references, research methods guide, and a structured **Research Question Builder**.
- **Active Learning Lab:** Interactive concept map, 12 retrieval flashcards, 6-question self-graded quiz, searchable neuroscience glossary, `Ctrl+K` global search, and browser-persisted study notes with JSON export.
- **5 Distinct Responsive Themes + Interactive Neural Connectome:**
  - `Cyber Dark` (cinematic cosmic lighting)
  - `Royal Obsidian` (research console grid)
  - `Deep Ocean` (luminous ocean backdrop with frosted white cards)
  - `Daylight` (clean academic light mode)
  - `Editorial Paper` (classic archival neuroscience atlas typography)
- **Privacy & Anti-Spam Protection:** Encrypted form delivery via **Web3Forms**, honeypot bot check, human-only email reveal shield, and zero client-side exposure of AI API keys.

---

## Architecture & Project Structure

The backend is intentionally engineered using **Python's standard library** (`http.server`, `urllib.request`) with zero heavy framework bloat, running seamlessly both locally and as Vercel Serverless Functions:

```text
NEUROATLAS/
├── NEUROATLAS.py            # Local Python launcher
├── server.py                # Local HTTP server (static assets + /api/status & /api/chat)
├── api/
│   ├── __init__.py
│   ├── status.py            # Serverless health & API key readiness check
│   └── chat.py              # Serverless AI chat & scientific translation (Gemini + Groq fallback)
├── neuroatlas-data.js       # 23 chapters, 24 NIH/NCBI sources, glossary, methods, map, flashcards & quiz
├── neuroatlas-i18n-data.js  # Full Persian (FA) and Turkish (TR) dataset translations
└── index.html               # Unified responsive frontend (5 themes, 3 languages, canvas & UI)
```

---

## Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Shirazxbox/NEUROATLAS.git
   cd NEUROATLAS
   ```

2. **Configure environment variables:**
   Create a local `.env` file (never commit `.env` to GitHub) with your Gemini / Groq API key(s) as expected by `api/chat.py`.

3. **Start the application:**
   ```bash
   python NEUROATLAS.py
   ```
   *(Or run `python server.py` directly.)*

4. **Deploy on Vercel:**
   Connect the repository to Vercel (Hobby plan, no Framework Preset required) and add your API key(s) inside **Project Settings → Environment Variables**.

---

## Scientific & Public Domain Image Credits

Visual specimens displayed in the NEUROATLAS Neuroimaging & Microscopy Archive are verified **Public Domain** open-science works:

- **White Matter Tractography (DTI):** NIH / NINDS (Public Domain)
- **Confocal Microscopy of Medium Spiny Neuron:** NIH · Margaret I. Davis (Public Domain)
- **Synaptic Ultrastructure (Electron Micrograph):** NIMH / NIH (Public Domain)
- **Human Cerebellum Purkinje Neuron (~1900):** Santiago Ramón y Cajal (Public Domain)

---

## Creator

**Narges Bayat**  
Student developer learning Python, web engineering, artificial intelligence, and neuroscience.  
Built for **GenHacks 2026**.