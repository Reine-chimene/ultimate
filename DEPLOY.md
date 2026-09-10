# Déployer ULTIMATE — Neon + Koyeb + Netlify

Stack recommandée **sans carte bancaire** :

| Rôle | Service |
|------|---------|
| Base de données | **Neon** |
| Backend API | **Koyeb** |
| Frontend | **Netlify** |

> Fly.io et Render demandent une carte bancaire. Koyeb fonctionne généralement sans.

---

## ÉTAPE 1 — Neon (base de données)

1. https://neon.tech → **Sign up with GitHub**
2. **New project** → nom : `ultimate`
3. **Connection string** → copiez l'URL :
   ```
   postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
   ```
4. Gardez-la pour l'étape 2.

---

## ÉTAPE 2 — Koyeb (backend API)

### 2.1 Créer le compte

1. https://app.koyeb.com → **Sign up with GitHub**
2. Pas de carte bancaire dans la majorité des cas

### 2.2 Créer l'application

1. **Create App**
2. **GitHub** → autorisez → repo **`Reine-chimene/ultimate`**
3. Paramètres du service :

| Champ | Valeur |
|-------|--------|
| **Name** | `ultimate-api` |
| **Builder** | Dockerfile |
| **Dockerfile** | `backend/Dockerfile` |
| **Work directory** | `backend` |
| **Port** | `8000` |
| **Instance** | **Free** (512 MB) |
| **Region** | Washington D.C. ou Frankfurt |

4. **Environment variables** (cliquez Add variable) :

| Key | Value |
|-----|--------|
| `DATABASE_URL` | *(URL Neon de l'étape 1)* |
| `SECRET_KEY` | `ultimate-secret-changez-moi-abc123xyz789` |
| `CORS_ORIGINS` | `https://placeholder.netlify.app` *(temporaire)* |
| `ENVIRONMENT` | `production` |

5. **Deploy**

### 2.3 Vérifier

Attendez 5–8 min (build Docker). Notez l'URL :

```
https://ultimate-api-XXXX.koyeb.app/health
```

Réponse attendue : `{"status":"ok","service":"ultimate-backend"}`

---

## ÉTAPE 3 — Netlify (frontend)

1. https://app.netlify.com → **Sign up with GitHub**
2. **Add new site** → **Import an existing project**
3. Repo : **`Reine-chimene/ultimate`**
4. Netlify lit `netlify.toml` automatiquement
5. **Environment variables** :

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_URL` | `https://ultimate-api-XXXX.koyeb.app` |

6. **Deploy site**
7. Notez l'URL Netlify : `https://xxx.netlify.app`

---

## ÉTAPE 4 — Mettre à jour CORS

Dans Koyeb → votre app → **Settings** → **Environment variables** :

```
CORS_ORIGINS = https://votre-url-reelle.netlify.app
```

Redéployez (bouton **Redeploy**).

---

## ÉTAPE 5 — Tester

1. Ouvrez l'URL Netlify
2. Login : `demo@ultimate.ca` / `Demo123!`
3. Admin : `admin@ultimate.ca` / `Admin123!`

> Koyeb free : cold start ~10–30 sec après 1h sans activité.

---

## Message client

```
🌐 ULTIMATE — démo
https://votre-url.netlify.app

Comptes test :
• demo@ultimate.ca / Demo123!
• admin@ultimate.ca / Admin123!
```

---

## Plan B — SnapDeploy (si Koyeb demande une carte)

1. https://snapdeploy.dev → Sign up (sans carte)
2. **New Container** → GitHub → `Reine-chimene/ultimate`
3. Dockerfile path : `backend/Dockerfile`
4. Port : `8000`
5. Mêmes variables d'environnement
6. Netlify avec `NEXT_PUBLIC_API_URL` = URL SnapDeploy
