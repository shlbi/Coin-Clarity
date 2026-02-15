"""
Database migration script to add new columns to analysis_reports table.
Run this script to add the new scoring model columns to existing databases.
"""
import os
from sqlmodel import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://coinclarity:coinclarity@postgres:5432/coinclarity"
)

engine = create_engine(DATABASE_URL, echo=True)

def migrate():
    """Add new columns to analysis_reports table if they don't exist"""
    with engine.connect() as conn:
        # Check if columns exist and add them if they don't
        migrations = [
            ("mrr", "INTEGER"),
            ("scr", "INTEGER"),
            ("mfr", "INTEGER"),
            ("uf", "REAL"),
            ("confidence", "REAL"),
            ("token_name", "VARCHAR(255)"),
            ("token_symbol", "VARCHAR(50)"),
            ("price_usd", "REAL"),
            ("price_change_24h", "REAL"),
        ]
        
        for column_name, column_type in migrations:
            try:
                # Check if column exists
                check_query = text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='analysis_reports' 
                    AND column_name='{column_name}'
                """)
                result = conn.execute(check_query)
                exists = result.fetchone() is not None
                
                if not exists:
                    print(f"Adding column {column_name}...")
                    alter_query = text(f"ALTER TABLE analysis_reports ADD COLUMN {column_name} {column_type}")
                    conn.execute(alter_query)
                    conn.commit()
                    print(f"✓ Added column {column_name}")
                else:
                    print(f"✓ Column {column_name} already exists")
            except Exception as e:
                print(f"✗ Error adding column {column_name}: {e}")
                conn.rollback()

if __name__ == "__main__":
    print("Running database migration...")
    migrate()
    print("Migration complete!")
