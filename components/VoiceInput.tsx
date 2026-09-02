"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInput({
  onTranscript,
  disabled = false,
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check SpeechRecognition support
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript) {
          onTranscript(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Could not start speech recognition:", err);
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      title={isListening ? "Listening... Click to stop" : "Voice Dictation (Speech to Text)"}
      style={{
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isListening
          ? "rgba(239, 68, 68, 0.2)"
          : "var(--primary-light)",
        color: isListening ? "#ef4444" : "var(--primary)",
        border: isListening
          ? "1px solid rgba(239, 68, 68, 0.5)"
          : "1px solid var(--border-glow)",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
        position: "relative",
        boxShadow: isListening ? "0 0 16px rgba(239, 68, 68, 0.4)" : "none",
        animation: isListening ? "pulse-dot 1.2s infinite ease-in-out" : "none",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isListening) {
          e.currentTarget.style.transform = "scale(1.06)";
          e.currentTarget.style.filter = "brightness(1.1)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isListening) {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.filter = "brightness(1)";
        }
      }}
    >
      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
      {isListening && (
        <span
          style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#ef4444",
            boxShadow: "0 0 8px #ef4444",
          }}
        />
      )}
    </button>
  );
}
