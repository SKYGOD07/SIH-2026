# Database Schema Documentation

## Database Provider

- **Engine**: PostgreSQL
- **Provider Recommendation**: Supabase PostgreSQL / Local Postgres
- **ORM**: Prisma ORM

---

## Entity Relationship Overview

```text
+----------------+          +----------------+          +----------------+
|      User      |          |     Driver     |          |    Vehicle     |
+----------------+          +----------------+          +----------------+
| id (PK)        | 1      1 | id (PK)        | 1      1 | id (PK)        |
| email          |<-------->| userId (FK)    |          | licensePlate   |
| passwordHash   |          | licenseNumber  |          | model, type    |
| role           |          | isAvailable    |          | capacityKg     |
| firstName      |          | vehicleId (FK) |<-------->| currentStatus  |
| lastName       |          +----------------+          +----------------+
+----------------+                  | 1
        | 1                         |
        |                           v 0..*
        | 0..*              +----------------+
        +------------------>|     Order      |
  (as sender/customer)      +----------------+
                            | id (PK)        |
                            | trackingNumber |
                            | senderId (FK)  |
                            | driverId (FK)  |
                            | status         |
                            | pickupAddress  |
                            | deliveryAddress|
                            | totalCost      |
                            +----------------+
                                    | 1
                                    | 0..*
                                    v
                            +----------------+
                            |    Tracking    |
                            +----------------+
                            | id (PK)        |
                            | orderId (FK)   |
                            | latitude       |
                            | longitude      |
                            | speed, heading |
                            | recordedAt     |
                            +----------------+
```

---

## Core Models

1. **User**: Represents platform actors with roles `ADMIN`, `DISPATCHER`, `DRIVER`, `CUSTOMER`.
2. **Driver**: Extends User for delivery drivers, tracking license details and vehicle pairing.
3. **Vehicle**: Fleet assets with capacity, status (`AVAILABLE`, `IN_TRANSIT`, `MAINTENANCE`), and vehicle category.
4. **Order**: Shipment record holding sender/recipient locations, status (`PENDING`, `ACCEPTED`, `PICKED_UP`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`), dimensions, and assigned driver.
5. **Tracking**: Time-series GPS breadcrumb records linked to an active order.
