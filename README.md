# 🚀 Team Mavericks — Universal Event Management System

A full-stack web application for **Team Mavericks** college club to manage events, registrations, payments, and participant queries.

| Layer    | Tech                                                                 |
| -------- | -------------------------------------------------------------------- |
| Frontend | React 19, Vite 7, Tailwind CSS 4, React Router 7, Axios, Lucide Icons |
| Backend  | Express 5, Sequelize 6 (ORM), MySQL, JWT Auth, Multer (file uploads) |
| Database | MySQL 8+                                                             |

---

## 📁 Project Structure

```
team-mavericks-web/
├── backend/
│   ├── config/
│   │   └── db.js               # Sequelize MySQL connection
│   ├── controllers/
│   │   ├── adminController.js   # Analytics, registrations, queries (admin)
│   │   ├── authController.js    # Register, Login, Get-Me
│   │   ├── eventController.js   # CRUD events
│   │   ├── queryController.js   # Submit & view queries
│   │   └── registrationController.js  # Register for events
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT protect + admin role check
│   │   └── uploadMiddleware.js  # Multer config for payment screenshots
│   ├── models/
│   │   ├── index.js             # Model associations
│   │   ├── User.js
│   │   ├── Event.js
│   │   ├── Registration.js
│   │   └── Query.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── queryRoutes.js
│   │   └── registrationRoutes.js
│   ├── uploads/                 # Payment screenshot uploads (gitignored)
│   ├── .env                     # Environment variables (DO NOT COMMIT)
│   ├── package.json
│   └── server.js                # Entry point
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Glassmorphism responsive navbar
│   │   │   ├── MainLayout.jsx   # Layout wrapper (Navbar + Footer)
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ui/
│   │   │       ├── Button.jsx
│   │   │       ├── Card.jsx
│   │   │       └── Input.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Auth state (login, register, logout)
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx       # Home + single-event view
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── RegistrationPage.jsx  # Event registration form
│   │   │   ├── ParticipantDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── App.jsx              # Routes
│   │   ├── main.jsx             # React entry
│   │   ├── index.css            # Tailwind + theme tokens
│   │   └── App.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
└── README.md                    # ← You are here
```

---

## ⚙️ Prerequisites

Make sure the following are installed on your machine **before** starting:

