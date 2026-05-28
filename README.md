# HAQMS: Hospital Appointment & Queue Management System

Welcome to **HAQMS (Hospital Appointment & Queue Management System)**. This is a fully functional full-stack web application.

---

## 🛠️ Tech Stack
- **Frontend**: Next.js (App Router, Tailwind CSS, Lucide icons, Context API)
- **Backend**: Node.js + Express
- **Database & ORM**: PostgreSQL + Prisma ORM
- **Process Management**: Docker Compose (Optional local PostgreSQL helper)

---

## 🚀 Getting Started & Setup

Follow these steps to spin up the local development workspace:

### 1. Auto-Install Dependencies
Run the included workspace orchestrator bootstrap script to install packages in the root, frontend, and backend packages:
```bash
chmod +x setup.sh
./setup.sh
```

### 2. Launch the Database
You need a running PostgreSQL server. If you have Docker installed, you can spin up the preconfigured container:
```bash
docker-compose up -d
```
Alternatively, configure your local PostgreSQL server and update the connection URL in `backend/.env`:
```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/haqms?schema=public"
```

### 3. Deploy Schema & Seed Mock Data
Apply Prisma schema migrations to the database and populate it with pre-built mock records (including administrative logins, medical histories, physician slots, and queue tokens):
```bash
npm run db:setup --prefix backend
```

### 4. Boot Dev Servers
Launch both the Next.js development client (port `3000`) and the Express API server (port `5000`) concurrently using:
```bash
npm run dev
```

---

## 🔑 Pre-Seeded Accounts
The database seed script populates the database with default accounts (All passwords are **`password123`**):

| Role | Email | Purpose / Flow Testing |
|---|---|---|
| **Administrator** | `admin@haqms.com` | Access system reports, view audit logs, view full physician registries |
| **Receptionist** | `reception1@haqms.com` | Register patients, book slots, perform direct queue check-in |
| **Doctor** | `doctor1@haqms.com` | View daily patient worklist, manage active calling monitors, read history |

---

