import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "BuddyAi - Your Personal AI Companion Platform",
  description:
    "Create custom companion personalities, bring your own LLM API keys (OpenAI, OpenRouter, Groq, Ollama), and chat in a private, high-fidelity experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="midnight" data-font="sans" data-bubble="modern">
      <body>
        <SessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
