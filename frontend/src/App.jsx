import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import AdminLogin from "./pages/AdminLogin";
import JobSeekerDashboard from "./pages/JobSeekerDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import EmailVerification from "./pages/EmailVerification";

function App() {
  return (
    <>
      {/* Toast notifications styling */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1a1f36",
            color: "#f1f5f9",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "10px",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#1a1f36",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#1a1f36",
            },
          },
        }}
      />

      {/* Global Navbar */}
      <Navbar />

      {/* Route definitions */}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<EmailVerification />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/jobseeker/dashboard"
          element={
            <ProtectedRoute allowedRoles={["jobseeker"]}>
              <JobSeekerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/dashboard"
          element={
            <ProtectedRoute allowedRoles={["recruiter"]}>
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback to Home */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  );
}

export default App;
