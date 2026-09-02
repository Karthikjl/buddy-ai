"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Send,
  Sparkles,
  Copy,
  Check,
  Plus,
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  BookmarkPlus,
  Brain,
  Edit2,
  CheckCheck,
  X,
  Trash2,
  Smile,
  HeartHandshake,
} from "lucide-react";
import Link from "next/link";
import MarkdownMessage from "@/components/MarkdownMessage";
import CustomDropdown from "@/components/CustomDropdown";

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
  gender: string;
  greeting: string;
}

interface ChatSessionData {
  id: string;
  title: string;
  activeMood: string | null;
  activeRelationship: string | null;
  character: CharacterInfo;
  messages: MessageItem[];
}

interface CompanionMemoryItem {
  id: string;
  category: string;
  fact: string;
  createdAt: string;
}

const MOOD_OPTIONS = [
  { id: "friendly", label: "Friendly & Warm" },
  { id: "witty", label: "Witty & Sarcastic" },
  { id: "empathetic", label: "Empathetic & Calm" },
  { id: "flirty", label: "Playful & Flirty" },
  { id: "creative", label: "Creative & Visionary" },
  { id: "motivating", label: "High Energy & Hype" },
  { id: "feisty", label: "Bold & Feisty" },
];

const RELATIONSHIP_OPTIONS = [
  { id: "friend", label: "Friend" },
  { id: "best friend", label: "Best Friend" },
  { id: "mentor", label: "Mentor & Advisor" },
  { id: "companion", label: "Companion" },
  { id: "partner", label: "Partner" },
];

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

  // Phase 2 features state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [currentMood, setCurrentMood] = useState("friendly");
  const [currentRelationship, setCurrentRelationship] = useState("friend");
  const [memories, setMemories] = useState<CompanionMemoryItem[]>([]);
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState(false);
  const [newMemoryFact, setNewMemoryFact] = useState("");
  const [newMemoryCategory, setNewMemoryCategory] = useState("fact");
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [rememberedNotice, setRememberedNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const fetchSessionAndMemories = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error("Failed to load chat session");
      const data = await res.json();
      setSessionData(data.session);
      setMessages(data.session.messages || []);
      setTitleInput(data.session.title);
      setCurrentMood(data.session.activeMood || data.session.character.mood || "friendly");
      setCurrentRelationship(data.session.activeRelationship || data.session.character.relationship || "friend");

      // Load memories
      if (data.session.characterId) {
        const memRes = await fetch(`/api/memories?characterId=${data.session.characterId}`);
        if (memRes.ok) {
          const memData = await memRes.json();
          setMemories(memData.memories || []);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) fetchSessionAndMemories();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages.length]);

  // Handle Dynamic Mood Change
  const handleMoodChange = async (newMood: string) => {
    setCurrentMood(newMood);
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeMood: newMood }),
      });
    } catch (err) {
      console.error("Failed to update mood", err);
    }
  };

  // Handle Dynamic Relationship Change
  const handleRelationshipChange = async (newRel: string) => {
    setCurrentRelationship(newRel);
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeRelationship: newRel }),
      });
    } catch (err) {
      console.error("Failed to update relationship", err);
    }
  };

  // Handle Title Rename
  const handleSaveTitle = async () => {
    if (!titleInput.trim() || titleInput === sessionData?.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleInput.trim() }),
      });
      if (res.ok) {
        setSessionData((prev) => (prev ? { ...prev, title: titleInput.trim() } : prev));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEditingTitle(false);
    }
  };

  // Handle Sending Chat Message
  const handleSendMessage = async (e?: React.FormEvent, isRegen = false) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !isRegen) || isStreaming) return;

    const userMessageContent = inputText.trim();
    if (!isRegen) {
      setInputText("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }

    let updatedMessages: MessageItem[] = [...messages];

    if (!isRegen) {
      updatedMessages.push({
        role: "user",
        content: userMessageContent,
        createdAt: new Date().toISOString(),
      });
    } else {
      // If regenerating, pop the last assistant message
      if (updatedMessages.length > 0 && updatedMessages[updatedMessages.length - 1].role === "assistant") {
        updatedMessages.pop();
      }
    }

    const assistantIndex = updatedMessages.length;
    updatedMessages.push({
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    });

    setMessages(updatedMessages);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: isRegen ? undefined : userMessageContent,
          regenerate: isRegen,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to get response");
      }

      if (!res.body) throw new Error("No response stream available");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamedAccumulator = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        streamedAccumulator += chunk;

        setMessages((prev) => {
          const arr = [...prev];
          if (arr[assistantIndex]) {
            arr[assistantIndex] = { ...arr[assistantIndex], content: streamedAccumulator };
          }
          return arr;
        });

        scrollToBottom("smooth");
      }

      // Check if any memories were auto-saved
      if (sessionData?.character?.id) {
        const memRes = await fetch(`/api/memories?characterId=${sessionData.character.id}`);
        if (memRes.ok) {
          const memData = await memRes.json();
          setMemories(memData.memories || []);
        }
      }
    } catch (err: any) {
      console.error("Streaming error:", err);
      setMessages((prev) => {
        const arr = [...prev];
        if (arr[assistantIndex]) {
          arr[assistantIndex] = {
            ...arr[assistantIndex],
            content: `⚠️ Error: ${err.message || "Failed to generate response."}`,
          };
        }
        return arr;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  // Keyboard shortcut Enter / Shift+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Memory Tagging: "Remember this" from chat
  const handleTagAsMemory = async (text: string) => {
    if (!sessionData?.character?.id) return;
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: sessionData.character.id,
          fact: text,
          category: "fact",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMemories((prev) => [data.memory, ...prev]);
        setRememberedNotice(`Saved to ${sessionData.character.name}'s memory bank!`);
        setTimeout(() => setRememberedNotice(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Manual Memory
  const handleAddManualMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryFact.trim() || !sessionData?.character?.id) return;

    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: sessionData.character.id,
          fact: newMemoryFact.trim(),
          category: newMemoryCategory,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMemories((prev) => [data.memory, ...prev]);
        setNewMemoryFact("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Memory
  const handleDeleteMemory = async (id: string) => {
    try {
      const res = await fetch(`/api/memories?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Text-To-Speech (SpeechSynthesis API)
  const handleSpeak = (text: string, index: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`~]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Pick appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((v) =>
      sessionData?.character.gender === "female"
        ? v.name.includes("Female") || v.name.includes("Samantha") || v.name.includes("Zira")
        : v.name.includes("Male") || v.name.includes("David") || v.name.includes("Alex")
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = 1.0;
    utterance.pitch = sessionData?.character.gender === "female" ? 1.05 : 0.95;

    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
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
      {/* Toast Notification for Memory */}
      {rememberedNotice && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            right: "24px",
            zIndex: 100,
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#ffffff",
            padding: "10px 18px",
            borderRadius: "var(--radius-md)",
            fontSize: "0.88rem",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(16, 185, 129, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: "glow-pulse 1.5s ease",
          }}
        >
          <Brain size={16} />
          <span>{rememberedNotice}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 28px",
          borderBottom: "1px solid var(--border-subtle)",
          backgroundColor: "var(--header-bg)",
          backdropFilter: "blur(12px)",
          zIndex: 30,
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* Left: Companion Info & Title */}
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
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "rgba(255, 255, 255, 0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.7rem",
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
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.15rem" }}>
                {character.name}
              </span>

              {/* Title editor */}
              {isEditingTitle ? (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                    autoFocus
                    style={{
                      padding: "2px 8px",
                      fontSize: "0.8rem",
                      borderRadius: "4px",
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--primary)",
                      color: "var(--text-main)",
                      outline: "none",
                    }}
                  />
                  <button onClick={handleSaveTitle} style={{ color: "#10b981" }}>
                    <CheckCheck size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingTitle(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    color: "var(--text-faint)",
                  }}
                  title="Click to rename conversation"
                >
                  <span>({sessionData.title})</span>
                  <Edit2 size={11} />
                </div>
              )}
            </div>

            {/* Dynamic In-Chat Mood & Dynamic Selectors */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              {/* Mood Dropdown */}
              <CustomDropdown
                value={currentMood}
                onChange={handleMoodChange}
                options={MOOD_OPTIONS.map((m) => ({ value: m.id, label: m.label }))}
                icon={<Smile size={13} color="var(--primary)" />}
                variant="primary"
                size="sm"
              />

              {/* Relationship Dropdown */}
              <CustomDropdown
                value={currentRelationship}
                onChange={handleRelationshipChange}
                options={RELATIONSHIP_OPTIONS.map((r) => ({ value: r.id, label: r.label }))}
                icon={<HeartHandshake size={13} color="var(--accent)" />}
                variant="accent"
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Right Actions: Memory Bank, Export, New Chat */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Memory Bank Button */}
          <button
            onClick={() => setIsMemoryDrawerOpen(true)}
            className="btn-secondary"
            title="View Companion Memories"
            style={{ fontSize: "0.82rem", padding: "6px 12px" }}
          >
            <Brain size={14} color="var(--primary)" />
            <span>Memories ({memories.length})</span>
          </button>

          {/* New Chat */}
          <button
            onClick={async () => {
              const res = await fetch("/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ characterId: character.id }),
              });
              if (res.ok) {
                const data = await res.json();
                router.push(`/chat/${data.session.id}`);
              }
            }}
            className="btn-primary"
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
          const isLastAssistant = !isUser && index === messages.length - 1;

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
                    width: "38px",
                    height: "38px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.4rem",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                >
                  {character.avatarUrl || "🤖"}
                </div>
              )}

              {/* Message Bubble & Actions Container */}
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
                    padding: "13px 18px",
                    borderRadius: "var(--bubble-radius)",
                    background: isUser ? "var(--bubble-user-bg)" : "var(--bubble-ai-bg)",
                    color: isUser ? "var(--bubble-user-text)" : "var(--bubble-ai-text)",
                    border: isUser ? "none" : "1px solid var(--bubble-ai-border)",
                    boxShadow: isUser
                      ? "0 4px 18px var(--primary-light)"
                      : "0 4px 20px rgba(0, 0, 0, 0.25)",
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
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
                    <MarkdownMessage content={msg.content} isUser={isUser} />
                  )}
                </div>

                {/* Sub-actions for User Messages */}
                {isUser && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <button
                      onClick={() => handleTagAsMemory(msg.content)}
                      title="Save as memory fact for companion"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.72rem",
                        color: "var(--text-faint)",
                        opacity: 0.7,
                        transition: "opacity 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                    >
                      <BookmarkPlus size={12} color="var(--primary)" />
                      <span>Remember this</span>
                    </button>
                  </div>
                )}

                {/* Sub-actions for Assistant Messages */}
                {!isUser && msg.content && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginTop: "6px",
                      paddingLeft: "4px",
                    }}
                  >
                    {/* Copy */}
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

                    {/* Text to Speech Listen */}
                    <button
                      onClick={() => handleSpeak(msg.content, index)}
                      title={speakingIndex === index ? "Stop voice" : "Listen to companion"}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.72rem",
                        color: speakingIndex === index ? "var(--primary)" : "var(--text-faint)",
                      }}
                    >
                      {speakingIndex === index ? (
                        <>
                          <VolumeX size={12} />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={12} />
                          <span>Listen</span>
                        </>
                      )}
                    </button>

                    {/* Regenerate Response */}
                    {isLastAssistant && !isStreaming && (
                      <button
                        onClick={() => handleSendMessage(undefined, true)}
                        title="Regenerate this response"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.72rem",
                          color: "var(--text-faint)",
                        }}
                      >
                        <RotateCcw size={12} />
                        <span>Regenerate</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
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
            "Remember that I love building open-source tech.",
            "What do you think is the secret to staying creative?",
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
          backgroundColor: "var(--footer-bg)",
          backdropFilter: "blur(12px)",
          zIndex: 20,
        }}
      >
        <form
          onSubmit={(e) => handleSendMessage(e)}
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

      {/* Memory Bank Slide-over Drawer */}
      {isMemoryDrawerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(5, 8, 16, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 100,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "420px",
              height: "100vh",
              borderRadius: "0",
              borderRight: "none",
              borderTop: "none",
              borderBottom: "none",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
                paddingBottom: "12px",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Brain size={20} color="var(--primary)" />
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>
                  {character.name}'s Memory Bank
                </h3>
              </div>
              <button
                onClick={() => setIsMemoryDrawerOpen(false)}
                style={{ color: "var(--text-muted)", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "16px" }}>
              These are the facts and preferences {character.name} remembers about you across all conversations.
            </p>

            {/* Add Memory Form */}
            <form onSubmit={handleAddManualMemory} style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="e.g. Likes black coffee with oat milk"
                  value={newMemoryFact}
                  onChange={(e) => setNewMemoryFact(e.target.value)}
                  className="input-field"
                  style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                />
                <button type="submit" className="btn-primary" style={{ padding: "8px 14px", fontSize: "0.85rem", flexShrink: 0 }}>
                  Add
                </button>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {["fact", "preference", "goal", "habit"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewMemoryCategory(cat)}
                    style={{
                      fontSize: "0.7rem",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-full)",
                      textTransform: "capitalize",
                      background: newMemoryCategory === cat ? "var(--primary-light)" : "rgba(255,255,255,0.04)",
                      border: newMemoryCategory === cat ? "1.5px solid var(--primary)" : "1px solid var(--border-subtle)",
                      color: newMemoryCategory === cat ? "var(--primary)" : "var(--text-muted)",
                      fontWeight: newMemoryCategory === cat ? 700 : 500,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </form>

            {/* Memories List */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
              {memories.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--text-faint)", fontSize: "0.85rem" }}>
                  No memories saved yet. Click "Remember this" on any message or add a custom fact above!
                </div>
              ) : (
                memories.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <span className="badge badge-cyan" style={{ fontSize: "0.68rem", padding: "1px 6px", marginBottom: "4px" }}>
                        {m.category}
                      </span>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-main)", marginTop: "3px" }}>
                        {m.fact}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMemory(m.id)}
                      title="Forget this memory"
                      style={{ color: "var(--text-faint)", padding: "4px", opacity: 0.7 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
