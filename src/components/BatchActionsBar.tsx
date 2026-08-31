"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  Download,
  Trash2,
  Search,
  FileText,
  FileCode,
  Layers,
  Sparkles,
} from "lucide-react";
import { TranscriptionResult } from "@/lib/types";
import {
  copyToClipboard,
  downloadFile,
  formatDuration,
  generateCombinedMarkdown,
  generateCombinedPlainText,
} from "@/lib/utils";

interface BatchActionsBarProps {
  items: TranscriptionResult[];
  onClearAll: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function BatchActionsBar({
  items,
  onClearAll,
  searchQuery,
  onSearchChange,
}: BatchActionsBarProps) {
  const [copiedAllState, setCopiedAllState] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const completed = items.filter((i) => i.status === "completed");
  const totalWords = completed.reduce((acc, curr) => acc + (curr.wordCount || 0), 0);
  const totalDuration = completed.reduce((acc, curr) => acc + (curr.duration || 0), 0);

  if (items.length === 0) return null;

  const handleCopyAll = async (format: "plain" | "markdown" = "plain") => {
    const textToCopy =
      format === "markdown"
        ? generateCombinedMarkdown(completed)
        : generateCombinedPlainText(completed);

    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopiedAllState(true);
      setTimeout(() => setCopiedAllState(false), 2200);
    }
  };

  const handleDownloadAll = (format: "plain" | "markdown" | "json") => {
    const timestamp = new Date().toISOString().slice(0, 10);
    if (format === "markdown") {
      downloadFile(
        `tiktok_transcripts_${timestamp}.md`,
        generateCombinedMarkdown(completed),
        "text/markdown;charset=utf-8"
      );
    } else if (format === "json") {
      downloadFile(
        `tiktok_transcripts_${timestamp}.json`,
        JSON.stringify(completed, null, 2),
        "application/json;charset=utf-8"
      );
    } else {
      downloadFile(
        `tiktok_transcripts_${timestamp}.txt`,
        generateCombinedPlainText(completed),
        "text/plain;charset=utf-8"
      );
    }
    setShowExportMenu(false);
  };

  return (
    <div className="sticky top-20 z-30 w-full glass-panel rounded-2xl p-3 sm:p-4 border border-white/15 shadow-2xl backdrop-blur-2xl">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Statistics & Counts */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-semibold">
            <Layers className="w-3.5 h-3.5 text-tiktok-cyan" />
            <span>
              {completed.length} / {items.length} Transcribed
            </span>
          </div>

          {totalWords > 0 && (
            <span className="text-xs text-zinc-400 font-medium">
              {totalWords.toLocaleString()} total words • {formatDuration(totalDuration)} audio
            </span>
          )}
        </div>

        {/* Search & Batch Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search in transcripts..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-tiktok-cyan"
            />
          </div>

          {/* Master Copy All Button */}
          {completed.length > 0 && (
            <button
              onClick={() => handleCopyAll("plain")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                copiedAllState
                  ? "bg-emerald-500 text-white shadow-emerald-500/25"
                  : "bg-gradient-to-r from-tiktok-pink via-[#fe2c55] to-tiktok-cyan text-white hover:opacity-90 shadow-tiktok-pink/20"
              }`}
              title="Copy all completed transcripts to clipboard"
            >
              {copiedAllState ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>All Copied to Clipboard! ✓</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy All Transcripts</span>
                </>
              )}
            </button>
          )}

          {/* Export All Dropdown */}
          {completed.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-white/10 transition"
                title="Download all transcripts"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export All</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-zinc-900 border border-white/15 shadow-2xl z-40 p-1.5 space-y-1 animate-in fade-in">
                  <button
                    onClick={() => handleDownloadAll("plain")}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-white/10 flex items-center justify-between"
                  >
                    <span>Plain Text (.txt)</span>
                  </button>
                  <button
                    onClick={() => handleDownloadAll("markdown")}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-white/10 flex items-center justify-between"
                  >
                    <span>Combined Markdown (.md)</span>
                  </button>
                  <button
                    onClick={() => handleDownloadAll("json")}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-white/10 flex items-center justify-between"
                  >
                    <span>JSON Data (.json)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Clear All */}
          <button
            onClick={onClearAll}
            className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-white/5 transition"
            title="Clear all results"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
