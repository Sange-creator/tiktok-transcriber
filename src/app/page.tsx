"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Mic,
  Zap,
  Sparkles,
  Layers,
  Flame,
  ShieldCheck,
  Copy,
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
  concurrency: 100, // Default to 100 Turbo Parallel
};

export default function HomePage() {
  const [items, setItems] = useState<TranscriptionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [settings, setSettings] = useState<TranscriberSettings>(DEFAULT_SETTINGS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [queueCount, setQueueCount] = useState(0);

  // Queue state refs for thread-safe worker execution
  const activeQueueRef = useRef<Array<{ id: string; url: string }>>([]);
  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);
  const activeWorkersCountRef = useRef(0);
  const settingsRef = useRef<TranscriberSettings>(DEFAULT_SETTINGS);

  // Keep settingsRef in sync
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Load settings and cached items from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("tiktok_transcriber_settings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        const merged: TranscriberSettings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          concurrency: parsed.concurrency || 100,
          geminiApiKey: parsed.geminiApiKey || DEFAULT_SETTINGS.geminiApiKey,
        };
        setSettings(merged);
        settingsRef.current = merged;
      }
      const savedItems = localStorage.getItem("tiktok_transcriber_history");
      if (savedItems) {
        setItems(JSON.parse(savedItems));
      }
    } catch (err) {
      console.warn("Error reading from localStorage:", err);
    }
  }, []);

  const saveToStorageOnly = (updatedItems: TranscriptionResult[]) => {
    try {
      localStorage.setItem("tiktok_transcriber_history", JSON.stringify(updatedItems));
    } catch (err) {
      console.warn("Error saving to localStorage:", err);
    }
  };

  const saveItemsToStorage = (updatedItems: TranscriptionResult[]) => {
    setItems(updatedItems);
    saveToStorageOnly(updatedItems);
  };

  const handleSaveSettings = (newSettings: TranscriberSettings) => {
    setSettings(newSettings);
    settingsRef.current = newSettings;
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
          settings: settingsRef.current,
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

  // Worker loop
  const spawnWorker = async (workerIndex: number) => {
    activeWorkersCountRef.current += 1;

    while (activeQueueRef.current.length > 0) {
      if (isCancelledRef.current) break;

      // Pause loop: wait until unpaused or cancelled
      while (isPausedRef.current) {
        await new Promise((r) => setTimeout(r, 200));
        if (isCancelledRef.current) break;
      }
      if (isCancelledRef.current) break;

      const target = activeQueueRef.current.shift();
      if (!target) break;

      setQueueCount(activeQueueRef.current.length);

      // Mark status as transcribing
      setItems((prev) => {
        const next = prev.map((item) =>
          item.id === target.id ? { ...item, status: "transcribing" as const } : item
        );
        saveToStorageOnly(next);
        return next;
      });

      let result = await processSingleUrl(target.url, target.id);

      // Auto-retry once on transient network failure
      if (result.status === "error" && !isCancelledRef.current) {
        await new Promise((r) => setTimeout(r, 500));
        result = await processSingleUrl(target.url, target.id);
      }

      // Update state and persistent storage with final result
      setItems((prev) => {
        const next = prev.map((item) =>
          item.id === target.id ? result : item
        );
        saveToStorageOnly(next);
        return next;
      });
    }

    activeWorkersCountRef.current -= 1;

    // When all workers finish and queue is empty
    if (activeWorkersCountRef.current === 0 && activeQueueRef.current.length === 0) {
      setIsProcessing(false);
      setIsPaused(false);
      isPausedRef.current = false;
      setQueueCount(0);

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.6 },
        colors: ["#FE2C55", "#25F4EE", "#FFFFFF"],
      });
    }
  };

  // Starts or scales worker pool up to settings.concurrency (default 100 Turbo)
  const startQueueProcessing = () => {
    if (activeQueueRef.current.length === 0) {
      setIsProcessing(false);
      setQueueCount(0);
      return;
    }

    setIsProcessing(true);
    isCancelledRef.current = false;
    setQueueCount(activeQueueRef.current.length);

    const concurrency = Math.max(1, Math.min(settingsRef.current.concurrency || 100, 100));
    const targetWorkers = Math.min(concurrency, activeQueueRef.current.length);
    const workersToLaunch = Math.max(0, targetWorkers - activeWorkersCountRef.current);

    for (let i = 0; i < workersToLaunch; i++) {
      spawnWorker(activeWorkersCountRef.current + i);
    }
  };

  // Add new links (works anytime, even while transcribing!)
  const handleStartTranscription = (urls: string[]) => {
    if (urls.length === 0) return;

    // Create placeholder items
    const newItems: TranscriptionResult[] = urls.map((url) => ({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      url,
      text: "",
      status: "extracting",
    }));

    // Prepend to visible list
    setItems((prev) => {
      const next = [...newItems, ...prev];
      saveToStorageOnly(next);
      return next;
    });

    // Add to active processing queue
    newItems.forEach((item) => {
      activeQueueRef.current.push({ id: item.id, url: item.url });
    });

    setQueueCount(activeQueueRef.current.length);

    // If not paused, start/expand workers immediately
    if (!isPausedRef.current) {
      startQueueProcessing();
    }
  };

  // Pause queue
  const handlePause = () => {
    setIsPaused(true);
    isPausedRef.current = true;
  };

  // Resume queue
  const handleResume = () => {
    setIsPaused(false);
    isPausedRef.current = false;
    startQueueProcessing();
  };

  // Cancel/Stop queue
  const handleCancelQueue = () => {
    isCancelledRef.current = true;
    const queuedIds = new Set(activeQueueRef.current.map((q) => q.id));
    activeQueueRef.current = [];

    setItems((prev) => {
      const next = prev.map((item) =>
        queuedIds.has(item.id) && (item.status === "extracting" || item.status === "transcribing")
          ? { ...item, status: "idle" as const }
          : item
      );
      saveToStorageOnly(next);
      return next;
    });

    setIsProcessing(false);
    setIsPaused(false);
    isPausedRef.current = false;
    setQueueCount(0);
  };

  // Retranscribe a single URL/card
  const handleRetry = (url: string) => {
    const itemToRetry = items.find((i) => i.url === url);
    if (!itemToRetry) return;

    setItems((prev) => {
      const next = prev.map((i) =>
        i.id === itemToRetry.id
          ? { ...i, status: "extracting" as const, error: undefined, text: "" }
          : i
      );
      saveToStorageOnly(next);
      return next;
    });

    activeQueueRef.current.push({ id: itemToRetry.id, url: itemToRetry.url });
    setQueueCount(activeQueueRef.current.length);

    if (!isPausedRef.current) {
      startQueueProcessing();
    }
  };

  // Retranscribe multiple selected items
  const handleRetranscribeSelected = () => {
    if (selectedIds.size === 0) return;
    const selectedList = items.filter((i) => selectedIds.has(i.id));

    setItems((prev) => {
      const next = prev.map((i) =>
        selectedIds.has(i.id)
          ? { ...i, status: "extracting" as const, error: undefined, text: "" }
          : i
      );
      saveToStorageOnly(next);
      return next;
    });

    selectedList.forEach((item) => {
      activeQueueRef.current.push({ id: item.id, url: item.url });
    });

    setQueueCount(activeQueueRef.current.length);
    setSelectedIds(new Set());

    if (!isPausedRef.current) {
      startQueueProcessing();
    }
  };

  // Retranscribe all failed items
  const handleRetranscribeFailed = () => {
    const failedItems = items.filter((i) => i.status === "error");
    if (failedItems.length === 0) return;

    setItems((prev) => {
      const next = prev.map((i) =>
        i.status === "error"
          ? { ...i, status: "extracting" as const, error: undefined, text: "" }
          : i
      );
      saveToStorageOnly(next);
      return next;
    });

    failedItems.forEach((item) => {
      activeQueueRef.current.push({ id: item.id, url: item.url });
    });

    setQueueCount(activeQueueRef.current.length);

    if (!isPausedRef.current) {
      startQueueProcessing();
    }
  };

  const handleUpdateText = (id: string, newText: string) => {
    const wordCount = newText.trim() ? newText.trim().split(/\s+/).length : 0;
    const updated = items.map((item) =>
      item.id === id ? { ...item, text: newText, wordCount } : item
    );
    saveItemsToStorage(updated);
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Delete handlers
  const handleDeleteItem = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    saveItemsToStorage(updated);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (window.confirm(`Are you sure you want to delete ${count} selected transcription${count > 1 ? "s" : ""}?`)) {
      const updated = items.filter((i) => !selectedIds.has(i.id));
      setSelectedIds(new Set());
      saveItemsToStorage(updated);
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all transcription history?")) {
      handleCancelQueue();
      setSelectedIds(new Set());
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
            <span>100 Turbo Parallel Transcriber • 1-Click Clipboard Copy</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            TikTok Video <span className="bg-gradient-to-r from-tiktok-pink via-[#fe2c55] to-tiktok-cyan bg-clip-text text-transparent">Transcriber</span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
            Paste one or multiple TikTok links below to extract speech and convert it into accurate text, timestamped subtitles, or clean markdown.
          </p>
        </section>

        {/* Input Card with Dynamic Queue Support & Pause/Resume Banner */}
        <section>
          <UrlInputSection
            onStartTranscription={handleStartTranscription}
            isLoading={isProcessing}
            isPaused={isPaused}
            queueCount={queueCount}
            onPause={handlePause}
            onResume={handleResume}
            onCancelQueue={handleCancelQueue}
          />
        </section>

        {/* Batch Actions Bar (Sticky when results exist) */}
        {items.length > 0 && (
          <section>
            <BatchActionsBar
              items={items}
              selectedIds={selectedIds}
              onToggleSelectAll={handleToggleSelectAll}
              onDeleteSelected={handleDeleteSelected}
              onDeselectAll={handleDeselectAll}
              onClearAll={handleClearAll}
              onRetranscribeSelected={handleRetranscribeSelected}
              onRetranscribeFailed={handleRetranscribeFailed}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isProcessing={isProcessing}
              isPaused={isPaused}
              onPause={handlePause}
              onResume={handleResume}
              onCancelQueue={handleCancelQueue}
              queueCount={queueCount}
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
                {selectedIds.size > 0 && (
                  <span className="text-xs font-mono text-tiktok-cyan font-bold bg-tiktok-cyan/10 px-2 py-0.5 rounded-full border border-tiktok-cyan/30">
                    {selectedIds.size} Selected
                  </span>
                )}
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
                  isSelected={selectedIds.has(item.id)}
                  onToggleSelect={handleToggleSelect}
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
                  <Zap className="w-3.5 h-3.5" /> 100 Turbo Parallel
                </div>
                <p className="text-[11px] text-zinc-400">
                  Transcribes up to 100 TikToks simultaneously in parallel in seconds.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Configured
                </div>
                <p className="text-[11px] text-zinc-400">
                  Pre-configured with AI speech engines ready to transcribe out-of-the-box.
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
