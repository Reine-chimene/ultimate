FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install --no-cache-dir -e .

COPY . .

RUN chmod +x scripts/entrypoint.sh

ENV PYTHONUNBUFFERED=1
ENV DATABASE_URL=postgresql+asyncpg://ultimate:ultimate@postgres:5432/ultimate

EXPOSE 8000

ENTRYPOINT ["./scripts/entrypoint.sh"]
