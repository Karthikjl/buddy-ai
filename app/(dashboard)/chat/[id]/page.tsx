"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Send,
  Sparkles,
  Bot,
  Copy,
  Check,
  RefreshCw,
  Plus,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

interface MessageItem {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
}

interface CharacterInfo {
  id: string;
  name: string;
  avatarUrl: string | null;
  tagline: string;
  mood: string | null;
  relationship: string | null;
  greeting: string;
}

interface ChatSessionData {
  id: string;
  title: string;
  character: CharacterInfo;
  messages: MessageItem[];
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [sessionData, setSessionData] = useState<ChatSessionData | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) {
          throw new Error("Failed to load chat session");
        }
        const data = await res.json();
        setSessionData(data.session);
        setMessages(data.session.messages || []);
      } catch (err: any) {
        setError(err.message || "Failed to load session");
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages.length]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isStreaming) return;

    const userMessageContent = inputText.trim();
    setInputText("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // 1. Optimistically append user message
    const newMessages: MessageItem[] = [
      ...messages,
      { role: "user", content: userMessageContent, createdAt: new Date().toISOString() },
    ];
    setMessages(newMessages);

    // 2. Prepare empty assistant placeholder
    const assistantIndex = newMessages.length;
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", createdAt: new Date().toISOString() },
    ]);

    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: userMessageContent,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to get response");
      }

      if (!res.body) {
        throw new Error("No response stream available");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamedAccumulator = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        streamedAccumulator += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          if (updated[assistantIndex]) {
            updated[assistantIndex] = {
              ...updated[assistantIndex],
              content: streamedAccumulator,
            };
          }
          return updated;
        });

        scrollToBottom("smooth");
      }
    } catch (err: any) {
      console.error("Streaming error:", err);
      setMessages((prev) => {
        const updated = [...prev];
        if (updated[assistantIndex]) {
          updated[assistantIndex] = {
            ...updated[assistantIndex],
            content: `⚠️ Error: ${err.message || "Something went wrong while generating response."}`,
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleStartNewChat = async () => {
    if (!sessionData?.character?.id) return;
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: sessionData.character.id }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/chat/${data.session.id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          height: "100%",
          color: "var(--text-muted)",
          gap: "10px",
        }}
      >
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
        <span style={{ fontSize: "0.9rem", marginLeft: "6px" }}>Connecting to companion...</span>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ color: "#f87171", marginBottom: "12px" }}>Conversation not found</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>{error}</p>
        <Link href="/dashboard" prefetch={false} className="btn-primary">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { character } = sessionData;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        backgroundColor: "var(--bg-main)",
        position: "relative",
      }}
    >
      {/* Top Header Bar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 28px",
          borderBottom: "1px solid var(--border-subtle)",
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(12px)",
          zIndex: 30,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <Link
            href="/dashboard"
            prefetch={false}
            style={{
              padding: "8px",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ArrowLeft size={18} />
          </Link>

          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "14px",
              background: "rgba(255, 255, 255, 0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.6rem",
              position: "relative",
            }}
          >
            {character.avatarUrl || "🤖"}
            <div
              style={{
                position: "absolute",
                bottom: "-2px",
                right: "-2px",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
                border: "2px solid var(--bg-surface)",
              }}
            />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem" }}>
                {character.name}
              </span>
              {character.mood && <span className="badge badge-violet">{character.mood}</span>}
              {character.relationship && (
                <span className="badge badge-cyan" style={{ fontSize: "0.7rem" }}>
                  {character.relationship}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "400px",
              }}
            >
              {character.tagline}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={handleStartNewChat}
            className="btn-secondary"
            title="Start fresh conversation with this character"
            style={{ fontSize: "0.82rem", padding: "6px 14px" }}
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>
        </div>
      </header>

      {/* Messages Scroll Stream Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "920px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={index}
              style={{
                display: "flex",
                flexDirection: isUser ? "row-reverse" : "row",
                alignItems: "flex-start",
                gap: "12px",
                width: "100%",
              }}
            >
              {/* Avatar for assistant */}
              {!isUser && (
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.3rem",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                >
                  {character.avatarUrl || "🤖"}
                </div>
              )}

              {/* Message Bubble */}
              <div
                style={{
                  maxWidth: "76%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isUser ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    padding: "12px 18px",
                    borderRadius: "var(--bubble-radius)",
                    background: isUser ? "var(--bubble-user-bg)" : "var(--bubble-ai-bg)",
                    color: isUser ? "var(--bubble-user-text)" : "var(--bubble-ai-text)",
                    border: isUser ? "none" : "1px solid var(--bubble-ai-border)",
                    boxShadow: isUser
                      ? "0 4px 18px var(--primary-light)"
                      : "0 4px 20px rgba(0, 0, 0, 0.25)",
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    position: "relative",
                  }}
                >
                  {msg.content === "" && isStreaming && index === messages.length - 1 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 0" }}>
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>

                {/* Sub-actions under assistant bubble */}
                {!isUser && msg.content && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "6px",
                      paddingLeft: "4px",
                    }}
                  >
                    <button
                      onClick={() => handleCopy(msg.content, index)}
                      title="Copy response"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.72rem",
                        color: "var(--text-faint)",
                      }}
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check size={12} color="#10b981" />
                          <span style={{ color: "#10b981" }}>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts (if chat is short) */}
      {messages.length <= 2 && (
        <div
          style={{
            maxWidth: "920px",
            width: "100%",
            margin: "0 auto",
            padding: "0 28px 12px 28px",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {[
            "Tell me what's on your mind right now.",
            "What do you think is the secret to staying creative?",
            "Help me brainstorm a cool project idea.",
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => {
                setInputText(prompt);
                if (textareaRef.current) textareaRef.current.focus();
              }}
              style={{
                fontSize: "0.78rem",
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <div
        style={{
          padding: "16px 28px 24px 28px",
          borderTop: "1px solid var(--border-subtle)",
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(12px)",
          zIndex: 20,
        }}
      >
        <form
          onSubmit={handleSendMessage}
          style={{
            maxWidth: "920px",
            margin: "0 auto",
            display: "flex",
            alignItems: "flex-end",
            gap: "12px",
            background: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "8px 12px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${character.name}... (Enter to send, Shift+Enter for newline)`}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-main)",
              fontSize: "0.95rem",
              padding: "8px 6px",
              resize: "none",
              maxHeight: "180px",
              lineHeight: 1.5,
            }}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isStreaming}
            className="btn-primary"
            style={{
              padding: "10px",
              borderRadius: "var(--radius-md)",
              minWidth: "40px",
              height: "40px",
            }}
          >
            <Send size={16} />
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: "8px",
            fontSize: "0.72rem",
            color: "var(--text-faint)",
          }}
        >
          BuddyAi runs private prompts directly with your configured LLM API.
        </div>
      </div>
    </div>
  );
}
