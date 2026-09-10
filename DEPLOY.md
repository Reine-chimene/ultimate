# Déployer ULTIMATE — Neon + Netlify + Render

> **Stack recommandée** : Neon (DB) + Render (API) + Netlify (frontend)  
> Vercel fonctionne aussi pour le frontend, mais Netlify est parfait pour Next.js.

Je ne peux pas créer vos comptes à votre place — une connexion GitHub suffit sur chaque plateforme (2–3 clics chacune).

---

## Architecture

```
Client (navigateur)
       ↓
Netlify  →  frontend Next.js  (https://ultimate-xxx.netlify.app)
       ↓
Render   →  backend FastAPI   (https://ultimate-api.onrender.com)
       ↓
Neon     →  PostgreSQL        (gratuit, 512 Mo)
```

---

## Étape 1 — Neon (base de données) ~3 min

1. https://neon.tech → **Sign up** (avec GitHub)
2. **New Project** → nom : `ultimate`
3. Copiez la **Connection string** (format `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)
4. Gardez-la — vous en aurez besoin à l'étape 2

> Le backend convertit automatiquement `postgresql://` en `postgresql+asyncpg://`

---

## Étape 2 — Render (backend API) ~5 min

1. https://render.com → **Sign up** (avec GitHub)
2. **New +** → **Web Service**
3. Connectez le repo **`Reine-chimene/ultimate`**
4. Paramètres :

| Champ | Valeur |
|-------|--------|
| Name | `ultimate-api` |
| Root Directory | `backend` |
| Runtime | **Docker** |
| Instance Type | **Free** |

5. **Environment Variables** :

| Key | Value |
|-----|--------|
| `DATABASE_URL` | *(coller l'URL Neon de l'étape 1)* |
| `SECRET_KEY` | *(générer une longue chaîne aléatoire)* |
| `ENVIRONMENT` | `production` |
| `CORS_ORIGINS` | `https://VOTRE-SITE.netlify.app` *(après étape 3)* |

6. **Create Web Service** → attendez le déploiement (~5 min)
7. Notez l'URL : `https://ultimate-api-xxxx.onrender.com`
8. Test : `https://ultimate-api-xxxx.onrender.com/health` → `{"status":"ok"}`

> Le seed (15 profils démo) s'exécute automatiquement au premier démarrage.

---

## Étape 3 — Netlify (frontend) ~3 min

1. https://app.netlify.com → **Sign up** (avec GitHub)
2. **Add new site** → **Import an existing project** → **GitHub**
3. Choisissez **`Reine-chimene/ultimate`**
4. Netlify détecte `netlify.toml` automatiquement. Vérifiez :

| Champ | Valeur |
|-------|--------|
| Base directory | `frontend` |
| Build command | `npm run build` |

5. **Environment variables** → **Add variable** :

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_URL` | `https://ultimate-api-xxxx.onrender.com` |

6. **Deploy site**
7. URL finale : `https://random-name.netlify.app` (renommable dans Site settings → Domain)

8. **Retour sur Render** → mettez à jour `CORS_ORIGINS` avec l'URL Netlify exacte → redeploy

---

## Étape 4 — Envoyer au client

```
🌐 ULTIMATE — démo
https://votre-site.netlify.app

Comptes test :
• demo@ultimate.ca / Demo123!
• admin@ultimate.ca / Admin123!

⚠️ Premier chargement : ~30 sec (Render free tier se réveille)
```

---

## Vercel vs Netlify ?

| | Netlify | Vercel |
|---|---------|--------|
| Next.js | ✅ Excellent | ✅ Excellent (créateurs de Next.js) |
| Gratuit | ✅ Oui | ✅ Oui |
| Import GitHub | ✅ 1 clic | ✅ 1 clic |

**Les deux conviennent.** Vous avez choisi Netlify — c'est parfait.

---

## Limites du free tier

- **Render** : API endormie après 15 min → 30 sec au réveil
- **Neon** : 512 Mo, projet suspendu après 7 jours d'inactivité (clic pour réactiver)
- **Netlify** : 100 Go bande passante/mois — largement suffisant pour une démo

---

## Mise à jour du code

Après chaque `git push` sur `main` :
- **Netlify** redéploie le frontend automatiquement
- **Render** redéploie le backend automatiquement
