"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

interface MarkdownMessageProps {
  content: string;
  isUser?: boolean;
}

function CodeBlock({
  language,
  value,
  isUser,
}: {
  language: string;
  value: string;
  isUser?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code", err);
    }
  };

  return (
    <div
      style={{
        margin: "10px 0",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        border: "1px solid var(--border-subtle)",
        backgroundColor: isUser ? "rgba(0, 0, 0, 0.35)" : "rgba(10, 15, 28, 0.95)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 12px",
          backgroundColor: isUser ? "rgba(0, 0, 0, 0.2)" : "rgba(15, 23, 42, 0.8)",
          borderBottom: "1px solid var(--border-subtle)",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <span>{language || "code"}</span>
        <button
          onClick={handleCopy}
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "0.72rem",
            color: copied ? "#10b981" : "var(--text-muted)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          {copied ? (
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
      <pre style={{ margin: 0, padding: "12px 14px", overflowX: "auto" }}>
        <code
          style={{
            color: isUser ? "#ffffff" : "#f1f5f9",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.86rem",
            lineHeight: 1.5,
          }}
        >
          {value}
        </code>
      </pre>
    </div>
  );
}

export default function MarkdownMessage({
  content,
  isUser = false,
}: MarkdownMessageProps) {
  return (
    <div className={`markdown-content ${isUser ? "markdown-user" : ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const codeText = String(children).replace(/\n$/, "");

            if (!inline && (match || codeText.includes("\n"))) {
              return (
                <CodeBlock
                  language={match ? match[1] : ""}
                  value={codeText}
                  isUser={isUser}
                />
              );
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
