# CinemaVault

A full-stack movie catalog app built with **Go** (standard library only, no web framework) and **vanilla JavaScript** (native Web Components, no frontend framework). Backed by PostgreSQL, seeded with a real ~4,800-title movie dataset.

## Features

- **Auth**: registration, login, JWT-based sessions, bcrypt password hashing
- **Password reset**: email-based reset flow with expiring tokens (falls back to logging the reset link locally when no SMTP server is configured)
- **Role-based admin panel**: promote users to `admin`, then manage the movie catalog (create/edit/delete) and user accounts (promote/demote/delete) from dedicated pages
- **Movie catalog**: search, browse, and view details for the seeded dataset
- **Responsive UI**: works down to phone width

## Tech stack

- **Backend**: Go, `net/http` (stdlib router), PostgreSQL (`lib/pq`), `golang-jwt`, `bcrypt`
- **Frontend**: plain ES modules, native Web Components (`customElements`), a hand-rolled router using the History API, no build step

## Getting started

### Prerequisites

- Go 1.26+
- A PostgreSQL database
- (Optional) an SMTP server for real password-reset emails

### 1. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=8080
DATABASE_URL=postgres://user:password@localhost:5432/dbname?sslmode=disable
JWT_SECRET=change-me-to-a-long-random-string

# Password reset emails
APP_BASE_URL=http://localhost:8080
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# Local dev only: prints reset links to the console instead of sending email
# when SMTP_HOST is empty. Never set this to true outside local development —
# reset links grant account takeover.
DEV_LOG_RESET_LINKS=true
```

`DATABASE_URL` and `JWT_SECRET` are required; the server refuses to start without them. Leave `SMTP_HOST` empty for local development — password reset links will print to the console instead of being emailed.

### 2. Set up the database

```bash
go run import/install.go
```

This creates all tables (if they don't already exist) and seeds the `movies` table with the full dataset. Safe to re-run — it won't duplicate data.

### 3. Run the server

```bash
go run main.go
```

The app is served at `http://localhost:8080` (or whatever `PORT` you set).

### 4. Create an admin account

Register a normal account through the app, then promote it manually:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

Log out and back in afterward — the role is baked into the JWT at login time.

## Project structure

```
main.go              Entry point, route wiring
handlers/            HTTP handlers (auth, movies, admin, middleware)
data/                Database access layer (repositories)
models/              Data structs
token/               JWT and password-reset token generation/validation
mail/                Password reset email delivery
import/              Database schema + seed data, one-time installer
public/              Frontend: components, services (API client, router, store), styles
```

## API overview

| Method | Path | Auth |
|---|---|---|
| POST | `/api/register` | — |
| POST | `/api/login` | — |
| POST | `/api/forgot-password` | — |
| POST | `/api/reset-password` | — |
| GET | `/api/movies` | — |
| GET | `/api/movies/{id}` | — |
| POST | `/api/movies` | admin |
| PUT | `/api/movies/{id}` | admin |
| DELETE | `/api/movies/{id}` | admin |
| GET | `/api/admin/users` | admin |
| PATCH | `/api/admin/users/{id}/role` | admin |
| DELETE | `/api/admin/users/{id}` | admin |

## Security notes

- Never commit `.env` — it's already git-ignored.
- `JWT_SECRET` must be a long random string in any real deployment; the server won't start without it.
- `DEV_LOG_RESET_LINKS` must stay unset (or `false`) outside local development, since it prints password-reset links (which grant account takeover) to the console.
