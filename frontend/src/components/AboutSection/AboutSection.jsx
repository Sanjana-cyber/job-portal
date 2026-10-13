import React from "react";
import { Sparkles, Target, Users, ShieldCheck } from "lucide-react";
import "./AboutSection.css";

/**
 * AboutSection Component
 * 
 * Sits below the Hero Section and above the Footer.
 * Background color is an intermediate blue (darker than hero #e6f0fa, but lighter than footer #0a2558).
 * Outlines the mission, features, and core value of TalentBridge.
 */
function AboutSection() {
  const cards = [
    {
      icon: Sparkles,
      title: "AI-Powered ATS Match",
      text: "Our intelligent scoring engine assesses resumes against real applicant tracking systems, giving actionable feedback so candidates never get lost in the automated filter.",
    },
    {
      icon: Target,
      title: "Direct Recruiter Access",
      text: "Say goodbye to black-hole job applications. TalentBridge connects candidates directly with verified hiring teams and talent acquisition leads globally.",
    },
    {
      icon: ShieldCheck,
      title: "Verified Opportunities",
      text: "Every role posted on TalentBridge is vetted for authenticity and salary transparency, ensuring you spend your time applying to real, impactful positions.",
    },
  ];

  const stats = [
    { num: "50,000+", label: "Verified Active Roles" },
    { num: "1,200+", label: "Partner Companies" },
    { num: "98.4%", label: "ATS Screening Success" },
    { num: "3.2x", label: "Faster Interview Offers" },
  ];

  return (
    <section className="about-section" id="about">
      <div className="about-container">
        {/* Header Content */}
        <div className="about-header">
          <span className="about-badge">
            <Users size={14} />
            About TalentBridge
          </span>
          <h2 className="about-title">
            Connecting Ambition With Real Career Opportunities
          </h2>
          <p className="about-description">
            TalentBridge is an advanced career acceleration platform built to remove the friction from modern hiring. Whether you are crafting an ATS-optimized resume, exploring remote tech roles, or discovering top employer networks, we build the bridge to your next milestone.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="about-grid">
          {cards.map(({ icon: Icon, title, text }) => (
            <div className="about-card" key={title}>
              <div className="about-card-icon">
                <Icon size={28} strokeWidth={2} />
              </div>
              <h3 className="about-card-title">{title}</h3>
              <p className="about-card-text">{text}</p>
            </div>
          ))}
        </div>

        {/* Impact Numbers */}
        <div className="about-stats">
          {stats.map(({ num, label }) => (
            <div className="about-stat-item" key={label}>
              <span className="about-stat-num">{num}</span>
              <span className="about-stat-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
