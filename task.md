# Task List: Enterprise Layer

## Phase 1: Backend Infrastructure (Audit Logs)
- `[x]` Create `backend/models/AuditLog.js` (Sequelize Model)
- `[x]` Update `backend/models/index.js` to register `AuditLog`
- `[x]` Create `backend/middleware/auditMiddleware.js`
- `[x]` Apply `auditMiddleware` to protected routes in `backend/routes/adminRoutes.js`
- `[x]` Add `GET /api/admin/logs` endpoint

## Phase 2: Backend Analytics Engine
- `[x]` Update `backend/controllers/adminController.js` for `getAnalytics` to return advanced data
- `[x]` Ensure `AuditLog` tracks reveal/invite counts for member activity

## Phase 3: Frontend Setup & Audit Log Viewer
- `[x]` Install `recharts` in the frontend directory
- `[x]` Create `frontend/src/features/admin/system/AuditLogViewer.jsx` (Terminal style)
- `[x]` Add "System Logs" tab to `AdminDashboard.jsx` (Admin only)

## Phase 4: Frontend Analytics Dashboard
- `[x]` Create `frontend/src/features/admin/analytics/AnalyticsDashboard.jsx` using Recharts
- `[x]` Add "Analytics" tab to `AdminDashboard.jsx` (Admin & Member)
- `[x]` Implement CSV export funcationality
