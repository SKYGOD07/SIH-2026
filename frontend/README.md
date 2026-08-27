# Logistics Frontend Application

Modern Next.js 14+ (App Router) client application with TypeScript, Tailwind CSS, shadcn/ui components, and real-time Socket.IO subscriptions.

---

## 🛠 Tech Stack

* **Framework**: Next.js 14 (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS + CSS Variables
* **UI Primitives**: Radix / shadcn/ui patterns
* **Icons**: Lucide React
* **Realtime Client**: Socket.IO Client

---

## 📁 Directory Structure

```text
src/
├── app/                  # Next.js App Router (pages, layout, globals.css)
├── components/           # UI components, dashboard widgets, layouts
│   └── ui/               # shadcn/ui atomic primitives (Button, Card, Badge)
├── hooks/                # Custom React hooks (e.g. useSocket)
├── lib/                  # Utilities (cn helper, API client)
├── services/             # Frontend service calls to backend REST API
├── types/                # TypeScript interface declarations
└── utils/                # Date, currency, string formatting utilities
```

---

## 🚀 Quick Start

### 1. Configure Environment

```bash
cp .env.example .env.local
```

### 2. Install Dependencies & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
