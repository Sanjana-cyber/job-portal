import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe, loginUser, registerUser, logoutUser, googleAuth } from "../api/authApi";

/**
 * Authentication Context
 * Manages global auth state: user, loading, isAuthenticated
 * Provides login, register, logout, and googleLogin actions
 */
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Load current user on mount (checks for existing session cookie)
   */
  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getMe();
      if (response.data.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      // Not authenticated — this is expected on first visit
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  /**
   * Login with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Object} user data
   */
  const login = async (email, password) => {
    const response = await loginUser({ email, password });
    if (response.data.success) {
      setUser(response.data.user);
      setIsAuthenticated(true);
    }
    return response.data;
  };

  /**
   * Register a new user
   * @param {Object} data - { name, email, password, role }
   * @returns {Object} user data
   */
  const register = async (data) => {
    const response = await registerUser(data);
    if (response.data.success) {
      setUser(response.data.user);
      setIsAuthenticated(true);
    }
    return response.data;
  };

  /**
   * Logout current user
   */
  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      // Continue logout even if API fails
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  /**
   * Google OAuth login/register
   * @param {string} credential - Google OAuth credential
   * @param {string} role - User role
   * @returns {Object} user data
   */
  const googleLogin = async (credential, role) => {
    const response = await googleAuth({ credential, role });
    if (response.data.success) {
      setUser(response.data.user);
      setIsAuthenticated(true);
    }
    return response.data;
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    googleLogin,
    loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
