# NeuroWake — Intelligent Cognitive Alarm Platform

An AI-powered alarm platform that makes you **solve a cognitive challenge**
(math, logic, memory, pattern, riddle, quiz, or word puzzle) before an alarm
can be dismissed. Difficulty adapts automatically to your performance and
snooze behavior, a weighted **Habit Score** tracks your wake-up consistency,
and a recommendation engine gives you personalized tips to build a better
morning routine.

This project was generated from the *Intelligent Cognitive Alarm Platform*
specification and implements every module described there: authentication &
role-based access, alarm scheduling, the cognitive challenge engine, the
adaptive difficulty engine, wake-up verification, behavioral analytics,
habit scoring, recommendations, dashboards, notifications, and CSV reports.

---

## 1. Tech stack

| Layer      | Technology |
|------------|------------|
| Backend    | Python, FastAPI, SQLAlchemy, JWT auth (python-jose), Passlib (bcrypt) |
| Database   | SQLite by default (zero config) — swap in Postgres by changing `DATABASE_URL` |
| Frontend   | React 18 + Vite, React Router, Tailwind CSS, Recharts, lucide-react icons |
| Alarm audio| Web Audio API — synthesized tones, no external mp3 files needed |
| Deployment | Docker + docker-compose (Nginx serves the built frontend) |

---

## 2. Project structure

```
alarm-platform/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI app & router registration
│   │   ├── models.py              # SQLAlchemy models
│   │   ├── schemas.py             # Pydantic request/response schemas
│   │   ├── database.py, config.py, security.py
│   │   ├── routers/               # auth, users, alarms, challenges,
│   │   │                          # analytics, habits, recommendations,
│   │   │                          # notifications, reports, admin
│   │   └── services/
│   │       ├── challenge_generator.py   # dynamic puzzle generation
│   │       ├── difficulty_engine.py     # adaptive difficulty ladder
│   │       ├── habit_scoring.py         # weighted habit-score model
│   │       └── recommendation_engine.py # rule-based recommendations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/       # Login, Register, Dashboard, Alarms, Analytics,
│   │   │                # Habits, Profile, Admin
│   │   ├── components/  # Layout (sidebar + alarm scheduler), RingModal
│   │   ├── context/     # AuthContext (JWT session)
│   │   ├── api/client.js
│   │   └── utils/sound.js   # Web Audio alarm sound engine
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── .vscode/               # recommended extensions & workspace settings
```

---

## 3. Running locally in VS Code

### Prerequisites
- Python 3.10+
- Node.js 18+
- VS Code (with the Python and ESLint extensions — see `.vscode/extensions.json`)

### 3.1 Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # edit SECRET_KEY for production
uvicorn app.main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`, with interactive docs at
`http://localhost:8000/docs`. SQLite tables are created automatically on
first run — no migrations needed to get started.

### 3.2 Frontend

Open a second terminal:

```bash
cd frontend
npm install
cp .env.example .env              # VITE_API_BASE_URL defaults to localhost:8000
npm run dev
```

Visit `http://localhost:5173`. Vite is already configured to proxy `/api`
calls to the backend during development.

### 3.3 First run

1. Go to **Register**, create an account (choose role `user`, `wellness_coach`,
   or `admin` — admins/coaches unlock the Admin dashboard).
2. Create an alarm in the **Alarms** tab, or just click **"Try a demo wake-up
   challenge"** on the Dashboard to instantly test the cognitive-challenge
   flow — including the synthesized alarm sound, snoozing, and dismissal.
3. Check **Habit Score** and **Analytics** to see the weighted scoring model
   and charts update as you interact with challenges.

---

## 4. Running with Docker

```bash
docker compose up --build
```

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

---

## 5. Core features implemented

- **Auth & RBAC** — JWT login/register, roles: `user`, `wellness_coach`, `admin`.
- **Alarm scheduling** — daily / weekday / weekend / one-time / smart-adaptive
  alarms, per-alarm sound & challenge-type preference, snooze limits.
- **Cognitive Challenge Engine** — math, logic, memory-sequence, pattern,
  riddle, quiz, and word-scramble challenges generated fresh every time.
- **Adaptive Difficulty Engine** — 5-level ladder (beginner → expert) that
  rises after 3 correct answers in a row, falls after 2 wrong answers, and
  always rises after a snooze (anti-snooze workflow).
- **Wake-Up Verification** — an alarm can only be dismissed by answering its
  generated challenge correctly; a client-side scheduler also auto-rings
  alarms in the browser at their scheduled time.
- **Alarm sounds** — 4 selectable tones synthesized live with the Web Audio
  API (no external audio files to manage), looping until solved or muted.
- **Behavioral Analytics** — snooze/solve-time/accuracy tracking, trend chart,
  score-composition pie chart, and a full challenge history table.
- **Habit Scoring Engine** — implements the weighted formula from the spec:
  Wake-Up Consistency 35% + Challenge Completion 25% + Snooze Reduction 20%
  + Sleep Schedule Adherence 20%.
- **Recommendation Engine** — rule-based tips generated from your latest
  habit-score breakdown.
- **Dashboards** — personal dashboard, Admin dashboard (users + platform
  stats) for `admin` / `wellness_coach` roles.
- **Reports** — CSV export of your full challenge history.

---

## 6. Extending this further

- Swap SQLite for Postgres by setting `DATABASE_URL=postgresql://user:pass@host/db`
  in `backend/.env` — the SQLAlchemy models require no changes.
- Add push notifications by wiring Firebase Cloud Messaging into
  `notifications.py` and the frontend `Notification` API.
- Add real ML-based difficulty tuning by replacing
  `services/difficulty_engine.py` with a trained model (e.g. scikit-learn)
  fed from `ChallengeAttempt` history.
