# ULTIMATE

**MEET. TONIGHT. CONNECT.**

Plateforme de rencontres premium pour adultes (18+). Application unique, base PostgreSQL unique — pas de multi-tenant, pas de microservices.

## Démarrage rapide

```bash
cp .env.example .env
docker compose up --build
```

| Service   | URL                        |
|-----------|----------------------------|
| Frontend  | http://localhost:3100      |
| API       | http://localhost:8100      |
| API Docs  | http://localhost:8100/docs |
| Health    | http://localhost:8100/health |

> Ports dédiés 3100/8100 pour éviter les conflits avec d'autres applications (Bloomar, Prigs, etc.)

## Comptes de démonstration

| Rôle  | Courriel           | Mot de passe |
|-------|--------------------|--------------|
| Admin | admin@ultimate.ca  | Admin123!    |
| User  | demo@ultimate.ca   | Demo123!     |

15 profils de démonstration sont créés automatiquement au premier démarrage.

## Fonctionnalités MVP

- Inscription / connexion JWT (18+ obligatoire)
- Profils avec photos, bio, intérêts, préférences
- Découverte avec score de compatibilité
- Likes, matchs, messagerie
- **Ce soir** — disponibilité same-day
- Demandes de rendez-vous (acceptation explicite requise)
- Abonnements Premium (simulation de paiement)
- Signalement et blocage d'utilisateurs
- Panel admin (stats, utilisateurs, modération, signalements)

## Structure

```
ultimate/
├── backend/app/
│   ├── models/      # SQLAlchemy (UUID PKs)
│   ├── schemas/     # Pydantic v2
│   ├── routers/     # REST API /api/v1
│   ├── services/    # Logique métier
│   └── auth/        # JWT, bcrypt
├── frontend/src/
│   ├── app/         # Pages Next.js (25 pages)
│   ├── components/  # UI, layout, discovery
│   ├── lib/         # API client, auth, utils
│   └── types/       # TypeScript
└── docker-compose.yml
```

## Développement local

```bash
# PostgreSQL seul
docker compose up -d postgres

# Backend
cd backend && pip install -e .
alembic upgrade head && python -m app.seed
uvicorn app.main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```

## Limitations (production)

- Paiements simulés (pas de Stripe/PayPal)
- Mot de passe oublié non fonctionnel
- Messagerie HTTP (pas de WebSockets)
- Photos via URL (pas d'upload fichier)
- Pas de vérification d'identité
- Pas de géolocalisation GPS (ville uniquement)
- Pas de rate limiting / CDN
