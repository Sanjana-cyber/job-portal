import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import "./Auth.css";

export default function Modal({ onClose, children, title }) {
  const overlayRef = useRef(null);

  // Close on Esc
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Click outside
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div className="auth-overlay" ref={overlayRef} onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label={title}>
      <div className="auth-modal">
        <button className="auth-modal__close" onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}
