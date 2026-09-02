"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plus,
  MessageSquare,
  Trash2,
  X,
  Bot,
  Heart,
  Smile,
  Zap,
} from "lucide-react";

interface Character {
  id: string;
  userId: string | null;
  name: string;
  gender: string;
  tagline: string;
  personalityPrompt: string;
  avatarUrl: string | null;
  greeting: string;
  mood: string | null;
  relationship: string | null;
  isDefault: boolean;
}

const AVATAR_OPTIONS = ["👦", "👧", "🌸", "⚡", "✨", "🧠", "🐱", "🦊", "🤖", "🎨", "🚀", "🎭", "🌿", "🔮"];

export default function CharactersPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [filter, setFilter] = useState<"all" | "presets" | "custom">("all");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startingChatId, setStartingChatId] = useState<string | null>(null);

  // Form state for creating character
  const [name, setName] = useState("");
  const [gender, setGender] = useState("neutral");
  const [tagline, setTagline] = useState("");
  const [personalityPrompt, setPersonalityPrompt] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("🤖");
  const [greeting, setGreeting] = useState("");
  const [mood, setMood] = useState("friendly");
  const [relationship, setRelationship] = useState("friend");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCharacters = async () => {
    try {
      const res = await fetch("/api/characters");
      if (res.ok) {
        const data = await res.json();
        setCharacters(data.characters || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStartingChatId(null);
    }
  };

  const handleDeleteCharacter = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const res = await fetch(`/api/characters/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCharacters((prev) => prev.filter((c) => c.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete character");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          gender,
          tagline,
          personalityPrompt,
          avatarUrl,
          greeting: greeting || `Hi! I'm ${name}. Glad to connect with you.`,
          mood,
          relationship,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create character");
      }

      setIsModalOpen(false);
      resetForm();
      await fetchCharacters();

      // Launch chat with the new character immediately!
      if (data.character?.id) {
        handleStartChat(data.character.id);
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to save character");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName("");
    setGender("neutral");
    setTagline("");
    setPersonalityPrompt("");
    setAvatarUrl("🤖");
    setGreeting("");
    setMood("friendly");
    setRelationship("friend");
    setFormError(null);
  };

  const filteredCharacters = characters.filter((c) => {
    if (filter === "presets") return c.isDefault;
    if (filter === "custom") return !c.isDefault;
    return true;
  });

  return (
    <div style={{ padding: "36px 40px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, marginBottom: "6px" }}>
            Companion Characters
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Chat with curated personalities or architect your own custom AI companion.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={16} />
          <span>Create Custom Buddy</span>
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "28px",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "12px",
        }}
      >
        {(["all", "presets", "custom"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.85rem",
              fontWeight: 600,
              textTransform: "capitalize",
              backgroundColor: filter === f ? "var(--primary-light)" : "transparent",
              color: filter === f ? "var(--primary)" : "var(--text-muted)",
              border: filter === f ? "1px solid var(--border-glow)" : "1px solid transparent",
            }}
          >
            {f === "all" ? "All Personalities" : f === "presets" ? "Curated Presets" : "My Custom Companions"}
          </button>
        ))}
      </div>

      {/* Characters Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {filteredCharacters.map((char) => (
          <div
            key={char.id}
            className="glass-panel glass-panel-hover"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            {/* Top row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  fontSize: "2.4rem",
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "var(--primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {char.avatarUrl || "🤖"}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {char.mood && <span className="badge badge-violet">{char.mood}</span>}
                {!char.isDefault && (
                  <button
                    onClick={() => handleDeleteCharacter(char.id, char.name)}
                    title="Delete character"
                    style={{
                      padding: "6px",
                      borderRadius: "6px",
                      color: "var(--text-faint)",
                      background: "rgba(239, 68, 68, 0.1)",
                    }}
                  >
                    <Trash2 size={14} color="#ef4444" />
                  </button>
                )}
              </div>
            </div>

            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "4px" }}>
              {char.name}
            </h3>

            <div
              style={{
                fontSize: "0.78rem",
                color: "var(--text-faint)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "10px",
              }}
            >
              {char.relationship || "Companion"} • {char.gender}
            </div>

            <p
              style={{
                fontSize: "0.88rem",
                color: "var(--text-muted)",
                lineHeight: 1.5,
                marginBottom: "16px",
                flex: 1,
              }}
            >
              {char.tagline}
            </p>

            <div
              style={{
                backgroundColor: "var(--quote-bg, rgba(255, 255, 255, 0.04))",
                padding: "12px 14px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.83rem",
                color: "var(--text-muted)",
                lineHeight: 1.45,
                fontStyle: "italic",
                marginBottom: "20px",
                border: "1px solid var(--border-subtle)",
                borderLeft: "3px solid var(--primary)",
              }}
            >
              "{char.greeting.slice(0, 85)}..."
            </div>

            <button
              onClick={() => handleStartChat(char.id)}
              disabled={startingChatId === char.id}
              className="btn-primary"
              style={{ width: "100%" }}
            >
              <MessageSquare size={15} />
              <span>{startingChatId === char.id ? "Opening..." : "Start Conversation"}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Create Custom Character Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(4, 7, 14, 0.8)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "32px",
              position: "relative",
            }}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                color: "var(--text-muted)",
                padding: "6px",
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <Sparkles size={20} color="var(--primary)" />
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700 }}>
                Design Custom Character
              </h2>
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "24px" }}>
              Define their tone, backstory, avatar, and conversational boundaries.
            </p>

            {formError && (
              <div
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#fca5a5",
                  padding: "10px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.85rem",
                  marginBottom: "20px",
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCharacter} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Avatar Selector */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
                  Pick Avatar Emoji
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setAvatarUrl(emoji)}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        fontSize: "1.4rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: avatarUrl === emoji ? "var(--primary-light)" : "rgba(255,255,255,0.05)",
                        border: avatarUrl === emoji ? "2px solid var(--primary)" : "1px solid var(--border-subtle)",
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Gender */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                    Companion Name
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Liam, Zephyr, Chloe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                    Gender
                  </label>
                  <select
                    className="input-field"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="neutral">Neutral / Other</option>
                  </select>
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                  Short Tagline
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Sarcastic coding partner with a heart of gold"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>

              {/* Mood & Relationship */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                    Default Mood
                  </label>
                  <select
                    className="input-field"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                  >
                    <option value="friendly">Friendly & Warm</option>
                    <option value="witty">Witty & Sarcastic</option>
                    <option value="empathetic">Empathetic & Calm</option>
                    <option value="flirty">Playful & Flirty</option>
                    <option value="creative">Creative & Visionary</option>
                    <option value="motivating">High Energy & Motivating</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                    Relationship Dynamic
                  </label>
                  <select
                    className="input-field"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                  >
                    <option value="friend">Friend</option>
                    <option value="best friend">Best Friend</option>
                    <option value="mentor">Mentor & Advisor</option>
                    <option value="partner">Companion / Partner</option>
                    <option value="assistant">Personal Assistant</option>
                  </select>
                </div>
              </div>

              {/* Initial Greeting */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                  Opening Greeting
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Hey! I just sat down with my coffee. What are we tackling today?"
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                />
              </div>

              {/* System Persona Prompt */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                  System Persona Prompt (Behavior, Voice & Rules)
                </label>
                <textarea
                  required
                  rows={5}
                  className="input-field"
                  style={{ resize: "vertical" }}
                  placeholder="You are [Name], a [relationship] who speaks with [tone]...
- Tone and slang: ...
- Boundaries: ...
- Conversational style: ..."
                  value={personalityPrompt}
                  onChange={(e) => setPersonalityPrompt(e.target.value)}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                >
                  <Sparkles size={16} />
                  <span>{saving ? "Creating..." : "Save & Launch Chat"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
