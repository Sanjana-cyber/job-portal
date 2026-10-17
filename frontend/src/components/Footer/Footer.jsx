import React from "react";
import { FaWhatsapp, FaInstagram, FaLinkedinIn, FaGithub } from "react-icons/fa";
import TalentBridgeLogo from "../TalentBridgeLogo/TalentBridgeLogo";
import "./Footer.css";

/**
 * Footer Component
 * 
 * Rendered in dark blue (matching TALENT BRIDGE theme),
 * containing interactive social links:
 * - WhatsApp
 * - Instagram
 * - LinkedIn
 * - GitHub
 */
function Footer() {
  const socialLinks = [
    {
      name: "WhatsApp",
      icon: FaWhatsapp,
      url: "https://wa.me/9877932989",
      className: "whatsapp",
      ariaLabel: "Connect with us on WhatsApp",
    },
    {
      name: "Instagram",
      icon: FaInstagram,
      url: "https://instagram.com/san_jana._03",
      className: "instagram",
      ariaLabel: "Follow us on Instagram",
    },
    {
      name: "LinkedIn",
      icon: FaLinkedinIn,
      url: "https://www.linkedin.com/in/sanjana-0b66b5309",
      className: "linkedin",
      ariaLabel: "Follow us on LinkedIn",
    },
    {
      name: "GitHub",
      icon: FaGithub,
      url: "https://github.com/Sanjana-cyber",
      className: "github",
      ariaLabel: "View our code on GitHub",
    },
  ];

  return (
    <footer className="tb-footer">
      <div className="tb-footer__container">

        {/* Social Icons Row */}
        <ul className="tb-footer__socials" aria-label="Social Media Links">
          {socialLinks.map(({ name, icon: Icon, url, className, ariaLabel }) => (
            <li key={name} className="tb-footer__social-item">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`tb-footer__social-link ${className}`}
                aria-label={ariaLabel}
                title={name}
              >
                <Icon aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>

        {/* Divider & Copyright */}
        <div className="tb-footer__divider" aria-hidden="true" />
        <p className="tb-footer__copy">
          © {new Date().getFullYear()} TalentBridge. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
