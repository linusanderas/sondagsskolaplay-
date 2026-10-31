# Söndagsskola Play

Monorepo för ombyggnaden av [sondagsskolaplay.se](https://sondagsskolaplay.se): **Laravel API** + **React SPA** (Vite).

## Struktur

```
sondagsskolaplay-/
  apps/
    api/                 # Laravel 12 API (Sanctum SPA-auth)
    web/                 # React 19 + Vite + TypeScript
  docker-compose.yml     # Postgres 16 + Mailpit
  README.md
```

Domänstubbar i API:t: `User`, `Organization`, `Plan`, `Subscription`, `AccessGrant`, `Video`, `Collection` (migrations + Eloquent-relationer, ingen full feature-logik ännu).

## Förutsättningar

- PHP 8.3+ med extensions: `mbstring`, `xml`, `curl`, `zip`, `pgsql` (eller `sqlite`), `bcmath`
- Composer 2
- Node.js 20+ / npm
- Docker (valfritt, för Postgres + Mailpit)

## Lokal körning

### 1. Databas (rekommenderat)

```bash
docker compose up -d
```

### 2. Backend (`apps/api`)

```bash
cd apps/api
cp .env.example .env
php artisan key:generate
composer install
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

Health-check:

- Framework: `GET http://localhost:8000/up`
- API: `GET http://localhost:8000/api/health`

### 3. Frontend (`apps/web`)

```bash
cd apps/web
cp .env.example .env
npm install
npm run dev
```

Öppna `http://localhost:5173`. Vite proxar `/api` och `/sanctum` till Laravel (`localhost:8000`) om `VITE_API_URL` lämnas tom; annars sätt `VITE_API_URL=http://localhost:8000`.

## Auth & CORS (stubbe)

- **Laravel Sanctum** för SPA (cookie/session + CSRF via `statefulApi()`).
- Stateful hosts styrs av `SANCTUM_STATEFUL_DOMAINS`.
- CORS: `CORS_ALLOWED_ORIGINS` + `supports_credentials=true` i `config/cors.php`.
- Full login/register UI kommer i senare faser; `/api/user` kräver `auth:sanctum`.

## Miljövariabler (placeholders)

Se `apps/api/.env.example`:

| Nyckel | Syfte |
|---|---|
| `DB_*` | Postgres (default) eller SQLite |
| `VIMEO_CLIENT_ID` | Vimeo API (hemlighet — endast i lokal `.env` / hosting secrets) |
| `VIMEO_CLIENT_SECRET` | Vimeo API |
| `VIMEO_ACCESS_TOKEN` | Vimeo API |
| `FRONTEND_URL` / `CORS_ALLOWED_ORIGINS` | SPA-origin |
| `SANCTUM_STATEFUL_DOMAINS` | Cookie-auth hosts |

**Lägg aldrig riktiga Vimeo-nycklar i git.**

## Snabb SQLite (utan Docker)

I `apps/api/.env`:

```env
DB_CONNECTION=sqlite
# DB_DATABASE=database/database.sqlite
```

Skapa filen om den saknas: `touch database/database.sqlite`, kör sedan `php artisan migrate`.

## Nästa steg

Se ombyggnadsplanen (SP-1) för fasindelning: admin MVP, kundbibliotek + Vimeo-playback, publik sajt.
