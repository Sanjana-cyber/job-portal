/**
 * googleAuthService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Production-Grade Singleton Google Identity Services (GIS) Manager.
 *
 * Solves:
 *   1. "google.accounts.id.initialize() is called multiple times"
 *      -> Guaranteed single execution across entire application lifecycle.
 *   2. "Only one navigator.credentials.get request may be outstanding at one time"
 *      -> Request-in-progress guard preventing concurrent credential fetches.
 *   3. "FedCM get() rejects with NotAllowedError / AbortError"
 *      -> Configures use_fedcm_for_prompt: false and handles prompt suppression.
 *   4. StrictMode duplicate mounting
 *      -> Initialization lock & ref-safe callback subscription pattern.
 */

class GoogleAuthService {
  constructor() {
    this.isInitialized = false;
    this.initializationPromise = null;
    this.isRequestInProgress = false;
    this.activeAuthHandler = null;
    this.clientId = null;
  }

  /**
   * Load the Google GSI script dynamically if not already loaded in document.
   * Returns a Promise that resolves when window.google.accounts.id is available.
   */
  async loadSDK() {
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      return window.google.accounts.id;
    }

    return new Promise((resolve, reject) => {
      // Check if script is already present in head
      const existingScript = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );

      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          resolve(window.google.accounts.id);
        }
      }, 50);

      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        if (window.google?.accounts?.id) {
          resolve(window.google.accounts.id);
        } else {
          reject(new Error("Google Identity Services SDK load timeout"));
        }
      }, 8000);

      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onerror = (err) => {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          reject(err);
        };
        document.head.appendChild(script);
      }
    });
  }

  /**
   * Initialize Google Identity Services exactly ONCE for the entire application.
   * Any subsequent calls with the same clientId return immediately.
   *
   * @param {string} clientId - Google OAuth Client ID
   */
  async initialize(clientId) {
    if (!clientId) {
      throw new Error("[GoogleAuthService] Client ID is required for initialization");
    }

    // If already initialized with same client ID, return immediately
    if (this.isInitialized && this.clientId === clientId) {
      return;
    }

    // If an initialization is currently in-flight, return the existing promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      await this.loadSDK();

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          // Disable FedCM prompt to avoid Chrome 120+ FedCM AbortError & NotAllowedError
          use_fedcm_for_prompt: false,
          cancel_on_tap_outside: true,
          callback: (response) => {
            this.isRequestInProgress = false;
            if (this.activeAuthHandler && response.credential) {
              this.activeAuthHandler(response.credential);
            }
          },
        });

        this.isInitialized = true;
        this.clientId = clientId;
      } catch (err) {
        console.error("[GoogleAuthService] Initialization failed:", err);
        throw err;
      } finally {
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Subscribe an authentication callback.
   * Allows React components to update their active handler without re-initializing Google.
   *
   * @param {(credential: string) => Promise<void> | void} handler
   * @returns {() => void} unsubscribe function
   */
  setAuthHandler(handler) {
    this.activeAuthHandler = handler;
    return () => {
      if (this.activeAuthHandler === handler) {
        this.activeAuthHandler = null;
      }
    };
  }

  /**
   * Render the official Google Sign-In button into a container.
   * Clears the container prior to rendering to avoid duplicate iframes.
   *
   * @param {HTMLElement} containerElement - DOM node to mount button into
   * @param {Object} [customOptions] - Optional configuration overrides
   */
  async renderButton(containerElement, customOptions = {}) {
    if (!containerElement) return;

    await this.loadSDK();

    if (!this.isInitialized) {
      console.warn("[GoogleAuthService] Attempted to render button before initialization");
      return;
    }

    // Clear any previous button iframe to prevent duplicates on remount
    containerElement.innerHTML = "";

    const defaultOptions = {
      theme: "outline",
      size: "large",
      width: 320,
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
    };

    window.google.accounts.id.renderButton(containerElement, {
      ...defaultOptions,
      ...customOptions,
    });
  }

  /**
   * Trigger Google One Tap / popup prompt safely with a concurrency guard.
   * If a credential request is already in progress, safely skips to avoid
   * "Only one navigator.credentials.get request may be outstanding at one time".
   */
  prompt() {
    if (!this.isInitialized || typeof window === "undefined" || !window.google?.accounts?.id) {
      return;
    }

    if (this.isRequestInProgress) {
      console.warn("[GoogleAuthService] A credential request is already in progress; skipping duplicate prompt.");
      return;
    }

    // Clear Google One Tap cooldown cookie if set
    this.clearCooldownCookie();

    this.isRequestInProgress = true;

    try {
      window.google.accounts.id.prompt((notification) => {
        // Reset in-progress flag if prompt is dismissed, skipped, or not displayed
        if (
          notification.isNotDisplayed() ||
          notification.isSkippedMoment() ||
          notification.isDismissedMoment()
        ) {
          this.isRequestInProgress = false;
        }
      });
    } catch (err) {
      this.isRequestInProgress = false;
      console.warn("[GoogleAuthService] Prompt invocation error:", err);
    }
  }

  /**
   * Cancel any outstanding One Tap prompt and reset the request-in-progress guard.
   */
  cancel() {
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.cancel();
      } catch {
        // ignore
      }
    }
    this.isRequestInProgress = false;
  }

  /**
   * Reset Google One Tap suppression cookie
   */
  clearCooldownCookie() {
    if (typeof document !== "undefined") {
      try {
        document.cookie = "g_state=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      } catch {
        // ignore
      }
    }
  }
}

// Export singleton instance
export const googleAuthService = new GoogleAuthService();
export default googleAuthService;
