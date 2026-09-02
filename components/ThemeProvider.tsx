"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  fontStyle: string;
  setFontStyle: (font: string) => void;
  bubbleStyle: string;
  setBubbleStyle: (style: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "midnight",
  setTheme: () => {},
  fontStyle: "sans",
  setFontStyle: () => {},
  bubbleStyle: "modern",
  setBubbleStyle: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<string>("midnight");
  const [fontStyle, setFontStyleState] = useState<string>("sans");
  const [bubbleStyle, setBubbleStyleState] = useState<string>("modern");

  useEffect(() => {
    // Check saved in localStorage or from API
    const savedTheme = localStorage.getItem("buddyai_theme") || "midnight";
    const savedFont = localStorage.getItem("buddyai_font") || "sans";
    const savedBubble = localStorage.getItem("buddyai_bubble") || "modern";

    setThemeState(savedTheme);
    setFontStyleState(savedFont);
    setBubbleStyleState(savedBubble);

    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.setAttribute("data-font", savedFont);
    document.documentElement.setAttribute("data-bubble", savedBubble);
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

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        fontStyle,
        setFontStyle,
        bubbleStyle,
        setBubbleStyle,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
