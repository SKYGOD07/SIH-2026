# System architecture

## Overview

Sarthi is a modular monolith: a Next.js frontend, an Express API, and Supabase
PostgreSQL reached only through Prisma.

```
+-------------------------------------------------------------------+
|                       Client layer (Next.js)                      |
|   - Department console          - Challenge authoring             |
|   - Startup discovery           - Pilot ledger & KPI views        |
|                                                                   |
|   Supabase Auth client: sign-in and session only.                 |
|   Never queries application tables.                               |
+---------------------------------+---------------------------------+
                                  |
                       HTTP (REST) + Supabase access token
                                  v
+-------------------------------------------------------------------+
|                    Backend server (Node / Express)                |
|                                                                   |
|   +-----------------------------------------------------------+   |
|   |                       Middleware                          |   |
|   |   - Helmet, CORS, Morgan                                  |   |
|   |   - Zod request validation, global error handler          |   |
|   |   - (planned) Supabase token verification & authz         |   |
|   +-----------------------------------------------------------+   |
|                                 |                                 |
|   +-----------------------------------------------------------+   |
|   |                   Routes & controllers                    |   |
|   |   /api/health,  /api/sarthi/*                             |   |
|   +-----------------------------------------------------------+   |
|                                 |                                 |
|   +-----------------------------------------------------------+   |
|   |                      Domain services                      |   |
|   |   - Simulator: comparable retrieval, design, risk,        |   |
|   |     confidence bands                                      |   |
|   |   - Policy retrieval (RAG)                                |   |
|   |   - Milestone ledger: evidence -> approval -> payment     |   |
|   |   - Feedback loop: closed pilot becomes corpus evidence   |   |
|   +-----------------------------------------------------------+   |
|                                 |                                 |
|   +-----------------------------------------------------------+   |
|   |        Repositories (interfaces; in-memory today)         |   |
|   +-----------------------------------------------------------+   |
|                                 |                                 |
|   +-----------------------------------------------------------+   |
|   |                      Prisma ORM layer                     |   |
|   +-----------------------------------------------------------+   |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|          Supabase PostgreSQL 17.6  (ap-south-1, session pooler)   |
|          + pgvector, 768d, HNSW cosine                            |
|          Supabase Auth owns auth.users                            |
+-------------------------------------------------------------------+
```

## Layer responsibilities

1. **Routes (`backend/src/routes`, `backend/src/sarthi/http`)** — path mapping
   and validation middleware. Grouped by pathway stage, so the route file reads
   in the same order the product does.
2. **Controllers (`backend/src/sarthi/http`)** — parse, delegate, respond. No
   branching on domain rules, so a second route cannot bypass one.
3. **Services (`backend/src/sarthi/`)** — domain logic, testable without a
   request object.
4. **Repositories** — storage behind an interface. Swapping the in-memory
   implementations for Prisma-backed ones touches no service, engine or route.

## Two structural decisions

**The browser never reaches the database.** Supabase Auth is used client-side for
sign-in; every read and write of application data goes through Express. The
backend derives identity from the access token and never trusts a client-supplied
user id. Row Level Security is therefore defence-in-depth rather than the primary
authorisation mechanism, and can be added later without a second data-access
architecture.

**Storage is behind an interface, deliberately.** The domain was built against
repository interfaces before the database existed, so the persistence layer is
unwritten rather than wrong. `container.ts` is the single composition root where
implementations are chosen.

## Current state

| | |
|---|---|
| Supabase project, CLI link, connection | done |
| Database schema, 18 models, 1 migration | done, tables empty |
| Logistics domain removed | done |
| Prisma-backed repositories | not yet |
| Authentication | not yet |
| Real startup/programme data | not yet |
| RAG retrieval, embeddings, Ollama | not yet |
| AI matching engine | not yet |

See [`../database/README.md`](../database/README.md) for the schema and
[`../DATA-SOURCES.md`](../DATA-SOURCES.md) for what data the product may assert.
