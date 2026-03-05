# Sprint 2 – Test Documentation

## Secure Healthcare Application

**Date:** March 5, 2026  
**Sprint:** Sprint 2 (Final)  
**Team:** Secure Healthcare Development Team  
**Module Owner:** Vital Intake + Dynamic Dashboard  
**Tester:** Aswin  

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [API Documentation](#3-api-documentation)
4. [Test Strategy](#4-test-strategy)
5. [Integration Tests](#5-integration-tests)
6. [Regression Tests](#6-regression-tests)
7. [End-to-End Tests](#7-end-to-end-tests)
8. [Test Results Summary](#8-test-results-summary)
9. [User Guide](#9-user-guide)
10. [Developer Guide](#10-developer-guide)

---

## 1. Overview

The Secure Healthcare application is a full-stack health-tech platform that provides:

- **Patient Management** – Registration, profiles with encrypted PII, medical records
- **Appointment Scheduling** – Doctor availability, time-slot booking, status tracking
- **Lab Management** – Lab orders, report uploads with digital signatures, verification
- **Vital Signs Monitoring** – Real-time vital intake (Sprint 2), traffic-light dashboards
- **Clinical Decision Support (CDSS)** – AI-powered lab report parsing, care plan generation
- **Prescription Management** – Medication records, OCR-based prescription scanning
- **Telemedicine** – Doctor-patient messaging for remote consultations
- **AI Health Bot** – AI-generated diet plans and care recommendations
- **Payments** – Stripe-integrated payment processing for consultations
- **Admin Panel** – User management, audit logs, compliance monitoring
- **Multi-Factor Authentication** – OTP-based MFA via email

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + Recharts |
| Backend | Node.js + Express.js |
| Database | PostgreSQL (Neon) |
| Authentication | JWT + bcrypt + OTP (email) |
| Encryption | AES-256-CBC (PII), RSA (digital signatures) |
| Testing | Jest (backend) + Vitest (frontend) |

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                       │
│  ┌────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Login  │ │ Dashboard  │ │ Sidebar  │ │ VitalsDashboard  │   │
│  │ Page   │ │ (per role) │ │ (nav)    │ │ (charts+form)    │   │
│  └───┬────┘ └─────┬──────┘ └────┬─────┘ └────────┬─────────┘   │
│      └─────────────┴─────────────┴────────────────┘             │
│                          │ Axios API                             │
└──────────────────────────┼──────────────────────────────────────┘
                           │ HTTP (REST)
┌──────────────────────────┼──────────────────────────────────────┐
│                    Backend (Express.js)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Middleware Layer                          │   │
│  │  CORS → JSON Parser → JWT Auth → Role Check              │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Route Layer                             │   │
│  │  /auth  /patients  /appointments  /vitals  /api/vitals   │   │
│  │  /labs  /cdss  /prescriptions  /ocr  /payments           │   │
│  │  /ai-bot  /telemedicine  /admin  /doctors                │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Service + Repository Layer                    │   │
│  │  Business logic → Validation → SQL queries               │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────┼──────────────────────────────────────┘
                           │ pg (node-postgres)
┌──────────────────────────┼──────────────────────────────────────┐
│             PostgreSQL Database (Neon)                           │
│  Tables: users, patients, user_roles, roles, appointments,     │
│          vitals, lab_orders, lab_results, prescriptions,        │
│          audit_logs, care_plans, doctor_availability            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. API Documentation

### Authentication Routes (`/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user + patient profile | Public |
| POST | `/auth/login` | Login with email/password → JWT | Public |
| POST | `/auth/verify-otp` | Verify MFA OTP code | Public |
| POST | `/auth/forgot-password` | Request password reset email | Public |
| POST | `/auth/reset-password` | Reset password with OTP | Public |

### Patient Routes (`/patients`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/patients` | List all patients | Doctor, Admin |
| GET | `/patients/:id` | Get patient details | Doctor, Admin, Patient (own) |

### Appointment Routes (`/appointments`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/appointments` | Book appointment | Patient |
| GET | `/appointments/patient/:id` | Get patient appointments | Patient, Doctor |
| GET | `/appointments/doctor/:id` | Get doctor appointments | Doctor |
| PATCH | `/appointments/:id/status` | Update appointment status | Doctor |

### Vitals Routes (`/vitals` and `/api/vitals`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/vitals` | Record vital signs (Sprint 1) | Doctor, Nurse |
| GET | `/vitals/:patientId` | Get patient vitals (Sprint 1) | Doctor, Nurse, Patient |
| **POST** | **`/api/vitals`** | **Submit vital signs (Sprint 2)** | **Doctor, Nurse, Patient** |
| **GET** | **`/api/vitals/:patientId`** | **Retrieve vitals for dashboard (Sprint 2)** | **Doctor, Nurse, Patient** |

### Lab Routes (`/labs`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/labs/order` | Create lab order | Doctor |
| POST | `/labs/upload-result` | Upload lab result with signature | Lab Tech |
| GET | `/labs/pending` | Get pending lab verifications | Doctor |
| POST | `/labs/verify` | Verify lab result | Doctor |
| GET | `/labs/patient/:id` | Get patient lab results | Doctor, Patient |

### CDSS Routes (`/cdss`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/cdss/parse` | Parse lab report data | Doctor |
| POST | `/cdss/generate-plan` | Generate AI care plan | Doctor |
| GET | `/cdss/care-plan/:patientId` | Get care plan | Doctor, Patient |

### Prescription Routes (`/prescriptions`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/prescriptions` | Create prescription | Doctor |
| GET | `/prescriptions/patient/:id` | Get patient prescriptions | Doctor, Patient |

### OCR Routes (`/ocr`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/ocr/upload` | Upload prescription image for OCR | Doctor, Patient |
| POST | `/ocr/analyze` | AI-analyze OCR output | Doctor, Patient |

### Admin Routes (`/admin`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/admin/users` | Create new user | Admin |
| GET | `/admin/users` | List all users | Admin |
| DELETE | `/admin/users/:id` | Delete user | Admin |
| GET | `/admin/audit-logs` | View audit trail | Admin |

### Payment Routes (`/payments`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/payments/create-session` | Create Stripe checkout session | Patient |
| POST | `/payments/webhook` | Stripe webhook handler | System |

### Telemedicine Routes (`/telemedicine`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/telemedicine/session` | Create telemedicine session | Doctor, Patient |
| GET | `/telemedicine/messages/:sessionId` | Get chat messages | Doctor, Patient |
| POST | `/telemedicine/message` | Send message | Doctor, Patient |

### AI Bot Routes (`/ai-bot`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/ai-bot/care-plan` | Generate AI care plan | Doctor, Patient |
| POST | `/ai-bot/diet-plan` | Generate AI diet plan | Doctor, Patient |

### Doctor Routes (`/doctors`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/doctors` | List all doctors | Patient |
| GET | `/doctors/:id/availability` | Get doctor availability | Patient |
| POST | `/doctors/availability` | Set availability | Doctor |

### Utility Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check | Public |

---

## 4. Test Strategy

### Testing Pyramid

```
        ╱╲
       ╱ E2E ╲          End-to-End: Full user workflows
      ╱────────╲
     ╱Integration╲      Integration: Module interactions
    ╱──────────────╲
   ╱   Regression    ╲   Regression: Sprint 1 still works
  ╱────────────────────╲
 ╱     Unit Tests       ╲  Unit: Individual functions
╱────────────────────────╲
```

### Test Categories

| Category | Purpose | Framework |
|----------|---------|-----------|
| **Unit** | Individual function correctness | Jest / Vitest |
| **Integration** | Module ↔ Module interaction | Jest / Vitest |
| **Regression** | Sprint 1 features unbroken | Jest / Vitest |
| **End-to-End** | Complete user workflows | Jest / Vitest |

### Mock Strategy

All tests use **mocked** external dependencies to ensure:
- No real database connection required
- Tests run in isolation (CI/CD ready)
- Deterministic, repeatable results
- Fast execution (< 30 seconds)

---

## 5. Integration Tests

### Backend Integration Tests (`__tests__/sprint2.integration.test.js`)

| Test Suite | Tests | Description |
|-----------|-------|-------------|
| Vitals-Intake Service ↔ Repository | 4 | Validate → INSERT → SELECT round-trip flow |
| Auth Module ↔ Role-Based Access | 3 | JWT payload, user→role resolution, route RBAC |
| CDSS ↔ Lab Report Pipeline | 2 | Lab parsing + abnormal value flagging |
| Appointment ↔ Patient Flow | 2 | Patient verification + double-booking prevention |
| Prescription ↔ OCR Pipeline | 1 | OCR extraction → prescription creation |
| Payment ↔ Appointment Flow | 2 | Payment creation + webhook status update |
| Telemedicine ↔ AI Bot | 2 | Session messaging + AI health recommendations |

### Frontend Integration Tests (`src/test/sprint2.integration.test.js`)

| Test Suite | Tests | Description |
|-----------|-------|-------------|
| Vitals Dashboard Logic | 2 | Chart data transformation + latest vitals extraction |
| Traffic-Light Classification | 5 | Green/amber/red/gray thresholds for all metrics + BP |
| VitalIntakeForm Validation | 4 | UUID format, BP format, numeric ranges, API payload |
| Sidebar Navigation | 5 | Role-based nav items, case normalization, fallback |
| VitalsApi Service | 3 | URL construction + error handling |

---

## 6. Regression Tests

### Backend Regression Tests (`__tests__/regression.test.js`)

| Module | Tests | What's Verified |
|--------|-------|----------------|
| Auth | 4 | Email validation, password hashing, OTP format, JWT structure |
| Patient | 3 | Data structure with encrypted PII, blood group validation, MRN format |
| Appointments | 3 | Status transitions, time slot format, required fields |
| Labs | 3 | Order structure, digital signature format, status transitions |
| Vitals (Sprint 1) | 2 | Data structure, vital sign ranges |
| CDSS | 2 | Care plan structure, abnormal value detection |
| Prescriptions | 1 | Prescription data structure |
| Admin & Audit | 2 | Audit log structure, admin-only access enforcement |

### Frontend Regression Tests (`src/test/regression.test.js`)

| Area | Tests | What's Verified |
|------|-------|----------------|
| Login Form | 3 | Email validation, password rules, required fields |
| Dashboard Routing | 2 | Role-based component rendering, route definitions |
| Protected Routes | 3 | Auth redirect, role enforcement |
| Auth Context | 2 | localStorage management, JWT parsing |
| API Client | 4 | Base URL, auth header, 401 handling |
| Existing Components | 3 | VitalsForm fields, appointment fields, audit columns |

---

## 7. End-to-End Tests

### Backend E2E Tests (`__tests__/e2e.test.js`)

| Workflow | Tests | Description |
|----------|-------|-------------|
| Vital Signs Complete | 3 | Validate→insert→retrieve, invalid data rejection, multiple records |
| Patient Journey | 1 | Register→profile→appointment→lab→vitals full path |
| RBAC Enforcement | 6 | Access matrix for Admin, Doctor, Nurse, Patient, Lab Tech + public |
| Error Handling Pipeline | 4 | Validation errors, DB failures (500), unauth (401), forbidden (403) |
| Dashboard Aggregation | 2 | Vitals aggregation for charts + traffic-light classification |

### Frontend E2E Tests (`src/test/e2e.test.js`)

| Workflow | Tests | Description |
|----------|-------|-------------|
| Vitals Dashboard Flow | 3 | Search→load→display→submit→refresh, empty state, API error |
| Authentication Flow | 3 | Login→token→route→logout, failure handling, MFA |
| Dashboard Per Role | 4 | Admin, Doctor, Patient, Lab Tech dashboard features |
| Form Submission Flow | 2 | Validate→transform→submit→success, error handling |
| Navigation Flow | 3 | Page-to-page, unauthorized redirect, unknown routes |

---

## 8. Test Results Summary

### Backend Test Results (Jest)

| Test Suite | Tests | Passed | Failed | Status |
|-----------|-------|--------|--------|--------|
| `unit.test.js` | — | All | 0 | ✅ PASS |
| `integration.test.js` | — | All | 0 | ✅ PASS |
| `sprint2.integration.test.js` | 16 | 16 | 0 | ✅ PASS |
| `regression.test.js` | 20 | 20 | 0 | ✅ PASS |
| `e2e.test.js` | 16 | 16 | 0 | ✅ PASS |

**Backend Total: 5 suites, ALL PASSED ✅**

### Frontend Test Results (Vitest)

| Test Suite | Tests | Passed | Failed | Status |
|-----------|-------|--------|--------|--------|
| `sample.test.js` | — | All | 0 | ✅ PASS |
| `integration.test.js` | — | All | 0 | ✅ PASS |
| `sprint2.integration.test.js` | 19 | 19 | 0 | ✅ PASS |
| `regression.test.js` | 17 | 17 | 0 | ✅ PASS |
| `e2e.test.js` | 15 | 15 | 0 | ✅ PASS |

**Frontend Sprint 2 Tests: ALL PASSED ✅**

### Overall Summary

| Metric | Value |
|--------|-------|
| Total Test Files | 10 (5 backend + 5 frontend) |
| Total Tests | 100+ |
| Pass Rate | 100% (Sprint 2 tests) |
| Test Categories | Unit, Integration, Regression, E2E |
| Mocking | Full mock coverage (no external dependencies needed) |

### Commands to Run Tests

```bash
# Backend tests (Jest)
cd backend
npm test
# or: npx jest --config jest.config.js --verbose

# Frontend tests (Vitest)
cd frontend-sprint1
npx vitest run
# or: npx vitest run --reporter=verbose
```

---

## 9. User Guide

### Getting Started

1. **Open the application** at `http://localhost:5173`
2. **Login** with your credentials (email + password)
3. If MFA is enabled, enter the **6-digit OTP** sent to your email

### Role-Based Features

#### 👨‍⚕️ Doctor
- **Patient Dashboard** – View patient list, pending lab verifications
- **Vitals Dashboard** – Search patients, view vital trends, submit vitals
- **Manage Availability** – Set consultation time slots
- **Diagnosis & EHR** – Create diagnoses and view patient records
- **Lab Management** – Order labs, verify results
- **CDSS** – AI-powered care plan generation from lab reports

#### 🏥 Nurse
- **Ward Dashboard** – Overview of assigned patients
- **Vitals Dashboard** – Monitor and record patient vital signs
- **Vitals Monitoring** – Real-time vitals overview

#### 🧑‍🤝‍🧑 Patient
- **Health Summary** – View personal health data
- **My Care Plan** – CDSS-generated care recommendations
- **Appointments** – Book and manage doctor appointments
- **Prescriptions** – View medications and OCR-scan prescriptions
- **Payments** – Pay for consultations via Stripe

#### 🔧 Admin
- **Admin Overview** – System statistics
- **User Management** – Create, view, and delete user accounts
- **Audit Logs** – View complete system activity trail
- **Compliance** – Monitor system compliance

### Vitals Dashboard (Sprint 2)

1. Navigate to **Vitals Dashboard** from the sidebar
2. Enter a **Patient UUID** in the search bar and click **Load Vitals**
3. View the **traffic-light metric cards**:
   - 🟢 Green = Normal
   - 🟡 Amber = Caution
   - 🔴 Red = Critical
4. View **trend charts** for heart rate, blood pressure, temperature, and SpO2
5. Use the **Record Vital Signs** form on the right to submit new readings
6. The dashboard **auto-refreshes** after each submission

---

## 10. Developer Guide

### Project Structure

```
secure_healthcare/
├── backend/
│   ├── __tests__/                    # All test files
│   │   ├── unit.test.js             # Unit tests
│   │   ├── integration.test.js       # Sprint 1 integration tests
│   │   ├── sprint2.integration.test.js # Sprint 2 integration tests
│   │   ├── regression.test.js        # Regression tests
│   │   └── e2e.test.js              # End-to-end tests
│   ├── migrations/                   # Database migration scripts
│   ├── scripts/                      # Utility scripts
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                # PostgreSQL connection pool
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT verification + RBAC
│   │   ├── modules/
│   │   │   ├── auth/                # Authentication (login, register, MFA)
│   │   │   ├── patients/            # Patient CRUD with PII encryption
│   │   │   ├── appointments/        # Appointment booking + scheduling
│   │   │   ├── vitals/              # Vital signs (Sprint 1)
│   │   │   ├── vitals-intake/       # Vital intake + dashboard (Sprint 2)
│   │   │   ├── labs/                # Lab orders + digital signatures
│   │   │   ├── cdss/                # Clinical Decision Support AI
│   │   │   ├── prescriptions/       # Medication management
│   │   │   ├── ocr/                 # Prescription OCR scanning
│   │   │   ├── doctors/             # Doctor profiles + availability
│   │   │   ├── aiBot/               # AI health recommendations
│   │   │   ├── payments/            # Stripe payment integration
│   │   │   └── telemedicine/        # Doctor-patient messaging
│   │   ├── routes/                  # Admin routes
│   │   └── app.js                   # Express app configuration
│   ├── server.js                    # Server entry point
│   ├── jest.config.js               # Jest test configuration
│   └── package.json
│
├── frontend-sprint1/
│   ├── src/
│   │   ├── api/                     # Axios API services
│   │   ├── components/              # Reusable components
│   │   │   ├── Layout.jsx           # App layout (navbar + sidebar)
│   │   │   ├── Sidebar.jsx          # Role-based navigation
│   │   │   ├── VitalIntakeForm.jsx  # Vital signs input form
│   │   │   └── ProtectedRoute.jsx   # Auth guard component
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Auth state management
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx        # Role-based dashboard
│   │   │   ├── VitalsDashboard.jsx  # Sprint 2 vitals + charts
│   │   │   └── ... (other pages)
│   │   └── test/                    # Frontend test files
│   │       ├── sample.test.js
│   │       ├── integration.test.js
│   │       ├── sprint2.integration.test.js
│   │       ├── regression.test.js
│   │       └── e2e.test.js
│   └── package.json
│
├── SPRINT2_TEST_DOCUMENTATION.md    # This document
└── README.md
```

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/Aswinlaks/secure_healthcare.git
cd secure_healthcare

# 2. Checkout Sprint 2 branch
git checkout sprint2_complete_integration

# 3. Install dependencies
cd backend && npm install
cd ../frontend-sprint1 && npm install

# 4. Configure environment
# Create backend/.env with:
#   DATABASE_URL=postgresql://...
#   JWT_SECRET=...
#   PII_ENCRYPTION_KEY=...
#   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

# 5. Run database migrations
cd backend && node migrations/create_vitals_table.js

# 6. Start servers
cd backend && npm run dev           # Backend on port 5000
cd frontend-sprint1 && npm run dev  # Frontend on port 5173

# 7. Run tests
cd backend && npm test
cd frontend-sprint1 && npx vitest run
```

### Module Architecture Pattern

Each backend module follows a layered architecture:

```
module/
├── module.routes.js       # Express routes → controller
├── module.controller.js   # HTTP layer → service
├── module.service.js      # Business logic + validation
└── module.repository.js   # SQL queries → database
```

### Security Features

- **PII Encryption:** Patient names encrypted with AES-256-CBC
- **Digital Signatures:** Lab results signed with RSA keys
- **JWT Authentication:** Stateless token-based auth with expiry
- **MFA:** Email-based OTP verification
- **RBAC:** Role-based route protection (Admin, Doctor, Nurse, Patient, Lab Tech)
- **Audit Trail:** All user actions logged for compliance
- **Neon Connection Handling:** Graceful pool error handling for idle disconnects
