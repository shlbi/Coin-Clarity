# Project Structure

```
.
├── apps/
│   ├── api/                    # FastAPI backend
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── database.py     # Database setup
│   │   │   ├── models.py       # SQLModel models
│   │   │   ├── worker.py       # Analysis function (called by RQ)
│   │   │   ├── routes/
│   │   │   │   ├── analyze.py  # POST /analyze
│   │   │   │   ├── report.py   # GET /report/{chain}/{address}
│   │   │   │   └── health.py   # GET /health
│   │   │   └── services/
│   │   │       ├── cache.py    # Redis caching
│   │   │       ├── scoring.py  # Risk scoring engine
│   │   │       └── analyzers/
│   │   │           ├── contract.py   # Contract analysis
│   │   │           ├── liquidity.py  # Liquidity analysis
│   │   │           └── holder.py     # Holder analysis
│   │   ├── main.py             # FastAPI app entry
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── web/                    # Next.js frontend
│   │   ├── app/
│   │   │   ├── page.tsx        # Home page with form
│   │   │   ├── layout.tsx
│   │   │   ├── globals.css
│   │   │   └── report/
│   │   │       └── [chain]/
│   │   │           └── [address]/
│   │   │               └── page.tsx  # Report page
│   │   ├── package.json
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── Dockerfile
│   │
│   └── worker/                 # RQ worker
│       ├── worker.py           # RQ worker entry point
│       └── Dockerfile
│
├── packages/
│   └── shared/                 # Shared types
│       ├── schema.json         # JSON schema
│       ├── types.ts            # TypeScript types
│       └── package.json
│
├── infra/
│   └── docker-compose.yml      # Docker Compose config
│
├── .env.example                 # Environment template
├── .gitignore
├── Makefile                    # Convenience commands
├── README.md                    # Full documentation
├── QUICKSTART.md               # Quick start guide
└── setup.sh                    # Setup script
```

## Key Components

### API (`apps/api`)
- **FastAPI** application with three main endpoints
- **SQLModel** for database models and queries
- **RQ** for job queue management
- **Analysis pipeline** with three analyzers + scoring engine

### Web (`apps/web`)
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- Form submission and report display with polling

### Worker (`apps/worker`)
- **RQ worker** that processes analysis jobs
- Imports analysis functions from `app.worker` module
- Runs async analysis and saves results

### Shared (`packages/shared`)
- JSON schema for validation
- TypeScript types for frontend
- Can be extended for shared validation logic

## Data Flow

1. User submits form → Web calls `POST /analyze`
2. API checks cache → If stale/missing, enqueues job
3. Worker processes job → Runs analyzers → Calculates score
4. Worker saves to DB → Updates Redis cache
5. Web polls `GET /report` → Displays results

## Services (Docker)

- **postgres**: PostgreSQL database
- **redis**: Redis cache and queue
- **api**: FastAPI backend
- **worker**: RQ worker process
- **web**: Next.js frontend
