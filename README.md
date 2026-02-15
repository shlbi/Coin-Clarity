# Coin Clarity

A production-ready MVP for analyzing EVM tokens to detect fraud and scam risk using a **context-aware adversarial risk scoring model**. Built with React, FastAPI, PostgreSQL, and Redis.

## 🎯 What It Does

Coin Clarity analyzes crypto tokens and provides:
- **Malicious Rug Risk (MRR)**: Probability of theft/blocking/trapping funds
- **Structural Centralization Risk (SCR)**: Power concentration, admin controls
- **Market Fragility Risk (MFR)**: Liquidity, volatility, manipulability
- **Uncertainty Factor (UF)**: Missing/immature data
- **Confidence Score**: Data quality indicator

Unlike simple "red flag" systems, Coin Clarity uses **context-aware analysis** that separates centralization from actual rug risk (e.g., WBTC has mint capability but it's custodian-controlled, not a scam).

## 🏗️ Architecture

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **API**: FastAPI (Python) + Uvicorn
- **Worker**: Python RQ worker for async analysis jobs
- **Database**: PostgreSQL (via SQLModel)
- **Cache/Queue**: Redis with RQ

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** installed and running ([Download here](https://www.docker.com/products/docker-desktop/))
- (Optional) **Etherscan/Basescan API keys** for enhanced analysis

### Running Locally

#### Step 1: Clone the Repository

```bash
git clone https://github.com/shlbi/Coin-Clarity.git
cd Coin-Clarity
```

#### Step 2: Create Environment File (Optional)

Create a `.env` file in the project root:

```bash
# Etherscan API Key (for Ethereum mainnet)
# Get one free at: https://etherscan.io/apis
ETHERSCAN_API_KEY=your_key_here

# Basescan API Key (for Base chain)
# Get one free at: https://basescan.org/apis
BASESCAN_API_KEY=your_key_here
```

**Note**: The app works without API keys, but confidence scores will be lower (~60% vs ~85-100% with keys).

#### Step 3: Start Backend Services

```bash
docker compose -f infra/docker-compose.yml up --build
```

This starts:
- ✅ PostgreSQL (port 5432)
- ✅ Redis (port 6379)
- ✅ FastAPI Backend (port 8000)
- ✅ Worker (background analysis jobs)

**Wait for**: "Application startup complete" messages (30-60 seconds)

#### Step 4: Start Frontend (New Terminal)

```bash
cd frontend
npm install
npm run dev
```

This starts the React frontend on **http://localhost:5173**

#### Step 5: Access the Application

- **Frontend**: http://localhost:5173
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Try It Out

1. Open http://localhost:5173 in your browser
2. Click on any token in the dashboard, or navigate to a token report
3. The system will automatically analyze the token and show:
   - Risk Score (0-100)
   - MRR, SCR, MFR breakdown
   - Confidence score
   - Detailed signals and evidence

**Test Tokens**:
- **WBTC**: `0x2260fac5e5542a773aa44fbcfedf7c193bc2c599` (Low risk, custodian-controlled)
- **UNI**: `0x1f9840a85d5af5bf1d1762f925bdaddc4201f984` (Low risk)
- **USDC**: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` (Low risk)

## 📁 Project Structure

```
.
├── apps/
│   ├── api/              # FastAPI backend
│   │   ├── app/
│   │   │   ├── routes/   # API endpoints
│   │   │   └── services/
│   │   │       ├── analyzers/  # Contract, liquidity, holder analysis
│   │   │       └── scoring.py  # Risk scoring engine
│   │   └── main.py
│   └── worker/           # RQ worker
├── frontend/             # React frontend
│   ├── src/
│   │   ├── app/         # Pages and components
│   │   └── lib/         # API client
│   └── package.json
├── infra/
│   └── docker-compose.yml
└── README.md
```

## 🔌 API Endpoints

### POST `/analyze`
Analyze a token or return cached result.

**Request**:
```json
{
  "chain": "ethereum" | "base",
  "address": "0x..."
}
```

**Response**:
- If cached/fresh: `{ "status": "completed", "report": {...} }`
- If queued: `{ "status": "processing", "jobId": "..." }`

### GET `/report/{chain}/{address}`
Get the latest analysis report for a token.

**Response**: Analysis report with MRR, SCR, MFR, UF, confidence, and signals.

### GET `/health`
Health check endpoint.

## 🧠 How the Scoring Model Works

The system uses a **7-step context-aware adversarial model**:

1. **Capability Graph**: Detects what the contract CAN do (mint, blacklist, pause, etc.)
2. **Authority Context**: Classifies WHO controls each capability (renounced, multisig, single EOA, etc.)
3. **Liquidity Attack Surface**: Analyzes liquidity depth, multi-pool presence, removability
4. **Holder Concentration**: Computes top 1/top 10 concentration (affects MFR, not MRR)
5. **Historical Stability**: Age-based modifiers (older tokens = lower rug probability)
6. **Market Legitimacy**: High liquidity/multi-pool presence dampens MRR
7. **Uncertainty Factor**: Tracks missing data (unverified source, no holder data, etc.)

**Key Principle**: Never mix centralization directly into rug risk. WBTC has mint capability, but it's custodian-controlled → SCR increases, MRR stays low.

## 🛠️ Development

### Running Without Docker

**Backend API**:
```bash
cd apps/api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Worker**:
```bash
cd apps/api
source venv/bin/activate
rq worker --url redis://localhost:6379 analysis
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

**Database & Redis** (use Docker for these):
```bash
docker compose -f infra/docker-compose.yml up postgres redis
```

## 🔧 Environment Variables

Key environment variables (set in `.env` or `docker-compose.yml`):

- `ETH_RPC_URL`: Ethereum JSON-RPC endpoint (default: public RPC)
- `BASE_RPC_URL`: Base JSON-RPC endpoint (default: public RPC)
- `ETHERSCAN_API_KEY`: Etherscan API key (optional, improves analysis)
- `BASESCAN_API_KEY`: Basescan API key (optional, improves analysis)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT`: Redis connection
- `CACHE_TTL_SECONDS`: Cache expiration (default: 21600 = 6 hours)
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)

## 🐛 Troubleshooting

### Docker not found
- Install Docker Desktop: https://www.docker.com/products/docker-desktop/
- Make sure Docker Desktop is **running** (check system tray)

### Port conflicts
Change ports in `infra/docker-compose.yml` if these are in use:
- **5173**: Frontend (Vite dev server)
- **8000**: API
- **5432**: PostgreSQL
- **6379**: Redis

### Frontend can't connect to API
- Check API is running: http://localhost:8000/health
- Check CORS settings in `infra/docker-compose.yml` includes `http://localhost:5173`
- Restart both frontend and API

### Worker not processing jobs
- Check Redis is running: `docker compose -f infra/docker-compose.yml ps`
- Check worker logs: `docker compose -f infra/docker-compose.yml logs worker`
- Ensure worker container is running

### Database errors
- Wait for PostgreSQL to be healthy (check docker logs)
- Services have health checks and wait for dependencies
- If needed, run migration: `docker compose -f infra/docker-compose.yml exec api python migrate_db.py`

### Low confidence scores
- Add Etherscan/Basescan API keys to `.env` file
- Restart API and worker: `docker compose -f infra/docker-compose.yml restart api worker`

## 🛑 Stopping Services

**Docker services**:
```bash
docker compose -f infra/docker-compose.yml down
```

**Frontend**: Press `Ctrl+C` in the terminal

## 📝 License

MIT
