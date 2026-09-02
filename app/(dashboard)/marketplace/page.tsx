"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Download,
  Upload,
  Check,
  Plus,
  Compass,
  Heart,
  Brain,
  Zap,
  Sword,
  Coffee,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface MarketplaceCharacter {
  id: string;
  name: string;
  category: "wellness" | "mentor" | "scifi" | "fantasy" | "fitness" | "creative";
  gender: string;
  tagline: string;
  personalityPrompt: string;
  avatarUrl: string;
  greeting: string;
  mood: string;
  relationship: string;
  downloadsCount: number;
}

const MARKETPLACE_CHARACTERS: MarketplaceCharacter[] = [
  {
    id: "dr-aris",
    name: "Dr. Aris",
    category: "mentor",
    gender: "male",
    tagline: "Socratic philosopher & stoic life mentor",
    personalityPrompt: "You are Dr. Aris, a wise, warm, and deeply thoughtful philosopher versed in Marcus Aurelius, Epictetus, and Socratic inquiry. You help the user examine their life, overcome anxiety with stoic calm, and navigate difficult ethical or personal decisions without being preachy.",
    avatarUrl: "🏛️",
    greeting: "Greetings, friend. Take a deep breath. Whatever storms the world is throwing at you today, remember: peace begins from within. What is on your mind?",
    mood: "empathetic",
    relationship: "mentor",
    downloadsCount: 1420,
  },
  {
    id: "seraphina",
    name: "Seraphina",
    category: "wellness",
    gender: "female",
    tagline: "Zen mindfulness & guided breathing companion",
    personalityPrompt: "You are Seraphina, a serene, poetic meditation and mental wellness guide. Your voice is gentle, calming, and restorative. You offer guided breathing exercises, grounding techniques, and emotional solace whenever the user feels stressed.",
    avatarUrl: "🌿",
    greeting: "Welcome to this quiet space. Inhale deeply for four seconds... hold... and gently let it go. How is your heart feeling right now?",
    mood: "friendly",
    relationship: "companion",
    downloadsCount: 2310,
  },
  {
    id: "kaelen",
    name: "Kaelen",
    category: "scifi",
    gender: "neutral",
    tagline: "Cyberpunk neural hacker & future tech visionary",
    personalityPrompt: "You are Kaelen, an elite rogue netrunner from the year 2084. You speak with high-tech slang, sharp dry wit, and boundless enthusiasm for futuristic tech, cryptography, synthwave music, and speculative AI architectures.",
    avatarUrl: "🚀",
    greeting: "Connection established. Secure node synced. What are we dissecting today—quantum computing, rogue subroutines, or just surviving the grid?",
    mood: "creative",
    relationship: "best friend",
    downloadsCount: 1890,
  },
  {
    id: "coach-rex",
    name: "Coach Rex",
    category: "fitness",
    gender: "male",
    tagline: "High-energy fitness & relentless discipline beast",
    personalityPrompt: "You are Coach Rex, an unstoppable, electrifying fitness and life accountability partner. You push the user to do hard things, celebrate every single victory, eliminate excuses, and build elite discipline with humor and heart.",
    avatarUrl: "⚡",
    greeting: "LET'S GO! Excuses don't burn calories, and procrastination doesn't build empires! Are you ready to crush whatever today brings?!",
    mood: "motivating",
    relationship: "mentor",
    downloadsCount: 3100,
  },
  {
    id: "thorin",
    name: "Thorin Ironforge",
    category: "fantasy",
    gender: "male",
    tagline: "Grizzled dwarven tavern-keeper & RPG dungeon master",
    personalityPrompt: "You are Thorin Ironforge, a stout, hearty dwarven adventurer turned tavern storyteller. You speak with theatrical grandeur, love tales of dragons, dungeons, and epic quests, and turn every ordinary life problem into an epic RPG narrative.",
    avatarUrl: "⚔️",
    greeting: "By the beard of the stone-gods! Pull up an oak stool by the hearth, traveller. What glorious quest or perilous dragon troubles your thoughts?",
    mood: "witty",
    relationship: "friend",
    downloadsCount: 1650,
  },
  {
    id: "aria-monet",
    name: "Aria Monet",
    category: "creative",
    gender: "female",
    tagline: "Bohemian artistic muse & creative writing spark",
    personalityPrompt: "You are Aria Monet, a passionate, expressive artistic muse and novelist. You see beauty in shadows and poetry in the mundane. You help the user brainstorm stories, write poetry, overcome creative blocks, and see the world in vivid color.",
    avatarUrl: "🎨",
    greeting: "Close your eyes for a moment. What color does your mood feel like today? Let's turn whatever you're feeling into art.",
    mood: "creative",
    relationship: "partner",
    downloadsCount: 2040,
  },
  {
    id: "klaus",
    name: "Klaus",
    category: "wellness",
    gender: "male",
    tagline: "Cozy rainy-day café barista & attentive confidant",
    personalityPrompt: "You are Klaus, a warm, observant café barista in a quiet rainy city. You love slow jazz, espresso aromas, and deep, sincere conversations about life, books, and dreams. You are a judgment-free sanctuary.",
    avatarUrl: "☕",
    greeting: "Fresh brew is ready. It's pouring rain outside, but it's warm in here. Take off your coat and stay as long as you'd like. How are you doing, really?",
    mood: "friendly",
    relationship: "companion",
    downloadsCount: 2780,
  },
];

const CATEGORIES = [
  { id: "all", label: "All Personas", icon: Compass },
  { id: "wellness", label: "Wellness & Calm", icon: Heart },
  { id: "mentor", label: "Mentors & Wisdom", icon: Brain },
  { id: "scifi", label: "Sci-Fi & Cyberpunk", icon: Zap },
  { id: "fitness", label: "High Energy & Fitness", icon: Zap },
  { id: "fantasy", label: "RPG & Fantasy", icon: Sword },
  { id: "creative", label: "Art & Writing", icon: Sparkles },
];

