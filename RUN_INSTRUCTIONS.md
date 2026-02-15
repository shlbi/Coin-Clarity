# How to Run Coin Clarity

## Option 1: Using Docker Compose (Recommended)

### Prerequisites
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) for Windows
- Make sure Docker Desktop is running

### Steps

1. **Create .env file** (if not already created):
   ```powershell
   Copy-Item .env.example .env
   ```

2. **Start all services**:
   ```powershell
   docker compose -f infra/docker-compose.yml up --build
   ```

   This will:
   - Build all Docker images
   - Start PostgreSQL, Redis, API, Worker, and Web services
   - Show logs from all services

3. **Wait for services to be ready** (look for "Application startup complete" messages)

4. **Access the application**:
   - **Web App**: Open http://localhost:3000 in your browser
   - **API**: http://localhost:8000
   - **API Docs**: http://localhost:8000/docs

5. **Try it out**:
   - Enter a token address (e.g., `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` for USDC)
   - Select "Ethereum" chain
   - Click "Analyze Token"

### Stop the services
Press `Ctrl+C` in the terminal, then:
```powershell
docker compose -f infra/docker-compose.yml down
```

---

## Option 2: Run Locally (Without Docker)

If you don't have Docker, you can run services manually:

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL (running locally)
- Redis (running locally)

### Steps

1. **Set up PostgreSQL and Redis**:
   - Install and start PostgreSQL on port 5432
   - Install and start Redis on port 6379
   - Create database: `createdb coinclarity`

2. **Update .env** for local setup:
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/coinclarity
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_URL=redis://localhost:6379/0
   ```

3. **Start API** (in one terminal):
   ```powershell
   cd apps/api
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

4. **Start Worker** (in another terminal):
   ```powershell
   cd apps/api
   .\venv\Scripts\activate
   rq worker --url redis://localhost:6379 analysis
   ```

5. **Start Web** (in another terminal):
   ```powershell
   cd apps/web
   npm install
   npm run dev
   ```

6. **Access**: http://localhost:3000

---

## Troubleshooting

### Docker not found
- Install Docker Desktop from https://www.docker.com/products/docker-desktop/
- Make sure Docker Desktop is running (check system tray)

### Port already in use
- Change ports in `infra/docker-compose.yml` if 3000, 8000, 5432, or 6379 are taken

### Services won't start
- Check Docker Desktop is running
- Try: `docker compose -f infra/docker-compose.yml down` then `docker compose -f infra/docker-compose.yml up --build`

### Worker not processing jobs
- Check Redis is running: `docker compose -f infra/docker-compose.yml ps`
- Check worker logs in the docker compose output

### Database connection errors
- Wait for PostgreSQL to be healthy (check docker logs)
- Services have health checks and will wait for dependencies

---

## Quick Test

Once running, try analyzing these tokens:

**Low Risk (USDC)**:
- Chain: Ethereum
- Address: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`

**Test any token**:
- Chain: Ethereum or Base
- Address: Any valid contract address (0x followed by 40 hex characters)
