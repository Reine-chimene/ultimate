# Déployer ULTIMATE — Neon + Fly.io + Netlify

| Rôle | Service | URL |
|------|---------|-----|
| Base de données | **Neon** | https://neon.tech |
| Backend API | **Fly.io** | https://fly.io |
| Frontend | **Netlify** | https://app.netlify.com |

> Fly.io demande une carte (même pour le gratuit). Aucun frais tant que vous restez dans les limites free tier.

---

## ÉTAPE 1 — Neon (base de données)

1. https://neon.tech → **Sign up with GitHub**
2. **New project** → nom : `ultimate`
3. **Connection string** → copiez l'URL :
   ```
   postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
   ```

---

## ÉTAPE 2 — Fly.io (backend)

### 2.1 Carte bancaire (une seule fois)

1. https://fly.io/dashboard/personal/billing
2. Ajoutez votre carte prépayée
3. Fly.io peut faire une vérification temporaire (~$5) — remboursée

### 2.2 Installer le CLI

```bash
curl -L https://fly.io/install.sh | sh
export PATH="$HOME/.fly/bin:$PATH"
fly auth login
```

### 2.3 Déployer

```bash
cd ~/Documents/ultimate/backend

# Si pas encore lancé :
fly launch --no-deploy --copy-config --name ultimate-api
# → Postgres : No | Redis : No | Deploy now : No

# Secrets (remplacez les valeurs)
fly secrets set \
  DATABASE_URL="postgresql://USER:PASS@ep-xxx.neon.tech/neondb?sslmode=require" \
  SECRET_KEY="ultimate-secret-changez-moi-abc123xyz789" \
  CORS_ORIGINS="https://temp.netlify.app" \
  ENVIRONMENT="production"

# Déployer
fly deploy
```

### 2.4 Vérifier

```bash
curl https://ultimate-api.fly.dev/health
```

Réponse : `{"status":"ok","service":"ultimate-backend"}`

---

## ÉTAPE 3 — Netlify (frontend)

1. https://app.netlify.com → **Sign up with GitHub**
2. **Add new site** → Import **`Reine-chimene/ultimate`**
3. Variable :

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_URL` | `https://ultimate-api.fly.dev` |

4. **Deploy** → notez l'URL Netlify

---

## ÉTAPE 4 — CORS

```bash
fly secrets set CORS_ORIGINS="https://votre-url.netlify.app"
```

---

## Comptes démo client

```
demo@ultimate.ca / Demo123!
admin@ultimate.ca / Admin123!
```

---

## Commandes utiles

```bash
fly logs              # voir les logs
fly status            # état de l'app
fly deploy            # redéployer après modification
git push origin main  # Netlify redéploie le frontend auto
```
