"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  KeyRound,
  MessageSquare,
  Plus,
  ArrowRight,
  ShieldAlert,
  Bot,
  Zap,
  CheckCircle2,
} from "lucide-react";

interface Character {
  id: string;
  name: string;
  gender: string;
  tagline: string;
  avatarUrl: string | null;
  greeting: string;
  mood: string | null;
  relationship: string | null;
  isDefault: boolean;
}

interface ApiKeyInfo {
  id: string;
  provider: string;
  label: string;
  maskedKey: string;
  model: string;
  isActive: boolean;
}

interface ChatSessionItem {
  id: string;
  title: string;
  character: {
    name: string;
    avatarUrl: string | null;
    mood: string | null;
  };
  messages: {
    content: string;
    createdAt: string;
  }[];
  updatedAt: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeKey, setActiveKey] = useState<ApiKeyInfo | null>(null);
  const [recentSessions, setRecentSessions] = useState<ChatSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingChatId, setStartingChatId] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [charsRes, keysRes, sessRes] = await Promise.all([
          fetch("/api/characters"),
          fetch("/api/keys"),
          fetch("/api/sessions"),
        ]);

        if (charsRes.ok) {
          const cData = await charsRes.json();
          setCharacters(cData.characters || []);
        }

        if (keysRes.ok) {
          const kData = await keysRes.json();
          const active = (kData.keys || []).find((k: ApiKeyInfo) => k.isActive);
          setActiveKey(active || null);
        }

        if (sessRes.ok) {
          const sData = await sessRes.json();
          setRecentSessions(sData.sessions || []);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleStartChat = async (characterId: string) => {
    setStartingChatId(characterId);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/chat/${data.session.id}`);
      } else {
        alert("Failed to start chat session");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStartingChatId(null);
    }
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div className="pulsing-status" />
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700 }}>
              Hey, {session?.user?.name || "Buddy"}!
            </h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Choose a companion to talk with or configure your AI intelligence keys.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/characters" prefetch={false} className="btn-secondary">
            <Bot size={16} />
            <span>Browse All Buddies</span>
          </Link>
          <Link href="/settings" prefetch={false} className="btn-primary">
            <KeyRound size={16} />
            <span>LLM Keys</span>
          </Link>
        </div>
      </div>

      {/* API Key Status Notice */}
      {loading ? (
        <div
          className="glass-panel"
          style={{
            padding: "16px 24px",
            marginBottom: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div className="skeleton" style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
            <div className="skeleton" style={{ width: "240px", height: "18px" }} />
          </div>
          <div className="skeleton" style={{ width: "130px", height: "16px" }} />
        </div>
      ) : !activeKey ? (
        <div
          className="glass-panel"
          style={{
            padding: "20px 24px",
            marginBottom: "32px",
            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)",
            borderColor: "rgba(245, 158, 11, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                backgroundColor: "rgba(245, 158, 11, 0.2)",
                color: "#f59e0b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#fde68a" }}>
                No Active LLM API Key Configured
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Plug in your OpenAI, OpenRouter, Groq, or Ollama endpoint to experience real streaming intelligence.
              </div>
            </div>
          </div>
          <Link
            href="/settings"
            prefetch={false}
            className="btn-primary"
            style={{
              background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
              fontSize: "0.85rem",
              padding: "8px 16px",
            }}
          >
            <span>Set Up API Key</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div
          className="glass-panel"
          style={{
            padding: "16px 24px",
            marginBottom: "32px",
            borderColor: "rgba(16, 185, 129, 0.3)",
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <CheckCircle2 size={20} color="#10b981" />
            <div style={{ fontSize: "0.9rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Active Provider: </span>
              <strong style={{ color: "var(--text-main)", textTransform: "capitalize" }}>{activeKey.provider}</strong>
              <span style={{ margin: "0 8px", color: "var(--border-subtle)" }}>•</span>
              <span style={{ color: "var(--text-muted)" }}>Model: </span>
              <span className="badge badge-cyan">{activeKey.model}</span>
            </div>
          </div>
          <Link
            href="/settings"
            prefetch={false}
            style={{ fontSize: "0.82rem", color: "var(--primary)", fontWeight: 600 }}
          >
            Switch or Test Keys →
          </Link>
        </div>
      )}

      {/* Quick Launch Companion Grid */}
      <div style={{ marginBottom: "40px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "18px",
          }}
        >
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 700 }}>
            Companion Personalities
          </h2>
          <Link
            href="/characters"
            prefetch={false}
            style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "18px",
          }}
        >
          {loading ? (
            [1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="glass-panel"
                style={{
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div className="skeleton" style={{ width: "48px", height: "48px", borderRadius: "14px" }} />
                  <div className="skeleton" style={{ width: "64px", height: "20px", borderRadius: "999px" }} />
                </div>
                <div className="skeleton" style={{ width: "110px", height: "18px" }} />
                <div className="skeleton" style={{ width: "100%", height: "36px" }} />
                <div className="skeleton" style={{ width: "100%", height: "36px", borderRadius: "var(--radius-md)", marginTop: "auto" }} />
              </div>
            ))
          ) : (
            characters.slice(0, 4).map((char) => (
            <div
              key={char.id}
              className="glass-panel glass-panel-hover"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                cursor: "pointer",
              }}
              onClick={() => handleStartChat(char.id)}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <div style={{ fontSize: "2.2rem" }}>{char.avatarUrl || "🤖"}</div>
                {char.mood && <span className="badge badge-violet">{char.mood}</span>}
              </div>

              <div style={{ fontWeight: 700, fontSize: "1.15rem", marginBottom: "4px" }}>
                {char.name}
              </div>

              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.4,
                  marginBottom: "16px",
                  flex: 1,
                }}
              >
                {char.tagline}
              </div>

              <button
                disabled={startingChatId === char.id}
                className="btn-primary"
                style={{ width: "100%", fontSize: "0.85rem", padding: "8px" }}
              >
                <MessageSquare size={14} />
                <span>{startingChatId === char.id ? "Launching..." : `Chat with ${char.name}`}</span>
              </button>
            </div>
          ))
        )}

          {/* Create Custom Character Card */}
          <Link
            href="/characters"
            prefetch={false}
            className="glass-panel glass-panel-hover"
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              borderStyle: "dashed",
              borderColor: "var(--border-subtle)",
              minHeight: "200px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(99, 102, 241, 0.15)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "12px",
              }}
            >
              <Plus size={24} />
            </div>
            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "4px" }}>
              Design Custom Buddy
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Define personality, greeting & dynamic
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Conversations List */}
      <div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.3rem",
            fontWeight: 700,
            marginBottom: "18px",
          }}
        >
          Recent Conversations
        </h2>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1, 2].map((i) => (
              <div
                key={i}
                className="glass-panel"
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div className="skeleton" style={{ width: "42px", height: "42px", borderRadius: "50%" }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div className="skeleton" style={{ width: "160px", height: "16px" }} />
                  <div className="skeleton" style={{ width: "240px", height: "12px" }} />
                </div>
              </div>
            ))}
          </div>
        ) : recentSessions.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: "36px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "0.9rem",
            }}
          >
            <MessageSquare size={32} style={{ margin: "0 auto 12px auto", opacity: 0.4 }} />
            <div>No conversation history yet.</div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-faint)", marginTop: "4px" }}>
              Pick any companion above to start your first private chat session!
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recentSessions.map((sess) => (
              <Link
                key={sess.id}
                href={`/chat/${sess.id}`}
                prefetch={false}
                className="glass-panel glass-panel-hover"
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px", overflow: "hidden" }}>
                  <div style={{ fontSize: "1.8rem" }}>
                    {sess.character?.avatarUrl || "🤖"}
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                        {sess.character?.name || sess.title}
                      </span>
                      {sess.character?.mood && (
                        <span className="badge badge-violet" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                          {sess.character.mood}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "600px",
                        marginTop: "2px",
                      }}
                    >
                      {sess.messages?.[0]?.content || "Conversation started"}
                    </div>
                  </div>
                </div>

                <div
                  className="btn-secondary"
                  style={{
                    fontSize: "0.82rem",
                    padding: "6px 14px",
                    flexShrink: 0,
                  }}
                >
                  <span>Continue</span>
                  <ArrowRight size={13} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
