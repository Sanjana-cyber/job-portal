import React, { createContext, useContext, useState } from "react";
import AuthModal from "../components/Auth/AuthModal";

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialView, setInitialView] = useState("role");
  const [user, setUser] = useState(null);

  const openModal = (view = "role") => {
    setInitialView(view);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    closeModal();
  };

  return (
    <AuthModalContext.Provider value={{ openModal, closeModal, user, setUser }}>
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

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used inside AuthModalProvider");
  return ctx;
}
