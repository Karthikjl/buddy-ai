"use client";

import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, ShieldAlert, Sparkles, Lock, Mail, User as UserIcon, AtSign, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Setup status
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
  const [allowPublicSignup, setAllowPublicSignup] = useState<boolean>(true);

  useEffect(() => {
    if (authStatus === "authenticated") {
      router.replace("/dashboard");
    }
  }, [authStatus, router]);

  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch("/api/setup-status");
        if (res.ok) {
          const data = await res.json();
          setIsFirstUser(data.isFirstUser);
          setAllowPublicSignup(data.allowPublicSignup);
          if (data.isFirstUser) {
            setIsRegister(true);
          }
        }
      } catch (err) {
        console.error("Failed to check setup status", err);
      }
    }
    checkSetup();
  }, []);

  if (authStatus === "loading" || authStatus === "authenticated") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(ellipse at 50% 20%, rgba(99, 102, 241, 0.15), transparent 70%), var(--bg-main)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <Logo size={56} />
          <div
            style={{
              width: "28px",
              height: "28px",
              border: "3px solid rgba(99, 102, 241, 0.2)",
              borderTopColor: "var(--primary)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        // Register user with email, username, password
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim() || username.trim(),
            username: username.toLowerCase().trim(),
            email: email.toLowerCase().trim(),
            password,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to create account");
        }

        setSuccessMsg(
          isFirstUser
            ? "Super Admin account initialized! Signing you in..."
            : "Account created successfully! Signing you in..."
        );

        // Sign in using the registered username/email
        const resSignIn = await signIn("credentials", {
          redirect: false,
          identifier: username.toLowerCase().trim() || email.toLowerCase().trim(),
          password,
        });

        if (resSignIn?.error) {
          throw new Error(resSignIn.error);
        }

        router.push("/dashboard");
        router.refresh();
        return;
      }

      // Normal Login with either Email or Username
      const res = await signIn("credentials", {
        redirect: false,
        identifier: loginIdentifier.toLowerCase().trim(),
        password,
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        background: "radial-gradient(ellipse at 50% 20%, rgba(99, 102, 241, 0.15), transparent 70%), var(--bg-main)",
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "36px 32px",
          position: "relative",
          zIndex: 10,
          border: "none",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(99, 102, 241, 0.08)",
          borderRadius: "24px",
        }}
      >
        {/* Brand Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <Logo size={56} />
        </div>

        {/* First User Setup Banner */}
        {isFirstUser && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "14px 16px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "rgba(99, 102, 241, 0.12)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              color: "var(--text-main)",
              fontSize: "0.88rem",
              lineHeight: 1.5,
              marginBottom: "22px",
            }}
          >
            <Sparkles size={20} style={{ color: "var(--primary)", flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong style={{ display: "block", color: "var(--text-main)", fontWeight: 700, marginBottom: "3px" }}>
                Initial System Setup
              </strong>
              <span style={{ color: "var(--text-muted)" }}>
                No accounts detected. The first account created will automatically be granted{" "}
                <strong style={{ color: "var(--primary)", fontWeight: 700 }}>Super Admin</strong> privileges.
              </span>
            </div>
          </div>
        )}

        <h1
          style={{
            textAlign: "center",
            fontFamily: "var(--font-display)",
            fontSize: "1.75rem",
            fontWeight: 700,
            marginBottom: "8px",
          }}
        >
          {isFirstUser
            ? "Create Super Admin"
            : isRegister
            ? "Create Account"
            : "Welcome Back"}
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
            marginBottom: "26px",
          }}
        >
          {isFirstUser
            ? "Configure your master administrative credentials"
            : isRegister
            ? "Your private, customizable companion realm"
            : "Sign in with your email or username to continue"}
        </p>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#dc2626",
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              fontSize: "0.85rem",
              marginBottom: "20px",
            }}
          >
            <ShieldAlert size={18} style={{ color: "#ef4444", flexShrink: 0, marginTop: "1px" }} />
            <div>{error}</div>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#059669",
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              fontSize: "0.85rem",
              marginBottom: "20px",
            }}
          >
            <ShieldCheck size={18} style={{ color: "#10b981" }} />
            <div>{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {isRegister ? (
            <>
              {/* Email Address */}
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                  }}
                >
                  <Mail size={14} />
                  <span>Email Address *</span>
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                  }}
                >
                  <AtSign size={14} />
                  <span>Username *</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. admin or alex"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                />
              </div>

              {/* Optional Display Name */}
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                  }}
                >
                  <UserIcon size={14} />
                  <span>Display Name (Optional)</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </>
          ) : (
            /* Login Identifier: Email or Username */
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  marginBottom: "6px",
                }}
              >
                <AtSign size={14} />
                <span>Email or Username</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="you@example.com or username"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}
            >
              <Lock size={14} />
              <span>Password</span>
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%", marginTop: "8px", padding: "12px", justifyContent: "center" }}
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{isFirstUser ? "Initialize Super Admin" : isRegister ? "Create Account" : "Sign In"}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode or Closed Registration notice */}
        {!isFirstUser && (
          <div
            style={{
              marginTop: "24px",
              textAlign: "center",
              fontSize: "0.85rem",
              color: "var(--text-muted)",
            }}
          >
            {allowPublicSignup ? (
              isRegister ? (
                <span>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setError(null);
                    }}
                    style={{ color: "var(--primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setError(null);
                    }}
                    style={{ color: "var(--primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
                  >
                    Create Account
                  </button>
                </span>
              )
            ) : (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-full)",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "0.8rem",
                  color: "var(--text-faint)",
                }}
              >
                <span>Public sign-up is disabled. Contact an administrator for an account.</span>
              </div>
            )}
          </div>
        )}

        <div
          style={{
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            color: "var(--text-faint)",
            fontSize: "0.78rem",
          }}
        >
          <ShieldCheck size={14} color="#10b981" />
          <span>Local SQLite & AES-256 encrypted API storage</span>
        </div>
      </div>
    </div>
  );
}
