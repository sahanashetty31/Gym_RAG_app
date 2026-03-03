# Flex Fitness — Nutrition & Recovery Coach

A full-stack app that acts as a **Nutrition & Recovery Coach**: scan or log meals, then get meal plans, supplement ideas, and recovery protocols tailored to each client using RAG over your knowledge base and **Google Gemini**.

## Features

- **Meal logging** — Log meals manually or upload a photo. With a Gemini API key, meal images are parsed with **Gemini vision** (food items + optional calories/protein); otherwise Tesseract OCR is used.
- **RAG-powered coach** — Ingest nutrition and recovery docs; the coach answers questions and suggests meal plans, supplements, and recovery protocols using that content plus client profiles.
- **Client profiles** — Store goals (e.g. lose fat, gain muscle), target calories/protein, restrictions, and preferences; all coach and plan suggestions use this context.
- **Coach chat** — Ask the coach anything; replies use Gemini (or OpenAI) plus retrieved snippets from your docs.

## Tech stack

| Layer   | Tech |
|--------|------|
| Backend | FastAPI, SQLAlchemy (async SQLite), LangChain, ChromaDB, sentence-transformers (local embeddings) |
| LLM / Vision | Google Gemini 2.5 Flash (coach + meal image parsing); optional OpenAI fallback for chat |
| OCR fallback | Tesseract (when Gemini key is not set) |
| Frontend | React 18, TypeScript, Vite, React Router |

## Prerequisites

- Python 3.10+
- Node.js 12+ (for frontend)
- **Optional:** [Google Gemini API key](https://aistudio.google.com/apikey) — used for coach chat and for parsing meal photos (recommended).
- **Optional:** Tesseract — only needed for meal image scanning if you do *not* use a Gemini key.

## Quick start

### 1. Clone and backend setup

```bash
# From project root
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Both **`.env`** and **`requirements.txt`** live in the **project root** (not inside `backend/`).  
If you see `ModuleNotFoundError: No module named 'fastapi'`, activate the venv and install from the project root:

```bash
cd /path/to/Flex_Fitness_app
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```
Then run the backend from the `backend/` directory (see step 3).

### 2. Environment (recommended for coach + meal scan)

Create or edit **`.env`** in the project root:

```env
# Get a key at https://aistudio.google.com/apikey
GEMINI_API_KEY=your-gemini-api-key
```

You can use `GOOGLE_API_KEY` instead of `GEMINI_API_KEY` (same value).  
Without this key, the coach returns only RAG snippets and meal scan falls back to Tesseract (if installed).

### 3. Run the backend

**Option A (recommended)** — use the run script so the project venv is used automatically:

```bash
chmod +x run_backend.sh
./run_backend.sh
```

The script creates `.venv` and installs from `requirements.txt` if needed, then starts the API.

**Option B** — run uvicorn with the venv’s Python explicitly (avoids `ModuleNotFoundError: No module named 'fastapi'` if your shell uses system Python):

```bash
source .venv/bin/activate   # from project root
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or in one line from project root: `.venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` (run from the `backend/` directory, or set `--app-dir backend`).

### 4. Ingest the knowledge base (one-time)

Open the app (after starting the frontend) and click **Dashboard → Ingest documents**, or:

```bash
curl -X POST http://127.0.0.1:8000/api/coach/ingest
```

This loads `backend/data/docs/*.txt` and `*.md` into the vector store.

### 5. Run the frontend

The frontend is set up to run on **Node.js 12+** (using Vite 2). From project root:

```bash
./run_frontend.sh
```

Or manually:
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Use the sidebar: **Dashboard**, **Log meals**, **Meal plans**, **Supplements**, **Recovery**, **Coach chat**.

## Docker deployment

Run **Flex Fitness** with Docker Compose (backend + frontend, with persistent data). Images are built as `flex-fitness-frontend:latest` and `flex-fitness-backend:latest`; containers run as `flex-fitness-frontend` and `flex-fitness-backend`.

**Prerequisites:** Docker and Docker Compose installed.

1. **Create `.env`** in the project root (for the backend API key):
   ```env
   GEMINI_API_KEY=your-gemini-api-key
   ```

2. **Build and start:**
   ```bash
   docker compose up -d --build
   ```

3. Open **http://localhost** (frontend; port 80). The frontend proxies `/api` to the backend.  
   Backend only: **http://localhost:8000**.

4. **Ingest the knowledge base** once: open the app → Dashboard → **Ingest documents**, or:
   ```bash
   curl -X POST http://localhost:8000/api/coach/ingest
   ```

**Compose overview:**
- **backend** (`flex-fitness-backend`) — FastAPI, SQLite, ChromaDB, Tesseract; data in volume `backend_data`.
- **frontend** (`flex-fitness-frontend`) — Built React app (Flex Fitness UI + logo) served by nginx; `/api` proxied to the backend.

**Useful commands:**
```bash
docker compose down          # stop
docker compose up -d --build # rebuild and start
docker compose logs -f       # follow logs
```

## Project layout

```
.env                    # API keys (project root)
requirements.txt        # Python dependencies (project root)
docker-compose.yml      # Backend + frontend services
Dockerfile.backend      # FastAPI image
Dockerfile.frontend     # React build + nginx image
.dockerignore
backend/
  app/
    api/                # Routes: nutrition (clients, meals, log-image), coach (chat, meal-plan, supplements, recovery, ingest)
    db/                 # SQLAlchemy models and session
    services/           # RAG, OCR/Gemini meal parsing, coach LLM
  data/
    docs/               # .txt / .md for RAG (meal_plans, supplements, recovery)
    uploads/            # Uploaded meal images (optional)
frontend/
  src/
    api/                # API client
    components/         # Layout, nav
    pages/              # Dashboard, MealLog, MealPlans, Supplements, Recovery, CoachChat
```

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/nutrition/clients` | Create client |
| GET | `/api/nutrition/clients` | List clients |
| GET | `/api/nutrition/clients/{id}` | Get client |
| POST | `/api/nutrition/meals/log` | Log meal (JSON: client_id, meal_type, items) |
| POST | `/api/nutrition/meals/log-image` | Log meal from image (form: client_id, meal_type, file) |
| GET | `/api/nutrition/meals?client_id=` | List meals |
| POST | `/api/coach/chat` | Coach chat (client_id, message) |
| POST | `/api/coach/meal-plan` | Get meal plan (client_id, days, focus) |
| POST | `/api/coach/supplements` | Supplement suggestions (client_id, goal) |
| POST | `/api/coach/recovery` | Recovery protocols (client_id, context) |
| POST | `/api/coach/ingest` | Ingest `backend/data/docs` into vector store |

## Adding your own knowledge

Add or edit `.txt` or `.md` files under **`backend/data/docs/`**. Then run **Ingest documents** (Dashboard button or `POST /api/coach/ingest`). The coach and all suggestion endpoints use this content via RAG.

## Optional: OpenAI instead of Gemini

To use OpenAI for coach chat only, set in `.env`:

```env
OPENAI_API_KEY=sk-...
```

The app uses **Gemini first** if `GEMINI_API_KEY` or `GOOGLE_API_KEY` is set; otherwise it uses OpenAI if set; otherwise RAG-only replies.

## License

MIT
