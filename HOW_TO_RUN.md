# How to Run Coin Clarity

You have **two frontends** to choose from:
1. **Next.js app** (`apps/web`) - Original simple interface
2. **React app** (`frontend`) - New integrated UI with portfolio features

## Option 1: Run Everything with Docker (Recommended)

### Step 1: Start Backend Services

```powershell
# Start all backend services (API, Worker, Postgres, Redis)
docker compose -f infra/docker-compose.yml up --build
```

This starts:
- ✅ PostgreSQL (port 5432)
- ✅ Redis (port 6379)
- ✅ FastAPI Backend (port 8000)
- ✅ Worker (background jobs)
- ✅ Next.js Web App (port 3000)

**Wait for**: "Application startup complete" messages (30-60 seconds)

### Step 2: Start React Frontend (Optional)

In a **new terminal**:

```powershell
cd frontend
npm install
npm run dev
```

This starts the React frontend on **http://localhost:3001**

### Access Points:

- **React Frontend**: http://localhost:3001 (New UI with portfolio)
- **Next.js Frontend**: http://localhost:3000 (Simple interface)
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## Option 2: Run Backend Only (Use React Frontend)

If you only want to use the React frontend:

### Step 1: Start Backend Services

```powershell
docker compose -f infra/docker-compose.yml up postgres redis api worker --build
```

### Step 2: Start React Frontend

```powershell
cd frontend

# Create .env file if it doesn't exist
if (!(Test-Path .env)) {
    Copy-Item .env.example .env
}

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

**Access**: http://localhost:3001

---

## Option 3: Run Everything Locally (No Docker)

### Prerequisites:
- Python 3.11+
- Node.js 20+
- PostgreSQL (running locally)
- Redis (running locally)

### Step 1: Setup Database

```powershell
# Create database
createdb coinclarity
```

### Step 2: Start Backend API

```powershell
cd apps/api
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Step 3: Start Worker (New Terminal)

```powershell
cd apps/api
.\venv\Scripts\activate
rq worker --url redis://localhost:6379 analysis
```

### Step 4: Start React Frontend (New Terminal)

```powershell
cd frontend
npm install
npm run dev
```

### Step 5: Update .env files

**Backend** (`apps/api/.env` or root `.env`):
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/coinclarity
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://localhost:8000
```

---

## Quick Test

Once everything is running:

1. **Open React Frontend**: http://localhost:3001
2. **Click "Add Asset"** button
3. **Enter**:
   - Chain: Ethereum
   - Address: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` (USDC)
4. **Click "Analyze"**
5. **Wait** for analysis (may take 10-30 seconds)
6. **See** the token appear in your portfolio with risk score!

---

## Troubleshooting

### Docker not found
- Install Docker Desktop: https://www.docker.com/products/docker-desktop/
- Make sure Docker Desktop is **running**

### Port conflicts
- **3000**: Next.js app - change in `infra/docker-compose.yml`
- **3001**: React frontend - change in `frontend/vite.config.ts`
- **8000**: API - change in `infra/docker-compose.yml`
- **5432**: PostgreSQL - change in `infra/docker-compose.yml`
- **6379**: Redis - change in `infra/docker-compose.yml`

### Frontend can't connect to API
- Check API is running: http://localhost:8000/health
- Check `frontend/.env` has: `VITE_API_URL=http://localhost:8000`
- Restart frontend after changing .env

### Worker not processing
- Check Redis is running: `docker compose -f infra/docker-compose.yml ps`
- Check worker logs in docker compose output
- Ensure worker container is running

### Database errors
- Wait for PostgreSQL to be healthy (check docker logs)
- Services have health checks and wait for dependencies

---

## Recommended Setup (Easiest)

**For development, I recommend:**

1. **Backend with Docker** (easiest):
   ```powershell
   docker compose -f infra/docker-compose.yml up --build
   ```

2. **Frontend locally** (faster hot reload):
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

This gives you:
- ✅ Stable backend services in Docker
- ✅ Fast frontend development with hot reload
- ✅ Easy to restart frontend without affecting backend

---

## Stop Services

**Docker services**:
```powershell
docker compose -f infra/docker-compose.yml down
```

**Frontend**: Press `Ctrl+C` in the terminal
