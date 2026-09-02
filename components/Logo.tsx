"use client";

import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  withText?: boolean;
  subtitle?: string;
}

export default function Logo({
  size = 36,
  className = "",
  withText = false,
  subtitle,
}: LogoProps) {
  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "12px",
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: "relative",
          flexShrink: 0,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          width="100%"
          height="100%"
          style={{ overflow: "visible" }}
        >
          <defs>
            <linearGradient id="buddyLogoGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="buddyLogoGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <radialGradient id="buddyLogoBg" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#090d16" />
            </radialGradient>
            <filter id="buddyGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Squircle container */}
          <rect
            width="100"
            height="100"
            rx="26"
            fill="url(#buddyLogoBg)"
          />
          <rect
            width="98"
            height="98"
            x="1"
            y="1"
            rx="25"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.5"
          />

          {/* Intersecting Companion Heart/Infinity Orbit */}
          <path
            d="M 38 28 C 24 28, 16 38, 16 50 C 16 62, 25 72, 38 72 C 45 72, 51 68, 55 62 C 59 68, 65 72, 72 72 C 85 72, 94 62, 94 50 C 94 38, 85 28, 72 28 C 65 28, 59 32, 55 38 C 51 32, 45 28, 38 28 Z"
            fill="none"
            stroke="url(#buddyLogoGrad1)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#buddyGlow)"
          />

          {/* Central Orbit Loop */}
          <ellipse
            cx="50"
            cy="50"
            rx="22"
            ry="24"
            fill="none"
            stroke="url(#buddyLogoGrad2)"
            strokeWidth="5"
            opacity="0.9"
          />

          {/* Smiling AI Face */}
          <circle cx="43" cy="46" r="3.2" fill="#38bdf8" />
          <circle cx="57" cy="46" r="3.2" fill="#38bdf8" />
          <path
            d="M 43 54 Q 50 61, 57 54"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {withText && (
        <div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: `${size * 0.52}px`,
              letterSpacing: "-0.02em",
              background: "linear-gradient(90deg, var(--text-main) 40%, var(--accent) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1.1,
            }}
          >
            BuddyAi
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: `${Math.max(10, size * 0.28)}px`,
                color: "var(--text-faint)",
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
