# Logistics Backend Service

Node.js + Express + TypeScript API server powering authentication, dispatching, fleet management, and real-time Socket.IO telemetry.

---

## 🛠 Tech Stack

* **Framework**: Express.js with TypeScript
* **ORM**: Prisma ORM with PostgreSQL
* **Real-time**: Socket.IO
* **Validation**: Zod
* **Security**: Helmet, CORS

---

## 📂 Architecture

```text
Request  ──>  Route  ──>  Controller  ──>  Service  ──>  Prisma  ──>  PostgreSQL
```

* **Routes (`src/routes/`)**: URL path mapping and validation middleware.
* **Controllers (`src/controllers/`)**: Thin request/response translation layer.
* **Services (`src/services/`)**: Pure business logic and database queries.
* **Socket (`src/socket/`)**: Real-time event broadcasting and room management.

---

## 🚀 Quick Start

### 1. Configure Environment

```bash
cp .env.example .env
```

Set your database connection URL in `.env`:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

### 2. Install & Generate Prisma Client

```bash
npm install
npm run prisma:generate
```

### 3. Run in Development Mode

```bash
npm run dev
```

Server will start on `http://localhost:5000`.

### 4. Build for Production

```bash
npm run build
npm start
```
