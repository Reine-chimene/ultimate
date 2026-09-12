#!/bin/sh
set -e

echo "En attente de PostgreSQL..."

until python -c "
import asyncio
import sys
from sqlalchemy import text
from app.database import engine

async def check():
    try:
        async with engine.connect() as conn:
            await conn.execute(text('SELECT 1'))
        return True
    except Exception:
        return False

sys.exit(0 if asyncio.run(check()) else 1)
"; do
  echo "PostgreSQL non disponible - nouvelle tentative dans 2s..."
  sleep 2
done

echo "PostgreSQL prêt."

echo "Exécution des migrations Alembic..."
alembic upgrade head || {
  echo "Migration Alembic échouée, création des tables via create_all..."
  python -m app.seed --tables-only 2>/dev/null || python -c "
import asyncio
from app.database import Base, engine

async def create():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()

asyncio.run(create())
print('Tables créées via create_all.')
"
}

echo "Seed de la base si vide..."
python -m app.seed

echo "Démarrage du serveur Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
