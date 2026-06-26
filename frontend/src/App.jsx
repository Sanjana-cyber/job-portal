import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminLogin from "./pages/AdminLogin";
import JobSeekerDashboard from "./pages/JobSeekerDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import SystemManagementConsole from "./pages/SystemManagementConsole";
import ResetPassword from "./pages/ResetPassword";
import EmailVerification from "./pages/EmailVerification";
import ProfileBuilderPage from "./pages/ProfileBuilderPage";
import JobsPage from "./pages/JobsPage";
import DashboardJobsPage from "./pages/DashboardJobsPage";

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
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<EmailVerification />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["jobseeker"]}>
              <JobSeekerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute allowedRoles={["jobseeker"]}>
              <ProfileBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/jobs"
          element={
            <ProtectedRoute allowedRoles={["jobseeker"]}>
              <DashboardJobsPage />
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
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <SystemManagementConsole />
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
