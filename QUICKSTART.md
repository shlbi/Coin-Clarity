# Quick Start Guide

## Prerequisites

- Docker and Docker Compose installed
- (Optional) Explorer API keys for enhanced analysis

## Steps

1. **Clone/Navigate to the project directory**

2. **Copy environment file**:
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` (optional)**:
   - Add `ETHERSCAN_API_KEY` and `BASESCAN_API_KEY` for better analysis
   - Other defaults work out of the box

4. **Start all services**:
   ```bash
   docker compose -f infra/docker-compose.yml up --build
   ```

   Or using Make:
   ```bash
   make up
   ```

5. **Access the application**:
   - Web App: http://localhost:3000
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Testing

Try analyzing a token:
- Chain: Ethereum
- Address: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` (USDC)

## Troubleshooting

- **Port conflicts**: Edit ports in `infra/docker-compose.yml`
- **Worker not processing**: Check Redis connection and worker logs
- **Database errors**: Ensure PostgreSQL is healthy before starting API/worker
