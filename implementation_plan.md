# Enterprise Layer: Audit Logs & Analytics Plan

This plan implements the final Enterprise Layer for the Bodhantra Admin Dashboard, dividing the work into two major systems: **Audit Logs** (Accountability) and an **Analytics Dashboard** (Data Insights). 

Since the backend is powered by **Sequelize (SQL)** and not MongoDB, the models will use `INTEGER` primary/foreign keys instead of `ObjectId`.

## User Review Required

> [!WARNING]
> Please review the following technical translation:
> - The prompt requested `userId (ObjectId)` for the `AuditLog` model, but because the backend runs on **Sequelize (MySQL/PostgreSQL)**, I will implement `userId` as an `INTEGER` (a Foreign Key to the `User` model) to maintain architectural consistency. Is this acceptable?
> - Let me know if you are okay with me over-hauling the existing `GET /api/admin/analytics` endpoint to return the new advanced metrics, rather than creating a second duplicate endpoint.

## Proposed Changes

---

### Backend Components

#### [NEW] `backend/models/AuditLog.js`
- **Fields:** 
  - `id` (INTEGER, Primary Key)
  - `userId` (INTEGER, ref: User.id)
  - `userName` (STRING)
  - `userRole` (STRING)
  - `action` (STRING) - e.g., "Created Event", "Updated Registration"
  - `target` (STRING) - The endpoint/entity affected
  - `ipAddress` (STRING)
- **Automatic Timestamps:** Sequelize handles `createdAt` perfectly for the requested `timestamp`.

#### [MODIFY] `backend/models/index.js`
- Import and register the `AuditLog` model.
- Define the association: `User.hasMany(AuditLog)` and `AuditLog.belongsTo(User)`.

#### [NEW] `backend/middleware/auditMiddleware.js`
- A middleware that automatically hooks into `res.on('finish', ...)` for protected Admin routes.
- If the request is a `POST`, `PUT`, `PATCH`, or `DELETE` and succeeds (status 200-299), it writes an `AuditLog` entry.
- It parses `req.originalUrl` and `req.method` to generate human-readable `action` and `target` strings.

#### [MODIFY] `backend/routes/adminRoutes.js`
- Apply `auditMiddleware` securely to admin routes.
- Add new endpoints:
  - `GET /api/admin/logs` (Admin only)
- Expand the existing `GET /api/admin/analytics` to include Recharts-friendly aggregation.

#### [MODIFY] `backend/controllers/adminController.js`
- Overhaul `getAnalytics` to aggregate:
  - **Registration Trends** (Grouped by `createdAt` day).
  - **Event Popularity** (JOIN with Registration count).
  - **Department/College Stats** (Grouped by User `college`/`category`).
  - **Member Activity** (Query the newly created `AuditLog` table for Invites/Reveals executed by members).

---

### Frontend Components

#### [MODIFY] `frontend/package.json`
- Install the `recharts` library for data visualization.

#### [NEW] `frontend/src/features/admin/system/AuditLogViewer.jsx`
- Terminal-style dark theme (`bg-slate-950 text-emerald-400 font-mono`).
- Table layout showing standard log attributes.
- Filters: Date range picker and Search bar (`userName`/`action`).
- Implements reverse-chronological sorting.

#### [NEW] `frontend/src/features/admin/analytics/AnalyticsDashboard.jsx`
- Replaces the simple stats view with an advanced Recharts layout.
- KPI metric cards (Total Participants, Teams, Revenue/Check-ins).
- **Bar Chart:** Registrations per Event comparison.
- **Pie Chart:** Department/College demographics.
- **Line Chart:** Time-series of registrations.
- Export to CSV action button.

#### [MODIFY] `frontend/src/features/admin/AdminDashboard.jsx`
- Inject the new "Analytics" and "System Logs" tabs into the navigation matrix.
- Hide "System Logs" from standard 'member' users.

## Open Questions

> [!IMPORTANT]
> 1. Should the "Member Activity" explicitly look for "Winner Reveals"? If so, we need to ensure the `spinwheel` or `winner` routes hit the backend whenever a reveal occurs. Currently, they might just be frontend visual states. If they don't hit the backend, I can create a lightweight `/api/admin/log-reveal` endpoint for the frontend to ping when a reveal finishes.
> 2. You mentioned "Neon accents, clean borders" for the UI. Is there a specific neon color (e.g., cyan/emerald/purple) you prefer for the Terminal Log Viewer and the Recharts graphics?

## Verification Plan

### Automated Tests
- N/A

### Manual Verification
1. Open the Admin UI and trigger an action (e.g., toggle attendance or edit a user).
2. Visit the "System Logs" tab and verify the successful terminal-styled log capture.
3. Verify that the analytics dashboard effectively translates the database's new grouped attributes into the Recharts visual components.
4. Download the CSV report to ensure the analytics export format is readable.
