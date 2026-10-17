import React from "react";
import { Briefcase, UserSearch } from "lucide-react";
import "./Auth.css";

const ROLES = [
  {
    id: "jobseeker",
    Icon: UserSearch,
    label: "Job Seeker",
    desc: "Browse and apply to thousands of jobs",
  },
  {
    id: "recruiter",
    Icon: Briefcase,
    label: "Recruiter",
    desc: "Post jobs and find top talent",
  },
];

export default function RoleSelect({ onSelect }) {
  return (
    <div className="role-select">
      <div className="auth-modal__header">

        <h2 className="auth-modal__title">Join Talent Bridge</h2>
        <p className="auth-modal__sub">Choose how you want to get started</p>
      </div>

      <div className="role-cards">
        {ROLES.map(({ id, Icon, label, desc }) => (
          <button
            key={id}
            className="role-card"
            onClick={() => onSelect(id)}
            id={`role-card-${id}`}
          >
            <span className="role-card__icon-wrap">
              <Icon size={32} strokeWidth={1.6} />
            </span>
            <span className="role-card__label">{label}</span>
            <span className="role-card__desc">{desc}</span>
            <span className="role-card__arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