| Tool      | Version | Download                                                                 |
| --------- | ------- | ------------------------------------------------------------------------ |
| **Node.js** | 18+     | [https://nodejs.org](https://nodejs.org)                                 |
| **npm**     | 9+      | Comes with Node.js                                                       |
| **MySQL**   | 8.0+    | [https://dev.mysql.com/downloads/](https://dev.mysql.com/downloads/)     |
| **Git**     | 2.x     | [https://git-scm.com](https://git-scm.com)                              |

> **Tip:** You can verify installations with `node -v`, `npm -v`, `mysql --version`, and `git --version`.

---

## 🗄️ Step 1 — Database Setup (MySQL)

### 1.1 Open MySQL CLI or any GUI (MySQL Workbench, phpMyAdmin, etc.)

```bash
mysql -u root -p
```

### 1.2 Create the database

```sql
CREATE DATABASE mavericks_events;
```

> **That's it!** You don't need to create tables manually. Sequelize will auto-create all tables when the backend starts (it uses `sync({ alter: true })`).

### 1.3 (Optional) Create a dedicated MySQL user

```sql
CREATE USER 'mavericks_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON mavericks_events.* TO 'mavericks_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 📥 Step 2 — Clone the Repository

```bash
git clone https://github.com/AakashDesai22/Team-Mavericks-Web.git
cd Team-Mavericks-Web
```

---

## 🔧 Step 3 — Backend Setup

### 3.1 Navigate to the backend folder

```bash
cd backend
```

### 3.2 Install dependencies

```bash
npm install
```

This installs:

| Package        | Purpose                         |
| -------------- | ------------------------------- |
| `express`      | Web framework                   |
| `sequelize`    | ORM for MySQL                   |
| `mysql2`       | MySQL driver for Node.js        |
| `bcryptjs`     | Password hashing                |
| `jsonwebtoken` | JWT authentication              |
| `multer`       | File upload (payment screenshots) |
| `cors`         | Cross-origin requests           |
| `dotenv`       | Environment variable loading    |
| `nodemon`      | Auto-restart server on file changes (dev) |

### 3.3 Create the `.env` file

Create a file named `.env` inside the `backend/` folder:

```bash
# backend/.env

PORT=5000
DB_NAME=mavericks_events
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
JWT_SECRET=your_super_secret_key_here
```

> ⚠️ **IMPORTANT:** Replace `your_mysql_password` with your actual MySQL password and set a strong `JWT_SECRET`. **Never commit this file to Git.**

### 3.4 Start the backend server

**Development mode** (auto-restarts on code changes):

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

✅ You should see:

```
MySQL Connected...
Database Synced
Server started on port 5000
```

> Sequelize will automatically create all tables (`Users`, `Events`, `Registrations`, `Queries`) in your MySQL database on first run.

### 3.5 Verify the API

Open your browser or use curl:

```bash
curl http://localhost:5000
```

You should see: **`API is running...`**

---

## 🎨 Step 4 — Frontend Setup

### 4.1 Open a new terminal and navigate to the frontend folder

```bash
cd frontend
```

> ⚡ Make sure to open a **separate terminal** — keep the backend running in the other one.

### 4.2 Install dependencies

```bash
npm install
```

This installs:

| Package              | Purpose                   |
| -------------------- | ------------------------- |
| `react`              | UI library                |
| `react-dom`          | React DOM renderer        |
| `react-router-dom`   | Client-side routing       |
| `axios`              | HTTP requests to backend  |
| `tailwindcss`        | Utility-first CSS framework |
| `@tailwindcss/vite`  | Tailwind Vite plugin      |
| `lucide-react`       | Modern icon library       |

### 4.3 Start the frontend dev server

```bash
npm run dev
```

✅ You should see:

```
  VITE v7.x.x  ready in Xms

  ➜  Local:   http://localhost:5173/
```

### 4.4 Open in browser

Navigate to **[http://localhost:5173](http://localhost:5173)** — you should see the Team Mavericks homepage with the glassmorphism navbar.

---

## 🧪 Step 5 — Quick Verification Checklist

After both servers are running, verify everything works:

| # | Test                          | How                                                             | Expected                              |
|---|-------------------------------|-----------------------------------------------------------------|---------------------------------------|
| 1 | Backend health check          | Visit `http://localhost:5000`                                    | "API is running..."                   |
| 2 | Homepage loads                | Visit `http://localhost:5173`                                    | Landing page with navbar              |
| 3 | Register a user               | Click **Login** → **Sign Up** tab → fill form                   | Redirect to dashboard                 |
| 4 | Login                         | Login with registered credentials                                | Dashboard with user name in navbar    |
| 5 | DB tables created             | In MySQL: `USE mavericks_events; SHOW TABLES;`                   | Users, Events, Registrations, Queries |

---

## 🗂️ Database Schema (Auto-Generated)

### Users

| Column   | Type                                    | Notes                 |
| -------- | --------------------------------------- | --------------------- |
| id       | INT (PK, Auto-increment)               |                       |
| name     | VARCHAR                                 | Required              |
| prn      | VARCHAR (Unique)                        | Nullable (admins)     |
| email    | VARCHAR (Unique)                        | Required, validated   |
| password | VARCHAR                                 | Bcrypt hashed         |
| role     | ENUM('admin', 'participant')            | Default: participant  |
| phone    | VARCHAR                                 | Optional              |
| college  | VARCHAR                                 | Optional              |
| year     | ENUM('FY','SY','TY','Final','Other')    | Optional              |

### Events

| Column          | Type                        | Notes          |
| --------------- | --------------------------- | -------------- |
| id              | INT (PK, Auto-increment)   |                |
| name            | VARCHAR                     | Required       |
| slug            | VARCHAR (Unique)            | URL-friendly   |
| description     | TEXT                        | Optional       |
| date            | DATE                        | Required       |
| status          | ENUM('active', 'past')      | Default: active|
| payment_details | TEXT                        | UPI/instructions |

### Registrations

| Column         | Type                                    | Notes                |
| -------------- | --------------------------------------- | -------------------- |
| id             | INT (PK, Auto-increment)               |                      |
| user_id        | INT (FK → Users.id)                     |                      |
| event_id       | INT (FK → Events.id)                    |                      |
| payment_ss_url | VARCHAR                                 | Upload path          |
| payment_method | ENUM('online', 'offline')               | Default: online      |
| status         | ENUM('pending','approved','rejected')   | Default: pending     |
| attendance     | BOOLEAN                                 | Default: false       |

### Queries

| Column   | Type                        | Notes            |
| -------- | --------------------------- | ---------------- |
| id       | INT (PK, Auto-increment)   |                  |
| user_id  | INT (FK → Users.id)         |                  |
| message  | TEXT                        | Required         |
| response | TEXT                        | Admin response   |
| status   | ENUM('open', 'resolved')    | Default: open    |

---

## 🔌 API Endpoints Reference

Base URL: `http://localhost:5000/api`

### Auth (`/api/auth`)

| Method | Endpoint    | Auth     | Description             |
| ------ | ----------- | -------- | ----------------------- |
| POST   | `/register` | Public   | Create a new user       |
| POST   | `/login`    | Public   | Login → returns JWT     |
| GET    | `/me`       | JWT      | Get logged-in user info |

### Events (`/api/events`)

| Method | Endpoint   | Auth        | Description           |
| ------ | ---------- | ----------- | --------------------- |
| GET    | `/`        | Public      | List all events       |
| POST   | `/`        | Admin only  | Create a new event    |
| GET    | `/:slug`   | Public      | Get event by slug     |

### Registrations (`/api/registrations`)

| Method | Endpoint | Auth | Description                                    |
| ------ | -------- | ---- | ---------------------------------------------- |
| POST   | `/`      | JWT  | Register for an event (multipart: payment_ss)  |
| GET    | `/my`    | JWT  | Get current user's registrations               |

### Queries (`/api/queries`)

| Method | Endpoint | Auth | Description                  |
| ------ | -------- | ---- | ---------------------------- |
| POST   | `/`      | JWT  | Submit a new query           |
| GET    | `/my`    | JWT  | Get current user's queries   |

### Admin (`/api/admin`) — all routes require Admin JWT

| Method | Endpoint                     | Description                       |
| ------ | ---------------------------- | --------------------------------- |
| GET    | `/analytics`                 | Dashboard analytics               |
| GET    | `/registrations`             | All registrations                 |
| PUT    | `/registrations/:id/status`  | Approve/reject a registration     |
| PUT    | `/registrations/:id/attendance` | Toggle attendance              |
| GET    | `/queries`                   | All participant queries           |
| PUT    | `/queries/:id/respond`       | Respond to a query                |

---

## 🏗️ Creating an Admin User

There is no admin signup on the UI (by design). To create an admin, either:

### Option A — Via API (recommended)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@mavericks.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### Option B — Via MySQL

```sql
-- First register normally, then update the role:
UPDATE Users SET role = 'admin' WHERE email = 'admin@mavericks.com';
```

---

## 📜 Available Scripts

### Backend (`backend/`)

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start with nodemon (auto-reload)         |
| `npm start`     | Start production server                  |

### Frontend (`frontend/`)

| Command           | Description                            |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Start Vite dev server (HMR)            |
| `npm run build`   | Create production build in `dist/`     |
| `npm run preview` | Preview production build locally       |
| `npm run lint`    | Run ESLint                             |

---

## 🌐 Environment Variables Reference

### `backend/.env`

| Variable      | Description                  | Example                    |
| ------------- | ---------------------------- | -------------------------- |
| `PORT`        | Backend server port          | `5000`                     |
| `DB_NAME`     | MySQL database name          | `mavericks_events`         |
| `DB_USER`     | MySQL username               | `root`                     |
| `DB_PASSWORD` | MySQL password               | `your_password`            |
| `DB_HOST`     | MySQL host                   | `localhost`                |
| `JWT_SECRET`  | Secret for signing JWT tokens| `supersecretmaverickskey`  |

> 🔒 Create a `.env.example` file to share the template without actual credentials.

---

## 🚨 Troubleshooting

| Problem                               | Solution                                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------------------------- |
| `ECONNREFUSED` on port 5000           | Make sure the backend is running (`npm run dev` in `backend/`)                                |
| `ER_ACCESS_DENIED_ERROR`              | Check `DB_USER` and `DB_PASSWORD` in `.env` match your MySQL credentials                      |
| `ER_BAD_DB_ERROR`                     | Run `CREATE DATABASE mavericks_events;` in MySQL first                                        |
| Frontend shows blank page             | Check browser console for errors; ensure backend is running on port 5000                      |
| CORS errors                           | Backend already has `cors()` enabled; ensure you're hitting `localhost:5000` (not 127.0.0.1)   |
| `MODULE_NOT_FOUND`                    | Run `npm install` in the folder that has the error                                            |
| Port 5173 already in use              | Kill the process: `npx kill-port 5173` or change Vite port in `vite.config.js`                |

---

## 👥 Team Workflow

1. **Clone** the repo and follow setup steps above
2. **Create** a new branch for your feature: `git checkout -b feature/your-feature`
3. **Code** your changes
4. **Test** locally (both servers running)
5. **Commit** with a clear message: `git commit -m "feat: add XYZ"`
6. **Push** and create a Pull Request: `git push origin feature/your-feature`

---

## 📄 License

This project is for the internal use of **Team Mavericks** college club.


<p align="center">Built with ❤️ by <strong>Team Mavericks</strong></p>
# Bodhantra2026
