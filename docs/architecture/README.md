# System Architecture

## Overview

The logistics platform is built as a modular monolithic architecture, engineered for low complexity, rapid hackathon iteration, and smooth deployment.

```
+-------------------------------------------------------------------+
|                        Client Layer (Next.js)                     |
|  - Dashboard & Admin UI         - Driver Mobile Web App           |
|  - Real-time Shipment Map       - Customer Tracking Portal        |
+---------------------------------+---------------------------------+
                                  |
               HTTP (REST API)    |    WebSocket (Socket.IO)
                                  v
+-------------------------------------------------------------------+
|                     Backend Server (Node / Express)               |
|                                                                   |
|   +-----------------------------------------------------------+   |
|   |                      Middleware                           |   |
|   |   - Helmet, CORS, Morgan (Security & Logging)             |   |
|   |   - JWT Auth & Role Authorization                         |   |
|   |   - Zod Request Validation & Error Handler                |   |
|   +-----------------------------------------------------------+   |
|                                 |                                 |
|                                 v                                 |
|   +-----------------------------------------------------------+   |
|   |                  Modular Routes & Controllers             |   |
|   |   /auth, /users, /drivers, /vehicles, /orders, /tracking  |   |
|   +-----------------------------------------------------------+   |
|                                 |                                 |
|                                 v                                 |
|   +-----------------------------------------------------------+   |
|   |                       Service Layer                       |   |
|   |   - Authentication & Token Service                        |   |
|   |   - Order Dispatch & State Machine                        |   |
|   |   - Driver Assignment & Fleet Logic                       |   |
|   |   - Tracking & Geolocation Telemetry                      |   |
|   +-----------------------------------------------------------+   |
|                                 |                                 |
|                                 v                                 |
|   +-----------------------------------------------------------+   |
|   |                      Prisma ORM Layer                     |   |
|   +-----------------------------------------------------------+   |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                    PostgreSQL Database (Supabase)                 |
+-------------------------------------------------------------------+
```

## Layer Responsibilities

1. **Routes (`/src/routes`)**:
   - Define URL endpoints, HTTP methods, and attach validation & auth middlewares.
2. **Controllers (`/src/controllers`)**:
   - Thin request handlers that unwrap params/body, invoke appropriate service functions, and format standard JSON responses.
3. **Services (`/src/services`)**:
   - Contain pure business logic, database queries via Prisma, and external API calls.
4. **Socket Handler (`/src/socket`)**:
   - Manages real-time telemetry streaming (e.g. driver GPS broadcasts to order rooms).
