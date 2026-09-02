"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Logo from "@/components/Logo";
import {
  Sparkles,
  LayoutDashboard,
  Users,
  KeyRound,
  Settings,
  MessageSquare,
  LogOut,
  Plus,
  Trash2,
  Menu,
  X,
} from "lucide-react";

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
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [pathname]);

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat session?")) return;

    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (pathname === `/chat/${id}`) {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Characters", href: "/characters", icon: Users },
    { label: "Marketplace", href: "/marketplace", icon: Sparkles },
    { label: "Keys & Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpenMobile(!isOpenMobile)}
        style={{
          position: "fixed",
          top: "16px",
          left: "16px",
          zIndex: 60,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          padding: "10px",
          borderRadius: "var(--radius-md)",
          color: "var(--text-main)",
          display: "none",
        }}
        className="mobile-menu-btn"
        aria-label="Toggle menu"
      >
        {isOpenMobile ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop for mobile */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 40,
          }}
        />
      )}

      <aside
        style={{
          width: "280px",
          minWidth: "280px",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--bg-surface)",
          borderRight: "1px solid var(--border-subtle)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "20px 16px",
        }}
      >
        {/* Brand Header */}
        <Link
          href="/dashboard"
          prefetch={false}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 12px",
            marginBottom: "24px",
            textDecoration: "none",
          }}
        >
          <Logo size={36} withText={true} subtitle="Private Companion Hub" />
        </Link>

        {/* Primary Navigation */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  color: isActive ? "var(--primary)" : "var(--text-muted)",
                  backgroundColor: isActive ? "var(--primary-light)" : "transparent",
                  border: isActive ? "1px solid var(--border-glow)" : "1px solid transparent",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "0.92rem",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon size={18} color={isActive ? "var(--primary)" : "currentColor"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Active Conversations Section */}
        <div
          style={{
            marginTop: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 8px 8px 8px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-faint)",
            }}
          >
            Conversations
          </span>
          <Link
            href="/characters"
            prefetch={false}
            title="Start new chat"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "22px",
              height: "22px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.06)",
              color: "var(--text-muted)",
            }}
          >
            <Plus size={14} />
          </Link>
        </div>

        {/* Conversation Search Bar */}
        <div style={{ marginTop: "10px", marginBottom: "6px" }}>
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "7px 12px",
              fontSize: "0.8rem",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-main)",
              outline: "none",
            }}
          />
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            marginTop: "4px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
        {(() => {
          const displayedSessions = sessions.filter((s) => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
              s.title.toLowerCase().includes(q) ||
              s.character.name.toLowerCase().includes(q) ||
              s.messages.some((m) => m.content.toLowerCase().includes(q))
            );
          });

          if (displayedSessions.length === 0) {
            return (
              <div
                style={{
                  padding: "24px 12px",
                  textAlign: "center",
                  color: "var(--text-faint)",
                  fontSize: "0.82rem",
                }}
              >
                {searchQuery ? "No matching conversations." : "No active chats yet."}
                <br />
                <Link
                  href="/characters"
                  prefetch={false}
                  style={{ color: "var(--primary)", marginTop: "6px", display: "inline-block" }}
                >
                  Pick a buddy to talk!
                </Link>
              </div>
            );
          }

          return displayedSessions.map((s) => {
            const isActive = pathname === `/chat/${s.id}`;
            return (
              <Link
                key={s.id}
                href={`/chat/${s.id}`}
                prefetch={false}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: isActive ? "var(--primary-light)" : "transparent",
                  border: isActive ? "1px solid var(--border-glow)" : "1px solid transparent",
                  color: isActive ? "var(--primary)" : "var(--text-muted)",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: "0.87rem",
                  transition: "background 0.15s ease",
                }}
              >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <span style={{ fontSize: "1.1rem" }}>
                      {s.character?.avatarUrl || "🤖"}
                    </span>
                    <span
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "140px",
                      }}
                    >
                      {s.character?.name || s.title}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    title="Delete conversation"
                    style={{
                      padding: "4px",
                      borderRadius: "4px",
                      color: "var(--text-faint)",
                      opacity: 0.6,
                      transition: "opacity 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                  >
                    <Trash2 size={13} />
                  </button>
                </Link>
              );
            });
          })()}
        </div>

        {/* User Session Profile & Signout */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: "14px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "#fff",
              }}
            >
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "120px",
                }}
              >
                {session?.user?.name || "Buddy Explorer"}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-faint)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "120px",
                }}
              >
                {session?.user?.email || "Local user"}
              </div>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign Out"
            style={{
              padding: "8px",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-faint)",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
    </>
  );
}
