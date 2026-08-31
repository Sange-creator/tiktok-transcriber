"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Mic,
  Sparkles,
  Zap,
  CheckCircle2,
  Copy,
  Layers,
  HelpCircle,
  ShieldCheck,
  Flame,
} from "lucide-react";
import { TranscriptionResult, TranscriberSettings } from "@/lib/types";
import { Header } from "@/components/Header";
import { UrlInputSection } from "@/components/UrlInputSection";
import { TranscriptionCard } from "@/components/TranscriptionCard";
import { BatchActionsBar } from "@/components/BatchActionsBar";
import { SettingsModal } from "@/components/SettingsModal";

const DEFAULT_SETTINGS: TranscriberSettings = {
  provider: "groq",
  language: "auto",
  includeTimestamps: true,
  groqApiKey: "",
  openaiApiKey: "",
  geminiApiKey: "",
  concurrency: 10,
};

export default function HomePage() {
  const [items, setItems] = useState<TranscriptionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [settings, setSettings] = useState<TranscriberSettings>(DEFAULT_SETTINGS);

  // Load settings and cached items from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("tiktok_transcriber_settings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          geminiApiKey: parsed.geminiApiKey || DEFAULT_SETTINGS.geminiApiKey,
        });
      }
      const savedItems = localStorage.getItem("tiktok_transcriber_history");
      if (savedItems) {
        setItems(JSON.parse(savedItems));
      }
    } catch (err) {
      console.warn("Error reading from localStorage:", err);
    }
  }, []);

  const saveItemsToStorage = (updatedItems: TranscriptionResult[]) => {
    setItems(updatedItems);
    try {
      localStorage.setItem("tiktok_transcriber_history", JSON.stringify(updatedItems));
    } catch (err) {
      console.warn("Error saving to localStorage:", err);
    }
  };

  const handleSaveSettings = (newSettings: TranscriberSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem("tiktok_transcriber_settings", JSON.stringify(newSettings));
    } catch (err) {
      console.warn("Error saving settings:", err);
    }
  };

  // Process a single URL
  const processSingleUrl = async (
    url: string,
    existingId: string
  ): Promise<TranscriptionResult> => {
    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          settings,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to transcribe video");
      }

      return {
        ...data.result,
        id: existingId,
      };
    } catch (error: any) {
      return {
        id: existingId,
        url,
        text: "",
        status: "error",
        error: error.message || "Failed to process video audio",
      };
    }
  };

  // Parallel Batch Processing with Concurrency Control
  const handleStartTranscription = async (urls: string[]) => {
    if (urls.length === 0 || isProcessing) return;

    setIsProcessing(true);

    // Create initial placeholder items
    const newItems: TranscriptionResult[] = urls.map((url) => ({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      url,
      text: "",
      status: "extracting",
    }));

    // Prepend to current list
    let currentList = [...newItems, ...items];
    saveItemsToStorage(currentList);

    // Dynamic concurrency limit (supports up to 100 parallel workers)
    const concurrency = Math.max(1, Math.min(settings.concurrency || 100, 100));
    const queue = [...newItems];
    const resultsMap = new Map<string, TranscriptionResult>();

    const runWorker = async () => {
      while (queue.length > 0) {
        const targetItem = queue.shift();
        if (!targetItem) break;

        // Set to transcribing
        currentList = currentList.map((item) =>
          item.id === targetItem.id ? { ...item, status: "transcribing" } : item
        );
        saveItemsToStorage(currentList);

        const result = await processSingleUrl(targetItem.url, targetItem.id);
        resultsMap.set(targetItem.id, result);

        currentList = currentList.map((item) =>
          item.id === targetItem.id ? result : item
        );
        saveItemsToStorage(currentList);
      }
    };

    // Run workers concurrently
    const workers = Array.from(
      { length: Math.min(concurrency, newItems.length) },
      () => runWorker()
    );

    await Promise.all(workers);

    setIsProcessing(false);

    // Trigger confetti if at least one succeeded
    const anySuccess = currentList.some((i) => i.status === "completed");
    if (anySuccess) {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#FE2C55", "#25F4EE", "#FFFFFF"],
      });
    }
  };

  const handleRetry = async (url: string) => {
    const itemToRetry = items.find((i) => i.url === url);
    if (!itemToRetry) return;

    let updated = items.map((i) =>
      i.id === itemToRetry.id ? { ...i, status: "extracting" as const, error: undefined } : i
    );
    saveItemsToStorage(updated);

    const result = await processSingleUrl(url, itemToRetry.id);

    updated = updated.map((i) => (i.id === itemToRetry.id ? result : i));
    saveItemsToStorage(updated);
  };

  const handleUpdateText = (id: string, newText: string) => {
    const wordCount = newText.trim() ? newText.trim().split(/\s+/).length : 0;
    const updated = items.map((item) =>
      item.id === id ? { ...item, text: newText, wordCount } : item
    );
    saveItemsToStorage(updated);
  };

  const handleDeleteItem = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    saveItemsToStorage(updated);
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all transcriptions?")) {
      saveItemsToStorage([]);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.text?.toLowerCase().includes(q) ||
      item.metadata?.title?.toLowerCase().includes(q) ||
      item.metadata?.author?.toLowerCase().includes(q) ||
      item.url.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center space-y-3 pt-4 sm:pt-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 mb-1">
            <Flame className="w-3.5 h-3.5 text-tiktok-pink" />
            <span>Fast Parallel Batch Transcriber • 1-Click Clipboard Copy</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            TikTok Video <span className="bg-gradient-to-r from-tiktok-pink via-[#fe2c55] to-tiktok-cyan bg-clip-text text-transparent">Transcriber</span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
            Paste one or multiple TikTok links below to extract speech and convert it into accurate text, timestamped subtitles, or clean markdown.
          </p>
        </section>

        {/* Input Card */}
        <section>
          <UrlInputSection
            onStartTranscription={handleStartTranscription}
            isLoading={isProcessing}
          />
        </section>

        {/* Batch Actions Bar (Sticky when results exist) */}
        {items.length > 0 && (
          <section>
            <BatchActionsBar
              items={items}
              onClearAll={handleClearAll}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </section>
        )}

        {/* Results List */}
        {items.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-tiktok-cyan" />
                Transcriptions ({filteredItems.length})
              </h2>
            </div>

            <div className="space-y-4">
              {filteredItems.map((item) => (
                <TranscriptionCard
                  key={item.id}
                  item={item}
                  onRetry={handleRetry}
                  onDelete={handleDeleteItem}
                  onUpdateText={handleUpdateText}
                  searchQuery={searchQuery}
                  apiKey={settings.geminiApiKey}
                />
              ))}
            </div>
          </section>
        ) : (
          /* Empty State Guide */
          <section className="glass-panel rounded-2xl p-8 text-center space-y-4 border border-dashed border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto text-tiktok-pink">
              <Mic className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">
                Ready to Transcribe TikTok Videos
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Paste TikTok links in the box above or click &ldquo;Sample Links&rdquo; to test immediately.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-4 text-left">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="text-xs font-semibold text-tiktok-cyan flex items-center gap-1">
                  <Copy className="w-3.5 h-3.5" /> 1-Click Copy
                </div>
                <p className="text-[11px] text-zinc-400">
                  Instant clipboard copy for individual transcripts or all batch results combined.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="text-xs font-semibold text-tiktok-pink flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Parallel Speed
                </div>
                <p className="text-[11px] text-zinc-400">
                  Transcribes multiple TikToks simultaneously in parallel in seconds.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Configured
                </div>
                <p className="text-[11px] text-zinc-400">
                  Pre-configured with your Gemini AI engine ready to use out-of-the-box.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} TikTok Video Transcriber. Built with Next.js & Tailwind CSS.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-zinc-300 transition font-medium text-tiktok-cyan"
            >
              Settings & API Keys
            </button>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}
