import React from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Sparkles, ArrowRight, Shield, Cpu, MessageSquare, Bot, Zap, HeartHandshake } from "lucide-react";

export default function LandingPage() {
  const characters = [
    {
      name: "Alex",
      role: "Witty Best Friend",
      avatar: "👦",
      mood: "Witty & Sarcastic",
      badgeClass: "badge-violet",
      quote: "Yo! Don't tell me you've been grinding without taking a breath. What's on your mind?",
    },
    {
      name: "Maya",
      role: "Empathetic Mentor",
      avatar: "🌸",
      mood: "Calm & Deep",
      badgeClass: "badge-cyan",
      quote: "Take a gentle breath. Whatever is cluttering your thoughts, let's explore it together.",
    },
    {
      name: "Nova",
      role: "Visionary Collaborator",
      avatar: "✨",
      mood: "Creative Geek",
      badgeClass: "badge-amber",
      quote: "What if we looked at that problem from a whole different angle? Ideas are infinite.",
    },
    {
      name: "Elena",
      role: "Hype Motivator",
      avatar: "⚡",
      mood: "High Energy",
      badgeClass: "badge-emerald",
      quote: "Hey superstar! Ready to conquer the day? Every little step counts!",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      {/* Top Navigation */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 48px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(8, 12, 22, 0.8)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <Logo size={36} withText={true} />

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/login" prefetch={false} className="btn-secondary" style={{ padding: "8px 18px", fontSize: "0.88rem" }}>
            Sign In
          </Link>
          <Link href="/login" prefetch={false} className="btn-primary" style={{ padding: "8px 20px", fontSize: "0.88rem" }}>
            <span>Get Started</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "80px 24px 40px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            backgroundColor: "rgba(99, 102, 241, 0.12)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            color: "#a5b4fc",
            fontSize: "0.85rem",
            fontWeight: 600,
            marginBottom: "24px",
          }}
        >
          <Sparkles size={14} />
          <span>Your Private AI Companion Platform • Bring Your Own Model</span>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.5rem, 6vw, 4.2rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            marginBottom: "20px",
          }}
        >
          The AI Companion You Control.
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 50%, #ec4899 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Tailored Personas. Your Own Keys.
          </span>
        </h1>

        <p
          style={{
            maxWidth: "680px",
            margin: "0 auto 36px auto",
            fontSize: "1.15rem",
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}
        >
          Pick a character or design your own companion. Plug in your OpenAI, OpenRouter,
          Groq, or local Ollama endpoint. Chat with real-time streaming, private SQLite storage,
          and AES-256 encrypted security.
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
          <Link href="/login" prefetch={false} className="btn-primary" style={{ padding: "14px 28px", fontSize: "1rem" }}>
            <span>Enter Companion Realm</span>
            <ArrowRight size={18} />
          </Link>
          <Link href="/characters" prefetch={false} className="btn-secondary" style={{ padding: "14px 24px", fontSize: "1rem" }}>
            <Bot size={18} />
            <span>Meet The Characters</span>
          </Link>
        </div>
      </section>

      {/* Featured Characters Carousel/Grid */}
      <section style={{ maxWidth: "1200px", margin: "40px auto 80px auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 700, marginBottom: "8px" }}>
            Preset Personalities Ready To Chat
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Each crafted with distinctive voice, behavior dynamics, and conversational warmth.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {characters.map((char) => (
            <div
              key={char.name}
              className="glass-panel glass-panel-hover"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ fontSize: "2.4rem" }}>{char.avatar}</div>
                <span className={`badge ${char.badgeClass}`}>{char.mood}</span>
              </div>

              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, marginBottom: "4px" }}>
                {char.name}
              </h3>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                {char.role}
              </div>

              <p
                style={{
                  fontSize: "0.88rem",
                  lineHeight: 1.5,
                  color: "var(--text-main)",
                  fontStyle: "italic",
                  background: "rgba(255,255,255,0.03)",
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  borderLeft: "3px solid var(--primary)",
                  marginBottom: "20px",
                  flex: 1,
                }}
              >
                "{char.quote}"
              </p>

              <Link
                href="/login"
                prefetch={false}
                className="btn-secondary"
                style={{ width: "100%", fontSize: "0.88rem", justifyContent: "center" }}
              >
                <span>Chat with {char.name}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section
        style={{
          borderTop: "1px solid var(--border-subtle)",
          backgroundColor: "rgba(10, 15, 28, 0.6)",
          padding: "70px 24px",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 700, marginBottom: "8px" }}>
              Built Around Privacy, Freedom & Style
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Everything designed to give you ownership of your AI relationships.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            <div className="glass-panel" style={{ padding: "28px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(99, 102, 241, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary)",
                  marginBottom: "16px",
                }}
              >
                <Cpu size={22} />
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "8px" }}>
                Bring-Your-Own-LLM
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                Support for OpenAI, OpenRouter, Groq, DeepSeek, or your local Ollama instance.
                Pay only for your actual token usage at true provider prices.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: "28px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(6, 182, 212, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent)",
                  marginBottom: "16px",
                }}
              >
                <Shield size={22} />
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "8px" }}>
                AES-256 Vault & Local DB
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                Your API keys are encrypted at rest with AES-256-GCM and never exposed to the frontend.
                Your chats are stored locally in your SQLite database.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: "28px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(16, 185, 129, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#10b981",
                  marginBottom: "16px",
                }}
              >
                <Zap size={22} />
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "8px" }}>
                Ultra-Low Latency Streaming
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                Tokens stream in real time as the character speaks. No clunky waiting for full
                paragraphs to finish generating.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "32px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "var(--text-faint)",
          fontSize: "0.85rem",
        }}
      >
        <div>© 2026 BuddyAi. Your Private Companion Platform.</div>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link href="/login" prefetch={false} style={{ color: "var(--text-muted)" }}>Sign In</Link>
          <Link href="/characters" prefetch={false} style={{ color: "var(--text-muted)" }}>Characters</Link>
          <Link href="/settings" prefetch={false} style={{ color: "var(--text-muted)" }}>Settings</Link>
        </div>
      </footer>
    </div>
  );
}
