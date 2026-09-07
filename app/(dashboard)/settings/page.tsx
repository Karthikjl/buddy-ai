"use client";

import React, { useEffect, useState, useRef } from "react";
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
  Save,
  RotateCcw,
  Loader2,
  Sparkles,
  Edit3,
  Layers,
  ListFilter,
  Search,
  ChevronDown,
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
      "deepseek/deepseek-r1",
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o-mini",
      "google/gemini-2.0-flash-exp:free",
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "o1-mini", "gpt-3.5-turbo"],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    models: [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-2.0-flash-lite",
    ],
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    baseUrl: "http://localhost:11434/v1",
    models: ["llama3.3", "llama3.2", "deepseek-r1", "mistral", "qwen2.5", "phi3"],
  },
  {
    id: "custom",
    name: "Custom OpenAI-Compatible",
    baseUrl: "https://api.your-provider.com/v1",
    models: ["custom-model-id"],
  },
];

export default function SettingsPage() {
  const {
    theme,
    setTheme,
    fontStyle,
    setFontStyle,
    bubbleStyle,
    setBubbleStyle,
    savePreferences,
    isSavingPreferences,
  } = useTheme();

  const [appearanceNotice, setAppearanceNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSaveAppearance = async () => {
    const res = await savePreferences();
    if (res.success) {
      setAppearanceNotice({ type: "success", text: res.message });
      setTimeout(() => setAppearanceNotice(null), 4000);
    } else {
      setAppearanceNotice({ type: "error", text: res.message });
    }
  };

  const handleResetAppearance = async () => {
    const res = await savePreferences("pearl", "sans", "modern");
    if (res.success) {
      setAppearanceNotice({
        type: "success",
        text: "Reset to default Pure Pearl White theme and saved!",
      });
      setTimeout(() => setAppearanceNotice(null), 4000);
    } else {
      setAppearanceNotice({ type: "error", text: res.message });
    }
  };

  const [activeTab, setActiveTab] = useState<"keys" | "appearance" | "telegram" | "vault" | "security">("keys");
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);

  // Security and Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordNotice, setPasswordNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

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
  const [fetchedModels, setFetchedModels] = useState<string[]>(
    PROVIDER_PRESETS[0].models
  );
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchModelStatus, setFetchModelStatus] = useState<{
    message: string;
    error?: boolean;
  } | null>(null);
  const [isCustomModelInput, setIsCustomModelInput] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelSearchFilter, setModelSearchFilter] = useState("");
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const lastFetchedRef = useRef<string>("");

  // Close model dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target as Node)
      ) {
        setIsModelDropdownOpen(false);
      }
    }
    if (isModelDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModelDropdownOpen]);

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
      setModel(preset.models[0] || "");
      setFetchedModels(preset.models || []);
      setIsCustomModelInput(false);
      setFetchModelStatus(null);
      setModelSearchFilter("");
      setLabel(preset.id === "custom" ? "Custom Provider" : `${preset.name}`);
    }
  };

  const handleFetchModels = async (overrideBaseUrl?: string, overrideApiKey?: string) => {
    const urlToFetch = (overrideBaseUrl !== undefined ? overrideBaseUrl : baseUrl).trim();
    const keyToFetch = (overrideApiKey !== undefined ? overrideApiKey : apiKey).trim();

    if (!urlToFetch) {
      setFetchModelStatus({
        message: "Please enter a Base URL first.",
        error: true,
      });
      return;
    }

    setFetchingModels(true);
    setFetchModelStatus(null);

    try {
      const res = await fetch("/api/models/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: urlToFetch,
          apiKey: keyToFetch || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        if (data.requiresAuth) {
          setFetchModelStatus({
            message: "API key required by this provider to fetch live account models.",
            error: true,
          });
        } else {
          setFetchModelStatus({
            message: data.message || data.error || "Failed to fetch live models from endpoint.",
            error: true,
          });
        }
      } else {
        const liveModels: string[] = data.models || [];
        if (liveModels.length > 0) {
          setFetchedModels(liveModels);
          setFetchModelStatus({
            message: `Discovered ${liveModels.length} live model(s) from provider!`,
            error: false,
          });
          if (!model || !liveModels.includes(model)) {
            setModel(liveModels[0]);
          }
        }
      }
    } catch (err: any) {
      setFetchModelStatus({
        message: err.message || "Could not reach models endpoint.",
        error: true,
      });
    } finally {
      setFetchingModels(false);
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

        <button
          onClick={() => setActiveTab("security")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.9rem",
            fontWeight: 600,
            backgroundColor: activeTab === "security" ? "var(--primary-light)" : "transparent",
            color: activeTab === "security" ? "var(--primary)" : "var(--text-muted)",
            border: activeTab === "security" ? "1px solid var(--border-glow)" : "1px solid transparent",
          }}
        >
          <ShieldCheck size={16} />
          <span>Account & Security</span>
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
          <div
            className="glass-panel"
            style={{
              padding: "28px",
              position: "relative",
              zIndex: isModelDropdownOpen ? 50 : 2,
            }}
          >
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

            <form
              onSubmit={handleSaveKey}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                position: "relative",
                zIndex: isModelDropdownOpen ? 50 : 1,
              }}
            >
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
                    required={provider !== "ollama" && provider !== "lmstudio" && provider !== "vllm"}
                    className="input-field"
                    placeholder={
                      provider === "ollama" || provider === "lmstudio" || provider === "vllm"
                        ? "Optional for local instances"
                        : "sk-..."
                    }
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)" }}>
                      Model Identifier
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => handleFetchModels()}
                        disabled={fetchingModels || !baseUrl}
                        title="Query live /v1/models endpoint from provider"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: "var(--primary-light)",
                          color: "var(--primary)",
                          border: "1px solid var(--border-glow)",
                          cursor: fetchingModels || !baseUrl ? "not-allowed" : "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {fetchingModels ? (
                          <>
                            <Loader2 size={11} className="animate-spin" />
                            <span>Fetching...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw size={11} />
                            <span>Fetch Live Models</span>
                          </>
                        )}
                      </button>

                      {fetchedModels.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomModelInput(!isCustomModelInput);
                            setIsModelDropdownOpen(false);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.75rem",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: isCustomModelInput ? "var(--primary-light)" : "rgba(255, 255, 255, 0.05)",
                            color: isCustomModelInput ? "var(--primary)" : "var(--text-muted)",
                            border: isCustomModelInput ? "1px solid var(--border-glow)" : "1px solid var(--border-subtle)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {isCustomModelInput ? (
                            <>
                              <ListFilter size={11} />
                              <span>Select from list</span>
                            </>
                          ) : (
                            <>
                              <Edit3 size={11} />
                              <span>Custom Model</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {!isCustomModelInput && fetchedModels.length > 0 ? (
                    <div
                      ref={modelDropdownRef}
                      style={{
                        position: "relative",
                        width: "100%",
                        zIndex: isModelDropdownOpen ? 100 : 1,
                      }}
                    >
                      {/* Custom Sleek Dropdown Trigger */}
                      <button
                        type="button"
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "var(--radius-md)",
                          backgroundColor: "var(--bg-input)",
                          border: isModelDropdownOpen
                            ? "1px solid var(--border-active)"
                            : "1px solid var(--border-subtle)",
                          color: "var(--text-main)",
                          fontSize: "0.88rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          outline: "none",
                          boxShadow: isModelDropdownOpen
                            ? "0 0 0 3px var(--primary-light)"
                            : "none",
                          transition: "all 0.18s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                          <Cpu size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
                          <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", fontFamily: "var(--font-family)" }}>
                            {model || "Select a model..."}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                          <ChevronDown
                            size={15}
                            style={{
                              transition: "transform 0.2s ease",
                              transform: isModelDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                              color: "var(--text-muted)",
                            }}
                          />
                        </div>
                      </button>

                      {/* Floating Popover Search & Options Menu */}
                      {isModelDropdownOpen && (
                        <div
                          style={{
                            position: "absolute",
                            top: "calc(100% + 6px)",
                            left: 0,
                            right: 0,
                            zIndex: 9999,
                            backgroundColor: "var(--bg-surface)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "var(--radius-md)",
                            boxShadow: "0 18px 42px rgba(0, 0, 0, 0.28), 0 4px 14px rgba(0,0,0,0.1)",
                            padding: "8px",
                            backdropFilter: "blur(24px)",
                            animation: "dropdownFadeIn 0.15s ease",
                          }}
                        >
                          {/* Search Filter Header */}
                          <div style={{ position: "relative", marginBottom: "8px" }}>
                            <Search
                              size={13}
                              style={{
                                position: "absolute",
                                left: "10px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--text-muted)",
                              }}
                            />
                            <input
                              type="text"
                              autoFocus
                              placeholder="Search available models..."
                              value={modelSearchFilter}
                              onChange={(e) => setModelSearchFilter(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: "100%",
                                padding: "6px 10px 6px 30px",
                                borderRadius: "var(--radius-sm)",
                                backgroundColor: "var(--bg-card)",
                                border: "1px solid var(--border-subtle)",
                                color: "var(--text-main)",
                                fontSize: "0.82rem",
                                outline: "none",
                              }}
                            />
                          </div>

                          {/* Quick Custom Input Action */}
                          <div
                            onClick={() => {
                              setIsCustomModelInput(true);
                              setIsModelDropdownOpen(false);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "7px 10px",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.82rem",
                              fontWeight: 600,
                              color: "var(--primary)",
                              backgroundColor: "var(--primary-light)",
                              cursor: "pointer",
                              marginBottom: "6px",
                              border: "1px dashed var(--border-glow)",
                            }}
                          >
                            <Edit3 size={13} />
                            <span>Type custom model identifier...</span>
                          </div>

                          {/* Model List */}
                          <div style={{ maxHeight: "230px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
                            {fetchedModels
                              .filter((m) =>
                                m.toLowerCase().includes(modelSearchFilter.toLowerCase())
                              )
                              .map((m) => {
                                const isSelected = m === model;
                                return (
                                  <div
                                    key={m}
                                    onClick={() => {
                                      setModel(m);
                                      setIsModelDropdownOpen(false);
                                      setModelSearchFilter("");
                                    }}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "7px 10px",
                                      borderRadius: "var(--radius-sm)",
                                      fontSize: "0.83rem",
                                      fontWeight: isSelected ? 600 : 400,
                                      color: isSelected ? "var(--primary)" : "var(--text-main)",
                                      backgroundColor: isSelected
                                        ? "var(--primary-light)"
                                        : "transparent",
                                      cursor: "pointer",
                                      transition: "all 0.12s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = "var(--bg-card-hover)";
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                      }
                                    }}
                                  >
                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {m}
                                    </span>
                                    {isSelected && (
                                      <Check size={14} color="var(--primary)" strokeWidth={2.5} style={{ flexShrink: 0, marginLeft: "8px" }} />
                                    )}
                                  </div>
                                );
                              })}

                            {fetchedModels.filter((m) =>
                              m.toLowerCase().includes(modelSearchFilter.toLowerCase())
                            ).length === 0 && (
                              <div style={{ padding: "12px", textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                No models matching &quot;{modelSearchFilter}&quot;
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder="e.g. meta-llama/llama-3.3-70b-instruct or my-model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                    />
                  )}
                </div>
              </div>

              {/* Model Fetch Status banner */}
              {fetchModelStatus && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.82rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: fetchModelStatus.error
                      ? "rgba(239, 68, 68, 0.1)"
                      : "rgba(16, 185, 129, 0.1)",
                    color: fetchModelStatus.error ? "#fca5a5" : "#6ee7b7",
                    border: `1px solid ${
                      fetchModelStatus.error ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"
                    }`,
                  }}
                >
                  {fetchModelStatus.error ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                  <span>{fetchModelStatus.message}</span>
                </div>
              )}

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
          <div
            className="glass-panel"
            style={{ padding: "28px", position: "relative", zIndex: 1 }}
          >
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
          {/* Notification */}
          {appearanceNotice && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor:
                  appearanceNotice.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                border:
                  appearanceNotice.type === "success"
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : "1px solid rgba(239, 68, 68, 0.3)",
                color: appearanceNotice.type === "success" ? "#10b981" : "#ef4444",
                fontSize: "0.9rem",
              }}
            >
              {appearanceNotice.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{appearanceNotice.text}</span>
            </div>
          )}

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
                  name: "Titanium Obsidian",
                  mode: "Graphite Dark",
                  bg: "#090a0f",
                  cardBg: "#11131a",
                  userBubble: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                  aiBubble: "rgba(22, 27, 39, 0.9)",
                  accent: "#38bdf8",
                  isLight: false,
                },
                {
                  id: "amethyst",
                  name: "Twilight Amethyst",
                  mode: "Deep Velvet",
                  bg: "#0c0a14",
                  cardBg: "#141021",
                  userBubble: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                  aiBubble: "rgba(32, 24, 52, 0.9)",
                  accent: "#c084fc",
                  isLight: false,
                },
                {
                  id: "emerald",
                  name: "Nordic Emerald",
                  mode: "Jade Forest",
                  bg: "#06110e",
                  cardBg: "#0b1c18",
                  userBubble: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  aiBubble: "rgba(18, 44, 37, 0.9)",
                  accent: "#34d399",
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

          {/* Theme Save Preferences Action Card */}
          <div
            className="glass-panel"
            style={{
              padding: "24px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              border: "1px solid var(--border-subtle)",
              background: "linear-gradient(135deg, var(--bg-card) 0%, rgba(99, 102, 241, 0.04) 100%)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                      Theme Save Preferences
                    </h3>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "var(--radius-full)",
                        backgroundColor: "rgba(16, 185, 129, 0.14)",
                        color: "#10b981",
                        border: "1px solid rgba(16, 185, 129, 0.25)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <ShieldCheck size={12} />
                      Cloud & Local Sync
                    </span>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                    Persist your preferred color palette, typography, and chat bubble styles across devices and sessions.
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleResetAppearance}
                    disabled={isSavingPreferences}
                    className="btn-secondary"
                    style={{ fontSize: "0.85rem", padding: "10px 16px", cursor: isSavingPreferences ? "not-allowed" : "pointer" }}
                    title="Reset to default Pure Pearl White theme"
                  >
                    <RotateCcw size={15} />
                    <span>Reset to White Default</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAppearance}
                    disabled={isSavingPreferences}
                    className="btn-primary"
                    style={{ fontSize: "0.85rem", padding: "10px 22px", cursor: isSavingPreferences ? "not-allowed" : "pointer" }}
                  >
                    {isSavingPreferences ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Save Preferences</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {appearanceNotice && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor:
                      appearanceNotice.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                    border:
                      appearanceNotice.type === "success"
                        ? "1px solid rgba(16, 185, 129, 0.3)"
                        : "1px solid rgba(239, 68, 68, 0.3)",
                    color: appearanceNotice.type === "success" ? "#10b981" : "#ef4444",
                    fontSize: "0.86rem",
                    fontWeight: 500,
                  }}
                >
                  {appearanceNotice.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{appearanceNotice.text}</span>
                </div>
              )}
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

      {/* Tab 5: Account & Security */}
      {activeTab === "security" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {passwordNotice && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor:
                  passwordNotice.type === "success"
                    ? "rgba(16, 185, 129, 0.12)"
                    : "rgba(239, 68, 68, 0.12)",
                border:
                  passwordNotice.type === "success"
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : "1px solid rgba(239, 68, 68, 0.3)",
                color: passwordNotice.type === "success" ? "#34d399" : "#f87171",
              }}
            >
              {passwordNotice.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{passwordNotice.text}</span>
            </div>
          )}

          <div className="glass-panel" style={{ padding: "28px", maxWidth: "600px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <KeyRound size={20} color="var(--primary)" />
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700 }}>
                Change Account Password
              </h2>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "22px" }}>
              Ensure your account is protected with a strong, distinct password.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPasswordNotice(null);

                if (newPassword.length < 6) {
                  setPasswordNotice({ type: "error", text: "New password must be at least 6 characters." });
                  return;
                }

                if (newPassword !== confirmPassword) {
                  setPasswordNotice({ type: "error", text: "New passwords do not match." });
                  return;
                }

                try {
                  setSavingPassword(true);
                  const res = await fetch("/api/auth/reset-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ currentPassword, newPassword }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    throw new Error(data.error || "Failed to update password");
                  }
                  setPasswordNotice({ type: "success", text: "Password changed successfully!" });
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                } catch (err: any) {
                  setPasswordNotice({ type: "error", text: err.message || "An error occurred" });
                } finally {
                  setSavingPassword(false);
                }
              }}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  className="input-field"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  className="input-field"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  className="input-field"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="btn-primary"
                  style={{ padding: "10px 22px" }}
                >
                  {savingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
