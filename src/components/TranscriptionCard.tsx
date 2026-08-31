"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  Download,
  Trash2,
  RotateCcw,
  ExternalLink,
  Clock,
  FileText,
  Subtitles,
  Code,
  Music,
  User,
  AlertTriangle,
  Sparkles,
  Edit3,
  Save,
  FileCheck2,
} from "lucide-react";
import { TranscriptionResult, ExportFormat } from "@/lib/types";
import {
  copyToClipboard,
  downloadFile,
  formatDuration,
  generateMarkdown,
  generateSrt,
  generateVtt,
} from "@/lib/utils";
import { AudioPlayer } from "./AudioPlayer";

interface TranscriptionCardProps {
  item: TranscriptionResult;
  onRetry: (url: string) => void;
  onDelete: (id: string) => void;
  onUpdateText?: (id: string, newText: string) => void;
  searchQuery?: string;
  apiKey?: string;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function TranscriptionCard({
  item,
  onRetry,
  onDelete,
  onUpdateText,
  searchQuery = "",
  apiKey,
  isSelected = false,
  onToggleSelect,
}: TranscriptionCardProps) {
  const [viewFormat, setViewFormat] = useState<"plain" | "timestamps" | "markdown">("plain");
  const [copiedState, setCopiedState] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(item.text || "");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [imgError, setImgError] = useState(false);

  const getExportContent = (format: ExportFormat): { content: string; filename: string; mime: string } => {
    const baseName = `transcript_${item.metadata?.author || "tiktok"}_${item.id}`.replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    );

    switch (format) {
      case "srt":
        return {
          content: generateSrt(item),
          filename: `${baseName}.srt`,
          mime: "text/plain;charset=utf-8",
        };
      case "vtt":
        return {
          content: generateVtt(item),
          filename: `${baseName}.vtt`,
          mime: "text/vtt;charset=utf-8",
        };
      case "markdown":
        return {
          content: generateMarkdown(item),
          filename: `${baseName}.md`,
          mime: "text/markdown;charset=utf-8",
        };
      case "json":
        return {
          content: JSON.stringify(item, null, 2),
          filename: `${baseName}.json`,
          mime: "application/json;charset=utf-8",
        };
      case "text":
      default:
        return {
          content: item.text,
          filename: `${baseName}.txt`,
          mime: "text/plain;charset=utf-8",
        };
    }
  };

