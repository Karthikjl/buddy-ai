import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "BuddyAi - Your Personal AI Companion Platform",
  description:
    "Create custom companion personalities, bring your own LLM API keys (OpenAI, OpenRouter, Groq, Ollama), and chat in a private, high-fidelity experience.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('buddyai_theme') || 'pearl';
                  var f = localStorage.getItem('buddyai_font') || 'sans';
                  var b = localStorage.getItem('buddyai_bubble') || 'modern';
                  document.documentElement.setAttribute('data-theme', t);
                  document.documentElement.setAttribute('data-font', f);
                  document.documentElement.setAttribute('data-bubble', b);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <SessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
