# API documentation

## Base URL

- Development: `http://localhost:5000/api`

## Response format

Success, from `sendSuccess` in `backend/src/utils/response.ts`. `message` and
`data` are omitted when absent rather than sent as null:

```json
{
  "success": true,
  "data": { },
  "message": "Optional human-readable message"
}
```

Error, from `sendError` via the global handler:

```json
{
  "success": false,
  "error": "Error name or summary",
  "details": [ ]
}
```

A Zod validation failure returns `400` with `error: "Validation Error"` and the
issue list in `details`.

---

## Routes

| Module | Route | Description |
| :--- | :--- | :--- |
| **System** | `GET /api/health` | Service health status |
| **Simulate** | `POST /api/sarthi/simulate` | Pilot design recommendations, risk register and confidence bands for a proposed pilot |
| **Screen** | `POST /api/sarthi/ask` | Answer a policy question by quoting the clause |
| **Ledger** | `GET /api/sarthi/pilots/:pilotId/ledger` | Milestone chain for a pilot |
| | `GET /api/sarthi/pilots/:pilotId/ledger/trail` | Append-only audit trail |
| | `POST /api/sarthi/pilots/:pilotId/milestones/:milestoneId/evidence` | File evidence against a milestone |
| | `POST /api/sarthi/pilots/:pilotId/milestones/:milestoneId/approve` | Approve filed evidence |
| | `POST /api/sarthi/pilots/:pilotId/milestones/:milestoneId/reject` | Return the milestone to the startup |
| | `POST /api/sarthi/pilots/:pilotId/milestones/:milestoneId/pay` | Release payment against an approved milestone |
| **Corpus** | `POST /api/sarthi/corpus/close` | Close a pilot into the evidence corpus |
| | `GET /api/sarthi/corpus/coverage` | What the corpus does and does not cover |
| **Console** | `GET /api/sarthi/dashboard` | Everything the department console renders, in one call |

---

## Two behaviours worth knowing

**An unanswerable question is a `200`, not a `404`.** `POST /ask` returns
`unanswered: true` when retrieval found nothing relevant. The corpus was searched
successfully and returned nothing, which is a legitimate answer the interface
needs to show verbatim rather than as an error.

**Payment cannot bypass approval.** The milestone endpoints implement a state
machine — `LOCKED → IN_PROGRESS → EVIDENCE_SUBMITTED → APPROVED → PAID`, with
`REJECTED` returning to `EVIDENCE_SUBMITTED`. There is no route that pays an
unapproved milestone and no argument that makes one possible.

---

## Not yet implemented

- **Authentication.** No route is currently behind auth. Supabase Auth is the
  chosen mechanism; the backend will derive identity from the access token and
  never trust a client-supplied user id.
- **Persistence.** These endpoints read and write the in-memory stores in
  `backend/src/sarthi/container.ts`. Writes are lost on restart. The database
  schema exists and is empty; repositories are the next round.
- **Real-time.** There are no WebSocket endpoints. The Socket.IO layer in this
  codebase belonged to an unrelated logistics application and was removed.
