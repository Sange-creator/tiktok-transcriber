"use client";

import React, { useState, useEffect } from "react";
import {
  Clipboard,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Video,
  ArrowRight,
  Plus,
  Pause,
  Play,
  Square,
  Zap,
} from "lucide-react";
import { extractTikTokUrls } from "@/lib/utils";

interface UrlInputSectionProps {
  onStartTranscription: (urls: string[]) => void;
  isLoading: boolean;
  isPaused?: boolean;
  queueCount?: number;
  onPause?: () => void;
  onResume?: () => void;
  onCancelQueue?: () => void;
}

const SAMPLE_TIKTOK_URLS = [
  "https://www.tiktok.com/@tiktok/video/7106594312292453678",
  "https://www.tiktok.com/@scout2015/video/6718335390845095173",
];

export function UrlInputSection({
  onStartTranscription,
  isLoading,
  isPaused = false,
  queueCount = 0,
  onPause,
  onResume,
  onCancelQueue,
}: UrlInputSectionProps) {
  const [inputText, setInputText] = useState("");
  const [detectedUrls, setDetectedUrls] = useState<string[]>([]);
  const [copiedNotification, setCopiedNotification] = useState(false);

  useEffect(() => {
    const urls = extractTikTokUrls(inputText);
    setDetectedUrls(urls);
  }, [inputText]);

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      const extracted = extractTikTokUrls(text);
      if (extracted.length > 0) {
        setInputText((prev) => {
          if (!prev.trim()) return extracted.join("\n");
          return `${prev.trim()}\n${extracted.join("\n")}`;
        });
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 2000);
      } else {
        setInputText((prev) => (prev ? `${prev}\n${text}` : text));
      }
    } catch (err) {
      console.warn("Could not read clipboard:", err);
    }
  };

  const handleUseSampleUrls = () => {
    setInputText(SAMPLE_TIKTOK_URLS.join("\n"));
  };

  const handleClear = () => {
    setInputText("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (detectedUrls.length === 0) return;
    onStartTranscription(detectedUrls);
    setInputText(""); // Clear input so user is ready to add more links anytime
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-4 sm:p-6 shadow-xl border border-white/10 relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-48 h-48 bg-tiktok-pink/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-tiktok-cyan/10 rounded-full blur-3xl pointer-events-none" />

      {/* Active Processing / Paused Control Banner */}
      {isLoading && (
        <div className="mb-4 p-3 rounded-xl bg-black/60 border border-tiktok-cyan/30 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className={`w-3 h-3 rounded-full ${isPaused ? "bg-amber-400" : "bg-tiktok-cyan animate-ping"}`} />
              <span className={`absolute w-2 h-2 rounded-full ${isPaused ? "bg-amber-400" : "bg-tiktok-cyan"}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-tiktok-cyan" />
                {isPaused ? "Batch Transcription Paused" : "100 Turbo Parallel Processing Active"}
              </p>
              <p className="text-[11px] text-zinc-400">
                {queueCount > 0
                  ? `${queueCount} videos remaining in queue • Paste more links below to add anytime`
                  : "Finishing active workers..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pause / Resume Button */}
            {isPaused ? (
              <button
                type="button"
                onClick={onResume}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition active:scale-95"
                title="Resume batch transcription"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onPause}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/90 hover:bg-amber-400 text-black text-xs font-bold shadow-md shadow-amber-500/20 transition active:scale-95"
                title="Pause batch transcription"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </button>
            )}

            {/* Cancel Queue Button */}
            {onCancelQueue && (
              <button
                type="button"
                onClick={onCancelQueue}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-900/80 hover:text-red-300 text-zinc-400 text-xs font-medium border border-white/10 transition"
                title="Cancel remaining queue items"
              >
                <Square className="w-3 h-3" />
                <span>Stop</span>
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        {/* Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Video className="w-4 h-4 text-tiktok-pink" />
              TikTok Video Links
            </span>
            {detectedUrls.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-tiktok-cyan/20 text-tiktok-cyan border border-tiktok-cyan/30 flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-3 h-3" />
                {detectedUrls.length} {detectedUrls.length === 1 ? "Video" : "Videos"} ready
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Paste from Clipboard Button */}
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-white/10 transition hover:scale-105 active:scale-95 shadow-sm"
              title="Read clipboard and insert TikTok links"
            >
              <Clipboard className="w-3.5 h-3.5 text-tiktok-cyan" />
              <span>{copiedNotification ? "Pasted! ✓" : "Paste Clipboard"}</span>
            </button>

            {/* Try Samples */}
            <button
              type="button"
              onClick={handleUseSampleUrls}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium border border-white/5 transition"
              title="Insert sample TikTok URLs to test"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sample Links</span>
            </button>

            {/* Clear button */}
            {inputText && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/5 transition"
                title="Clear input"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Multi-line URL Input Textarea */}
        <div className="relative rounded-xl overflow-hidden border border-white/10 focus-within:border-tiktok-cyan/60 focus-within:ring-2 focus-within:ring-tiktok-cyan/20 transition-all">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste single or multiple TikTok URLs here (one per line)...&#10;e.g.&#10;https://www.tiktok.com/@user/video/7106594312292453678&#10;https://vt.tiktok.com/ZS...&#10;https://vm.tiktok.com/..."
            rows={4}
            className="w-full bg-zinc-950/70 p-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-y min-h-[100px] font-mono leading-relaxed"
          />
        </div>

        {/* Input Footer & Submit CTA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            {detectedUrls.length === 0 && inputText.trim() ? (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> No valid TikTok links detected yet
              </span>
            ) : (
              <span>Add links anytime — supports mobile (vm/vt) & 100 parallel batch</span>
            )}
          </div>

          <button
            type="submit"
            disabled={detectedUrls.length === 0}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white shadow-xl transition-all ${
              detectedUrls.length > 0
                ? "bg-gradient-to-r from-tiktok-pink via-[#fe2c55] to-tiktok-cyan hover:opacity-95 hover:scale-[1.02] active:scale-95 shadow-tiktok-pink/25 cursor-pointer"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60"
            }`}
          >
            {isLoading ? (
              <>
                <Plus className="w-4 h-4 text-tiktok-cyan stroke-[2.5]" />
                <span>
                  Add {detectedUrls.length > 0 ? `${detectedUrls.length} ` : ""}to Queue
                </span>
              </>
            ) : (
              <>
                <span>
                  Transcribe {detectedUrls.length > 1 ? `${detectedUrls.length} Videos` : "Video"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
