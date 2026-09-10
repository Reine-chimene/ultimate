#!/bin/sh
set -e

echo "En attente de PostgreSQL..."

until python -c "
import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check():
    url = os.environ.get('DATABASE_URL', 'postgresql+asyncpg://ultimate:ultimate@postgres:5432/ultimate')
    engine = create_async_engine(url)
    try:
        async with engine.connect() as conn:
            await conn.execute(text('SELECT 1'))
        await engine.dispose()
        return True
    except Exception:
        await engine.dispose()
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
