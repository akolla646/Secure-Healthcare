/**
 * Main Application Component
 * 
 * This component handles the core routing logic and global state providers.
 * It defines the navigation structure of the application using React Router.
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Provides authentication state to the app

// Import Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BookAppointment from './pages/BookAppointment';
import PatientDiagnosis from './pages/PatientDiagnosis';
import CarePlanReview from './pages/CarePlanReview';
import PatientCareView from './pages/PatientCareView';
import OrderLab from './pages/OrderLab';
import DoctorAvailability from './pages/DoctorAvailability';
import AuditLogs from './pages/AuditLogs';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

// Import Components
import Layout from './components/Layout'; // Common layout for dashboard pages
import ProtectedRoute from './components/ProtectedRoute'; // Guard component for secure routes

function App() {
  return (
    // Router enables navigation without page reloads
    <Router>
      {/* AuthProvider makes user login state available to all components */}
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Payment Routes */}
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />

          {/* Secure Route for Booking Appointment (accessible by Patients & Users) */}
          <Route
            path="/book-appointment"
            element={
              <ProtectedRoute allowedRoles={['Patient', 'User', 'USER', 'PATIENT']}>
                <BookAppointment />
              </ProtectedRoute>
            }
          />

          {/* Dashboard Routes - Wrapped in Layout and ProtectedRoute */}
          {/* Default Protection: Requires any authenticated user */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>

            {/* Main Dashboard - Redirects based on role inside the component */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Doctor-Specific Routes */}
            <Route
              path="/patient/:id/diagnosis"
              element={
                <ProtectedRoute allowedRoles={['Doctor', 'DOCTOR']}>
                  <PatientDiagnosis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/:id/review-plan"
              element={
                <ProtectedRoute allowedRoles={['Doctor', 'DOCTOR']}>
                  <CarePlanReview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/:id/order-lab"
              element={
                <ProtectedRoute allowedRoles={['Doctor', 'DOCTOR']}>
                  <OrderLab />
                </ProtectedRoute>
              }
            />

            {/* Shared Route: Care Plan View (Doctor can edit, Patient can view) */}
            <Route
              path="/patient/:id/care-plan"
              element={
                <ProtectedRoute allowedRoles={['Doctor', 'DOCTOR', 'Patient', 'PATIENT']}>
                  <PatientCareView />
                </ProtectedRoute>
              }
            />

            {/* Doctor Availability Management */}
            <Route
              path="/doctor/availability"
              element={
                <ProtectedRoute allowedRoles={['Doctor', 'DOCTOR']}>
                  <DoctorAvailability />
                </ProtectedRoute>
              }
            />

            {/* Admin-Specific Route: Audit Logs */}
            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'ADMIN']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Default Redirect: Send unknown routes to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
