import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Protected Route Component
 * Checks authentication status and user role before rendering children
 * Redirects to home if not authenticated or unauthorized
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string[]} props.allowedRoles - Array of roles that can access this route
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Not authenticated — redirect to home
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's own dashboard
    const dashboardRoutes = {
      jobseeker: "/jobseeker/dashboard",
      recruiter: "/recruiter/dashboard",
      admin: "/admin/dashboard",
    };
    return <Navigate to={dashboardRoutes[user.role] || "/"} replace />;
  }

  return children;
};

export default ProtectedRoute;
