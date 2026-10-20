# Academic Tracker — Student Academic Performance Tracking System

A full-stack, secure, modern Progressive Web Application (PWA) designed for college students to track academic daily tasks, measure study hours with browser lifecycle auto-stopping timers, practice AI-generated assessments from lecture notes, receive smart 8:00 AM calendar reminders, and monitor learning curves with personalized weak-topic remediation.

---

## 🚀 Key Features

1. **Authentication & Multi-Tenant Isolation**:
   - Secure student registration with automatically generated unique Student IDs (`STU-YYYY-XXXX`).
   - Bcrypt password hashing, JWT bearer authorization, and strict user-scoped database isolation.
2. **Study Tracker & Browser Lifecycle Engine**:
   - Persistent stopwatch recording focused study intervals.
   - Auto-stops when students switch tabs, minimize the browser, or lock their device (via `visibilitychange`, `pagehide`, and `sendBeacon`).
   - Server-side heartbeat reconciliation handles unexpected shutdowns or battery dies without inventing unverified study time.
   - Daily study accumulation in student's local timezone with midnight rollover.
3. **Daily Academic To-Do List**:
   - Coursework task management with priority badges (LOW, MEDIUM, HIGH), category tags, due dates, and completion metrics.
4. **Calendar & Smart 8:00 AM Reminders**:
   - Monthly and agenda calendar views for exams, assignments, projects, and revision blocks.
   - Automated 8:00 AM local morning push reminders with past-time detection (if created after 8:00 AM, flags an immediate reminder).
   - Web Push API integration with VAPID credentials and Service Worker background push receivers.
5. **AI Assessments & Weak-Topic Remediation**:
   - PDF and TXT study material text extraction using `pypdf`.
   - Generates MCQs, True/False, and Short Answer quizzes via Google Gemini API (with robust pedagogical algorithmic fallback if no API key is provided).
   - Timed quiz interface with question palette, review mode, and auto-submit countdown.
   - 60% passing threshold flags weak topics, generates 3-step revision roadmaps, and facilitates quiz retakes.
6. **Built-in AI Study Assistant**:
   - Conversational academic tutor with markdown formatting, concept derivations, and persistent chat history.
   - Context toggle pulls recent weak assessment topics to personalize explanations.
7. **Performance Reports & Analytics**:
   - Weekly study distribution charts, consistency index (% active days), subject mastery breakdown, and AI diagnostic insights.
8. **Android PWA & Mobile First**:
   - Standalone app display, custom branded icons (192px, 512px, maskable), splash theme, bottom navigation bar, and offline caching.

---

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Service Worker (`sw.js`), Web App Manifest (`manifest.webmanifest`).
- **Backend**: Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2.0 ORM, Alembic, Passlib[bcrypt], Python-Jose, APScheduler, PyWebPush, PyPDF.
- **Database**: PostgreSQL (Production) / SQLite (Zero-config local development).
- **AI Integration**: Google Gemini 1.5/2.0 API + Curated Academic Quiz Synthesizer Fallback.

---

## 📱 How to Install on Android via Link

1. Open the application URL in **Google Chrome** on your Android phone.
2. Tap the **three vertical dots (⋮)** in the top right corner of Chrome.
3. Tap **"Install app"** or **"Add to Home screen"**.
4. Confirm by tapping **"Install"**.
5. The **Academic Tracker** icon will now appear in your Android App Drawer and Home Screen. When launched, it opens in a native standalone app interface without the browser address bar!

---

## 💻 Local Quickstart

### 1. Start the Server
Double-click `start_server.bat` or run:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

### 2. Access on Android (Same Wi-Fi)
Find your local IP address (e.g. `192.168.1.X`) and open `http://192.168.1.X:8000` on your mobile phone Chrome browser.

### 3. Run Automated Tests
```bash
python backend/test_suite.py
```

---

## ☁️ Cloud Deployment (Render / Railway / Docker)

- **Render**: Connect repository to Render. It will automatically detect `render.yaml` or use the provided `Dockerfile`.
- **Public URL**: Set environment variables `SECRET_KEY`, `DATABASE_URL` (PostgreSQL), and optional `GEMINI_API_KEY`.
