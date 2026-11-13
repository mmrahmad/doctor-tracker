# Doctor Tracker — Project Plan

> Source of truth: `Fullstack_Task_Frontend_Focused_Updated_1.pdf`.
> The spec has two conflicting "Tech Stack" sections. We follow the **updated** one:
> Next.js **separate client app**, Node.js + Express **separate standalone server**, MongoDB, REST.

---

## 1. Goals & Non-Negotiables

| Area | Commitment |
|---|---|
| UI/UX | Modern, consistent design system (tokens, 4px spacing grid, type scale), responsive (360px → 1920px), light/dark, skeletons, empty/error states, keyboard accessible. |
| Code quality | SOLID, no duplicated logic (shared contracts package, generic table/filters/forms), descriptive names only. |
| Security | Argon2id hashing, short-lived JWT access token + rotating refresh token (reuse detection), httpOnly/SameSite=strict cookies, rate limiting + account lockout, Helmet, strict CORS, Origin check on mutations, Zod validation (unknown keys stripped), regex-escaping, log redaction, generic auth errors. |
| Scale (millions of users/rows) | Compound indexes matching every query shape, anchored-prefix search on normalized fields, bounded page sizes, denormalized `patientCount`, Redis cache-aside with O(1) versioned invalidation, request coalescing, stateless API (horizontal scaling), Redis-backed rate limits. |
| Resilience / fallback | Redis is optional at runtime: cache + rate-limit fail open to DB / in-memory store; graceful shutdown; health/readiness endpoints; frontend retries with backoff, error boundaries, offline-friendly cached data. |
| Consistency | MongoDB multi-document transactions (replica set) for patient create/delete/reassign + doctor counter; optimistic concurrency (`version`) on patient edits → 409 on stale writes; idempotency keys on create endpoints; unique email per doctor. |

---

## 2. Architecture

```
Browser ──► Next.js (apps/web, :3000)
              │  same-origin rewrite  /api/*  ──►  Express API (apps/api, :4000)
              │                                       ├── MongoDB (replica set rs0)
              │                                       └── Redis (cache, rate limit, idempotency)
              └── packages/contracts  (Zod schemas, types, enums — shared by both apps)
```

* **Same-origin proxy**: the browser only talks to `:3000/api/*`; Next rewrites to the API. Cookies stay first-party, no CORS in the browser path, CSRF surface reduced.
* **Backend layering** (per module): `routes → controller → service → repository → model`. Services depend on interfaces (`DoctorRepository`, `CacheStore`), wired in one composition root (`container.ts`) — Dependency Inversion.
* **Frontend**: App Router; server state in TanStack Query; filter/pagination state in the URL (shareable, back-button friendly); auth gate in `proxy.ts` + 401 → silent refresh → redirect.

### Data model

| Collection | Fields | Indexes |
|---|---|---|
| `users` | email, passwordHash, fullName, role, failedLoginAttempts, lockedUntil | `email` unique |
| `refresh_sessions` | userId, tokenHash, familyId, expiresAt, revokedAt | `tokenHash` unique, `familyId`, TTL on `expiresAt` |
| `doctors` | fullName, searchName, specialization, hospital, phone, email, patientCount, timestamps | `email` unique, `{createdAt:-1,_id:-1}`, `{specialization:1,createdAt:-1}`, `{hospital:1,createdAt:-1}`, `{searchName:1}`, `{patientCount:-1}` |
| `patients` | fullName, searchName, email, phone, gender, dateOfBirth, condition, diagnosis, doctorId, admittedAt, version, timestamps | `{doctorId:1,createdAt:-1}`, `{condition:1,createdAt:-1}`, `{createdAt:-1,_id:-1}`, `{searchName:1}`, `{admittedAt:-1}` |

### REST API (`/api/v1`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/login` · `/auth/refresh` · `/auth/logout` | Session lifecycle |
| GET | `/auth/me` | Current user |
| GET / POST | `/doctors` | List (search, filters, pagination) / create |
| GET | `/doctors/:doctorId` | Doctor detail |
| GET / POST | `/doctors/:doctorId/patients` | Doctor's patients / add patient under doctor |
| GET | `/doctors/options` | Lightweight id+name list for selects |
| GET | `/patients` | List (search, condition, doctor, gender, date filters, pagination) |
| PATCH / DELETE | `/patients/:patientId` | Edit (optimistic concurrency) / delete |
| GET | `/analytics/overview?range=30d` | Dashboard aggregates |
| GET | `/health/live` · `/health/ready` | Probes |

Response envelope: `{ data, meta? }` on success, `{ error: { code, message, details?, requestId } }` on failure.

