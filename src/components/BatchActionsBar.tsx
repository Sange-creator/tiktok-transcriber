"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  Download,
  Trash2,
  Search,
  Layers,
  CheckSquare,
  Square,
  X,
  RotateCcw,
  Music,
  Pause,
  Play,
  AlertCircle,
} from "lucide-react";
import { TranscriptionResult } from "@/lib/types";
import {
  copyToClipboard,
  downloadFile,
  downloadAudioFile,
  formatDuration,
  generateCombinedMarkdown,
  generateCombinedPlainText,
} from "@/lib/utils";

interface BatchActionsBarProps {
  items: TranscriptionResult[];
  selectedIds: Set<string>;
  onToggleSelectAll: () => void;
  onDeleteSelected: () => void;
  onDeselectAll: () => void;
  onClearAll: () => void;
  onRetranscribeSelected?: () => void;
  onRetranscribeFailed?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isProcessing?: boolean;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancelQueue?: () => void;
  queueCount?: number;
}

export function BatchActionsBar({
  items,
  selectedIds,
  onToggleSelectAll,
  onDeleteSelected,
  onDeselectAll,
  onClearAll,
  onRetranscribeSelected,
  onRetranscribeFailed,
  searchQuery,
  onSearchChange,
  isProcessing = false,
  isPaused = false,
  onPause,
  onResume,
  onCancelQueue,
  queueCount = 0,
}: BatchActionsBarProps) {
  const [copiedState, setCopiedState] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const completed = items.filter((i) => i.status === "completed");
  const failed = items.filter((i) => i.status === "error");
  const selectedItems = items.filter((i) => selectedIds.has(i.id));
  const selectedCompleted = selectedItems.filter((i) => i.status === "completed");

  const totalWords = completed.reduce((acc, curr) => acc + (curr.wordCount || 0), 0);
  const totalDuration = completed.reduce((acc, curr) => acc + (curr.duration || 0), 0);

  if (items.length === 0) return null;

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isSomeSelected = selectedIds.size > 0;

  // Copy either selected items or all completed items
  const handleCopy = async (format: "plain" | "markdown" = "plain") => {
    const targetItems = isSomeSelected ? selectedCompleted : completed;
    if (targetItems.length === 0) return;

    const textToCopy =
      format === "markdown"
        ? generateCombinedMarkdown(targetItems)
        : generateCombinedPlainText(targetItems);

    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2200);
    }
  };

  // Download either selected items or all completed items
  const handleDownload = (format: "plain" | "markdown" | "json") => {
    const targetItems = isSomeSelected ? selectedCompleted : completed;
    if (targetItems.length === 0) return;

    const timestamp = new Date().toISOString().slice(0, 10);
    const prefix = isSomeSelected ? `tiktok_selected_${targetItems.length}` : `tiktok_transcripts`;

    if (format === "markdown") {
      downloadFile(
        `${prefix}_${timestamp}.md`,
        generateCombinedMarkdown(targetItems),
        "text/markdown;charset=utf-8"
      );
    } else if (format === "json") {
      downloadFile(
        `${prefix}_${timestamp}.json`,
        JSON.stringify(targetItems, null, 2),
        "application/json;charset=utf-8"
      );
    } else {
      downloadFile(
        `${prefix}_${timestamp}.txt`,
        generateCombinedPlainText(targetItems),
        "text/plain;charset=utf-8"
      );
    }
    setShowExportMenu(false);
  };

  // Download all available audio tracks from completed items
  const handleDownloadAudios = () => {
    const targetItems = (isSomeSelected ? selectedCompleted : completed).filter((i) => i.audioUrl);
    if (targetItems.length === 0) return;

    targetItems.forEach((item, index) => {
      setTimeout(() => {
        const filename = `tiktok_audio_${item.metadata?.author || "video"}_${item.id}.mp3`;
        downloadAudioFile(filename, item.audioUrl!);
      }, index * 250);
    });
    setShowExportMenu(false);
  };

  return (
    <div
      className={`sticky top-20 z-30 w-full glass-panel rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-2xl transition-all ${
        isSomeSelected
          ? "border-2 border-tiktok-cyan/70 ring-4 ring-tiktok-cyan/15 bg-zinc-950/90"
          : "border border-white/15"
      }`}
    >
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left Side: Select All & Stats & Live Processing Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Select All / Deselect Toggle */}
          <button
            type="button"
            onClick={onToggleSelectAll}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 ${
              isAllSelected
                ? "bg-tiktok-cyan border-tiktok-cyan text-black"
                : isSomeSelected
                ? "bg-tiktok-cyan/20 border-tiktok-cyan/40 text-tiktok-cyan"
                : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white"
            }`}
            title={isAllSelected ? "Deselect All" : "Select All"}
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span>
              {isAllSelected
                ? "Deselect All"
                : isSomeSelected
                ? `${selectedIds.size} of ${items.length} Selected`
                : "Select All"}
            </span>
          </button>

          {/* Live Pause / Resume Button inside sticky bar if processing */}
          {isProcessing && (
            <div className="flex items-center gap-1.5">
              {isPaused ? (
                <button
                  type="button"
                  onClick={onResume}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition active:scale-95 animate-pulse"
                  title="Resume queue"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume ({queueCount})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onPause}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md shadow-amber-500/20 transition active:scale-95"
                  title="Pause queue"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </button>
              )}
            </div>
          )}

          {/* Counts */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-semibold">
            <Layers className="w-3.5 h-3.5 text-tiktok-cyan" />
            <span>
              {completed.length} / {items.length} Transcribed
            </span>
          </div>

          {/* Failed count & retry failed button */}
          {failed.length > 0 && onRetranscribeFailed && (
            <button
              type="button"
              onClick={onRetranscribeFailed}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-semibold transition active:scale-95"
              title="Retranscribe all failed videos"
            >
              <RotateCcw className="w-3 h-3 text-red-400" />
              <span>Retry {failed.length} Failed</span>
            </button>
          )}

          {totalWords > 0 && (
            <span className="text-xs text-zinc-400 font-medium hidden lg:inline">
              {totalWords.toLocaleString()} words • {formatDuration(totalDuration)}
            </span>
          )}
        </div>

        {/* Right Side: Search & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-tiktok-cyan"
            />
          </div>

          {/* If Items are Selected: Show Selected Toolbar */}
          {isSomeSelected ? (
            <>
              {/* Retranscribe Selected */}
              {onRetranscribeSelected && (
                <button
                  type="button"
                  onClick={onRetranscribeSelected}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 border border-white/15 shadow-md transition active:scale-95 animate-in fade-in"
                  title={`Retranscribe ${selectedIds.size} selected videos`}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-tiktok-cyan" />
                  <span>Retranscribe ({selectedIds.size})</span>
                </button>
              )}

              {/* Delete Selected Button */}
              <button
                type="button"
                onClick={onDeleteSelected}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 border border-red-500/50 shadow-lg shadow-red-600/25 transition active:scale-95 animate-in fade-in"
                title={`Delete ${selectedIds.size} selected transcriptions`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete ({selectedIds.size})</span>
              </button>

              {/* Copy Selected Button */}
              {selectedCompleted.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleCopy("plain")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                    copiedState
                      ? "bg-emerald-500 text-white shadow-emerald-500/25"
                      : "bg-tiktok-cyan text-black hover:opacity-90 shadow-tiktok-cyan/20"
                  }`}
                  title="Copy selected transcripts"
                >
                  {copiedState ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied! ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Selected</span>
                    </>
                  )}
                </button>
              )}

              {/* Export Selected Dropdown */}
              {selectedCompleted.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-white/10 transition"
                    title="Export selected transcripts"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </button>

                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-52 rounded-xl bg-zinc-900 border border-white/15 shadow-2xl z-40 p-1.5 space-y-1 animate-in fade-in">
                      <button
                        onClick={() => handleDownload("plain")}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-white/10 flex items-center justify-between"
                      >
                        <span>Plain Text (.txt)</span>
                      </button>
                      <button
                        onClick={() => handleDownload("markdown")}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-white/10 flex items-center justify-between"
                      >
                        <span>Markdown (.md)</span>
                      </button>
                      <button
                        onClick={() => handleDownload("json")}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-white/10 flex items-center justify-between"
                      >
                        <span>JSON Data (.json)</span>
                      </button>
                      <button
                        onClick={handleDownloadAudios}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-tiktok-cyan hover:bg-white/10 flex items-center justify-between border-t border-white/5 pt-1.5"
                      >
                        <span className="flex items-center gap-1.5">
                          <Music className="w-3.5 h-3.5 text-tiktok-pink" /> Download MP3s
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">.mp3</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Deselect Button */}
              <button
                type="button"
                onClick={onDeselectAll}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
                title="Cancel selection"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            /* Regular Master Copy All & Export All */
            <>
              {completed.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleCopy("plain")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                    copiedState
                      ? "bg-emerald-500 text-white shadow-emerald-500/25"
                      : "bg-gradient-to-r from-tiktok-pink via-[#fe2c55] to-tiktok-cyan text-white hover:opacity-90 shadow-tiktok-pink/20"
                  }`}
                  title="Copy all completed transcripts to clipboard"
                >
                  {copiedState ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>All Copied! ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All Transcripts</span>
                    </>
                  )}
                </button>
              )}

              {completed.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-white/10 transition"
                    title="Download all transcripts"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Export All</span>
                  </button>

                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-52 rounded-xl bg-zinc-900 border border-white/15 shadow-2xl z-40 p-1.5 space-y-1 animate-in fade-in">
                      <button
                        onClick={() => handleDownload("plain")}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-white/10 flex items-center justify-between"
                      >
                        <span>Plain Text (.txt)</span>
                      </button>
                      <button
                        onClick={() => handleDownload("markdown")}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-white/10 flex items-center justify-between"
                      >
                        <span>Combined Markdown (.md)</span>
                      </button>
                      <button
                        onClick={() => handleDownload("json")}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-white/10 flex items-center justify-between"
                      >
                        <span>JSON Data (.json)</span>
                      </button>
                      <button
                        onClick={handleDownloadAudios}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-tiktok-cyan hover:bg-white/10 flex items-center justify-between border-t border-white/5 pt-1.5"
                      >
                        <span className="flex items-center gap-1.5">
                          <Music className="w-3.5 h-3.5 text-tiktok-pink" /> Download MP3s
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">.mp3</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Clear All History */}
              <button
                type="button"
                onClick={onClearAll}
                className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-white/5 transition"
                title="Clear all history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
