# Déployer ULTIMATE gratuitement (démo client)

## Option recommandée : Vercel + Render + Neon (100% gratuit)

| Composant | Service | Gratuit |
|-----------|---------|---------|
| Frontend Next.js | [Vercel](https://vercel.com) | ✅ Oui |
| Backend FastAPI | [Render](https://render.com) | ✅ Oui (sleep après 15 min inactivité) |
| PostgreSQL | [Neon](https://neon.tech) | ✅ Oui (512 Mo) |

---

## Étape 1 — Pousser le code sur GitHub

```bash
cd ultimate
git init -b main
git add -A
git commit -m "ULTIMATE MVP — plateforme de rencontres"
```

Créez un repo sur https://github.com/new (nom : `ultimate`, privé recommandé), puis :

```bash
git remote add origin https://github.com/VOTRE-USERNAME/ultimate.git
git push -u origin main
```

---

## Étape 2 — Base de données Neon (gratuit)

1. Allez sur https://neon.tech → créer un compte
2. **New Project** → nom `ultimate`
3. Copiez la connection string (format `postgresql://...`)
4. Remplacez `postgresql://` par `postgresql+asyncpg://` pour le backend

Exemple :
```
postgresql+asyncpg://user:pass@ep-xxx.us-east-2.aws.neon.tech/ultimate?sslmode=require
```

---

## Étape 3 — Backend sur Render (gratuit)

1. https://render.com → **New +** → **Web Service**
2. Connectez votre repo GitHub `ultimate`
3. Paramètres :
   - **Root Directory** : `backend`
   - **Runtime** : Docker
   - **Plan** : Free
4. Variables d'environnement :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | URL Neon (avec `postgresql+asyncpg://`) |
| `SECRET_KEY` | Une longue chaîne aléatoire |
| `CORS_ORIGINS` | `https://votre-app.vercel.app` (après étape 4) |
| `ENVIRONMENT` | `production` |

5. Déployez → notez l'URL : `https://ultimate-api-xxxx.onrender.com`

6. **Premier démarrage** : les migrations et le seed s'exécutent automatiquement via `entrypoint.sh`

---

## Étape 4 — Frontend sur Vercel (gratuit)

1. https://vercel.com → **Add New Project**
2. Importez le repo GitHub `ultimate`
3. Paramètres :
   - **Root Directory** : `frontend`
   - **Framework** : Next.js (auto-détecté)
4. Variable d'environnement :

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://ultimate-api-xxxx.onrender.com` |

5. Déployez → URL : `https://ultimate-xxxx.vercel.app`

6. Retournez sur Render → mettez à jour `CORS_ORIGINS` avec l'URL Vercel exacte

---

## Étape 5 — Envoyer le lien au client

```
🌐 Application : https://ultimate-xxxx.vercel.app

Comptes démo :
• Utilisateur : demo@ultimate.ca / Demo123!
• Admin     : admin@ultimate.ca / Admin123!
```

> ⚠️ Render free tier : le backend met ~30 secondes à démarrer s'il était inactif. Prévenez le client de patienter au premier chargement.

---

## Option 2 — Tout sur Render (Blueprint)

1. Push sur GitHub
2. Render → **New Blueprint** → connecter le repo
3. Le fichier `render.yaml` configure backend + frontend + DB
4. Définir `CORS_ORIGINS` et `NEXT_PUBLIC_API_URL` manuellement après déploiement

---

## Option 3 — Démo locale avec tunnel (temporaire, sans hébergement)

Pour une démo rapide sans déployer :

```bash
# Terminal 1
docker compose up

# Terminal 2 — tunnel public gratuit
npx localtunnel --port 3100
```

Vous obtenez un lien `https://xxxx.loca.lt` à envoyer au client (valide tant que votre PC est allumé).

Pour ngrok :
```bash
ngrok http 3100
```
