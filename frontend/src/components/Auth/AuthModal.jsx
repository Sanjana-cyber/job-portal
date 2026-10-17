import React, { useState } from "react";
import Modal from "./Modal";
import RoleSelect from "./RoleSelect";
import AuthForm from "./AuthForm";
import "./Auth.css";

/**
 * AuthModal orchestrates 3 possible views:
 *  "role"   – pick Job Seeker or Recruiter
 *  "login"  – login form for the chosen role
 *  "signup" – registration form for the chosen role
 */
export default function AuthModal({ initialView = "role", onClose, onSuccess }) {
  const [view, setView] = useState(initialView);
  const [role, setRole] = useState(null);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setView("login"); // default to login after role selection
  };

  const handleBack = () => {
    setView("role");
    setRole(null);
  };

  const handleSwitchMode = (newMode) => {
    setView(newMode); // "login" | "signup"
  };

  return (
    <Modal onClose={onClose} title="TalentBridge Authentication">
      {view === "role" && (
        <RoleSelect onSelect={handleRoleSelect} />
      )}
      {(view === "login" || view === "signup") && role && (
        <AuthForm
          role={role}
          mode={view}
          onSwitchMode={handleSwitchMode}
          onBack={handleBack}
          onSuccess={onSuccess}
        />
      )}
    </Modal>
  );
}
