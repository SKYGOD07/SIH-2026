# Sarthi frontend

Next.js 14 (App Router) client for the Sarthi innovation-procurement pathway,
with TypeScript, Tailwind CSS and shadcn/ui components.

Authentication uses the Supabase Auth client for sign-in and session only. All
application data is read and written through the Express backend — the browser
never queries Supabase tables directly.

---

## 🛠 Tech Stack

* **Framework**: Next.js 14 (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS + CSS Variables
* **UI Primitives**: Radix / shadcn/ui patterns
* **Icons**: Lucide React
* **Auth**: Supabase Auth client (sign-in and session only)

---

## 📁 Directory Structure

```text
src/
├── app/                  # Next.js App Router (pages, layout, globals.css)
├── components/           # UI components, dashboard widgets, layouts
│   └── ui/               # shadcn/ui atomic primitives (Button, Card, Badge)
├── hooks/                # Custom React hooks
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
