"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Trash2,
  Edit3,
  KeyRound,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  RefreshCw,
  Clock,
  Gauge,
  UserCheck,
  UserX,
  X,
  AtSign,
  Mail,
  User as UserIcon,
  Unlock,
  ChevronDown,
  Check,
  Settings,
} from "lucide-react";
import CustomDropdown from "@/components/CustomDropdown";

interface UserItem {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  role: string;
  status: string;
  rateLimit: number;
  mustResetPassword: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    chatSessions: number;
    apiKeys: number;
    characters: number;
  };
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminCount: number;
  allowPublicSignup: boolean;
  globalLoginRateLimit: number;
}

const RATE_LIMIT_PRESETS = [
  { value: 3, label: "3 attempts / 5 min", tag: "Strict", color: "#f59e0b", desc: "Maximum brute-force defense" },
  { value: 5, label: "5 attempts / 5 min", tag: "Recommended", color: "#10b981", desc: "Balanced security for production" },
  { value: 10, label: "10 attempts / 5 min", tag: "Standard", color: "#06b6d4", desc: "Tolerates occasional typos" },
  { value: 15, label: "15 attempts / 5 min", tag: "Relaxed", color: "#6366f1", desc: "Generous window for multi-device users" },
  { value: 20, label: "20 attempts / 5 min", tag: "High", color: "#8b5cf6", desc: "Ideal for testing & staging environments" },
  { value: 50, label: "50 attempts / 5 min", tag: "Permissive", color: "#ec4899", desc: "Minimal rate limiting restriction" },
];

