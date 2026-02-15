# Coin Clarity

A production-ready MVP for analyzing crypto tokens to detect fraud and scam risk. Built with Next.js, FastAPI, PostgreSQL, and Redis.

## Architecture

- **Web App**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **API**: FastAPI (Python) + Uvicorn
- **Worker**: Python RQ worker for async analysis jobs
- **Database**: PostgreSQL (via SQLModel)
- **Cache/Queue**: Redis with RQ

## Features

- **Contract Analysis**: Detects proxy contracts, verification status, and risky privilege functions
- **Liquidity Analysis**: Analyzes token liquidity, FDV, and trading volume via DexScreener
- **Holder Analysis**: Computes concentration metrics (requires explorer API keys)
- **Risk Scoring**: Rule-based scoring system (0-100) with tier classification
- **Caching**: Redis-based caching with configurable TTL
- **Async Processing**: Background job queue for analysis tasks

## Quick Start

### Prerequisites

- Docker and Docker Compose
- (Optional) Explorer API keys for enhanced analysis

### Setup

1. **Clone and navigate to the project**:
   ```bash
   cd Hack_NCState_Spring_2026
   ```

2. **Copy environment file**:
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env`** (optional):
   - Add `ETHERSCAN_API_KEY` and `BASESCAN_API_KEY` for better analysis
   - Adjust RPC URLs if needed
   - Other defaults work out of the box

4. **Start all services**:
   ```bash
   docker compose -f infra/docker-compose.yml up --build
   ```

5. **Access the application**:
   - Web App: http://localhost:3000
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Using Make (Alternative)

If you prefer Make commands:

```bash
# Start all services
make up

# Stop all services
make down

# View logs
make logs

# Rebuild and restart
make restart
```

## Project Structure

```
.
├── apps/
│   ├── web/              # Next.js web application
│   ├── api/              # FastAPI backend
│   └── worker/           # RQ worker for async jobs
├── packages/
│   └── shared/           # Shared types and schemas
├── infra/
│   └── docker-compose.yml # Docker Compose configuration
├── .env.example          # Environment variables template
└── README.md
```

## API Endpoints

### POST `/analyze`
Analyze a token or return cached result.

**Request Body**:
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

**Response**: Analysis report object or 404 if not found.

### GET `/health`
Health check endpoint for monitoring.

## Analysis Pipeline

1. **Contract Analyzer**:
   - Fetches bytecode via JSON-RPC
   - Detects proxy contracts (DELEGATECALL heuristic)
   - Checks verification status via explorer API
   - Scans for risky function selectors (mint, blacklist, pause, etc.)

2. **Liquidity Analyzer**:
   - Calls DexScreener public API
   - Extracts liquidity, FDV, volume
   - Flags low liquidity (<$25k) and suspicious ratios

3. **Holder Analyzer**:
   - Fetches top holders via explorer API (if key provided)
   - Computes top 1 and top 10 concentration

4. **Scoring Engine**:
   - Rule-based weights produce 0-100 risk score
   - Tiers: Extreme (≥80), High (60-79), Medium (35-59), Low (<35)
   - Generates 3-8 signals with severity and evidence links

## Caching

- Reports cached in Redis with 6-hour TTL (configurable)
- Database stores all reports for history
- Stale reports trigger background re-analysis

## Development

### Running Locally (without Docker)

**API**:
```bash
cd apps/api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Worker**:
```bash
cd apps/worker
# Use same venv as API
rq worker --url redis://localhost:6379 analysis
```

**Web**:
```bash
cd apps/web
npm install
npm run dev
```

**Database & Redis**:
```bash
# Use Docker Compose for just these services
docker compose -f infra/docker-compose.yml up postgres redis
```

## Environment Variables

See `.env.example` for all available variables. Key ones:

- `ETH_RPC_URL`, `BASE_RPC_URL`: JSON-RPC endpoints
- `ETHERSCAN_API_KEY`, `BASESCAN_API_KEY`: Explorer API keys (optional)
- `CACHE_TTL_SECONDS`: Cache expiration (default: 21600 = 6 hours)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT`: Redis connection

## Troubleshooting

**Port conflicts**: Change ports in `docker-compose.yml` if 3000, 8000, 5432, or 6379 are in use.

**Worker not processing**: Check Redis connection and ensure worker container is running.

**Missing data**: Some features require explorer API keys. Add them to `.env` for complete analysis.

**Database errors**: Ensure PostgreSQL container is healthy before starting API/worker.

## License

MIT
