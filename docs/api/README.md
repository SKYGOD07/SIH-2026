# API Documentation

## Base URL

- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Standard Response Format

All REST responses adhere to a consistent JSON structure:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable message",
  "meta": { ... }
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error name or summary",
  "details": [ ... ]
}
```

---

## Route Overview

| Module | Route Prefix | Description |
| :--- | :--- | :--- |
| **System** | `GET /api/health` | Service health status check |
| **Auth** | `/api/auth` | User registration, login, token refresh, and session info |
| **Users** | `/api/users` | Profile management and user directory |
| **Drivers** | `/api/drivers` | Driver verification, status toggling, assigned deliveries |
| **Vehicles** | `/api/vehicles` | Fleet inventory, vehicle capacity, and maintenance records |
| **Orders** | `/api/orders` | Order creation, dispatching, lifecycle management |
| **Tracking** | `/api/tracking` | GPS breadcrumbs, live ETA estimation, route history |
| **Admin** | `/api/admin` | Analytics, audit logs, and platform oversight |

---

## Real-Time Events (Socket.IO)

Connected clients can join room channels for real-time delivery telemetry.

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join:order` | Client -> Server | `{ orderId: string }` | Subscribe to live updates for a specific order |
| `leave:order` | Client -> Server | `{ orderId: string }` | Unsubscribe from an order |
| `update:location` | Driver -> Server | `{ orderId, latitude, longitude, speed, heading }` | Push driver GPS update |
| `order:location_updated`| Server -> Client | `{ orderId, latitude, longitude, timestamp }` | Broadcast location to subscribers |
| `order:status_changed` | Server -> Client | `{ orderId, status, timestamp }` | Broadcast order status update |
