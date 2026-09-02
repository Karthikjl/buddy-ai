"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  icon?: React.ReactNode;
  size?: "sm" | "md";
  variant?: "primary" | "accent" | "surface";
  labelPrefix?: string;
  triggerLabel?: string;
  className?: string;
  align?: "left" | "right";
}

export default function CustomDropdown({
  value,
  onChange,
  options,
  icon,
  size = "sm",
  variant = "primary",
  labelPrefix,
  triggerLabel,
  className = "",
  align = "left",
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Color variants
  const getVariantStyles = () => {
    if (variant === "accent") {
      return {
        bg: "var(--accent-light)",
        border: "1px solid var(--border-subtle)",
        text: "var(--accent)",
        activeGlow: "0 0 12px var(--accent-light)",
      };
    }
    if (variant === "surface") {
      return {
        bg: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        text: "var(--text-main)",
        activeGlow: "0 2px 10px rgba(0,0,0,0.06)",
      };
    }
    // Default primary
    return {
      bg: "var(--primary-light)",
      border: "1px solid var(--border-glow)",
      text: "var(--primary)",
      activeGlow: "0 0 12px var(--primary-light)",
    };
  };

  const vStyles = getVariantStyles();
  const isSm = size === "sm";

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        userSelect: "none",
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: isSm ? "6px" : "8px",
          padding: isSm ? "4px 10px" : "8px 14px",
          borderRadius: "var(--radius-full)",
          backgroundColor: vStyles.bg,
          border: vStyles.border,
          color: vStyles.text,
          fontSize: isSm ? "0.76rem" : "0.86rem",
          fontWeight: 600,
          cursor: "pointer",
          outline: "none",
          transition: "all 0.18s ease",
          boxShadow: isOpen ? vStyles.activeGlow : "none",
          backdropFilter: "blur(8px)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.filter = "brightness(1.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.filter = "brightness(1)";
        }}
      >
        {icon && (
          <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>
        )}
        <span>
          {labelPrefix && (
            <span style={{ opacity: 0.7, fontWeight: 500, marginRight: "4px" }}>
              {labelPrefix}
            </span>
          )}
          {triggerLabel || (selectedOption ? selectedOption.label : "Select...")}
        </span>
        <ChevronDown
          size={isSm ? 12 : 14}
          style={{
            transition: "transform 0.2s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            opacity: 0.8,
            marginLeft: "2px",
          }}
        />
      </button>

      {/* Floating Popover Options Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            [align === "right" ? "right" : "left"]: 0,
            zIndex: 9999,
            minWidth: isSm ? "170px" : "200px",
            maxHeight: "260px",
            overflowY: "auto",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            boxShadow:
              "0 12px 36px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0,0,0,0.08)",
            padding: "6px",
            backdropFilter: "blur(20px)",
            animation: "dropdownFadeIn 0.15s ease",
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: isSm ? "0.78rem" : "0.85rem",
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? "var(--primary)" : "var(--text-main)",
                  backgroundColor: isSelected
                    ? "var(--primary-light)"
                    : "transparent",
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor =
                      "var(--bg-card-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    overflow: "hidden",
                  }}
                >
                  {option.icon && <span>{option.icon}</span>}
                  <div>
                    <div>{option.label}</div>
                    {option.description && (
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          fontWeight: 400,
                        }}
                      >
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <Check size={14} color="var(--primary)" strokeWidth={2.5} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
