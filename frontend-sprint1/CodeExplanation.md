# Code Explanation Report

This document provides a detailed explanation of the key frontend files in your project.

## 1. Core Application Files

### **`src/main.jsx`**
**Purpose**: The entry point of the React application.
- **`createRoot`**: Initializes the React application and attaches it to the HTML element with `id="root"`.
- **`StrictMode`**: activates additional checks and warnings for descendants.
- **`App`**: Renders the main `App` component.
- **`./index.css`**: Imports global CSS styles.

### **`src/App.jsx`**
**Purpose**: The main component that handles routing and global providers.
- **`AuthProvider`**: Wraps the app to provide authentication state (user, login, logout) to all components.
- **`Router` (`BrowserRouter`)**: Enables navigation between pages without reloading the browser.
- **`Routes` & `Route`**: Defines the mapping between URL paths and components (e.g., `/login` renders `<Login />`).
- **`ProtectedRoute`**: A wrapper component that checks if a user is logged in and has the correct role before allowing access to specific routes (e.g., only 'Doctor' role can access `/patient/:id/diagnosis`).
- **Layout**: Wraps dashboard routes to provide a common sidebar/header structure.

## 2. Services

### **`src/services/emailService.js`**
**Purpose**: Handles sending emails (specifically OTPs) using the EmailJS library.
- **`initEmailJS`**: Initializes the EmailJS SDK with your public key.
- **`sendOtpEmail`**:
    - Takes `email`, `otp`, and `name` as input.
    - Constructs parameters (to_email, passcode, etc.) matching your EmailJS template.
    - Sends the email using `emailjs.send()`.
    - Returns a success/failure object to the caller.

## 3. Dashboards (Role-Based Views)

### **`src/pages/dashboards/AdminDashboard.jsx`**
**Purpose**: The main interface for System Administrators.
- **Features**:
    - **Statistics**: Shows total users, total audit logs, and system compliance status.
    - **User Management**: Displays a searchable list of all users. Allows deleting users and adding new users (Patients, Doctors, etc.) via a modal form.
    - **Audit Logs**: Shows a snippet of recent security events.
- **Key Functions**:
    - `fetchDashboardData`: Calls backend APIs to get stats, users, and logs parallelly.
    - `handleAddUser`: Sends a POST request to create a new user.
    - `handleDeleteUser`: Sends a DELETE request to remove a user.

### **`src/pages/dashboards/LabTechDashboard.jsx`**
**Purpose**: Interface for Lab Technicians to manage test orders.
- **Features**:
    - **Pending Orders**: Lists lab orders that haven't been completed yet.
    - **Upload Results**: Allows the tech to select an order and type/paste results.
- **Key Functions**:
    - `fetchOrders`: Gets orders with 'PENDING' status.
    - `submitUpload`: Sends the result text to the backend API (`/labs/reports`), which updates the order status to 'COMPLETED'.

### **`src/pages/dashboards/NurseDashboard.jsx`**
**Purpose**: Interface for Nurses to manage patient care tasks.
- **Features**:
    - **Stats Cards**: Shows assigned patients, critical alerts, rounds status, etc.
    - **Tasks List**: Displays upcoming rounds and medication schedules for specific rooms/beds.
    - *Note*: Currently, this dashboard uses static/mock data for demonstration.

### **`src/pages/dashboards/PatientDashboard.jsx`**
**Purpose**: The main portal for Patients.
- **Features**:
    - **Appointments**: Lists upcoming appointments. Allows booking new ones.
    - **Lab Reports**: Lists processed lab results. Patients can view details in a modal or download them as a text file.
    - **Quick Actions**: Shortcuts to view care plans or request refills.
- **Key Functions**:
    - `handleDownloadReport`: Generates a downloadable text file containing the lab result, verification status, and doctor comments.
    - `handleViewReport`: Fetches full details of a specific lab report.

## 4. Security & Auditing

### **`src/pages/AuditLogs.jsx`**
**Purpose**: A dedicated page for Admins to view the full security audit history.
- **Features**:
    - **Paginated Table**: Displays logs in pages of 20.
    - **Security Events**: Shows actions (LOGIN, LOGOUT, FAILED_ACCESS), User IDs, IPs, and Timestamps.
    - **Navigation**: Uses `page` and `limit` to query the backend pagination API.
