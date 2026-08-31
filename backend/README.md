# Sarthi backend service

Node.js + Express + TypeScript API for the Sarthi innovation-procurement
pathway — SIH Problem Statement 26136.

---

## Tech stack

* **Framework**: Express.js with TypeScript
* **ORM**: Prisma, against Supabase PostgreSQL 17.6 (`ap-south-1`)
* **Retrieval**: pgvector, 768-dimension embeddings (`nomic-embed-text`)
* **Auth**: Supabase Auth — this service never stores a password
* **Validation**: Zod
* **Security**: Helmet, CORS

---

## Architecture

```text
Next.js  ──>  Express  ──>  Prisma  ──>  Supabase PostgreSQL
```

The browser never queries the database. Supabase Auth is used from the frontend
for sign-in only; the backend derives the caller's identity from the Supabase
access token and never trusts a client-supplied user id.

* **Routes (`src/routes/`)** — path mapping and validation middleware.
* **Controllers (`src/sarthi/http/`)** — thin request/response translation.
* **Services (`src/sarthi/`)** — domain logic: simulator, retrieval, ledger,
  feedback. Testable without a request object.
* **Schema (`prisma/schema.prisma`)** — the persistence contract. See
  [`docs/database/README.md`](../docs/database/README.md).

### Current state

The database schema is in place and empty. The Sarthi services still run on the
in-memory stores wired in `src/sarthi/container.ts`, so writes do not survive a
restart. Prisma-backed repositories are the next round of work.

---

## Quick start

### 1. Configure environment

```bash
cp .env.example .env
```

Set the Supabase connection string. Note two things that are easy to get wrong:

```env
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

* Use the **session pooler**, not the direct connection, unless your network has
  working IPv6 — the direct endpoint (`db.<ref>.supabase.co`) is IPv6-only.
* The pooler username is `postgres.<project-ref>`, not `postgres`.
* Percent-encode special characters in the password (`#` → `%23`, `@` → `%40`).
  An unencoded `#` silently truncates the password to empty.

### 2. Install and generate the Prisma client

```bash
npm install
npm run prisma:generate
```

### 3. Apply migrations

```bash
npx prisma migrate deploy
```

`migrate deploy` is preferred over `migrate dev` against the pooler: it needs no
shadow database and never prompts.

### 4. Run in development

```bash
npm run dev
```

Server starts on `http://localhost:5000`. Health check at `/api/health`.

### 5. Build for production

```bash
npm run build
npm start
```
