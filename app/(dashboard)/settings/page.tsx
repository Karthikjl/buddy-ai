"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import {
  KeyRound,
  Paintbrush,
  Check,
  ShieldCheck,
  Zap,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Cpu,
} from "lucide-react";

interface ApiKeyInfo {
  id: string;
  provider: string;
  label: string;
  baseUrl: string;
  maskedKey: string;
  model: string;
  isActive: boolean;
  createdAt: string;
}

const PROVIDER_PRESETS = [
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    models: [
      "meta-llama/llama-3.3-70b-instruct",
      "deepseek/deepseek-chat",
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o-mini",
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
  },
  {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    models: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"],
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    baseUrl: "http://localhost:11434/v1",
    models: ["llama3", "mistral", "qwen2.5"],
  },
  {
    id: "custom",
    name: "Custom OpenAI-Compatible",
    baseUrl: "https://api.together.xyz/v1",
    models: ["meta-llama/Llama-3-70b-chat-hf"],
  },
];

export default function SettingsPage() {
  const { theme, setTheme, fontStyle, setFontStyle, bubbleStyle, setBubbleStyle } = useTheme();

  const [activeTab, setActiveTab] = useState<"keys" | "appearance">("keys");
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);

  // Key form state
  const [selectedPreset, setSelectedPreset] = useState("openrouter");
  const [provider, setProvider] = useState("openrouter");
  const [label, setLabel] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://openrouter.ai/api/v1");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("meta-llama/llama-3.3-70b-instruct");

  // Feedback states
  const [testStatus, setTestStatus] = useState<{ loading: boolean; message?: string; error?: boolean } | null>(null);
  const [savingKey, setSavingKey] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = PROVIDER_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setProvider(preset.id);
      setBaseUrl(preset.baseUrl);
      setModel(preset.models[0]);
      setLabel(`${preset.name}`);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus({ loading: true });
    setActionNotice(null);

    try {
      const res = await fetch("/api/keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, apiKey, model }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTestStatus({ loading: false, message: data.error || "Connection test failed", error: true });
      } else {
        setTestStatus({ loading: false, message: "Connection successful!", error: false });
      }
    } catch (err: any) {
      setTestStatus({ loading: false, message: err.message, error: true });
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey(true);
    setActionNotice(null);

    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          label: label || `${provider} (${model})`,
          baseUrl,
          apiKey,
          model,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save API key");
      }

      setActionNotice({ type: "success", text: "Key saved and activated securely!" });
      setApiKey("");
      await fetchKeys();
    } catch (err: any) {
      setActionNotice({ type: "error", text: err.message || "Failed to store key" });
    } finally {
      setSavingKey(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      const res = await fetch(`/api/keys?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchKeys();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetActiveKey = async (id: string) => {
    try {
      const res = await fetch("/api/keys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, makeActive: true }),
      });
      if (res.ok) {
        await fetchKeys();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, marginBottom: "6px" }}>
          Settings & BYO-Model Keys
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Configure your LLM endpoints with AES-256 encryption or customize your aesthetic experience.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "12px",
          marginBottom: "28px",
        }}
      >
        <button
          onClick={() => setActiveTab("keys")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.9rem",
            fontWeight: 600,
            backgroundColor: activeTab === "keys" ? "var(--primary-light)" : "transparent",
            color: activeTab === "keys" ? "var(--primary)" : "var(--text-muted)",
            border: activeTab === "keys" ? "1px solid var(--border-glow)" : "1px solid transparent",
          }}
        >
          <KeyRound size={16} />
          <span>LLM API Keys</span>
        </button>

        <button
          onClick={() => setActiveTab("appearance")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.9rem",
            fontWeight: 600,
            backgroundColor: activeTab === "appearance" ? "var(--primary-light)" : "transparent",
            color: activeTab === "appearance" ? "var(--primary)" : "var(--text-muted)",
            border: activeTab === "appearance" ? "1px solid var(--border-glow)" : "1px solid transparent",
          }}
        >
          <Paintbrush size={16} />
          <span>Appearance & Themes</span>
        </button>
      </div>

      {/* Tab 1: API Keys */}
      {activeTab === "keys" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* Action Notice */}
          {actionNotice && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor:
                  actionNotice.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                border:
                  actionNotice.type === "success"
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : "1px solid rgba(239, 68, 68, 0.3)",
                color: actionNotice.type === "success" ? "#6ee7b7" : "#fca5a5",
                fontSize: "0.9rem",
              }}
            >
              {actionNotice.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{actionNotice.text}</span>
            </div>
          )}

          {/* Add New Key Form Card */}
          <div className="glass-panel" style={{ padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Zap size={20} color="var(--primary)" />
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Connect an LLM Provider</h2>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "20px" }}>
              BuddyAi works with any OpenAI-compatible API. Select a preset or supply your own custom endpoint.
            </p>

            {/* Provider presets */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
              {PROVIDER_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetSelect(p.id)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    background: selectedPreset === p.id ? "var(--primary-light)" : "rgba(255,255,255,0.04)",
                    border: selectedPreset === p.id ? "1.5px solid var(--primary)" : "1px solid var(--border-subtle)",
                    color: selectedPreset === p.id ? "var(--primary)" : "var(--text-muted)",
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveKey} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                    Provider Name / Key Label
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. OpenRouter Llama 3"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                    Base URL (OpenAI-compatible)
                  </label>
                  <input
                    type="url"
                    required
                    className="input-field"
                    placeholder="https://openrouter.ai/api/v1"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                    API Key
                  </label>
                  <input
                    type="password"
                    required={provider !== "ollama"}
                    className="input-field"
                    placeholder={provider === "ollama" ? "Optional for local Ollama" : "sk-..."}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                    Model Identifier
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. meta-llama/llama-3.3-70b-instruct"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
              </div>

              {/* Test status banner if present */}
              {testStatus && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.85rem",
                    backgroundColor: testStatus.error ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                    color: testStatus.error ? "#fca5a5" : "#6ee7b7",
                    border: `1px solid ${testStatus.error ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
                  }}
                >
                  {testStatus.loading ? "Testing endpoint connectivity..." : testStatus.message}
                </div>
              )}

              {/* Form Buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testStatus?.loading || !baseUrl || !model}
                  className="btn-secondary"
                  style={{ fontSize: "0.85rem" }}
                >
                  <Cpu size={14} />
                  <span>{testStatus?.loading ? "Testing..." : "Test Connection"}</span>
                </button>

                <button
                  type="submit"
                  disabled={savingKey}
                  className="btn-primary"
                >
                  <ShieldCheck size={16} />
                  <span>{savingKey ? "Encrypting & Saving..." : "Save & Activate Key"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Saved Keys List */}
          <div className="glass-panel" style={{ padding: "28px" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "16px" }}>
              Stored API Keys (Encrypted)
            </h2>

            {keys.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "0.88rem", padding: "12px 0" }}>
                No API keys stored yet. Add one above to begin streaming conversations with your companions.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {keys.map((k) => (
                  <div
                    key={k.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 18px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: k.isActive ? "rgba(99, 102, 241, 0.1)" : "rgba(255, 255, 255, 0.03)",
                      border: k.isActive ? "1px solid var(--border-glow)" : "1px solid var(--border-subtle)",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{k.label}</span>
                        {k.isActive && <span className="badge badge-emerald">Active</span>}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "3px" }}>
                        <span>Model: <strong>{k.model}</strong></span> • <span>Key: <code>{k.maskedKey}</code></span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {!k.isActive && (
                        <button
                          onClick={() => handleSetActiveKey(k.id)}
                          className="btn-secondary"
                          style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                        >
                          Make Active
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteKey(k.id)}
                        title="Delete key"
                        style={{
                          padding: "8px",
                          borderRadius: "6px",
                          background: "rgba(239, 68, 68, 0.1)",
                          color: "#ef4444",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Appearance */}
      {activeTab === "appearance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* Theme Palette */}
          <div className="glass-panel" style={{ padding: "28px" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>
              Theme Aesthetics
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "20px" }}>
              Tailor the color palette of your companion workspace.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
              {[
                {
                  id: "pearl",
                  name: "Pure Pearl White",
                  mode: "Clean Light",
                  bg: "#f8fafc",
                  cardBg: "#ffffff",
                  userBubble: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
                  aiBubble: "#ffffff",
                  accent: "#4f46e5",
                  isLight: true,
                },
                {
                  id: "midnight",
                  name: "Midnight Navy",
                  mode: "Default Dark",
                  bg: "#080c16",
                  cardBg: "#0f172a",
                  userBubble: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  aiBubble: "rgba(26, 36, 61, 0.9)",
                  accent: "#6366f1",
                  isLight: false,
                },
                {
                  id: "obsidian",
                  name: "Cyber Obsidian",
                  mode: "OLED Black",
                  bg: "#050608",
                  cardBg: "#0c0e12",
                  userBubble: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
                  aiBubble: "rgba(20, 24, 34, 0.9)",
                  accent: "#06b6d4",
                  isLight: false,
                },
                {
                  id: "amethyst",
                  name: "Neon Amethyst",
                  mode: "Purple Dream",
                  bg: "#0b0614",
                  cardBg: "#140b22",
                  userBubble: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                  aiBubble: "rgba(36, 21, 61, 0.9)",
                  accent: "#a855f7",
                  isLight: false,
                },
                {
                  id: "emerald",
                  name: "Aurora Emerald",
                  mode: "Cyber Forest",
                  bg: "#05100d",
                  cardBg: "#0a1b16",
                  userBubble: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  aiBubble: "rgba(18, 44, 36, 0.9)",
                  accent: "#10b981",
                  isLight: false,
                },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--bg-card)",
                    border: theme === t.id ? `2px solid ${t.accent}` : "1px solid var(--border-subtle)",
                    boxShadow: theme === t.id ? `0 0 18px ${t.accent}30` : "none",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Mini Preview Window */}
                  <div
                    style={{
                      width: "100%",
                      height: "64px",
                      borderRadius: "8px",
                      backgroundColor: t.bg,
                      border: `1px solid ${t.isLight ? "#e2e8f0" : "rgba(255,255,255,0.1)"}`,
                      padding: "8px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: t.accent }} />
                        <div style={{ width: "22px", height: "5px", borderRadius: "3px", backgroundColor: t.isLight ? "#cbd5e1" : "rgba(255,255,255,0.2)" }} />
                      </div>
                      <div
                        style={{
                          width: "32px",
                          height: "11px",
                          borderRadius: "4px",
                          background: t.userBubble,
                        }}
                      />
                    </div>

                    <div
                      style={{
                        width: "68%",
                        height: "12px",
                        borderRadius: "4px",
                        backgroundColor: t.aiBubble,
                        border: `1px solid ${t.isLight ? "#e2e8f0" : "rgba(255,255,255,0.12)"}`,
                      }}
                    />
                  </div>

                  {/* Label & Active Check */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: "2px" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.86rem", color: "var(--text-main)" }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "1px" }}>
                        {t.mode}
                      </div>
                    </div>
                    {theme === t.id && (
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: t.accent,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          flexShrink: 0,
                        }}
                      >
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Font & Bubble customization */}
          <div className="glass-panel" style={{ padding: "28px" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "16px" }}>
              Typography & Bubble Shape
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "10px" }}>
                  Font Family
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { id: "sans", label: "Modern Sans" },
                    { id: "serif", label: "Bookish Serif" },
                    { id: "mono", label: "Terminal Mono" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFontStyle(f.id)}
                      className={fontStyle === f.id ? "btn-primary" : "btn-secondary"}
                      style={{ fontSize: "0.82rem", padding: "8px 14px" }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "10px" }}>
                  Chat Bubble Styling
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { id: "modern", label: "Modern Curve" },
                    { id: "rounded", label: "Pill Rounded" },
                    { id: "glass", label: "Glass Box" },
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setBubbleStyle(b.id)}
                      className={bubbleStyle === b.id ? "btn-primary" : "btn-secondary"}
                      style={{ fontSize: "0.82rem", padding: "8px 14px" }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