---

## 3. Task Breakdown (executed in order)

### Phase 0 — Foundation
- [x] 0.1 Read spec, resolve stack conflict, write this plan
- [x] 0.2 pnpm workspace, root tooling (TypeScript, Prettier, ESLint), `.gitignore`, `.env.example`
- [x] 0.3 `docker-compose.yml`: MongoDB single-node replica set + Redis

### Phase 1 — Shared contracts (`packages/contracts`)
- [x] 1.1 Enums: specializations, patient conditions, genders, analytics ranges
- [x] 1.2 Zod schemas: auth, doctor create/query, patient create/update/query, pagination, analytics
- [x] 1.3 Inferred TS types + API envelope types

### Phase 2 — API (`apps/api`)
- [x] 2.1 Config (Zod-validated env), logger (pino with redaction), app bootstrap, graceful shutdown
- [x] 2.2 Infrastructure: Mongo connection, Redis client, `CacheStore` (Redis + no-op fallback), request coalescing
- [x] 2.3 Common: error classes, error handler, `validateRequest`, request id, Origin check, rate limiters, idempotency
- [x] 2.4 Auth module: user model, refresh sessions, token service, login lockout, `authenticate` / `authorize`
- [x] 2.5 Doctors module: model + indexes, repository, service (cache), controller, routes
- [x] 2.6 Patients module: transactions for count consistency, optimistic concurrency, routes
- [x] 2.7 Analytics module: aggregation pipelines, cached overview
- [x] 2.8 Health endpoints, seed script (admin + realistic demo data)
- [x] 2.9 Unit tests for core services/utilities

### Phase 3 — Web (`apps/web`)
- [x] 3.1 Next.js app, Tailwind v4 design tokens (light/dark), fonts, rewrites, security headers
- [x] 3.2 UI kit: Button, Input, Select, Field, Badge, Card, Dialog, ConfirmDialog, Skeleton, EmptyState, Pagination, DataTable, SearchInput, DateRange
- [x] 3.3 HTTP client (typed errors, single-flight refresh), query client, query keys, URL filter hook
- [x] 3.4 Auth: login page, `proxy.ts` route guard, session hook, logout
- [x] 3.5 App shell: sidebar, mobile nav, top bar, theme toggle, page header
- [x] 3.6 Dashboard: KPI cards, registrations trend, patients per doctor, condition mix, specialization mix
- [x] 3.7 Doctors: list (search/filter/paginate), create dialog, detail page with patients, add/delete patient
- [x] 3.8 Patients: list (search/filter/paginate), edit dialog, delete with optimistic update

### Phase 4 — Quality & Delivery
- [x] 4.1 Typecheck + lint + tests green; production builds succeed
- [x] 4.2 End-to-end smoke run against docker services
- [x] 4.3 Screenshots (desktop + mobile) via Playwright
- [x] 4.4 README: pitch, setup guide, architecture, 2 technical decisions, visual evidence

---

## 4. Execution Notes

- Host ports are 27027 (MongoDB), 6389 (Redis), 4100 (API), 3100 (web) to avoid clashing with other local services.
- `explain()` showed filtered lists sorting in memory; every compound index now ends with `_id` (the sort tiebreaker), so each page reads exactly `pageSize` index entries.
- A non-secret `dt_session` hint cookie (SameSite=Lax) lets the web route guard see a refreshable session, because the refresh cookie is path-scoped to `/api/v1/auth`.
- The dashboard uses one validated chart hue (dataviz palette checks) with direct labels; conditions are identified by labeled badges, never by color alone.
- Out of scope (not in the spec): editing/deleting doctors, multi-role user management.

## 5. Key Technical Decisions (summary — detailed in README)

1. **Separate Express API behind a same-origin Next.js rewrite** — keeps the spec's separation while letting auth use first-party httpOnly cookies (no tokens in JS, no cross-site cookies).
2. **TanStack Query + URL state instead of Redux** — almost all state is server state; Query gives caching, dedupe, background refresh, optimistic updates and pagination prefetching; the URL holds filters so views are shareable.
3. **Prefix search on normalized fields instead of `$regex` contains / `$text`** — anchored, case-normalized prefix queries use B-tree indexes (`IXSCAN`), unlike unanchored regex (collection scan) at millions of rows.
4. **Denormalized `patientCount` maintained in transactions** — "patients per doctor" is O(1) to read and sort, always consistent with the patients collection.
5. **Versioned cache namespaces** — invalidating "all doctor list pages" is a single `INCR`, no `KEYS`/`SCAN`.
