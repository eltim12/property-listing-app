# Property Listing App

Airbnb-style bilingual (EN / 中文) marketplace for factory & warehouse listings in Indonesia (IDR).

## Structure

| Folder | Stack | Port |
|--------|--------|------|
| `backend/` | Express + mysql2 + JWT + multer | 4000 |
| `frontend/` | Next.js + Tailwind + next-intl | 3000 |
| `backoffice/` | Vue 3 + Vite + reimbursement-UI kit | 5173 |

## Prerequisites

- Node.js 20+
- MySQL 8+ running locally

## Setup

### 1. Database

```bash
cd backend
cp .env.example .env   # edit DB_PASSWORD if needed
npm install
npm run seed           # creates DB, schema, admin, sample listings
```

Default admin: `admin@example.com` / `admin123`

### 2. Backend

```bash
cd backend
npm run dev
# http://localhost:4000
```

### 3. Public site

```bash
cd frontend
npm install
npm run dev
# http://localhost:3000  → redirects to /en
```

### 4. Backoffice

```bash
cd backoffice
npm install
npm run dev
# http://localhost:5173
```

## Deploy (Firebase Hosting)

Project: **industrialbridge-d9312**

| App | URL |
|-----|-----|
| Frontend | https://industrialbridge-d9312.web.app |
| Backoffice | https://industrialbridge-d9312.web.app/admin |

```bash
# build + deploy
npm run deploy:firebase

# or build only into ./hosting
npm run build:hosting
```

Both apps talk to the VPS API (`https://property-listing-api.72-60-78-140.sslip.io`).

## API target (local ↔ deployed)

Both frontend and backoffice share one switch:

```bash
# from repo root
npm run api:status      # show current target
npm run api:local       # → http://localhost:4000
npm run api:deployed    # → http://72.60.78.140:4000
```

Then restart the frontend / backoffice dev servers. Config lives in `api.config.json`.

Default admin on **deployed**: see your VPS seed credentials.  
Default admin on **local**: `admin@example.com` / `admin123`

## Features

- Public browse/search only (no user accounts)
- Listing availability: **open** (for sale/rent) vs **closed** (sold/rented)
- Visibility: draft / published (admin only)
- Single global contact person (Settings in backoffice)
- Local image uploads under `backend/uploads/`
- Trust-blue Airbnb-inspired UI (not pink)

## API overview

- `GET /api/listings` — public filters
- `GET /api/listings/:id`
- `GET /api/settings/contact`
- `POST /api/auth/login`
- `GET|POST|PUT|DELETE /api/admin/listings...`
- `GET|PUT /api/settings/admin`
