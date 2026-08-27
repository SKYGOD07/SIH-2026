# Logistics Platform

A production-ready, modular monorepo for real-time logistics, fleet management, shipment dispatching, and live GPS tracking.

---

## 🛠 Tech Stack

* **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons
* **Backend**: Node.js, Express.js, TypeScript
* **Database**: PostgreSQL (Supabase PostgreSQL supported)
* **ORM**: Prisma ORM
* **Real-time**: Socket.IO
* **Maps & Geo**: Modular integration for Mapbox / Google Maps API

---

## 📁 Project Structure

```text
logistics-platform/
│
├── frontend/                     # Next.js App Router frontend application
│   ├── src/
│   │   ├── app/                  # App Router pages and layout
│   │   ├── components/           # Reusable UI & dashboard components (shadcn/ui ready)
│   │   ├── hooks/                # Custom React hooks (e.g. useSocket, useGeolocation)
│   │   ├── lib/                  # Library configurations and helpers (e.g. api client, utils)
│   │   ├── services/             # Frontend API integration services
│   │   ├── types/                # Shared frontend TypeScript declarations
│   │   └── utils/                # Utility and formatting functions
│   ├── public/                   # Static assets
│   ├── .env.example              # Frontend environment variables template
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── backend/                      # Node.js + Express + TypeScript API server
│   ├── src/
│   │   ├── config/               # Environment & database configuration
│   │   ├── controllers/          # Request handler controllers (thin layer)
│   │   ├── middleware/           # Auth, error handling, validation middleware
│   │   ├── routes/               # Modular API route definitions
│   │   ├── services/             # Core business logic and database queries
│   │   ├── socket/               # Real-time Socket.IO event handlers
│   │   ├── types/                # Backend TypeScript types and schemas
│   │   ├── utils/                # Logging, response formatting, math helpers
│   │   ├── app.ts                # Express app setup and middleware configuration
│   │   └── server.ts             # HTTP server & Socket.IO initialization
│   ├── prisma/
│   │   └── schema.prisma         # Prisma data models & migrations
│   ├── .env.example              # Backend environment variables template
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── docs/                         # System architecture, API, and database documentation
│   ├── architecture/
│   │   └── README.md
│   ├── api/
│   │   └── README.md
│   └── database/
│       └── README.md
│
├── .gitignore
├── .env.example
├── README.md
└── package.json
```

---

## 🚀 Local Development

### Prerequisites
* **Node.js**: >= 18.0.0
* **npm**: >= 9.0.0
* **PostgreSQL** instance (e.g., local PostgreSQL or Supabase)

### 1. Clone & Install Dependencies

```bash
git clone <your-repository-url>
cd SIH-2026

# Install all monorepo dependencies
npm install
```

### 2. Environment Setup

Copy example environment files to `.env` in frontend and backend:

```bash
# Frontend
cp frontend/.env.example frontend/.env

# Backend
cp backend/.env.example backend/.env
```

Update `backend/.env` with your PostgreSQL / Supabase connection URL:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### 3. Database Migration & Prisma Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Apply migrations (when database URL is set)
npm run prisma:migrate
```

### 4. Run the Development Servers

Run both frontend and backend concurrently from the root directory:

```bash
npm run dev
```

Or run services individually:

```bash
# Run only Backend (default: http://localhost:5000)
npm run dev:backend

# Run only Frontend (default: http://localhost:3000)
npm run dev:frontend
```

---

## 🌿 Git Workflow

To maintain code quality and fast parallel development during the hackathon, follow this branch strategy:

```text
main (Production / Stable Releases)
  │
  └── develop (Active Integration Branch)
        │
        ├── feature/frontend    (UI, dashboard, map components)
        ├── feature/backend     (REST API, controller & services)
        ├── feature/database    (Prisma schema & migrations)
        └── feature/tracking    (Socket.IO real-time location stream)
```

1. Always create a feature branch off `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```
2. Commit small, atomic changes with descriptive commit messages.
3. Open a Pull Request (PR) against `develop` for review before merging.
4. Merge `develop` into `main` only for tagged milestone releases.

---

## 📄 Documentation

* [System Architecture & Data Flow](file:///docs/architecture/README.md)
* [REST & Socket API Reference](file:///docs/api/README.md)
* [Database Schema & ERD](file:///docs/database/README.md)
