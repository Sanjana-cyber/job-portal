import React from "react";
import { Search, FileText, BriefcaseBusiness, UserRound, Users } from "lucide-react";
import TalentBridgeLogo from "../TalentBridgeLogo/TalentBridgeLogo";
import heroImg from "./hero.png";
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
    id: "upload-resume",
    Icon: FileText,
    title: "Upload Resume",
    description: "Showcase your skills",
  },
  {
    id: "apply-easily",
    Icon: BriefcaseBusiness,
    title: "Apply Easily",
    description: "One-click application",
  },
  {
    id: "top-employers",
    Icon: UserRound,
    title: "Top Employers",
    description: "Connect with companies",
  },
];

function HeroSection() {
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

        <ul className="hero__features">
          {FEATURES.map(({ id, Icon, title, description }) => (
            <li className="feature" key={id}>
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
            <a href="/register" className="account-card__btn">
              Create Account
            </a>
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
