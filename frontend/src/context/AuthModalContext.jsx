import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import AuthModal from "../components/Auth/AuthModal";
import { getMe, logoutUser } from "../services/api";
import tokenService from "../services/tokenService";

/**
 * AuthModalContext
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides app-wide authentication state and modal control.
 *
 * Exposes via useAuthModal():
 *   user        – current user object, or null if not logged in
 *   openModal   – opens the auth modal (view: "role" | "login" | "signup")
 *   closeModal  – closes the auth modal
 *   logout      – logs the user out and clears state
 *   isLoading   – true while the initial session check is in flight
 */

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialView, setInitialView] = useState("role");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true until session check finishes

  // ── Session restore on mount ─────────────────────────────────────────────
  // Restore user session if a saved token exists. If no token is stored,
  // skip the network call to avoid logging an expected 401 in the console.
  useEffect(() => {
    if (!tokenService.hasToken()) {
      setIsLoading(false);
      return;
    }

    getMe()
      .then((res) => {
        if (res?.user) setUser(res.user);
      })
      .catch(() => {
        // 401 → token expired / invalid → clear stale token
        tokenService.clearToken();
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ── Auto-logout on 401 ───────────────────────────────────────────────────
  // api.js dispatches "auth:expired" whenever any request returns 401.
  // We listen here so the whole app reacts consistently.
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setIsOpen(false);
    };
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  // ── Modal controls ───────────────────────────────────────────────────────

  /** Open the auth modal. view: "role" | "login" | "signup" */
  const openModal = useCallback((view = "role") => {
    setInitialView(view);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => setIsOpen(false), []);

  /** Called by AuthModal after a successful login/register */
  const handleAuthSuccess = useCallback((userData) => {
    setUser(userData);
    setIsOpen(false);
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    try {
      await logoutUser(); // asks backend to clear the HttpOnly cookie
    } catch {
      // Even if the request fails (e.g. already expired), clear local state
    } finally {
      setUser(null);
      setIsOpen(false);
    }
  }, []);

  return (
    <AuthModalContext.Provider
      value={{ user, setUser, openModal, closeModal, logout, isLoading }}
    >
      {children}

      {isOpen && (
        <AuthModal
          initialView={initialView}
          onClose={closeModal}
          onSuccess={handleAuthSuccess}
        />
      )}
    </AuthModalContext.Provider>
  );
}

/**
 * useAuthModal — consume auth state and modal controls anywhere in the tree.
 *
 * Example:
 *   const { user, openModal, logout } = useAuthModal();
 */
export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used inside <AuthModalProvider>");
  }
  return ctx;
}
