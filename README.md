# 🏥 Secure Healthcare Management System

A full-stack, role-based healthcare management platform built for Sprint 2 of the Software Engineering project. The system handles patient management, doctor appointments, telemedicine consultations, lab results, payments, prescriptions (with OCR), and AI-powered clinical decision support.

🌐 **Live Demo:** [https://secure-healthcare-frontend.onrender.com](https://secure-healthcare-frontend.onrender.com)

---

## 📁 Project Structure

```
/
├── backend/                  # Node.js + Express backend
│   ├── src/
│   │   ├── app.js            # Express app setup, middleware, routes
│   │   ├── server.js         # HTTP server entry point + Socket.IO init
│   │   ├── config/
│   │   │   └── db.js         # PostgreSQL (Neon) connection pool
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # JWT authentication
│   │   │   └── role.middleware.js   # Role-based access control
│   │   ├── modules/
│   │   │   ├── auth/           # Login, register, MFA OTP, password reset
│   │   │   ├── patients/       # Patient profile management
│   │   │   ├── doctors/        # Doctor profile & availability
│   │   │   ├── appointments/   # Booking & scheduling
│   │   │   ├── telemedicine/   # Real-time chat + video consultations
│   │   │   ├── vitals/         # Patient vitals dashboard
│   │   │   ├── vitals-intake/  # Vitals data intake (nurse role)
│   │   │   ├── labs/           # Lab reports (encrypted)
│   │   │   ├── prescriptions/  # Prescriptions management
│   │   │   ├── ocr/            # OCR prescription scanning
│   │   │   ├── payments/       # Stripe payment processing
│   │   │   ├── cdss/           # Clinical Decision Support System
│   │   │   └── aiBot/          # AI chatbot (Google Gemini)
│   │   ├── scripts/            # One-time DB migration scripts
│   │   └── utils/              # OTP, email, audit logger, crypto helpers
│   ├── tests/                  # Jest test suite
│   ├── package.json
│   └── server.js
│
├── frontend-sprint1/           # React + Vite frontend
│   ├── src/
│   │   ├── pages/              # Route-level page components
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # AuthContext (global auth state)
│   │   ├── api/                # Axios client configuration
│   │   └── main.jsx            # App entry point
│   └── package.json
│
├── ocr.controller.js           # Root-level OCR controller
├── ocr.routes.js
└── ocr.service.js
```

---

## ✨ Features

| Module | Description |
|---|---|
| **Authentication** | JWT login, MFA (email OTP), registration, password reset, account activation |
| **Role-Based Access** | PATIENT, DOCTOR, NURSE, LAB_TECH, ADMIN roles with middleware enforcement |
| **Appointments** | Book, reschedule, manage appointments with doctor availability slots |
| **Telemedicine** | Real-time text chat (Socket.IO) + Jitsi video calls during appointment windows |
| **Vitals** | Nurses record vitals; patients and doctors view charts via Recharts |
| **Lab Reports** | Encrypted lab results with RSA key-pair security |
| **Prescriptions + OCR** | Manage and scan prescriptions using Tesseract.js OCR |
| **Payments** | Stripe-powered payment processing for appointments |
| **CDSS** | Clinical Decision Support System with AI-powered suggestions |
| **AI Chatbot** | Google Gemini-powered healthcare assistant |
| **Audit Logging** | Immutable audit trails for compliance-sensitive actions |

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js v5
- **Database**: PostgreSQL (hosted on Neon)
- **Real-Time**: Socket.IO v4
- **Auth**: JWT (`jsonwebtoken`) + bcrypt
- **Email/OTP**: Nodemailer
- **OCR**: Tesseract.js + Sharp (image preprocessing)
- **Payments**: Stripe
- **AI**: Google Gemini (`@google/genai`)
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 19 + Vite
- **Routing**: React Router DOM v7
- **HTTP**: Axios
- **Real-Time**: Socket.IO Client
- **Charts**: Recharts
- **Forms**: React Hook Form
- **Animations**: Framer Motion
- **Icons**: Lucide React + React Icons
- **Styling**: Tailwind CSS

---

## ⚙️ Prerequisites

- Node.js v18+
- npm v9+
- PostgreSQL database (or a [Neon](https://neon.tech) serverless Postgres account)
- Stripe account (for payment processing)
- Gmail / SMTP credentials (for OTP emails)
- Google Gemini API key (for AI chatbot)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Aswinlaks/secure_healthcare.git
cd secure_healthcare
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5000

# Database (PostgreSQL / Neon)
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
DB_HOST=
DB_PORT=5432
DB_NAME=
DB_USER=
DB_PASSWORD=

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d

# OTP / Email
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
OTP_EXPIRY_MINUTES=10

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# RSA Keys (for encrypted lab results)
LAB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

Run database migrations:

```bash
node src/scripts/migrate_telemedicine.js
node src/scripts/migrate_enable_mfa.js
node src/scripts/add_admin_user.js
```

Start the backend:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The backend will run on **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd frontend-sprint1
npm install
```

Create a `.env` file in `frontend-sprint1/`:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

The frontend will run on **http://localhost:5173**

---

## 🔐 User Roles & Access

| Role | Capabilities |
|---|---|
| **PATIENT** | View own records, book appointments, telemedicine chat, view vitals/prescriptions, make payments |
| **DOCTOR** | Manage appointments, start telemedicine sessions, video calls, CDSS, view patient records |
| **NURSE** | Record patient vitals |
| **LAB_TECH** | Upload and manage encrypted lab reports |
| **ADMIN** | Create users, manage all records |

### Default Admin
Admin users are seeded using `src/scripts/add_admin_user.js`. Doctors, Nurses, and Lab Technicians must be created by an Admin.

---

## 🩺 Telemedicine Flow

1. Doctor or patient navigates to `/telemedicine/:appointmentId`
2. System validates appointment timing (cannot enter before `scheduled_start`)
3. A shared telemedicine session is created (or reused if one exists for this doctor-patient pair)
4. Real-time chat via Socket.IO begins
5. Video call via **Jitsi Meet** is available during the active appointment window
6. Chat is permanently unlocked after the first appointment concludes
7. Doctor ends the session via "End Consultation"

---

## 🧪 Testing

### Backend Tests (Jest)
```bash
cd backend
npm test               # Run all tests
npm run test:coverage  # Run with coverage report
```

### Frontend Tests (Vitest)
```bash
cd frontend-sprint1
npm run test:run       # Run all tests once
npm test               # Run in watch mode
```

---

## 📡 Key API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Patient self-registration |
| POST | `/api/auth/login` | Step 1: Password check |
| POST | `/api/auth/login/verify-otp` | Step 2: MFA OTP verification |
| POST | `/api/auth/activate` | Activate account with OTP |
| POST | `/api/auth/forgot-password` | Request password reset OTP |
| POST | `/api/auth/reset-password` | Reset password with OTP |

### Telemedicine
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/telemedicine/session` | Create session (Doctor only) |
| GET | `/api/telemedicine/session/:id` | Get session details |
| GET | `/api/telemedicine/messages/:id` | Get message history |
| GET | `/api/telemedicine/appointment/:id` | Get session by appointment |

### Socket.IO Events
| Event | Direction | Description |
|---|---|---|
| `join-session` | Client → Server | Join a session room |
| `send-message` | Client → Server | Send a chat message |
| `mark-read` | Client → Server | Mark messages as read |
| `end-session` | Client → Server | End session (Doctor only) |
| `receive-message` | Server → Client | Broadcast new message |
| `session-ended` | Server → Client | Notify session ended |

---

## 🔒 Security Features

- **JWT Authentication** on all protected routes
- **Role-based access control** via middleware
- **Password hashing** with bcrypt (12 rounds)
- **MFA via email OTP** (SHA-256 hashed, time-limited)
- **RSA encryption** for sensitive lab results
- **Audit logging** for all critical actions
- **Password history** to prevent reuse
- **Account locking** for security violations

---

## 📦 Scripts Reference

| Script | Location | Purpose |
|---|---|---|
| `migrate_telemedicine.js` | `src/scripts/` | Create telemedicine DB tables |
| `migrate_enable_mfa.js` | `src/scripts/` | Enable MFA for all users |
| `add_admin_user.js` | `src/scripts/` | Seed initial admin user |
| `add_doctor_availability_constraint.js` | `src/scripts/` | Add DB constraints for scheduling |
| `encrypt_existing_patients.js` | `src/scripts/` | Encrypt existing patient data |
| `migrate_lab_result_type.js` | `src/scripts/` | Migrate lab result column types |

---

## 👥 Team

This project was built as part of the 6th Semester Software Engineering course at Amrita Vishwa Vidyapeetham.

---

## 📄 License

This project is for academic purposes.