export default function UserManagementPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("USER");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Custom Rate Limit Dropdown State
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [rateLimitWindow, setRateLimitWindow] = useState(15);
  const [rateLimitMaxAttempts, setRateLimitMaxAttempts] = useState(20);
  const [rateLimitSaveStatus, setRateLimitSaveStatus] = useState<"saved" | "saving" | "idle">("saved");
  const [lockoutIdentifier, setLockoutIdentifier] = useState("");
  const [showLockoutDropdown, setShowLockoutDropdown] = useState(false);
  const [isResettingLockout, setIsResettingLockout] = useState(false);
  const lockoutDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (lockoutDropdownRef.current && !lockoutDropdownRef.current.contains(event.target as Node)) {
        setShowLockoutDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "USER",
    status: "ACTIVE",
    mustResetPassword: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    mustResetPassword: false,
  });

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchRateLimitConfig = async () => {
    try {
      const res = await fetch("/api/admin/rate-limit");
      if (res.ok) {
        const data = await res.json();
        setRateLimitEnabled(data.enabled ?? true);
        setRateLimitWindow(data.windowMinutes ?? 15);
        setRateLimitMaxAttempts(data.maxAttempts ?? 20);
      }
    } catch (err) {
      console.error("Failed to fetch rate limit settings:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        throw new Error("Failed to load user records");
      }
      const data = await res.json();
      setUsers(data.users || []);
      setStats(data.stats || null);
      setCurrentUserRole(data.currentUserRole || "USER");
    } catch (err: any) {
      showToast("error", err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRateLimitConfig();
  }, []);

  const saveRateLimitConfig = async (override?: {
    enabled?: boolean;
    windowMinutes?: number;
    maxAttempts?: number;
  }) => {
    try {
      setRateLimitSaveStatus("saving");
      const payload = {
        enabled: override?.enabled !== undefined ? override.enabled : rateLimitEnabled,
        windowMinutes: override?.windowMinutes !== undefined ? override.windowMinutes : rateLimitWindow,
        maxAttempts: override?.maxAttempts !== undefined ? override.maxAttempts : rateLimitMaxAttempts,
      };
      const res = await fetch("/api/admin/rate-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update rate limit settings");
      }
      setRateLimitSaveStatus("saved");
    } catch (err: any) {
      setRateLimitSaveStatus("idle");
      showToast("error", err.message || "Failed to save rate limit");
    }
  };

  const handleResetLockoutAction = async (targetIdentifier?: string) => {
    try {
      setIsResettingLockout(true);
      const identifierToReset = (targetIdentifier !== undefined ? targetIdentifier : lockoutIdentifier).trim();
      const res = await fetch("/api/admin/rate-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset",
          identifier: identifierToReset || "__all__",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset lockout");
      }
      showToast("success", data.message || "Lockout reset successfully");
      setShowLockoutDropdown(false);
    } catch (err: any) {
      showToast("error", err.message || "Failed to reset lockout");
    } finally {
      setIsResettingLockout(false);
    }
  };

  // Toggle public signup setting
  const handleToggleSignup = async () => {
    if (!stats) return;
    const newValue = !stats.allowPublicSignup;
    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "allowPublicSignup", value: String(newValue) }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update signup setting");
      }
      setStats({ ...stats, allowPublicSignup: newValue });
      showToast(
        "success",
        newValue ? "Public registration enabled" : "Public registration disabled (Admin-only mode)"
      );
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Change global login rate limit
  const handleUpdateGlobalRateLimit = async (newLimit: number) => {
    if (!stats) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "globalLoginRateLimit", value: String(newLimit) }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update rate limit setting");
      }
      setStats({ ...stats, globalLoginRateLimit: newLimit });
      showToast("success", `Global login rate limit set to ${newLimit} attempts / 5 mins`);
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reset lockout for specific user or all users
  const handleResetLockout = async (userId?: string) => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/lockout/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, resetAll: !userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset lockout");
      }
      showToast("success", data.message || "Lockout cleared successfully");
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle user status (Active / Inactive)
  const handleToggleUserStatus = async (user: UserItem) => {
    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update user status");
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
      if (stats) {
        setStats({
          ...stats,
          activeUsers: newStatus === "ACTIVE" ? stats.activeUsers + 1 : stats.activeUsers - 1,
          inactiveUsers: newStatus === "INACTIVE" ? stats.inactiveUsers + 1 : stats.inactiveUsers - 1,
        });
      }
      showToast("success", `User ${user.email} marked as ${newStatus}`);
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Add User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }
      showToast("success", `User ${data.user.email} created successfully`);
      setShowAddModal(false);
      setFormData({
        name: "",
        username: "",
        email: "",
        password: "",
        role: "USER",
        status: "ACTIVE",
        mustResetPassword: false,
      });
      fetchUsers();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Edit User
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          role: formData.role,
          status: formData.status,
          mustResetPassword: formData.mustResetPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update user");
      }
      showToast("success", `User ${selectedUser.email} updated successfully`);
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Update/Reset Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const payload: any = {
        mustResetPassword: passwordForm.mustResetPassword,
      };
      if (passwordForm.newPassword) {
        payload.password = passwordForm.newPassword;
      }
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password settings");
      }
      showToast("success", `Security settings updated for ${selectedUser.email}`);
      setShowPasswordModal(false);
      setSelectedUser(null);
      setPasswordForm({ newPassword: "", mustResetPassword: false });
      fetchUsers();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user");
      }
      showToast("success", `User ${selectedUser.email} deleted successfully`);
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      u.email.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.name && u.name.toLowerCase().includes(q));

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;

    return matchesQuery && matchesRole && matchesStatus;
  });

  return (
    <div style={{ padding: "32px 36px", maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 20px",
            borderRadius: "var(--radius-md)",
            backgroundColor:
              toastMessage.type === "success"
                ? "rgba(16, 185, 129, 0.95)"
                : "rgba(239, 68, 68, 0.95)",
            color: "#fff",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.4)",
            fontSize: "0.9rem",
            fontWeight: 500,
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {toastMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <Users size={20} />
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700 }}>
              User Management
            </h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.92rem" }}>
            Control user access, roles, account statuses, global login rate limiting, and security lockouts.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => handleResetLockout()}
            disabled={actionLoading}
            className="btn-secondary"
            title="Clear all active login rate limits and lockouts across the system"
            style={{ padding: "10px 14px" }}
          >
            <Unlock size={16} color="#10b981" />
            <span>Reset All Lockouts</span>
          </button>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="btn-secondary"
            title="Refresh list"
            style={{ padding: "10px 14px" }}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setFormData({
                name: "",
                username: "",
                email: "",
                password: "",
                role: "USER",
                status: "ACTIVE",
                mustResetPassword: false,
              });
              setShowAddModal(true);
            }}
            className="btn-primary"
            style={{ padding: "10px 18px" }}
          >
            <UserPlus size={16} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "18px",
          marginBottom: "22px",
        }}
      >
        {/* Total Users */}
        <div className="glass-panel" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>Total Accounts</span>
            <Users size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-display)" }}>
            {stats ? stats.totalUsers : "—"}
          </div>
          <div style={{ color: "var(--text-faint)", fontSize: "0.78rem", marginTop: "4px" }}>
            {stats ? `${stats.activeUsers} active / ${stats.inactiveUsers} inactive` : "—"}
          </div>
        </div>

        {/* Administrators */}
        <div className="glass-panel" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>Administrators</span>
            <Shield size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: "#f59e0b" }}>
            {stats ? stats.adminCount : "—"}
          </div>
          <div style={{ color: "var(--text-faint)", fontSize: "0.78rem", marginTop: "4px" }}>
            Super Admins & Admins
          </div>
        </div>

        {/* Public Sign-up Toggle */}
        <div
          className="glass-panel"
          style={{
            padding: "20px 24px",
            border: stats?.allowPublicSignup
              ? "1px solid rgba(16, 185, 129, 0.3)"
              : "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>
              Public Sign-Up Policy
            </span>
            <button
              onClick={handleToggleSignup}
              disabled={actionLoading || currentUserRole !== "SUPER_ADMIN"}
              title={
                currentUserRole !== "SUPER_ADMIN"
                  ? "Only Super Admins can change registration policy"
                  : "Click to toggle public registration"
              }
              style={{
                background: "none",
                border: "none",
                cursor: currentUserRole === "SUPER_ADMIN" ? "pointer" : "not-allowed",
                color: stats?.allowPublicSignup ? "#10b981" : "#ef4444",
                display: "flex",
                alignItems: "center",
                padding: 0,
              }}
            >
              {stats?.allowPublicSignup ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: stats?.allowPublicSignup ? "#10b981" : "#ef4444",
              }}
            >
              {stats?.allowPublicSignup ? "Open (Enabled)" : "Closed (Disabled)"}
            </span>
          </div>
          <div style={{ color: "var(--text-faint)", fontSize: "0.78rem", marginTop: "4px" }}>
            {stats?.allowPublicSignup
              ? "Anyone can create an account"
              : "Only admins can create accounts"}
          </div>
        </div>
      </div>

      {/* Login Rate Limiting Panel */}
      <div
        className="glass-panel"
        style={{
          padding: "22px 26px",
          marginBottom: "26px",
          position: "relative",
          zIndex: showLockoutDropdown ? 40 : 1,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "18px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
              flexShrink: 0,
            }}
          >
            <Settings size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-main)", marginBottom: "3px" }}>
              Login Rate Limiting
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.4 }}>
              Reduce brute-force attacks; disable only for trusted environments. Changes are saved automatically.
            </p>
          </div>
        </div>

        {/* Form Controls Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Row 1: Rate Limiting Toggle, Window, Max Attempts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "18px",
              alignItems: "flex-end",
            }}
          >
            {/* Rate Limiting Toggle */}
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
                Rate Limiting
              </label>
              <button
                type="button"
                onClick={() => {
                  if (currentUserRole !== "SUPER_ADMIN") return;
                  const nextVal = !rateLimitEnabled;
                  setRateLimitEnabled(nextVal);
                  saveRateLimitConfig({ enabled: nextVal });
                }}
                disabled={currentUserRole !== "SUPER_ADMIN"}
                style={{
                  height: "40px",
                  padding: "0 16px",
                  borderRadius: "var(--radius-md)",
                  border: rateLimitEnabled
                    ? "1px solid rgba(16, 185, 129, 0.5)"
                    : "1px solid rgba(239, 68, 68, 0.4)",
                  background: rateLimitEnabled
                    ? "rgba(16, 185, 129, 0.12)"
                    : "rgba(239, 68, 68, 0.1)",
                  color: rateLimitEnabled ? "#10b981" : "#ef4444",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: currentUserRole === "SUPER_ADMIN" ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                }}
              >
                {rateLimitEnabled ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Enabled</span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} />
                    <span>Disabled</span>
                  </>
                )}
              </button>
            </div>

            {/* Window (minutes) */}
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
                Window (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="1440"
                value={rateLimitWindow}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setRateLimitWindow(isNaN(val) ? 1 : Math.max(1, val));
                }}
                onBlur={() => {
                  if (currentUserRole === "SUPER_ADMIN") {
                    saveRateLimitConfig({ windowMinutes: rateLimitWindow });
                  }
                }}
                disabled={currentUserRole !== "SUPER_ADMIN"}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-card)",
                  color: "var(--text-main)",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  outline: "none",
                }}
              />
            </div>

            {/* Max attempts */}
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
                Max attempts
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={rateLimitMaxAttempts}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setRateLimitMaxAttempts(isNaN(val) ? 1 : Math.max(1, val));
                }}
                onBlur={() => {
                  if (currentUserRole === "SUPER_ADMIN") {
                    saveRateLimitConfig({ maxAttempts: rateLimitMaxAttempts });
                  }
                }}
                disabled={currentUserRole !== "SUPER_ADMIN"}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-card)",
                  color: "var(--text-main)",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Row 2: Reset lockout (email/username) Search Box + Status + Reset Button */}
          <div style={{ marginTop: "4px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
              Reset lockout (email/username)
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "14px",
              }}
            >
              {/* Search input with Dropdown */}
              <div
                ref={lockoutDropdownRef}
                style={{
                  position: "relative",
                  flex: "1 1 320px",
                  maxWidth: "480px",
                }}
              >
                <div style={{ position: "relative" }}>
                  <Search
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-faint)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search user or enter email / username..."
                    value={lockoutIdentifier}
                    onChange={(e) => {
                      setLockoutIdentifier(e.target.value);
                      setShowLockoutDropdown(true);
                    }}
                    onFocus={() => setShowLockoutDropdown(true)}
                    style={{
                      width: "100%",
                      height: "40px",
                      paddingLeft: "36px",
                      paddingRight: lockoutIdentifier ? "32px" : "12px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                      fontSize: "0.88rem",
                      outline: "none",
                    }}
                  />
                  {lockoutIdentifier && (
                    <button
                      type="button"
                      onClick={() => {
                        setLockoutIdentifier("");
                        setShowLockoutDropdown(false);
                      }}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--text-faint)",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Floating Search Menu */}
                {showLockoutDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      right: 0,
                      zIndex: 9999,
                      background: "var(--bg-surface)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-subtle)",
                      boxShadow: "0 18px 40px rgba(0, 0, 0, 0.28), 0 6px 14px rgba(0, 0, 0, 0.15)",
                      padding: "6px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      maxHeight: "260px",
                      overflowY: "auto",
                    }}
                  >
                    {/* Option: All Users / Global Reset */}
                    <button
                      type="button"
                      onClick={() => {
                        setLockoutIdentifier("");
                        setShowLockoutDropdown(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        border: "1px solid transparent",
                        background: !lockoutIdentifier ? "rgba(99, 102, 241, 0.1)" : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "var(--bg-card-hover)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = !lockoutIdentifier
                          ? "rgba(99, 102, 241, 0.1)"
                          : "transparent";
                      }}
                    >
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          background: "rgba(16, 185, 129, 0.2)",
                          color: "#10b981",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Unlock size={14} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>
                          All Users (Global Reset)
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-faint)" }}>
                          Clear active lockouts for everyone across the system
                        </div>
                      </div>
                    </button>

                    {/* Filtered User List */}
                    {users
                      .filter((u) => {
                        if (!lockoutIdentifier) return true;
                        const q = lockoutIdentifier.toLowerCase().trim();
                        return (
                          u.email.toLowerCase().includes(q) ||
                          (u.username && u.username.toLowerCase().includes(q)) ||
                          (u.name && u.name.toLowerCase().includes(q))
                        );
                      })
                      .map((u) => {
                        const isSelected =
                          lockoutIdentifier.toLowerCase() === u.email.toLowerCase() ||
                          (u.username && lockoutIdentifier.toLowerCase() === u.username.toLowerCase());
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setLockoutIdentifier(u.email);
                              setShowLockoutDropdown(false);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              border: isSelected ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid transparent",
                              background: isSelected ? "rgba(99, 102, 241, 0.12)" : "transparent",
                              cursor: "pointer",
                              textAlign: "left",
                              width: "100%",
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--bg-card-hover)";
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent";
                            }}
                          >
                            <div
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "6px",
                                background: "var(--bg-card)",
                                border: "1px solid var(--border-subtle)",
                                color: "var(--text-muted)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {(u.name || u.username || u.email).charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: "0.84rem",
                                  fontWeight: 600,
                                  color: "var(--text-main)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {u.name ? `${u.name} (${u.email})` : u.email}
                              </div>
                              <div style={{ fontSize: "0.72rem", color: "var(--text-faint)" }}>
                                {u.username ? `@${u.username} • ` : ""}
                                <span style={{ color: u.role === "SUPER_ADMIN" ? "#f59e0b" : "inherit" }}>
                                  {u.role}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Status indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem" }}>
                {rateLimitSaveStatus === "saving" ? (
                  <>
                    <RefreshCw size={14} className="spin" style={{ color: "var(--text-muted)" }} />
                    <span style={{ color: "var(--text-muted)" }}>Saving changes...</span>
                  </>
                ) : (
                  <>
                    <Check size={15} color="#10b981" />
                    <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>All changes saved</span>
                  </>
                )}
              </div>

              {/* Reset Lockout Button */}
              <button
                type="button"
                onClick={() => handleResetLockoutAction()}
                disabled={isResettingLockout || currentUserRole !== "SUPER_ADMIN"}
                className="btn-secondary"
                style={{
                  height: "40px",
                  padding: "0 18px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  cursor: currentUserRole === "SUPER_ADMIN" ? "pointer" : "not-allowed",
                  marginLeft: "auto",
                }}
              >
                <Unlock size={15} color="#10b981" />
                <span>{isResettingLockout ? "Resetting..." : "Reset"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 280px" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "360px" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-faint)",
              }}
            />
            <input
              type="text"
              placeholder="Search by username, name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: "36px", fontSize: "0.88rem" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <CustomDropdown
            value={roleFilter}
            onChange={(val) => setRoleFilter(val)}
            variant="surface"
            size="sm"
            icon={<Filter size={13} color="var(--primary)" />}
            labelPrefix="Role:"
            options={[
              { value: "ALL", label: "All Roles" },
              { value: "SUPER_ADMIN", label: "Super Admin", icon: <Shield size={13} color="#6366f1" /> },
              { value: "ADMIN", label: "Admin", icon: <Shield size={13} color="#f59e0b" /> },
              { value: "USER", label: "User", icon: <UserIcon size={13} color="#0ea5e9" /> },
            ]}
          />

          <CustomDropdown
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            variant="surface"
            size="sm"
            labelPrefix="Status:"
            options={[
              { value: "ALL", label: "All Statuses" },
              { value: "ACTIVE", label: "Active", icon: <CheckCircle2 size={13} color="#10b981" /> },
              { value: "INACTIVE", label: "Inactive", icon: <XCircle size={13} color="#ef4444" /> },
            ]}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border-subtle)",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  color: "var(--text-muted)",
                  fontSize: "0.78rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <th style={{ padding: "14px 20px" }}>User & Identity</th>
                <th style={{ padding: "14px 16px" }}>Role</th>
                <th style={{ padding: "14px 16px" }}>Status</th>
                <th style={{ padding: "14px 16px" }}>Security & Password</th>
                <th style={{ padding: "14px 16px" }}>Created</th>
                <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                      <RefreshCw size={18} className="spin" />
                      <span>Loading user directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--text-faint)" }}>
                    No users matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = session?.user?.id === u.id;
                  const isSuperAdmin = u.role === "SUPER_ADMIN";
                  const isAdmin = u.role === "ADMIN";

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* User Info */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "50%",
                              background: isSuperAdmin
                                ? "linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)"
                                : isAdmin
                                ? "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)"
                                : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.9rem",
                              color: "#fff",
                              flexShrink: 0,
                            }}
                          >
                            {u.username ? u.username.charAt(0).toUpperCase() : (u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase())}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                              <span>{u.name || u.username || u.email.split("@")[0]}</span>
                              {isSelf && (
                                <span
                                  style={{
                                    fontSize: "0.68rem",
                                    padding: "2px 6px",
                                    borderRadius: "var(--radius-full)",
                                    background: "rgba(99, 102, 241, 0.2)",
                                    color: "#a5b4fc",
                                    fontWeight: 700,
                                  }}
                                >
                                  YOU
                                </span>
                              )}
                            </div>
                            <div style={{ color: "var(--text-faint)", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "6px" }}>
                              {u.username && (
                                <span style={{ color: "var(--primary)", fontWeight: 600 }}>@{u.username}</span>
                              )}
                              <span>•</span>
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background: isSuperAdmin
                              ? "rgba(245, 158, 11, 0.15)"
                              : isAdmin
                              ? "rgba(59, 130, 246, 0.15)"
                              : "rgba(255, 255, 255, 0.06)",
                            color: isSuperAdmin
                              ? "#fbbf24"
                              : isAdmin
                              ? "#60a5fa"
                              : "var(--text-muted)",
                            border: isSuperAdmin
                              ? "1px solid rgba(245, 158, 11, 0.3)"
                              : isAdmin
                              ? "1px solid rgba(59, 130, 246, 0.3)"
                              : "1px solid var(--border-subtle)",
                          }}
                        >
                          {isSuperAdmin && <Shield size={12} />}
                          {isAdmin && <ShieldCheck size={12} />}
                          <span>{u.role.replace("_", " ")}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 16px" }}>
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          disabled={isSelf || (currentUserRole === "ADMIN" && isSuperAdmin)}
                          title={
                            isSelf
                              ? "Cannot deactivate your own account"
                              : "Click to toggle active/inactive status"
                          }
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            background:
                              u.status === "ACTIVE"
                                ? "rgba(16, 185, 129, 0.12)"
                                : "rgba(239, 68, 68, 0.12)",
                            color: u.status === "ACTIVE" ? "#34d399" : "#f87171",
                            border:
                              u.status === "ACTIVE"
                                ? "1px solid rgba(16, 185, 129, 0.3)"
                                : "1px solid rgba(239, 68, 68, 0.3)",
                            cursor:
                              isSelf || (currentUserRole === "ADMIN" && isSuperAdmin)
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              backgroundColor: u.status === "ACTIVE" ? "#34d399" : "#f87171",
                            }}
                          />
                          <span>{u.status}</span>
                        </button>
                      </td>

                      {/* Must Reset Password */}
                      <td style={{ padding: "14px 16px" }}>
                        {u.mustResetPassword ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "3px 8px",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              background: "rgba(239, 68, 68, 0.15)",
                              color: "#fca5a5",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                            }}
                          >
                            <KeyRound size={11} />
                            <span>Must Reset</span>
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-faint)", fontSize: "0.8rem" }}>Protected</span>
                        )}
                      </td>

                      {/* Created At */}
                      <td style={{ padding: "14px 16px", color: "var(--text-faint)", fontSize: "0.8rem" }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          {/* Reset Lockout / Unlock */}
                          <button
                            onClick={() => handleResetLockout(u.id)}
                            title="Reset Lockout & Rate Limit for this user"
                            className="btn-secondary"
                            style={{ padding: "6px 8px", color: "#10b981" }}
                          >
                            <Unlock size={14} />
                          </button>

                          {/* Edit User Button */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setFormData({
                                name: u.name || "",
                                username: u.username || "",
                                email: u.email,
                                password: "",
                                role: u.role,
                                status: u.status,
                                mustResetPassword: u.mustResetPassword,
                              });
                              setShowEditModal(true);
                            }}
                            title="Edit User Details"
                            className="btn-secondary"
                            style={{ padding: "6px 8px" }}
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Reset Password Button */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setPasswordForm({
                                newPassword: "",
                                mustResetPassword: u.mustResetPassword,
                              });
                              setShowPasswordModal(true);
                            }}
                            title="Set/Reset Password"
                            className="btn-secondary"
                            style={{ padding: "6px 8px" }}
                          >
                            <KeyRound size={14} />
                          </button>

                          {/* Delete User Button */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowDeleteModal(true);
                            }}
                            disabled={isSelf || (currentUserRole === "ADMIN" && isSuperAdmin)}
                            title={
                              isSelf
                                ? "Cannot delete own account"
                                : currentUserRole === "ADMIN" && isSuperAdmin
                                ? "Cannot delete Super Admin"
                                : "Delete User"
                            }
                            className="btn-secondary"
                            style={{
                              padding: "6px 8px",
                              color: isSelf ? "var(--text-faint)" : "#f87171",
                              opacity: isSelf ? 0.4 : 1,
                              cursor: isSelf ? "not-allowed" : "pointer",
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== ADD USER MODAL ===================== */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(6px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <UserPlus size={20} color="var(--primary)" />
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 700 }}>
                  Create New Account
                </h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUser} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Email Address */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                  <Mail size={14} />
                  <span>Email Address *</span>
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                  <AtSign size={14} />
                  <span>Username *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. alexsmith or admin"
                  className="input-field"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  minLength={3}
                />
              </div>

              {/* Initial Password */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                  <KeyRound size={14} />
                  <span>Initial Password *</span>
                </label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  className="input-field"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              {/* Display Name */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                  <UserIcon size={14} />
                  <span>Display Name (Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex"
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                    Role
                  </label>
                  <CustomDropdown
                    value={formData.role}
                    onChange={(val) => setFormData({ ...formData, role: val })}
                    variant="form"
                    size="md"
                    fullWidth={true}
                    options={[
                      { value: "USER", label: "User", description: "Standard user chat access", icon: <UserIcon size={14} color="#0ea5e9" /> },
                      ...(currentUserRole === "SUPER_ADMIN"
                        ? [{ value: "ADMIN", label: "Admin", description: "Can provision users & view analytics", icon: <Shield size={14} color="#f59e0b" /> }]
                        : []),
                    ]}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                    Status
                  </label>
                  <CustomDropdown
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                    variant="form"
                    size="md"
                    fullWidth={true}
                    options={[
                      { value: "ACTIVE", label: "Active", description: "Account enabled and ready", icon: <CheckCircle2 size={14} color="#10b981" /> },
                      { value: "INACTIVE", label: "Inactive", description: "Temporarily suspend account", icon: <XCircle size={14} color="#ef4444" /> },
                    ]}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  id="addMustReset"
                  checked={formData.mustResetPassword}
                  onChange={(e) => setFormData({ ...formData, mustResetPassword: e.target.checked })}
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--primary)" }}
                />
                <label htmlFor="addMustReset" style={{ fontSize: "0.85rem", color: "var(--text-main)", cursor: "pointer" }}>
                  Require user to reset password on first login
                </label>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                  style={{ padding: "9px 16px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary"
                  style={{ padding: "9px 20px" }}
                >
                  {actionLoading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== EDIT USER MODAL ===================== */}
      {showEditModal && selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(6px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "480px",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Edit3 size={20} color="var(--primary)" />
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 700 }}>
                  Edit Account: {selectedUser.username ? `@${selectedUser.username}` : selectedUser.email}
                </h2>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditUser} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                  Username
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. alexsmith"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                  Display Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alex"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                    Role
                  </label>
                  <CustomDropdown
                    value={formData.role}
                    onChange={(val) => setFormData({ ...formData, role: val })}
                    variant="form"
                    size="md"
                    fullWidth={true}
                    disabled={selectedUser.role === "SUPER_ADMIN" || currentUserRole !== "SUPER_ADMIN"}
                    options={
                      selectedUser.role === "SUPER_ADMIN"
                        ? [{ value: "SUPER_ADMIN", label: "Super Admin (Protected)", icon: <Shield size={14} color="#6366f1" /> }]
                        : [
                            { value: "USER", label: "User", description: "Standard user account", icon: <UserIcon size={14} color="#0ea5e9" /> },
                            ...(currentUserRole === "SUPER_ADMIN"
                              ? [{ value: "ADMIN", label: "Admin", description: "Administrative privileges", icon: <Shield size={14} color="#f59e0b" /> }]
                              : []),
                          ]
                    }
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                    Status
                  </label>
                  <CustomDropdown
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                    variant="form"
                    size="md"
                    fullWidth={true}
                    disabled={session?.user?.id === selectedUser.id}
                    options={[
                      { value: "ACTIVE", label: "Active", description: "Account enabled and ready", icon: <CheckCircle2 size={14} color="#10b981" /> },
                      { value: "INACTIVE", label: "Inactive", description: "Account suspended", icon: <XCircle size={14} color="#ef4444" /> },
                    ]}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  id="editMustReset"
                  checked={formData.mustResetPassword}
                  onChange={(e) => setFormData({ ...formData, mustResetPassword: e.target.checked })}
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--primary)" }}
                />
                <label htmlFor="editMustReset" style={{ fontSize: "0.85rem", color: "var(--text-main)", cursor: "pointer" }}>
                  Force user to reset password on next login
                </label>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                  style={{ padding: "9px 16px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary"
                  style={{ padding: "9px 20px" }}
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== PASSWORD MODAL ===================== */}
      {showPasswordModal && selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(6px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "460px",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <KeyRound size={20} color="var(--primary)" />
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 700 }}>
                  Password Control
                </h2>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "18px" }}>
              Update password for <strong style={{ color: "var(--text-main)" }}>{selectedUser.username ? `@${selectedUser.username}` : selectedUser.email}</strong>.
            </p>

            <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                  Set New Password (Leave blank to keep existing)
                </label>
                <input
                  type="password"
                  placeholder="New password (min 6 characters)"
                  className="input-field"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  minLength={6}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  id="modalMustReset"
                  checked={passwordForm.mustResetPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, mustResetPassword: e.target.checked })}
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--primary)" }}
                />
                <label htmlFor="modalMustReset" style={{ fontSize: "0.85rem", color: "var(--text-main)", cursor: "pointer" }}>
                  Flag as "Must Reset Password" on next login
                </label>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="btn-secondary"
                  style={{ padding: "9px 16px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary"
                  style={{ padding: "9px 20px" }}
                >
                  {actionLoading ? "Updating..." : "Update Security"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
      {showDeleteModal && selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(6px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "440px",
              padding: "28px",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#f87171", marginBottom: "16px" }}>
              <AlertTriangle size={24} />
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700 }}>
                Delete User Account?
              </h2>
            </div>

            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "20px" }}>
              Are you sure you want to permanently delete{" "}
              <strong style={{ color: "#fff" }}>{selectedUser.username ? `@${selectedUser.username}` : selectedUser.email}</strong>? All associated chat sessions,
              custom characters, and API keys will be permanently deleted. This action cannot be undone.
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
                style={{ padding: "9px 16px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={actionLoading}
                style={{
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  padding: "9px 18px",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                }}
              >
                {actionLoading ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
