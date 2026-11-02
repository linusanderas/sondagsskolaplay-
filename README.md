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

Domänmodeller: `User`, `Organization`, `Plan`, `Subscription`, `AccessGrant`, `Video`, `Collection`.

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
php artisan migrate --seed
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

Öppna `http://localhost:5173`. Vite proxar `/api` och `/sanctum` till Laravel (`localhost:8000`) om `VITE_API_URL` lämnas tom.

## Admin-MVP (lokalt)

Efter `php artisan migrate --seed`:

| | |
|---|---|
| URL | http://localhost:5173/login → `/admin` |
| E-post | `admin@sondagsskolaplay.local` |
| Lösenord | `password` |

**Endast för lokal utveckling** — byt i produktion.

Admin kan:

- Lista/skapa/redigera **Organization** (församling)
- Skapa/koppla **User** till org
- Skapa **Subscription** mot **Plan** och sätta manuell status (`pending`, `active`, `past_due`, `paused`, `ended`, `cancelled`)
- Tilldela **AccessGrant** till Video eller Collection (urval / resurspaket)

Seed skapar också exempelplaner, videor, collections och två demo-församlingar.

## Auth & CORS

- **Laravel Sanctum** SPA (cookie/session + CSRF via `statefulApi()`)
- Admin-routes: `auth:sanctum` + `admin` (User.role = `admin`)
- Stateful hosts: `SANCTUM_STATEFUL_DOMAINS`
- CORS: `CORS_ALLOWED_ORIGINS` + `supports_credentials=true`

## Miljövariabler (placeholders)

Se `apps/api/.env.example`:

| Nyckel | Syfte |
|---|---|
| `DB_*` | Postgres (default) eller SQLite |
| `VIMEO_CLIENT_ID` / `SECRET` / `ACCESS_TOKEN` | Vimeo — endast i lokal `.env` / secrets |
| `FRONTEND_URL` / `CORS_ALLOWED_ORIGINS` | SPA-origin |
| `SANCTUM_STATEFUL_DOMAINS` | Cookie-auth hosts |

**Lägg aldrig riktiga Vimeo-nycklar i git.**

## Snabb SQLite (utan Docker)

I `apps/api/.env`:

```env
DB_CONNECTION=sqlite
# DB_DATABASE lämnas tom → database/database.sqlite
```

```bash
touch database/database.sqlite
php artisan migrate --seed
```
