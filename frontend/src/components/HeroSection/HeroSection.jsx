import React, { useState } from "react";
import {
  Search,
  Sparkles,
  BriefcaseBusiness,
  Users
} from "lucide-react";
import TalentBridgeLogo from "../TalentBridgeLogo/TalentBridgeLogo";
import heroImg from "./hero.png";
import { useAuthModal } from "../../context/AuthModalContext";
import "./HeroSection.css";

const ICON_SIZE = 22;
const ICON_STROKE = 1.75;

const FEATURES = [
  {
    id: "search-jobs",
    Icon: Search,
    title: "Search Jobs",
    description: "Find the right opportunity",
  },
  {
    id: "build-resume",
    Icon: Sparkles,
    title: "Build Resume",
    description: "AI-powered resume builder",
  },
  {
    id: "apply-easily",
    Icon: BriefcaseBusiness,
    title: "Apply Easily",
    description: "One-click application",
  },
];

function HeroSection() {
  const { openModal } = useAuthModal();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchAction = (e) => {
    if (e) e.preventDefault();
    openModal("login");
  };

  const handleFeatureClick = (id) => {
    openModal("login");
  };

  return (
    <section className="hero">
      <div className="hero__dots" aria-hidden="true" />

      <div className="hero__content">
        <div className="hero__brand">
          <TalentBridgeLogo variant="paperplane" className="hero__logo" />
          <h1 className="hero__title">TALENT BRIDGE</h1>
        </div>

        <p className="hero__subtitle">
          Find Jobs. Build Career. Shape Your Future.
        </p>

        {/* ── Interactive Hero Search Bar ── */}


        {/* ── 3 Key Features: Search Jobs, Build Resume, Apply Easily ── */}
        <ul className="hero__features">
          {FEATURES.map(({ id, Icon, title, description }) => (
            <li
              className="feature feature--clickable"
              key={id}
              onClick={() => handleFeatureClick(id)}
              role="button"
              tabIndex={0}
              title={`Click to ${title}`}
            >
              <span className="feature__icon-circle">
                <Icon
                  size={ICON_SIZE}
                  strokeWidth={ICON_STROKE}
                  aria-hidden="true"
                />
              </span>
              <h2 className="feature__title">{title}</h2>
              <p className="feature__description">{description}</p>
            </li>
          ))}
        </ul>

        {/* Hero Mockup Scene Image with Create Account Card */}
        <div className="hero__image-wrapper">
          {/* Left-side Create Account Card */}
          <div className="hero__account-card">
            <div className="account-card__icon-wrap">
              <Users size={28} className="account-card__icon" strokeWidth={2.2} />
            </div>
            <h3 className="account-card__title">
              Join Thousands of Job Seekers Today!
            </h3>
            <button
              type="button"
              className="account-card__btn"
              id="create-account-btn"
              onClick={() => openModal("role")}
            >
              Create Account
            </button>
          </div>

          {/* Laptop Mockup Image */}
          <img
            src={heroImg}
            alt="TalentBridge Platform Laptop Mockup"
            className="hero__mockup-img"
          />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
