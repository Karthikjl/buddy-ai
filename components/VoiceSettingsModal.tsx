"use client";

import React, { useState, useEffect } from "react";
import { Volume2, Play, Check, X, Sliders, Sparkles } from "lucide-react";

interface VoiceSettingsModalProps {
  characterId: string;
  characterName: string;
  initialVoicePitch?: number | null;
  initialVoiceRate?: number | null;
  initialVoiceName?: string | null;
  initialAutoSpeak?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: { voicePitch: number; voiceRate: number; voiceName: string | null; autoSpeak: boolean }) => void;
}

export default function VoiceSettingsModal({
  characterId,
  characterName,
  initialVoicePitch = 1.0,
  initialVoiceRate = 1.0,
  initialVoiceName = null,
  initialAutoSpeak = false,
  isOpen,
  onClose,
  onSaved,
}: VoiceSettingsModalProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(initialVoiceName || "");
  const [pitch, setPitch] = useState<number>(initialVoicePitch ?? 1.0);
  const [rate, setRate] = useState<number>(initialVoiceRate ?? 1.0);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(initialAutoSpeak ?? false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
        if (!selectedVoiceName && available.length > 0) {
          // Default to first English voice or first voice
          const enVoice = available.find((v) => v.lang.startsWith("en")) || available[0];
          setSelectedVoiceName(enVoice.name);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoiceName]);

  if (!isOpen) return null;

  const handleTestVoice = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const testText = `Hey there! This is ${characterName}. How does my voice sound to you?`;
    const utterance = new SpeechSynthesisUtterance(testText);

    if (selectedVoiceName) {
      const v = voices.find((vox) => vox.name === selectedVoiceName);
      if (v) utterance.voice = v;
    }

    utterance.pitch = pitch;
    utterance.rate = rate;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/characters/${characterId}/voice`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voicePitch: pitch,
          voiceRate: rate,
          voiceName: selectedVoiceName || null,
          autoSpeak,
        }),
      });

      if (res.ok) {
        onSaved({
          voicePitch: pitch,
          voiceRate: rate,
          voiceName: selectedVoiceName || null,
          autoSpeak,
        });
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "26px",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.5)",
          border: "1px solid var(--border-glow)",
          animation: "fadeIn 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "var(--primary-light)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Volume2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "var(--font-display)" }}>
                {characterName}&apos;s Voice Profile
              </h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Customize speech tone, pitch, rate & auto-speak
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: "6px", borderRadius: "50%", minWidth: "auto" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Voice Selector */}
        <div>
          <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "8px" }}>
            Select Voice Actor
          </label>
          <select
            value={selectedVoiceName}
            onChange={(e) => setSelectedVoiceName(e.target.value)}
            className="input-field"
            style={{ width: "100%", fontSize: "0.85rem", cursor: "pointer" }}
          >
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>

        {/* Pitch Slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)" }}>Voice Pitch</span>
            <span style={{ fontSize: "0.82rem", fontFamily: "'JetBrains Mono', monospace", color: "var(--primary)" }}>
              {pitch.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.6"
            step="0.05"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-faint)" }}>
            <span>Deep</span>
            <span>Natural</span>
            <span>High</span>
          </div>
        </div>

        {/* Rate / Speed Slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)" }}>Speaking Speed</span>
            <span style={{ fontSize: "0.82rem", fontFamily: "'JetBrains Mono', monospace", color: "var(--primary)" }}>
              {rate.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.5"
            step="0.05"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-faint)" }}>
            <span>Relaxed</span>
            <span>Normal</span>
            <span>Brisk</span>
          </div>
        </div>

        {/* Auto-Speak Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <div style={{ fontSize: "0.86rem", fontWeight: 600 }}>Auto-Speak Replies</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Automatically read new messages aloud
            </div>
          </div>
          <label style={{ position: "relative", display: "inline-block", width: "42px", height: "24px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: "absolute",
                cursor: "pointer",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: autoSpeak ? "var(--primary)" : "var(--bg-surface)",
                borderRadius: "24px",
                transition: "0.2s",
                border: "1px solid var(--border-glow)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  content: '""',
                  height: "16px",
                  width: "16px",
                  left: autoSpeak ? "20px" : "4px",
                  bottom: "3px",
                  backgroundColor: "white",
                  borderRadius: "50%",
                  transition: "0.2s",
                }}
              />
            </span>
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
          <button
            type="button"
            onClick={handleTestVoice}
            disabled={isPlaying}
            className="btn-secondary"
            style={{ flex: 1, justifyContent: "center" }}
          >
            <Play size={14} />
            <span>{isPlaying ? "Playing..." : "Preview Voice"}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ flex: 1, justifyContent: "center" }}
          >
            <Check size={14} />
            <span>{saving ? "Saving..." : "Save Voice"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
