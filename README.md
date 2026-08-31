# Sarthi — Innovation Procurement Pathway

> **SIH 2026** · A full-stack monorepo that helps government procurement officers simulate, track, and audit outcome-based pilot contracts using RAG-powered retrieval and an immutable milestone ledger.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, GSAP, Lenis |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | PostgreSQL via Supabase |
| **ORM** | Prisma ORM |
| **DevOps** | Supabase CLI, npm workspaces, concurrently |

---

## 📁 Project Structure

```text
SIH-2026/                              # Monorepo root (npm workspaces)
│
├── frontend/                          # Next.js 14 App Router application
│   └── src/
│       ├── app/                       # Pages and layouts (App Router)
│       ├── components/
│       │   ├── console/               # Dashboard shell (Sidebar, RightRail)
│       │   ├── sections/product/      # PilotBoard and product sections
│       │   └── ui/                    # Shared UI primitives (badge, etc.)
│       ├── data/                      # Static/seed data files
│       ├── hooks/                     # Custom React hooks
│       ├── lib/
│       │   ├── api/sarthi.ts          # Sarthi API client
│       │   └── gsap/                  # Centralised GSAP registration & config
│       ├── types/                     # Shared TypeScript declarations
│       └── utils/                     # Utility and formatting helpers
│
├── backend/                           # Express + Prisma API server
│   ├── prisma/
│   │   ├── schema.prisma              # Full domain schema (see below)
│   │   └── migrations/               # Prisma migration history
│   └── src/
│       ├── controllers/
│       │   └── health.controller.ts   # Health-check endpoint
│       └── server.ts                  # Express app + Supabase bootstrap
│
├── supabase/                          # Supabase project config & temp files
├── docs/                              # Architecture, API & database docs
├── .env.example                       # Root environment variable template
└── package.json                       # Monorepo scripts (workspaces)
```

---

## 🗄 Database Schema (Prisma)

The schema models **Sarthi's** core domain. All records are historical facts — nothing stored asserts a prediction.

| Model | Purpose |
|---|---|
| `PilotRecord` | A completed pilot that has entered the corpus; the primary similarity source for the simulator |
| `PilotLedger` | A live pilot's contract, as an ordered chain of milestones |
| `Milestone` | One payment gate inside a ledger (`LOCKED → IN_PROGRESS → EVIDENCE_SUBMITTED → APPROVED/REJECTED → PAID`) |
| `MilestoneEvidence` | An artefact filed to back a milestone claim |
| `LedgerEvent` | Immutable, append-only audit trail — every milestone transition records a row |
| `PolicyClause` | Quotable passages from the policy corpus used by the RAG retrieval service |

**Key enums:** `PilotOutcome`, `BaselineQuality`, `FailureCause`, `MilestoneStatus`, `SourceKind`, `LedgerAction`

---

## 🚀 Local Development

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** instance (local or Supabase)
- **Supabase CLI** (optional, for `supabase` commands)

### 1. Clone & Install

```bash
git clone https://github.com/shubhamrajput34/SIH-2026.git
cd SIH-2026

# Install all workspace dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy root env template
cp .env.example .env

# Copy frontend env template
cp frontend/.env.example frontend/.env

# Copy backend env template
cp backend/.env.example backend/.env
```

Update `backend/.env` with your Supabase connection string:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations against your database
npm run prisma:migrate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### 4. Run Development Servers

```bash
# Run frontend + backend concurrently (recommended)
npm run dev

# Run individually
npm run dev:frontend    # → http://localhost:3000
npm run dev:backend     # → http://localhost:5000
```

> **Windows users**: If `npm` is not recognised after a fresh Node.js install, run this in PowerShell first to refresh the PATH:
> ```powershell
> $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
> ```
> Then open a **new terminal** — it will work automatically.

---

## 🌿 Recent Changes

| Commit | Description |
|---|---|
| `523775f` | Initialize Sarthi backend service with Prisma schema, health check routes, and Supabase configuration |
| `3095073` | Initialize Sarthi backend with Prisma schema, routes, and Supabase integration |
| `12febc2` | Merge: dashboard changes (PR #3) |
| `2f6f24b` | Fix: add `data-lenis-prevent` to Sidebar and RightRail to prevent Lenis scroll hijack |
| `2271948` | Feat: make Sidebar and RightRail scrollable by constraining max height |
| `446615a` | Feat: initialize project styling with custom Tailwind config and global CSS variables |
| `0fc3a6f` | Feat: centralized GSAP registration and shared animation configuration constants |
| `754d16f` | Feat: implement simulator services — confidence analysis, risk assessment, and design retrieval |
| `c89258d` | Feat: foundational platform architecture — dashboard pages, RAG retrieval services, core ledger validation |

---

## 🌿 Git Workflow

```text
main           ← stable / tagged releases
  └── develop  ← active integration branch
        ├── feature/frontend    (UI, dashboard, GSAP animations)
        ├── feature/backend     (API, Prisma services)
        ├── feature/database    (schema & migrations)
        └── feature/simulator   (confidence & risk engine)
```

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
# ...work...
# Open a PR against develop
```

---

## 📄 Documentation

- [System Architecture & Data Flow](docs/architecture/README.md)
- [REST API Reference](docs/api/README.md)
- [Database Schema & ERD](docs/database/README.md)
