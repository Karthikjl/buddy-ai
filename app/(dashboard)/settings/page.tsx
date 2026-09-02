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
  Send,
  ExternalLink,
  RefreshCw,
  Smartphone,
  Copy,
  Database,
  Download,
  Upload,
  Clock,
  BellRing,
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

  const [activeTab, setActiveTab] = useState<"keys" | "appearance" | "telegram" | "vault">("keys");
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);

  // Vault and Proactive state
  const [restoringVault, setRestoringVault] = useState(false);
  const [vaultNotice, setVaultNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [proactiveFrequency, setProactiveFrequency] = useState("gentle");
  const [triggeringCheckin, setTriggeringCheckin] = useState(false);

  // Telegram bot state
  const [telegramConfig, setTelegramConfig] = useState<{
    isConfigured: boolean;
    botUsername: string | null;
    isActive: boolean;
    isLinked: boolean;
    telegramChatId: string | null;
    pairCode: string | null;
  } | null>(null);
  const [botTokenInput, setBotTokenInput] = useState("");
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [telegramNotice, setTelegramNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [pairCodeDisplay, setPairCodeDisplay] = useState<string | null>(null);
  const [pairLinkDisplay, setPairLinkDisplay] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [syncingTelegram, setSyncingTelegram] = useState(false);

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
    fetchTelegramConfig();
  }, []);

  const fetchTelegramConfig = async () => {
    try {
      const res = await fetch("/api/telegram/config");
      if (res.ok) {
        const data = await res.json();
        setTelegramConfig(data);
        if (data.pairCode) {
          setPairCodeDisplay(data.pairCode);
          if (data.botUsername) {
            setPairLinkDisplay(`https://t.me/${data.botUsername}?start=${data.pairCode}`);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTelegramToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botTokenInput.trim()) return;

    setSavingTelegram(true);
    setTelegramNotice(null);

    try {
      const res = await fetch("/api/telegram/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: botTokenInput.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setTelegramNotice({ type: "error", text: data.error || "Failed to verify bot token" });
      } else {
        setTelegramNotice({ type: "success", text: `Connected to @${data.botUsername} successfully!` });
        setBotTokenInput("");
        fetchTelegramConfig();
      }
    } catch (err: any) {
      setTelegramNotice({ type: "error", text: err.message || "Network error" });
    } finally {
      setSavingTelegram(false);
    }
  };

  const handleGeneratePairCode = async () => {
    setGeneratingCode(true);
    setTelegramNotice(null);
    try {
      const res = await fetch("/api/telegram/pair", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPairCodeDisplay(data.pairCode);
        setPairLinkDisplay(data.directLink);
        setTelegramNotice({ type: "success", text: `Pairing code ${data.pairCode} generated!` });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!confirm("Are you sure you want to disconnect Telegram?")) return;
    try {
      const res = await fetch("/api/telegram/config", { method: "DELETE" });
      if (res.ok) {
        setTelegramNotice({ type: "success", text: "Telegram bot disconnected." });
        setPairCodeDisplay(null);
        setPairLinkDisplay(null);
        fetchTelegramConfig();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncTelegram = async () => {
    setSyncingTelegram(true);
    try {
      const res = await fetch("/api/telegram/sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.isLinked) {
          setTelegramNotice({ type: "success", text: "Telegram device paired successfully!" });
          fetchTelegramConfig();
        } else if (data.processedCount > 0) {
          setTelegramNotice({ type: "success", text: `Processed ${data.processedCount} update(s) from Telegram!` });
          fetchTelegramConfig();
        } else {
          setTelegramNotice({ type: "success", text: "Checked Telegram: No new messages yet. Make sure to send the /start command!" });
        }
      }
    } catch (err: any) {
      setTelegramNotice({ type: "error", text: err.message || "Sync failed" });
    } finally {
      setSyncingTelegram(false);
    }
  };

  // Background polling while waiting for pairing
  useEffect(() => {
    if (activeTab === "telegram" && telegramConfig?.isConfigured && !telegramConfig?.isLinked) {
      const interval = setInterval(() => {
        fetch("/api/telegram/sync", { method: "POST" })
          .then((r) => r.json())
          .then((data) => {
            if (data.isLinked) {
              fetchTelegramConfig();
            }
          })
          .catch(() => {});
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [activeTab, telegramConfig?.isConfigured, telegramConfig?.isLinked]);

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

        <button
          onClick={() => setActiveTab("telegram")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.9rem",
            fontWeight: 600,
            backgroundColor: activeTab === "telegram" ? "var(--primary-light)" : "transparent",
            color: activeTab === "telegram" ? "var(--primary)" : "var(--text-muted)",
            border: activeTab === "telegram" ? "1px solid var(--border-glow)" : "1px solid transparent",
          }}
        >
          <Send size={16} />
          <span>Telegram Bot Sync</span>
          {telegramConfig?.isLinked && (
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981" }} />
          )}
        </button>

        <button
          onClick={() => setActiveTab("vault")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.9rem",
            fontWeight: 600,
            backgroundColor: activeTab === "vault" ? "var(--primary-light)" : "transparent",
            color: activeTab === "vault" ? "var(--primary)" : "var(--text-muted)",
            border: activeTab === "vault" ? "1px solid var(--border-glow)" : "1px solid transparent",
          }}
        >
          <Database size={16} />
          <span>Data Vault & Backups</span>
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

      {/* Tab 3: Telegram Bot Sync */}
      {activeTab === "telegram" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* Notification */}
          {telegramNotice && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor:
                  telegramNotice.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                border:
                  telegramNotice.type === "success"
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : "1px solid rgba(239, 68, 68, 0.3)",
                color: telegramNotice.type === "success" ? "#6ee7b7" : "#fca5a5",
                fontSize: "0.9rem",
              }}
            >
              {telegramNotice.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{telegramNotice.text}</span>
            </div>
          )}

          {/* Status Banner */}
          <div
            className="glass-panel"
            style={{
              padding: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  backgroundColor: telegramConfig?.isLinked ? "rgba(16, 185, 129, 0.15)" : "var(--primary-light)",
                  color: telegramConfig?.isLinked ? "#10b981" : "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Smartphone size={24} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700 }}>
                    Telegram Companion Sync
                  </h2>
                  <span
                    className="badge"
                    style={{
                      fontSize: "0.72rem",
                      backgroundColor: telegramConfig?.isLinked
                        ? "rgba(16, 185, 129, 0.15)"
                        : telegramConfig?.isConfigured
                        ? "rgba(245, 158, 11, 0.15)"
                        : "rgba(148, 163, 184, 0.15)",
                      color: telegramConfig?.isLinked
                        ? "#10b981"
                        : telegramConfig?.isConfigured
                        ? "#f59e0b"
                        : "var(--text-muted)",
                      border: "none",
                    }}
                  >
                    {telegramConfig?.isLinked
                      ? "Linked & Active"
                      : telegramConfig?.isConfigured
                      ? "Bot Connected (Unpaired)"
                      : "Not Configured"}
                  </span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
                  Chat with Alex, Maya, or any companion on-the-go from Telegram with full memory sync.
                </p>
              </div>
            </div>

            {telegramConfig?.isConfigured && (
              <button
                onClick={handleUnlinkTelegram}
                className="btn-secondary"
                style={{ fontSize: "0.82rem", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.3)" }}
              >
                <Trash2 size={14} />
                <span>Disconnect Bot</span>
              </button>
            )}
          </div>

          {/* Setup Steps Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            {/* Step 1: Connect Bot Token */}
            <div className="glass-panel" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: "var(--primary-light)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                  }}
                >
                  1
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Telegram Bot Token</h3>
              </div>

              <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", lineHeight: 1.5, marginBottom: "14px" }}>
                1. Open <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" style={{ color: "var(--primary)", textDecoration: "underline" }}>@BotFather</a> on Telegram.
                <br />
                2. Send <code>/newbot</code>, choose a name and username.
                <br />
                3. Paste the generated HTTP API token below:
              </p>

              <form onSubmit={handleSaveTelegramToken} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input
                  type="text"
                  placeholder={telegramConfig?.botUsername ? `Connected as @${telegramConfig.botUsername}` : "e.g. 123456789:ABCdefGhIJKlmNoPQRstuVWXyz"}
                  value={botTokenInput}
                  onChange={(e) => setBotTokenInput(e.target.value)}
                  className="input-field"
                  style={{ fontSize: "0.86rem", fontFamily: "'JetBrains Mono', monospace" }}
                />

                <button
                  type="submit"
                  disabled={savingTelegram || !botTokenInput.trim()}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {savingTelegram ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                  <span>{savingTelegram ? "Testing & Connecting..." : "Connect Telegram Bot"}</span>
                </button>
              </form>
            </div>

            {/* Step 2: Pair User Account */}
            <div className="glass-panel" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: "var(--primary-light)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                  }}
                >
                  2
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Link Your Account</h3>
              </div>

              <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", lineHeight: 1.5, marginBottom: "16px" }}>
                Pairing authorizes your personal Telegram account with this BuddyAi instance so memories and chat history sync privately.
              </p>

              {telegramConfig?.isLinked ? (
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontWeight: 600, fontSize: "0.9rem" }}>
                    <CheckCircle2 size={16} />
                    <span>Device Successfully Linked!</span>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Telegram Chat ID: <code>{telegramConfig.telegramChatId}</code>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-faint)", marginTop: "4px" }}>
                    Send any message to your bot on Telegram to receive live companion replies.
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <button
                    type="button"
                    onClick={handleGeneratePairCode}
                    disabled={generatingCode || !telegramConfig?.isConfigured}
                    className="btn-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    <Zap size={14} />
                    <span>{generatingCode ? "Generating..." : "Generate Pairing Code"}</span>
                  </button>

                  {pairCodeDisplay && (
                    <div
                      style={{
                        padding: "16px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--bg-input)",
                        border: "1px solid var(--border-glow)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                          Send this exact command to your bot:
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            backgroundColor: "var(--bg-surface)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "var(--radius-sm)",
                            padding: "8px 12px",
                          }}
                        >
                          <code
                            style={{
                              fontSize: "1rem",
                              fontWeight: 700,
                              fontFamily: "'JetBrains Mono', monospace",
                              color: "var(--primary)",
                            }}
                          >
                            /start {pairCodeDisplay}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`/start ${pairCodeDisplay}`);
                              setCopiedCommand(true);
                              setTimeout(() => setCopiedCommand(false), 2000);
                            }}
                            className="btn-secondary"
                            style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                          >
                            {copiedCommand ? (
                              <>
                                <Check size={12} color="#10b981" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <a
                          href={`https://web.telegram.org/a/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3D${telegramConfig?.botUsername}%26start%3D${pairCodeDisplay}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary"
                          style={{
                            flex: 1,
                            justifyContent: "center",
                            fontSize: "0.8rem",
                            padding: "8px 12px",
                          }}
                        >
                          <span>Open Telegram Web</span>
                          <ExternalLink size={12} />
                        </a>

                        <a
                          href={pairLinkDisplay || `https://t.me/${telegramConfig?.botUsername}?start=${pairCodeDisplay}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary"
                          style={{
                            flex: 1,
                            justifyContent: "center",
                            fontSize: "0.8rem",
                            padding: "8px 12px",
                          }}
                        >
                          <span>Open Telegram App</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={handleSyncTelegram}
                        disabled={syncingTelegram}
                        className="btn-primary"
                        style={{ width: "100%", justifyContent: "center", fontSize: "0.82rem" }}
                      >
                        <RefreshCw size={14} className={syncingTelegram ? "animate-spin" : ""} />
                        <span>{syncingTelegram ? "Checking Connection..." : "Check & Sync Pairing Now"}</span>
                      </button>

                      <div style={{ fontSize: "0.76rem", color: "var(--text-faint)", lineHeight: 1.4 }}>
                        💡 <strong>No Telegram Desktop installed on this PC?</strong> Simply open Telegram on your phone or tablet, search for <strong>@{telegramConfig?.botUsername}</strong>, and send: <code>/start {pairCodeDisplay}</code>.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Data Vault & Backups */}
      {activeTab === "vault" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {vaultNotice && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor:
                  vaultNotice.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                border:
                  vaultNotice.type === "success"
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : "1px solid rgba(239, 68, 68, 0.3)",
                color: vaultNotice.type === "success" ? "#6ee7b7" : "#fca5a5",
                fontSize: "0.9rem",
              }}
            >
              {vaultNotice.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{vaultNotice.text}</span>
            </div>
          )}

          {/* Banner */}
          <div
            className="glass-panel"
            style={{
              padding: "24px",
              display: "flex",
              alignItems: "center",
              gap: "18px",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheck size={26} />
            </div>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.18rem", fontWeight: 700 }}>
                100% Private, Local Data Vault
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
                All memories, chats, personas, and encrypted keys live in your local database. Export or restore anytime.
              </p>
            </div>
          </div>

          {/* Vault Controls Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            {/* Backup & Restore */}
            <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Database size={18} color="var(--primary)" />
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Full Vault Backup</h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", lineHeight: 1.5 }}>
                Download an unencrypted portable JSON archive containing your characters, conversations, and learned companion memories.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                <a
                  href="/api/backup"
                  download
                  className="btn-primary"
                  style={{ textDecoration: "none", justifyContent: "center" }}
                >
                  <Download size={15} />
                  <span>Download Full Backup (.json)</span>
                </a>

                <label
                  className="btn-secondary"
                  style={{
                    cursor: "pointer",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <Upload size={15} />
                  <span>{restoringVault ? "Restoring..." : "Restore Backup (.json)"}</span>
                  <input
                    type="file"
                    accept=".json"
                    disabled={restoringVault}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setRestoringVault(true);
                      setVaultNotice(null);
                      const reader = new FileReader();
                      reader.onload = async (ev) => {
                        try {
                          const json = JSON.parse(ev.target?.result as string);
                          const res = await fetch("/api/backup", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(json),
                          });
                          const data = await res.json();
                          if (res.ok) {
                            setVaultNotice({
                              type: "success",
                              text: `Restored ${data.importedMemories} memories and ${data.importedCharacters} characters!`,
                            });
                          } else {
                            throw new Error(data.error);
                          }
                        } catch (err: any) {
                          setVaultNotice({ type: "error", text: err.message || "Failed to restore backup" });
                        } finally {
                          setRestoringVault(false);
                        }
                      };
                      reader.readAsText(file);
                    }}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>

            {/* Proactive Check-ins */}
            <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <BellRing size={18} color="var(--accent)" />
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Proactive Companion Check-ins</h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", lineHeight: 1.5 }}>
                Companions reach out with morning/evening check-ins and idle nudges across Web and paired Telegram.
              </p>

              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
                  Check-in Cadence
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { id: "gentle", label: "Gentle (1x / day)" },
                    { id: "active", label: "Active (2x / day)" },
                    { id: "off", label: "Off" },
                  ].map((freq) => (
                    <button
                      key={freq.id}
                      type="button"
                      onClick={() => setProactiveFrequency(freq.id)}
                      className={proactiveFrequency === freq.id ? "btn-primary" : "btn-secondary"}
                      style={{ flex: 1, fontSize: "0.78rem", padding: "6px 8px", justifyContent: "center" }}
                    >
                      {freq.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setTriggeringCheckin(true);
                  try {
                    const res = await fetch("/api/checkins", { method: "POST" });
                    const data = await res.json();
                    if (res.ok) {
                      setVaultNotice({
                        type: "success",
                        text: `${data.characterName} sent: "${data.message}" (Telegram: ${data.telegramSent ? "Sent ⚡" : "Not paired"})`,
                      });
                    }
                  } catch (err: any) {
                    setVaultNotice({ type: "error", text: err.message || "Failed to trigger check-in" });
                  } finally {
                    setTriggeringCheckin(false);
                  }
                }}
                disabled={triggeringCheckin}
                className="btn-secondary"
                style={{ width: "100%", justifyContent: "center", marginTop: "4px" }}
              >
                <Clock size={14} className={triggeringCheckin ? "animate-spin" : ""} />
                <span>{triggeringCheckin ? "Sending Check-in..." : "Test Instant Check-in Now"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
