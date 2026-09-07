"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface ThemeSaveResult {
  success: boolean;
  savedLocallyOnly?: boolean;
  message: string;
}

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  fontStyle: string;
  setFontStyle: (font: string) => void;
  bubbleStyle: string;
  setBubbleStyle: (style: string) => void;
  savePreferences: (
    newTheme?: string,
    newFont?: string,
    newBubble?: string
  ) => Promise<ThemeSaveResult>;
  isSavingPreferences: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "pearl",
  setTheme: () => {},
  fontStyle: "sans",
  setFontStyle: () => {},
  bubbleStyle: "modern",
  setBubbleStyle: () => {},
  savePreferences: async () => ({ success: true, message: "Default preference" }),
  isSavingPreferences: false,
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<string>("pearl");
  const [fontStyle, setFontStyleState] = useState<string>("sans");
  const [bubbleStyle, setBubbleStyleState] = useState<string>("modern");
  const [isSavingPreferences, setIsSavingPreferences] = useState<boolean>(false);

  useEffect(() => {
    // 1. Initial hydration from localStorage
    const savedTheme = localStorage.getItem("buddyai_theme") || "pearl";
    const savedFont = localStorage.getItem("buddyai_font") || "sans";
    const savedBubble = localStorage.getItem("buddyai_bubble") || "modern";

    setThemeState(savedTheme);
    setFontStyleState(savedFont);
    setBubbleStyleState(savedBubble);

    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.setAttribute("data-font", savedFont);
    document.documentElement.setAttribute("data-bubble", savedBubble);

    // 2. Fetch server preferences if authenticated to sync cross-device
    fetch("/api/preferences")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.preferences) {
          const sTheme = data.preferences.theme || "pearl";
          const sFont = data.preferences.fontStyle || "sans";
          const sBubble = data.preferences.bubbleStyle || "modern";

          const hasLocalTheme = localStorage.getItem("buddyai_theme");
          if (!hasLocalTheme) {
            setThemeState(sTheme);
            setFontStyleState(sFont);
            setBubbleStyleState(sBubble);

            localStorage.setItem("buddyai_theme", sTheme);
            localStorage.setItem("buddyai_font", sFont);
            localStorage.setItem("buddyai_bubble", sBubble);

            document.documentElement.setAttribute("data-theme", sTheme);
            document.documentElement.setAttribute("data-font", sFont);
            document.documentElement.setAttribute("data-bubble", sBubble);
          }
        }
      })
      .catch(() => {});
  }, []);

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem("buddyai_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const setFontStyle = (newFont: string) => {
    setFontStyleState(newFont);
    localStorage.setItem("buddyai_font", newFont);
    document.documentElement.setAttribute("data-font", newFont);
  };

  const setBubbleStyle = (newBubble: string) => {
    setBubbleStyleState(newBubble);
    localStorage.setItem("buddyai_bubble", newBubble);
    document.documentElement.setAttribute("data-bubble", newBubble);
  };

  const savePreferences = async (
    newTheme?: string,
    newFont?: string,
    newBubble?: string
  ): Promise<ThemeSaveResult> => {
    const t = newTheme ?? theme;
    const f = newFont ?? fontStyle;
    const b = newBubble ?? bubbleStyle;

    setIsSavingPreferences(true);

    // 1. Immediately apply locally
    setThemeState(t);
    setFontStyleState(f);
    setBubbleStyleState(b);

    localStorage.setItem("buddyai_theme", t);
    localStorage.setItem("buddyai_font", f);
    localStorage.setItem("buddyai_bubble", b);

    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.setAttribute("data-font", f);
    document.documentElement.setAttribute("data-bubble", b);

    // 2. Persist to cloud backend
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: t,
          fontStyle: f,
          bubbleStyle: b,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          return {
            success: true,
            savedLocallyOnly: true,
            message: "Theme preferences saved to this browser. Sign in to sync across devices.",
          };
        }
        const data = await res.json().catch(() => ({}));
        return {
          success: false,
          message: data.error || "Failed to sync preferences to cloud.",
        };
      }

      return {
        success: true,
        savedLocallyOnly: false,
        message: "Theme and appearance preferences saved to your account!",
      };
    } catch {
      return {
        success: true,
        savedLocallyOnly: true,
        message: "Preferences saved to your local browser storage.",
      };
    } finally {
      setIsSavingPreferences(false);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        fontStyle,
        setFontStyle,
        bubbleStyle,
        setBubbleStyle,
        savePreferences,
        isSavingPreferences,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