export default function MarketplacePage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installedNotice, setInstalledNotice] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const filteredCharacters =
    selectedCategory === "all"
      ? MARKETPLACE_CHARACTERS
      : MARKETPLACE_CHARACTERS.filter((c) => c.category === selectedCategory);

  const handleInstall = async (char: MarketplaceCharacter) => {
    setInstallingId(char.id);
    try {
      // 1. Create character in user's roster
      const charRes = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: char.name,
          gender: char.gender,
          tagline: char.tagline,
          personalityPrompt: char.personalityPrompt,
          avatarUrl: char.avatarUrl,
          greeting: char.greeting,
          mood: char.mood,
          relationship: char.relationship,
        }),
      });

      if (!charRes.ok) throw new Error("Failed to install character");
      const charData = await charRes.json();

      // 2. Create initial chat session
      const sessionRes = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: charData.character.id }),
      });

      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setInstalledNotice(`Installed ${char.name} successfully! Redirecting...`);
        setTimeout(() => {
          router.push(`/chat/${sessionData.session.id}`);
        }, 800);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to install companion");
    } finally {
      setInstallingId(null);
    }
  };

  const handleExportJson = (char: MarketplaceCharacter) => {
    const cardData = {
      buddyAiVersion: "1.0",
      type: "character-card",
      character: {
        name: char.name,
        gender: char.gender,
        tagline: char.tagline,
        personalityPrompt: char.personalityPrompt,
        avatarUrl: char.avatarUrl,
        greeting: char.greeting,
        mood: char.mood,
        relationship: char.relationship,
      },
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(cardData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${char.name.toLowerCase().replace(/\s+/g, "_")}.buddy.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        const charData = parsed.character || parsed;
        if (!charData.name || !charData.personalityPrompt) {
          throw new Error("Invalid .buddy.json format");
        }

        const res = await fetch("/api/characters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: charData.name,
            gender: charData.gender || "neutral",
            tagline: charData.tagline || "Custom imported companion",
            personalityPrompt: charData.personalityPrompt,
            avatarUrl: charData.avatarUrl || "🤖",
            customImage: charData.customImage || null,
            greeting: charData.greeting || "Hello! Glad to connect.",
            mood: charData.mood || "friendly",
            relationship: charData.relationship || "friend",
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setInstalledNotice(`Successfully imported ${charData.name}!`);
          setTimeout(() => router.push("/characters"), 1000);
        } else {
          throw new Error("Server rejected import");
        }
      } catch (err: any) {
        alert(err.message || "Failed to import card");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "36px 28px", display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Notice */}
      {installedNotice && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            backgroundColor: "#10b981",
            color: "white",
            padding: "12px 20px",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 8px 24px rgba(16, 185, 129, 0.4)",
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          <span>{installedNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: "36px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "24px",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%)",
          border: "1px solid var(--border-glow)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "8px" }}>
            <Sparkles size={16} />
            <span>COMMUNITY SHOWCASE</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.5px" }}>
            Companion Marketplace
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", maxWidth: "620px", marginTop: "6px", lineHeight: 1.5 }}>
            Discover curated community companions, install distinct personalities in one click, or import and share `.buddy.json` persona cards.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <label className="btn-secondary" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <Upload size={16} />
            <span>{importing ? "Importing..." : "Import Companion Card"}</span>
            <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: "none" }} />
          </label>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px" }}>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.85rem",
                fontWeight: isSelected ? 700 : 500,
                backgroundColor: isSelected ? "var(--primary-light)" : "var(--bg-surface)",
                color: isSelected ? "var(--primary)" : "var(--text-muted)",
                border: isSelected ? "1px solid var(--border-glow)" : "1px solid var(--border-subtle)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={14} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Persona Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "22px" }}>
        {filteredCharacters.map((char) => (
          <div
            key={char.id}
            className="glass-panel"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "18px",
              transition: "transform 0.2s ease, border-color 0.2s ease",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div>
              {/* Card Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      backgroundColor: "var(--primary-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.6rem",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    {char.avatarUrl}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.12rem", fontWeight: 700, fontFamily: "var(--font-display)" }}>
                      {char.name}
                    </h3>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                      <span className="badge badge-indigo" style={{ fontSize: "0.68rem", textTransform: "capitalize" }}>
                        {char.mood}
                      </span>
                      <span className="badge badge-pink" style={{ fontSize: "0.68rem", textTransform: "capitalize" }}>
                        {char.relationship}
                      </span>
                    </div>
                  </div>
                </div>

                <span style={{ fontSize: "0.75rem", color: "var(--text-faint)" }}>
                  {char.downloadsCount.toLocaleString()} installs
                </span>
              </div>

              {/* Tagline */}
              <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "10px" }}>
                {char.tagline}
              </p>

              {/* Persona Description */}
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "14px" }}>
                {char.personalityPrompt}
              </p>

              {/* Greeting Quote Box */}
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  fontStyle: "italic",
                }}
              >
                &ldquo;{char.greeting}&rdquo;
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px", borderTop: "1px solid var(--border-subtle)", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => handleInstall(char)}
                disabled={installingId === char.id}
                className="btn-primary"
                style={{ flex: 1, justifyContent: "center", fontSize: "0.85rem" }}
              >
                <Plus size={15} />
                <span>{installingId === char.id ? "Installing..." : "Install Companion"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleExportJson(char)}
                className="btn-secondary"
                title="Export .buddy.json card"
                style={{ padding: "8px 12px" }}
              >
                <Download size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
