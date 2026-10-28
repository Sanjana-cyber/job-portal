/**
 * tokenService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised Token Storage & Lifecycle Manager.
 *
 * Provides a single source of truth for auth tokens on the client side:
 *   • Safe access with in-memory caching for performance
 *   • Fallback to localStorage for persistence across reloads
 *   • Atomic clearing during logout and session expiration
 */

const TOKEN_KEY = "tb_auth_token";

let memoryToken = null;

export const tokenService = {
  /**
   * Get the current JWT token.
   * Checks in-memory cache first, then falls back to localStorage.
   */
  getToken() {
    if (memoryToken) return memoryToken;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const stored =
          window.localStorage.getItem(TOKEN_KEY) ||
          window.localStorage.getItem("token") ||
          window.localStorage.getItem("authToken");
        if (stored && stored !== "null" && stored !== "undefined" && stored !== "none") {
          memoryToken = stored;
          return stored;
        }
      }
    } catch {
      // Storage unavailable (e.g. private browsing mode quota exceeded)
    }
    return null;
  },

  /**
   * Persist a new JWT token in memory and localStorage.
   *
   * @param {string} token
   */
  setToken(token) {
    if (!token || typeof token !== "string") return;
    memoryToken = token;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(TOKEN_KEY, token);
        window.localStorage.setItem("token", token);
      }
    } catch {
      // Storage unavailable
    }
  },

  /**
   * Remove token from memory and localStorage.
   */
  clearToken() {
    memoryToken = null;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
        // Also clear legacy keys if present
        window.localStorage.removeItem("token");
      }
    } catch {
      // Storage unavailable
    }
  },

  /**
   * Check if a token currently exists.
   */
  hasToken() {
    return Boolean(this.getToken());
  },
};

export default tokenService;
