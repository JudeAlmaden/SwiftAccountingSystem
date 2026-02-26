## SwiftAccountingSystem – Agent Guide

This document explains how AI agents should work on this project: how to run it, how to seed data, and what conventions to follow.

### Tech stack

- **Backend**: Laravel 12 (PHP 8.2)
- **Frontend**: Inertia + React + TypeScript, bundled with **Vite** (not Laravel Mix)
- **Database**: MySQL 8
- **Tooling**: Composer, npm, PHPUnit, Laravel Pint, Docker + docker-compose

### Docker environment

- **Services**:
  - **app**: PHP CLI container running `php artisan serve` on port `8000`.
  - **mysql**: MySQL 8 container, internal hostname `mysql`.
- **Database defaults** (from `docker-compose.yml` / `.env`):
  - **DB host**: `mysql`
  - **DB name**: `Accounting_System`
  - **DB user**: `app`
  - **DB password**: `app`

#### Start the stack

From the project root:

```bash
docker compose build
docker compose up -d
```

#### Install and build dependencies (inside Docker)

Use the `app` service as the execution environment:

```bash
docker compose run --rm app composer install
docker compose run --rm app npm install
docker compose run --rm app npm run build
```

#### Database migrations and seeders

- To create and seed the schema from scratch:

```bash
docker compose run --rm app php artisan migrate --seed
```

- To only run seeders after schema exists:

```bash
docker compose run --rm app php artisan db:seed
```

Agents should **prefer `migrate --seed`** when setting up a new environment, and **use `db:seed`** when only data needs refreshing.

### Application conventions

- **Assets**:
  - Use `@viteReactRefresh` and `@vite([...])` in Blade views.
  - **Do not** reintroduce `mix()` or Laravel Mix; there is no `mix-manifest.json`.
- **Inertia + Ziggy**:
  - Main layout is `resources/views/app.blade.php` with `@inertia`, `@inertiaHead`, and `@routes`.
  - Frontend entry is `resources/js/app.tsx` plus page components under `resources/js/pages/`.

### Composer and npm scripts

- **Setup (one-shot, local without Docker)**:
  - `composer setup` runs: `composer install`, copies `.env` if missing, generates key, runs migrations, installs npm deps, and builds assets.
- **Development**:
  - `composer dev` starts Laravel server, queue listener, and Vite dev server concurrently.
  - `composer dev:ssr` additionally runs Inertia SSR and Laravel Pail.
- **Linting & tests**:
  - `composer lint` runs Pint in parallel.
  - `composer test:lint` runs Pint in test mode.
  - `composer test` clears config cache, runs `test:lint`, then `php artisan test`.

Agents should use these scripts instead of re‑implementing equivalent command chains where possible.

### Coding and project guidelines for agents

- **Do not commit or rely on `.env` as a source of truth**; treat it as local configuration. When documenting config, describe expected keys and defaults rather than duplicating secrets.
- **Follow Laravel and React best practices**:
  - Keep controllers thin; business logic belongs in services, actions, or models.
  - For React, prefer functional components and hooks; keep components small and focused.
- **Preserve existing tooling**:
  - Use Vite, Inertia, and Pint as configured; avoid adding competing bundlers or linters unless requested.
- **When adding features**:
  - Add or update database migrations and seeders as needed.
  - Add or update tests and ensure `composer test` passes.

