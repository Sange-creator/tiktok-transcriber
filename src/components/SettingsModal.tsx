"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Key,
  Zap,
  Shield,
  Globe,
  ExternalLink,
  Check,
  Sparkles,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  Cookie,
  Plus,
  Trash2,
  Users,
  RefreshCw,
} from "lucide-react";
import {
  TranscriberSettings,
  TranscriptionProvider,
  TikTokAccountSession,
} from "@/lib/types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TranscriberSettings;
  onSaveSettings: (newSettings: TranscriberSettings) => void;
}

const LANGUAGES = [
  { code: "auto", name: "🌐 Auto-Detect Language" },
  { code: "en", name: "English" },
  { code: "es", name: "Spanish (Español)" },
  { code: "fr", name: "French (Français)" },
  { code: "de", name: "German (Deutsch)" },
  { code: "pt", name: "Portuguese (Português)" },
  { code: "it", name: "Italian (Italiano)" },
  { code: "id", name: "Indonesian (Bahasa Indonesia)" },
  { code: "ja", name: "Japanese (日本語)" },
  { code: "ko", name: "Korean (한국어)" },
  { code: "zh", name: "Chinese (中文)" },
  { code: "ar", name: "Arabic (العربية)" },
  { code: "hi", name: "Hindi (हिन्दी)" },
  { code: "ne", name: "Nepali (नेपाली)" },
  { code: "tl", name: "Tagalog / Filipino" },
  { code: "ru", name: "Russian (Русский)" },
];

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<TranscriberSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  // Multi-session pool state
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionId, setNewSessionId] = useState("");
  const [showSessionInput, setShowSessionInput] = useState(false);
  const [revealedSessionIds, setRevealedSessionIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleGroqKeyChange = (val: string) => {
    const trimmed = val.trim();
    if (trimmed.startsWith("sk-") && !localSettings.openaiApiKey) {
      setLocalSettings({
        ...localSettings,
        openaiApiKey: trimmed,
        provider: "openai",
        groqApiKey: "",
      });
      return;
    }
    setLocalSettings({ ...localSettings, groqApiKey: trimmed });
  };

  const handleOpenAIKeyChange = (val: string) => {
    const trimmed = val.trim();
    if (trimmed.startsWith("gsk_") && !localSettings.groqApiKey) {
      setLocalSettings({
        ...localSettings,
        groqApiKey: trimmed,
        provider: "groq",
        openaiApiKey: "",
      });
      return;
    }
    setLocalSettings({ ...localSettings, openaiApiKey: trimmed });
  };

  const handleGeminiKeyChange = (val: string) => {
    const trimmed = val.trim();
    setLocalSettings({ ...localSettings, geminiApiKey: trimmed });
  };

  const handleAddSession = () => {
    if (!newSessionId.trim()) return;
    const sessions = localSettings.tiktokSessions || [];
    const count = sessions.length + 1;
    const newSession: TikTokAccountSession = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newSessionName.trim() || `Account ${count}`,
      sessionId: newSessionId.trim(),
      active: true,
      createdAt: Date.now(),
    };

    setLocalSettings({
      ...localSettings,
      tiktokSessions: [...sessions, newSession],
    });
    setNewSessionName("");
    setNewSessionId("");
  };

  const handleToggleSession = (id: string) => {
    const sessions = (localSettings.tiktokSessions || []).map((s) =>
      s.id === id ? { ...s, active: !s.active } : s
    );
    setLocalSettings({ ...localSettings, tiktokSessions: sessions });
  };

  const handleDeleteSession = (id: string) => {
    const sessions = (localSettings.tiktokSessions || []).filter((s) => s.id !== id);
    setLocalSettings({ ...localSettings, tiktokSessions: sessions });
  };

  const toggleRevealSession = (id: string) => {
    setRevealedSessionIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const isGroqValid = localSettings.groqApiKey?.startsWith("gsk_");
  const isOpenAIValid = localSettings.openaiApiKey?.startsWith("sk-");
  const isGeminiValid =
    localSettings.geminiApiKey?.startsWith("AIzaSy") ||
    localSettings.geminiApiKey?.startsWith("AQ.");

  const sessions = localSettings.tiktokSessions || [];
  const activeSessionsCount = sessions.filter((s) => s.active).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity">
      <div
        className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl relative border border-white/15 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-tiktok-pink/15 text-tiktok-pink">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Transcription Settings
              </h2>
              <p className="text-xs text-zinc-400">
                Configure AI engines, multi-account sessions & concurrency
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-5 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-tiktok-cyan" />
              Active AI Provider
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  id: "groq",
                  name: "Groq Whisper",
                  badge: "Recommended",
                  sub: "Free & 0.4s Speed",
                  color: "border-tiktok-cyan/40 bg-tiktok-cyan/10 text-tiktok-cyan",
                },
                {
                  id: "openai",
                  name: "OpenAI Whisper",
                  badge: "Official",
                  sub: "whisper-1",
                  color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
                },
                {
                  id: "gemini",
                  name: "Google Gemini",
                  badge: "Flash 2.0",
                  sub: "Multimodal",
                  color: "border-tiktok-pink/40 bg-tiktok-pink/10 text-tiktok-pink",
                },
              ].map((p) => {
                const isSelected = localSettings.provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setLocalSettings({
                        ...localSettings,
                        provider: p.id as TranscriptionProvider,
                      })
                    }
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? `${p.color} ring-1 ring-white/20 shadow-md`
                        : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{p.name}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{p.sub}</div>
                    </div>
                    {isSelected && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 self-start mt-2">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Groq API Key Input */}
          <div
            className={`space-y-2 p-3.5 rounded-xl border transition-all ${
              localSettings.provider === "groq"
                ? "bg-tiktok-cyan/[0.04] border-tiktok-cyan/30 ring-1 ring-tiktok-cyan/20"
                : "bg-zinc-900/60 border-white/10"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-tiktok-cyan" />
                <span className="text-xs font-medium text-zinc-200">Groq API Key</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-tiktok-cyan/15 text-tiktok-cyan">
                  gsk_...
                </span>
              </div>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-tiktok-cyan hover:underline flex items-center gap-1 font-semibold"
              >
                Get Free Groq Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative flex items-center">
              <input
                type={showGroqKey ? "text" : "password"}
                placeholder="gsk_..."
                value={localSettings.groqApiKey || ""}
                onChange={(e) => handleGroqKeyChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-sm font-mono text-white focus:outline-none focus:border-tiktok-cyan focus:ring-1 focus:ring-tiktok-cyan placeholder:text-zinc-600 pr-16"
              />
              <div className="absolute right-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  className="text-zinc-400 hover:text-white p-1 transition"
                  title={showGroqKey ? "Hide API key" : "Show API key"}
                >
                  {showGroqKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {isGroqValid && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>
            <p className="text-[11px] text-zinc-400">
              ⚡ 100% Free tier (25k requests/day). 60s TikTok transcribes in ~0.4s.
            </p>
          </div>

          {/* OpenAI API Key Input */}
          <div
            className={`space-y-2 p-3.5 rounded-xl border transition-all ${
              localSettings.provider === "openai"
                ? "bg-emerald-500/[0.04] border-emerald-500/30 ring-1 ring-emerald-500/20"
                : "bg-zinc-900/60 border-white/10"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-zinc-200">OpenAI API Key</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400">
                  sk-...
                </span>
              </div>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                Get OpenAI Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative flex items-center">
              <input
                type={showOpenAIKey ? "text" : "password"}
                placeholder="sk-..."
                value={localSettings.openaiApiKey || ""}
                onChange={(e) => handleOpenAIKeyChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-sm font-mono text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-zinc-600 pr-16"
              />
              <div className="absolute right-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                  className="text-zinc-400 hover:text-white p-1 transition"
                  title={showOpenAIKey ? "Hide API key" : "Show API key"}
                >
                  {showOpenAIKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {isOpenAIValid && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>
          </div>

          {/* Gemini API Key Input */}
          <div
            className={`space-y-2 p-3.5 rounded-xl border transition-all ${
              localSettings.provider === "gemini"
                ? "bg-tiktok-pink/[0.04] border-tiktok-pink/30 ring-1 ring-tiktok-pink/20"
                : "bg-zinc-900/60 border-white/10"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-tiktok-pink" />
                <span className="text-xs font-medium text-zinc-200">Google Gemini API Key</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-tiktok-pink/15 text-tiktok-pink">
                  AQ... / AIzaSy...
                </span>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-tiktok-pink hover:underline flex items-center gap-1"
              >
                Get Free Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative flex items-center">
              <input
                type={showGeminiKey ? "text" : "password"}
                placeholder="AQ... or AIzaSy..."
                value={localSettings.geminiApiKey || ""}
                onChange={(e) => handleGeminiKeyChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-sm font-mono text-white focus:outline-none focus:border-tiktok-pink focus:ring-1 focus:ring-tiktok-pink placeholder:text-zinc-600 pr-16"
              />
              <div className="absolute right-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="text-zinc-400 hover:text-white p-1 transition"
                  title={showGeminiKey ? "Hide API key" : "Show API key"}
                >
                  {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {isGeminiValid && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>
          </div>

          {/* TikTok Multi-Account Session Manager */}
          <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/70 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  TikTok Multi-Account Sessions
                </label>
                {activeSessionsCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-400/15 text-amber-300 font-bold">
                    {activeSessionsCount} active
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowSessionInput(!showSessionInput)}
                className="text-xs text-tiktok-cyan hover:underline flex items-center gap-1 font-medium"
              >
                {showSessionInput ? "Done" : "+ Add Session"}
              </button>
            </div>

            {/* Configured Sessions List */}
            {sessions.length > 0 ? (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {sessions.map((sess) => {
                  const isRevealed = revealedSessionIds[sess.id];
                  return (
                    <div
                      key={sess.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition ${
                        sess.active
                          ? "bg-black/50 border-amber-400/30"
                          : "bg-white/[0.02] border-white/5 opacity-50"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSession(sess.id)}
                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition ${
                              sess.active
                                ? "bg-amber-400 border-amber-400 text-black"
                                : "border-white/20 hover:border-white/40"
                            }`}
                            title={sess.active ? "Enabled" : "Disabled"}
                          >
                            {sess.active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </button>
                          <span className="font-semibold text-zinc-200 truncate">
                            {sess.name}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-zinc-500 mt-0.5 truncate pl-5">
                          {isRevealed
                            ? sess.sessionId
                            : `sessionid=••••••••${sess.sessionId.slice(-6)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleRevealSession(sess.id)}
                          className="p-1 text-zinc-400 hover:text-white transition"
                          title={isRevealed ? "Hide" : "Show"}
                        >
                          {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(sess.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 transition"
                          title="Delete session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Add multiple TikTok session IDs to automatically rotate accounts across batch transcriptions.
              </p>
            )}

            {/* Add Session Input Form */}
            {showSessionInput && (
              <div className="p-3 rounded-lg bg-black/60 border border-white/10 space-y-2 animate-in fade-in duration-150">
                <input
                  type="text"
                  placeholder="Account Label (e.g. Account 1, Main, Backup)"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                />
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Paste sessionid=... or full cookie string"
                    value={newSessionId}
                    onChange={(e) => setNewSessionId(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddSession}
                    className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1 shrink-0 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Parallel Batch Workers (Concurrency - Up to 100) */}
          <div className="space-y-2.5 p-3.5 rounded-xl bg-zinc-900/60 border border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-tiktok-cyan" />
                Parallel Batch Concurrency
              </label>
              <span className="text-xs font-mono font-bold text-tiktok-cyan bg-tiktok-cyan/10 px-2 py-0.5 rounded border border-tiktok-cyan/30">
                {(localSettings.concurrency || 100) >= 100
                  ? "🚀 100 Turbo Parallel"
                  : `${localSettings.concurrency || 100} at once`}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[4, 10, 25, 50, 100].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, concurrency: num })}
                  className={`py-2 px-1 rounded-lg text-xs font-bold border transition ${
                    (localSettings.concurrency || 100) === num
                      ? "bg-gradient-to-r from-tiktok-pink to-tiktok-cyan text-white border-transparent shadow-lg shadow-tiktok-pink/20 scale-105"
                      : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {num === 100 ? "100 Turbo" : `${num}x`}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-zinc-400">
              Select <strong>100 Turbo</strong> to process 100 TikTok videos simultaneously in parallel!
            </p>
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-tiktok-cyan" />
              Spoken Audio Language
            </label>
            <select
              value={localSettings.language || "auto"}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, language: e.target.value })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm text-white focus:outline-none focus:border-tiktok-cyan"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
            <Shield className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Your API keys and session cookies are stored locally in your browser and are never transmitted to any third-party servers.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-tiktok-pink to-tiktok-cyan hover:opacity-95 transition active:scale-95 shadow-lg shadow-tiktok-pink/20"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" /> Saved!
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