  const handleCopyCurrentView = async () => {
    let textToCopy = item.text;
    if (viewFormat === "timestamps") {
      textToCopy = generateSrt(item);
    } else if (viewFormat === "markdown") {
      textToCopy = generateMarkdown(item);
    }

    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    }
  };

  const handleSaveEdit = () => {
    if (onUpdateText) {
      onUpdateText(item.id, editedText);
    }
    setIsEditing(false);
  };

  const handleGenerateSummary = async () => {
    if (aiSummary || isSummarizing || !item.text) return;
    setIsSummarizing(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: item.text, apiKey }),
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setAiSummary(data.summary);
      }
    } catch (err) {
      console.warn("Summary generation error:", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDownload = (format: ExportFormat) => {
    const { content, filename, mime } = getExportContent(format);
    downloadFile(filename, content, mime);
    setShowExportMenu(false);
  };

  const renderHighlightedText = (text: string) => {
    if (!searchQuery.trim()) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark
              key={i}
              className="bg-amber-400/30 text-amber-200 px-0.5 rounded"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div
      className={`glass-panel rounded-2xl overflow-hidden shadow-2xl transition-all ${
        isSelected
          ? "border-2 border-tiktok-cyan ring-4 ring-tiktok-cyan/15 bg-tiktok-cyan/[0.02]"
          : "border border-white/10 glass-panel-hover"
      }`}
    >
      {/* Video Header Card */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-start gap-3 min-w-0">
          {/* Checkbox for Multi-Selection */}
          {onToggleSelect && (
            <button
              type="button"
              onClick={() => onToggleSelect(item.id)}
              className={`mt-2 w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                isSelected
                  ? "bg-tiktok-cyan border-tiktok-cyan text-black shadow-md shadow-tiktok-cyan/30"
                  : "border-white/20 bg-black/40 hover:border-tiktok-cyan/50 text-transparent"
              }`}
              title={isSelected ? "Deselect video" : "Select video"}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          )}

          {/* Thumbnail Preview */}
          <div className="relative w-14 h-18 sm:w-16 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 flex items-center justify-center shadow-md">
            {item.metadata?.coverUrl && !imgError ? (
              <img
                src={
                  item.metadata.coverUrl.startsWith("/")
                    ? `https://www.tikwm.com${item.metadata.coverUrl}`
                    : item.metadata.coverUrl
                }
                alt={item.metadata.title || "TikTok Cover"}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 p-2 text-center">
                <Music className="w-5 h-5 text-tiktok-pink animate-pulse" />
                <span className="text-[9px] font-bold text-zinc-400 mt-1 font-mono uppercase truncate max-w-[48px]">
                  {item.metadata?.author?.slice(0, 4) || "TT"}
                </span>
              </div>
            )}
          </div>

          {/* Title & Author Info */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-tiktok-cyan flex items-center gap-1">
                <User className="w-3 h-3" />
                @{item.metadata?.author || "tiktok_creator"}
              </span>
              {item.duration ? (
                <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(item.duration)}
                </span>
              ) : null}
              {item.wordCount ? (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10">
                  {item.wordCount} words
                </span>
              ) : null}
            </div>

            <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2 leading-snug">
              {item.metadata?.title || item.url}
            </h3>

            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-zinc-500 hover:text-tiktok-pink flex items-center gap-1 transition truncate max-w-xs"
            >
              <span>{item.url}</span>
              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </a>
          </div>
        </div>

        {/* Top Right Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {item.status === "completed" && (
            <>
              {/* Instant Master Copy Button */}
              <button
                onClick={handleCopyCurrentView}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                  copiedState
                    ? "bg-emerald-500 text-white shadow-emerald-500/25"
                    : "bg-gradient-to-r from-tiktok-pink via-[#fe2c55] to-tiktok-cyan text-white hover:opacity-95 shadow-tiktok-pink/20"
                }`}
                title="Copy full transcript to clipboard"
              >
                {copiedState ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied! ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              {/* AI Summary Button */}
              <button
                onClick={handleGenerateSummary}
                disabled={isSummarizing || Boolean(aiSummary)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-amber-300 text-xs font-medium border border-amber-500/20 transition hover:scale-105 active:scale-95 disabled:opacity-50"
                title="Generate AI Key Takeaways"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isSummarizing ? "Summarizing..." : "Summary"}</span>
              </button>

              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-white/10 transition"
                  title="Download transcript"
                >
                  <Download className="w-4 h-4" />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-44 rounded-xl bg-zinc-900 border border-white/15 shadow-2xl z-30 p-1.5 space-y-1 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => handleDownload("text")}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-white/10 flex items-center justify-between"
                    >
                      <span>Plain Text</span>
                      <span className="text-[10px] text-zinc-500">.txt</span>
                    </button>
                    <button
                      onClick={() => handleDownload("srt")}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-white/10 flex items-center justify-between"
                    >
                      <span>Subtitles (SRT)</span>
                      <span className="text-[10px] text-zinc-500">.srt</span>
                    </button>
                    <button
                      onClick={() => handleDownload("markdown")}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-white/10 flex items-center justify-between"
                    >
                      <span>Markdown</span>
                      <span className="text-[10px] text-zinc-500">.md</span>
                    </button>
                    <button
                      onClick={() => handleDownload("json")}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-white/10 flex items-center justify-between"
                    >
                      <span>Full JSON</span>
                      <span className="text-[10px] text-zinc-500">.json</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Delete Button */}
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-white/5 transition"
            title="Remove from list"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body / Content Area */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Processing State */}
        {(item.status === "extracting" || item.status === "transcribing") && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-tiktok-pink/20 border-t-tiktok-pink animate-spin" />
              <div className="w-8 h-8 rounded-full bg-tiktok-cyan/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-tiktok-cyan animate-pulse" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {item.status === "extracting"
                  ? "⚡ Fetching audio from TikTok..."
                  : "🎙️ AI Transcribing speech..."}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {item.status === "extracting"
                  ? "Extracting audio stream"
                  : "Recognizing speech verbatim"}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {item.status === "error" && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-300">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-red-200">Transcription Encountered An Issue</p>
                <p className="text-red-300/80 mt-0.5">{item.error || "Failed to process video."}</p>
              </div>
            </div>
            <button
              onClick={() => onRetry(item.url)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-semibold border border-red-500/30 transition shrink-0 self-end sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Completed State */}
        {item.status === "completed" && (
          <>
            {/* AI Summary Box if generated */}
            {aiSummary && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Key Takeaways</span>
                </div>
                <div className="text-xs text-amber-100/90 whitespace-pre-wrap leading-relaxed">
                  {aiSummary}
                </div>
              </div>
            )}

            {/* View Format Selector Tabs & Edit toggle */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10">
                <button
                  onClick={() => setViewFormat("plain")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    viewFormat === "plain"
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Plain Text</span>
                </button>
                <button
                  onClick={() => setViewFormat("timestamps")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    viewFormat === "timestamps"
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Subtitles className="w-3 h-3" />
                  <span>Timestamps / SRT</span>
                </button>
                <button
                  onClick={() => setViewFormat("markdown")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    viewFormat === "markdown"
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Code className="w-3 h-3" />
                  <span>Markdown</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Edit transcript text toggle */}
                <button
                  onClick={() => {
                    if (isEditing) handleSaveEdit();
                    else setIsEditing(true);
                  }}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition"
                >
                  {isEditing ? (
                    <>
                      <Save className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Save Edits</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </>
                  )}
                </button>

                {/* Quick Copy Link */}
                <button
                  onClick={handleCopyCurrentView}
                  className="text-xs text-zinc-400 hover:text-tiktok-cyan flex items-center gap-1 transition font-medium"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedState ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Transcript Display Box */}
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/10 font-sans text-sm text-zinc-200 max-h-80 overflow-y-auto leading-relaxed selection:bg-tiktok-pink selection:text-white">
              {isEditing ? (
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full bg-black/60 p-2.5 rounded-lg border border-white/20 text-sm text-white focus:outline-none focus:border-tiktok-cyan resize-y min-h-[120px] font-sans leading-relaxed"
                />
              ) : (
                <>
                  {viewFormat === "plain" && (
                    <p className="whitespace-pre-wrap">
                      {item.text ? (
                        renderHighlightedText(item.text)
                      ) : (
                        <span className="text-zinc-500 italic">
                          No spoken dialogue detected in this video.
                        </span>
                      )}
                    </p>
                  )}

                  {viewFormat === "timestamps" && (
                    <div className="space-y-2 font-mono text-xs">
                      {item.segments && item.segments.length > 0 ? (
                        item.segments.map((seg) => (
                          <div
                            key={seg.id}
                            className="flex items-start gap-2.5 group hover:bg-white/5 p-1 rounded"
                          >
                            <span className="text-tiktok-cyan/80 shrink-0 font-semibold">
                              [{formatDuration(seg.start)} - {formatDuration(seg.end)}]
                            </span>
                            <span className="text-zinc-300">
                              {renderHighlightedText(seg.text.trim())}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="whitespace-pre-wrap">{generateSrt(item)}</p>
                      )}
                    </div>
                  )}

                  {viewFormat === "markdown" && (
                    <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-300">
                      {generateMarkdown(item)}
                    </pre>
                  )}
                </>
              )}
            </div>

            {/* In-app Audio Preview Player */}
            {item.audioUrl && (
              <div className="pt-1">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1.5">
                  <Music className="w-3.5 h-3.5 text-tiktok-pink" />
                  <span>Audio Preview (with Speed Controls)</span>
                </div>
                <AudioPlayer src={item.audioUrl} duration={item.duration} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
