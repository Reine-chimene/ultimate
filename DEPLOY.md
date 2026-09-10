# Déployer ULTIMATE — Neon + Fly.io + Netlify

Stack : **Neon** (DB) + **Fly.io** (API) + **Netlify** (frontend)

> Render inaccessible ? Fly.io est l'alternative recommandée (Docker natif, gratuit).

---

## Architecture

```
Navigateur
    ↓
Netlify   →  https://ultimate.netlify.app        (frontend)
    ↓
Fly.io    →  https://ultimate-api.fly.dev        (backend FastAPI)
    ↓
Neon      →  PostgreSQL                          (base de données)
```

---

## Étape 1 — Neon (base de données) ~3 min

1. https://neon.tech → **Sign up with GitHub**
2. **New project** → nom : `ultimate` → région : `AWS US East` ou `Canada` si dispo
3. **Connection string** → copiez l'URL `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`
4. Gardez-la pour l'étape 2

---

## Étape 2 — Fly.io (backend API) ~10 min

### 2a. Créer un compte

1. https://fly.io/app/sign-up → **Sign up with GitHub**
2. Installez le CLI (Linux) :

```bash
curl -L https://fly.io/install.sh | sh
export FLYCTL_INSTALL="$HOME/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"
fly auth login
```

### 2b. Déployer le backend

```bash
cd ~/Documents/ultimate/backend

# Créer l'app (répondre aux questions — ne pas créer de Postgres Fly, vous utilisez Neon)
fly launch --no-deploy --copy-config --name ultimate-api

# Secrets (remplacez par vos vraies valeurs)
fly secrets set \
  DATABASE_URL="postgresql://USER:PASS@ep-xxx.neon.tech/neondb?sslmode=require" \
  SECRET_KEY="votre-cle-secrete-longue-et-aleatoire" \
  CORS_ORIGINS="https://VOTRE-SITE.netlify.app" \
  ENVIRONMENT="production"

# Déployer
fly deploy
```

### 2c. Vérifier

```bash
fly open /health
# ou
curl https://ultimate-api.fly.dev/health
```

Réponse attendue : `{"status":"ok","service":"ultimate-backend"}`

> Le seed (15 profils démo) s'exécute au premier démarrage.

---

## Étape 3 — Netlify (frontend) ~5 min

1. https://app.netlify.com → **Sign up with GitHub**
2. **Add new site** → **Import an existing project** → GitHub
3. Repo : **`Reine-chimene/ultimate`**
4. Netlify lit `netlify.toml` automatiquement
5. **Environment variables** :

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_URL` | `https://ultimate-api.fly.dev` |

6. **Deploy site**
7. Notez l'URL : `https://random-name.netlify.app`
8. (Optionnel) Site settings → Domain → renommer en `ultimate-demo.netlify.app`

### 3b. Mettre à jour CORS sur Fly.io

```bash
fly secrets set CORS_ORIGINS="https://votre-url.netlify.app"
```

---

## Étape 4 — Envoyer au client

```
🌐 ULTIMATE — démo
https://votre-site.netlify.app

Comptes test :
• demo@ultimate.ca / Demo123!
• admin@ultimate.ca / Admin123!

Note : premier chargement ~5-10 sec (Fly.io se réveille)
```

---

## Alternative si Fly.io ne marche pas : Koyeb

1. https://app.koyeb.com → Sign up with GitHub
2. **Create App** → **GitHub** → repo `Reine-chimene/ultimate`
3. Paramètres :
   - **Builder** : Dockerfile
   - **Dockerfile path** : `backend/Dockerfile`
   - **Port** : `8000`
   - **Instance** : Free (Nano)
4. **Environment variables** : même liste que Fly.io (`DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`, `ENVIRONMENT`)
5. Deploy → URL : `https://xxx.koyeb.app`

Puis Netlify avec `NEXT_PUBLIC_API_URL` = URL Koyeb.

---

## Comparaison hébergeurs backend

| | Fly.io | Koyeb | Render |
|---|--------|-------|--------|
| Accès | ✅ fly.io | ✅ koyeb.com | ❌ (bloqué chez vous) |
| Docker | ✅ | ✅ | ✅ |
| Gratuit | ✅ | ✅ | ✅ |
| Cold start | ~5-10 sec | ~10 sec | ~30 sec |
| Région proche | Toronto (yyz) | Europe/US | US |

---

## Mises à jour

Chaque `git push` sur `main` :
- **Netlify** → redéploie le frontend automatiquement
- **Fly.io** → `fly deploy` depuis `backend/` (ou CI GitHub Actions)
