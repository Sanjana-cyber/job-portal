import React from "react";

/**
 * TalentBridgeLogo
 * 
 * Multi-variant logo component for TalentBridge.
 * Easily switch logos using the `variant` prop:
 * - variant="bridge"     -> Modern suspension bridge emblem
 * - variant="airplane"   -> Modern jet aircraft in flight
 * - variant="paperplane" -> Origami paper plane
 */
function TalentBridgeLogo({
  size = "1em",
  className = "",
  variant = "paperplane", // Default is paperplane
  royal = "#2563eb",
  royalDeep = "#1d4ed8",
  darkBlue = "#0a2558",
  lightBlue = "#93c5fd",
  ariaLabel = "TalentBridge Logo",
  ...props
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
      style={{ display: "inline-block", verticalAlign: "middle" }}
      {...props}
    >
      {/* ── 1. BRIDGE LOGO ── */}
      {variant === "bridge" && (
        <g>
          {/* Main Suspension Cables (Sweeping Arch) */}
          <path
            d="M6 24 C 20 40, 44 40, 58 24"
            stroke={royal}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Vertical Suspension Wire Ropes */}
          <line x1="20" y1="33" x2="20" y2="45" stroke={royal} strokeWidth="1.8" strokeOpacity="0.85" />
          <line x1="27" y1="36" x2="27" y2="45" stroke={royal} strokeWidth="1.8" strokeOpacity="0.85" />
          <line x1="37" y1="36" x2="37" y2="45" stroke={royal} strokeWidth="1.8" strokeOpacity="0.85" />
          <line x1="44" y1="33" x2="44" y2="45" stroke={royal} strokeWidth="1.8" strokeOpacity="0.85" />

          {/* Left Tower / Pylon */}
          <path
            d="M15 12 L18 12 L18 45 L15 45 Z"
            fill={darkBlue}
          />
          <path
            d="M12 45 L21 45 L20 49 L13 49 Z"
            fill={darkBlue}
          />

          {/* Right Tower / Pylon */}
          <path
            d="M46 12 L49 12 L49 45 L46 45 Z"
            fill={darkBlue}
          />
          <path
            d="M43 45 L52 45 L51 49 L44 49 Z"
            fill={darkBlue}
          />

          {/* Tower Peaks / Golden Star Accent */}
          <circle cx="16.5" cy="11" r="2.2" fill={royal} />
          <circle cx="47.5" cy="11" r="2.2" fill={royal} />

          {/* Horizontal Bridge Deck / Roadway */}
          <path
            d="M4 44 H60"
            stroke={darkBlue}
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Arch Pier Support Below Roadway */}
          <path
            d="M18 45 C 24 40, 40 40, 46 45"
            stroke={royalDeep}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      )}

      {/* ── 2. AIRPLANE LOGO ── */}
      {variant === "airplane" && (
        <g>
          {/* Upper / Starboard Wing */}
          <path
            d="M37 23 L10 18 C8.5 17.5 7.5 19 8.5 20.2 L14 26 L26 32 Z"
            fill={royal}
          />

          {/* Lower / Port Wing */}
          <path
            d="M41 27 L32 39 L38 51 C39 52.5 40.5 52.8 41.5 51.5 L46 45 Z"
            fill={royalDeep}
          />

          {/* Vertical Tail Fin */}
          <path
            d="M16 44 L7 37 C6 36.2 5 37.2 5.8 38.2 L11 47 Z"
            fill={royal}
          />

          {/* Horizontal Tail Stabilizer */}
          <path
            d="M13 47 L19 55 C19.8 56 21 55.4 20.5 54.2 L17 45 Z"
            fill={royalDeep}
          />

          {/* Central Aerodynamic Fuselage */}
          <path
            d="M58 6 C56 6 50 10.5 42 18 L19 41 C16 44 14 47 13 50 L11 52 C10.5 52.5 11 53.5 11.8 53 L13.8 51 C16.5 50 19.5 48 22.5 45 L45 22 C53 14 58 8 58 6 Z"
            fill={darkBlue}
          />

          {/* Cockpit Windshield Highlight */}
          <path
            d="M54 9.5 C52.5 11 48 14.5 43 19 L40 16 C45 12 49.5 8.5 51 7.5 L54 9.5 Z"
            fill={lightBlue}
            opacity="0.85"
          />

          {/* Wing Highlight */}
          <path
            d="M37 23 L14 20 L26 32 Z"
            fill="#ffffff"
            opacity="0.18"
          />
        </g>
      )}

      {/* ── 3. PAPER PLANE LOGO ── */}
      {variant === "paperplane" && (
        <g>
          <path d="M58 6 L6 28 L26 36 Z" fill={royal} />
          <path d="M58 6 L26 36 L36 58 Z" fill={royalDeep} />
          <path d="M26 36 L36 58 L28 46 Z" fill={darkBlue} />
        </g>
      )}
    </svg>
  );
}

export default TalentBridgeLogo;
