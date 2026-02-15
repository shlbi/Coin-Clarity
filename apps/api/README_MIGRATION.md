# Database Migration Guide

## Problem
The new scoring model requires additional columns in the `analysis_reports` table:
- `mrr` (Malicious Rug Risk)
- `scr` (Structural Centralization Risk)  
- `mfr` (Market Fragility Risk)
- `uf` (Uncertainty Factor)
- `confidence` (Confidence Score)
- `token_name`, `token_symbol`, `price_usd`, `price_change_24h`

## Solution

### Option 1: Run Migration Script (Recommended)
Run the migration script inside the API container:

```bash
docker compose exec api python migrate_db.py
```

### Option 2: Manual SQL Migration
Connect to the database and run:

```sql
ALTER TABLE analysis_reports ADD COLUMN IF NOT EXISTS mrr INTEGER;
ALTER TABLE analysis_reports ADD COLUMN IF NOT EXISTS scr INTEGER;
ALTER TABLE analysis_reports ADD COLUMN IF NOT EXISTS mfr INTEGER;
ALTER TABLE analysis_reports ADD COLUMN IF NOT EXISTS uf REAL;
ALTER TABLE analysis_reports ADD COLUMN IF NOT EXISTS confidence REAL;
ALTER TABLE analysis_reports ADD COLUMN IF NOT EXISTS token_name VARCHAR(255);
ALTER TABLE analysis_reports ADD COLUMN IF NOT EXISTS token_symbol VARCHAR(50);
ALTER TABLE analysis_reports ADD COLUMN IF NOT EXISTS price_usd REAL;
ALTER TABLE analysis_reports ADD COLUMN IF NOT EXISTS price_change_24h REAL;
```

### Option 3: Drop and Recreate (Development Only)
If you're in development and don't mind losing data:

```bash
docker compose down -v
docker compose up --build
```

## After Migration
- Existing reports will have `NULL` values for new columns
- Re-analyze tokens to populate the new scoring fields
- The API will handle missing columns gracefully until migration is complete
