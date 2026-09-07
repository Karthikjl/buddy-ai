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
  Settings,
  Shield,
  MessageSquare,
  LogOut,
  Plus,
  Trash2,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  Search,
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Initialize collapse preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("buddyai_sidebar_collapsed");
      if (saved === "true") {
        setIsCollapsed(true);
      }
    } catch (e) {}
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("buddyai_sidebar_collapsed", String(next));
      } catch (e) {}
      return next;
    });
  };

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
    ...((session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN")
      ? [{ label: "User Management", href: "/admin/users", icon: Shield }]
      : []),
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
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
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
          width: isCollapsed ? "74px" : "280px",
          minWidth: isCollapsed ? "74px" : "280px",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--bg-surface)",
          borderRight: "1px solid var(--border-subtle)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: isCollapsed ? "20px 10px" : "20px 16px",
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding 0.25s ease",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Brand Header with Toggle Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            marginBottom: "20px",
            padding: isCollapsed ? "0" : "0 4px",
          }}
        >
          <Link
            href="/dashboard"
            prefetch={false}
            title="BuddyAi Dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              overflow: "hidden",
            }}
          >
            <Logo size={34} withText={!isCollapsed} subtitle="Private Companion Hub" />
          </Link>

          {/* Desktop Toggle Button */}
          <button
            type="button"
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              display: isCollapsed ? "none" : "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--primary)";
              e.currentTarget.style.borderColor = "var(--primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.borderColor = "var(--border-subtle)";
            }}
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* Collapsed Expand Quick Button */}
        {isCollapsed && (
          <button
            type="button"
            onClick={toggleCollapse}
            title="Expand sidebar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "28px",
              margin: "0 auto 16px auto",
              borderRadius: "6px",
              background: "var(--primary-light)",
              border: "1px solid var(--border-glow)",
              color: "var(--primary)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <PanelLeftOpen size={16} />
          </button>
        )}

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
                title={isCollapsed ? item.label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  gap: isCollapsed ? "0" : "12px",
                  padding: isCollapsed ? "10px" : "10px 14px",
                  borderRadius: "var(--radius-md)",
                  color: isActive ? "var(--primary)" : "var(--text-muted)",
                  backgroundColor: isActive ? "var(--primary-light)" : "transparent",
                  border: isActive ? "1px solid var(--border-glow)" : "1px solid transparent",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "0.92rem",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon size={18} color={isActive ? "var(--primary)" : "currentColor"} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Active Conversations Section */}
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            padding: isCollapsed ? "8px 0" : "0 8px 8px 8px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          {!isCollapsed && (
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
          )}
          <Link
            href="/characters"
            prefetch={false}
            title="Start new chat"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              borderRadius: "6px",
              background: "var(--primary-light)",
              border: "1px solid var(--border-glow)",
              color: "var(--primary)",
              textDecoration: "none",
            }}
          >
            <Plus size={14} />
          </Link>
        </div>

        {/* Conversation Search Bar */}
        {!isCollapsed && (
          <div style={{ marginTop: "10px", marginBottom: "6px" }}>
            <div style={{ position: "relative" }}>
              <Search
                size={13}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-faint)",
                }}
              />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 28px",
                  fontSize: "0.8rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-main)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        )}

        {/* Session List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            marginTop: "6px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            scrollbarWidth: "none",
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
              if (isCollapsed) return null;
              return (
                <div
                  style={{
                    padding: "20px 8px",
                    textAlign: "center",
                    color: "var(--text-faint)",
                    fontSize: "0.8rem",
                  }}
                >
                  {searchQuery ? "No matching chats." : "No active chats."}
                  <br />
                  <Link
                    href="/characters"
                    prefetch={false}
                    style={{ color: "var(--primary)", marginTop: "4px", display: "inline-block", fontWeight: 600 }}
                  >
                    Start talking!
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
                  title={isCollapsed ? `${s.character?.name || s.title}` : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isCollapsed ? "center" : "space-between",
                    padding: isCollapsed ? "8px" : "8px 10px",
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
                    <span style={{ fontSize: "1.15rem", flexShrink: 0 }}>
                      {s.character?.avatarUrl || "🤖"}
                    </span>
                    {!isCollapsed && (
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
                    )}
                  </div>
                  {!isCollapsed && (
                    <button
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      title="Delete conversation"
                      style={{
                        padding: "4px",
                        borderRadius: "4px",
                        color: "var(--text-faint)",
                        opacity: 0.6,
                        transition: "opacity 0.15s ease",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
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
            justifyContent: isCollapsed ? "center" : "space-between",
            flexDirection: isCollapsed ? "column" : "row",
            gap: isCollapsed ? "10px" : "0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              overflow: "hidden",
              justifyContent: isCollapsed ? "center" : "flex-start",
            }}
          >
            <div
              title={isCollapsed ? (session?.user?.name || "User") : undefined}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--primary) 0%, #06b6d4 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
            </div>
            {!isCollapsed && (
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
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      color: session?.user?.role === "SUPER_ADMIN" ? "#fbbf24" : session?.user?.role === "ADMIN" ? "#60a5fa" : "var(--text-faint)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {session?.user?.role ? session.user.role.replace("_", " ") : "USER"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign Out"
            style={{
              padding: "8px",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-faint)",
              transition: "color 0.15s ease",
              background: "none",
              border: "none",
              cursor: "pointer",
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
