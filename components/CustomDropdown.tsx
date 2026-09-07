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
  variant?: "primary" | "accent" | "surface" | "form";
  labelPrefix?: string;
  triggerLabel?: string;
  className?: string;
  align?: "left" | "right";
  fullWidth?: boolean;
  disabled?: boolean;
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
  fullWidth = false,
  disabled = false,
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
    if (variant === "form") {
      return {
        bg: "var(--bg-input)",
        border: "1px solid var(--border-subtle)",
        text: "var(--text-main)",
        borderRadius: "var(--radius-md)",
        padding: "10px 14px",
        activeGlow: "0 0 0 3px var(--primary-light)",
      };
    }
    if (variant === "accent") {
      return {
        bg: "var(--accent-light)",
        border: "1px solid var(--border-subtle)",
        text: "var(--accent)",
        borderRadius: "var(--radius-full)",
        padding: "4px 10px",
        activeGlow: "0 0 12px var(--accent-light)",
      };
    }
    if (variant === "surface") {
      return {
        bg: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        text: "var(--text-main)",
        borderRadius: "var(--radius-md)",
        padding: "6px 12px",
        activeGlow: "0 2px 10px rgba(0,0,0,0.06)",
      };
    }
    // Default primary
    return {
      bg: "var(--primary-light)",
      border: "1px solid var(--border-glow)",
      text: "var(--primary)",
      borderRadius: "var(--radius-full)",
      padding: "4px 10px",
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
        display: fullWidth ? "block" : "inline-block",
        width: fullWidth ? "100%" : "auto",
        userSelect: "none",
        zIndex: isOpen ? 50 : 1,
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: fullWidth ? "space-between" : "flex-start",
          width: fullWidth ? "100%" : "auto",
          gap: isSm ? "6px" : "8px",
          padding: vStyles.padding,
          borderRadius: vStyles.borderRadius,
          backgroundColor: vStyles.bg,
          border: vStyles.border,
          color: disabled ? "var(--text-faint)" : vStyles.text,
          fontSize: isSm ? "0.82rem" : "0.9rem",
          fontWeight: 600,
          cursor: disabled ? "not-allowed" : "pointer",
          outline: "none",
          transition: "all 0.18s ease",
          boxShadow: isOpen ? vStyles.activeGlow : "none",
          opacity: disabled ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = fullWidth ? "none" : "translateY(-1px)";
            e.currentTarget.style.filter = "brightness(1.04)";
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.filter = "brightness(1)";
          }
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
          {selectedOption?.icon || icon ? (
            <span style={{ display: "flex", alignItems: "center" }}>
              {selectedOption?.icon || icon}
            </span>
          ) : null}
          <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
            {labelPrefix && (
              <span style={{ opacity: 0.7, fontWeight: 500, marginRight: "4px" }}>
                {labelPrefix}
              </span>
            )}
            {triggerLabel || (selectedOption ? selectedOption.label : "Select...")}
          </span>
        </div>
        <ChevronDown
          size={isSm ? 13 : 15}
          style={{
            transition: "transform 0.2s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            opacity: 0.8,
            marginLeft: "6px",
            flexShrink: 0,
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
            minWidth: fullWidth ? "100%" : isSm ? "170px" : "200px",
            width: fullWidth ? "100%" : "auto",
            maxHeight: "260px",
            overflowY: "auto",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            boxShadow:
              "0 14px 36px rgba(0, 0, 0, 0.22), 0 4px 12px rgba(0,0,0,0.08)",
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
