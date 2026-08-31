import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TranscriptionResult, VideoMetadata } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts all valid TikTok URLs from an input string (supports multi-line, comma, space-separated, etc.)
 */
export function extractTikTokUrls(rawText: string): string[] {
  if (!rawText || typeof rawText !== "string") return [];

  // Match standard tiktok URLs, vt.tiktok, vm.tiktok, etc.
  const regex = /https?:\/\/(?:(?:www|m|v[tm])\.)?tiktok\.com\/(?:@[\w.-]+\/video\/\d+|v\/\d+|[\w.-]+|\S+)/gi;
  const matches = rawText.match(regex) || [];

  // Clean trailing punctuation or trailing query parameters if needed
  const cleaned = matches.map((url) => {
    // Remove trailing comma, period, bracket, or quotes that might have been pasted
    return url.replace(/[,)"'>]+$/, "").trim();
  });

  // Return unique URLs
  return Array.from(new Set(cleaned));
}

/**
 * Validates whether a single string is a valid TikTok URL
 */
export function isValidTikTokUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
  ) && (
    trimmed.includes("tiktok.com/") ||
    trimmed.includes("vt.tiktok.com") ||
    trimmed.includes("vm.tiktok.com")
  );
}

/**
 * Formats seconds into MM:SS or HH:MM:SS
 */
export function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds < 0) {
    return "0:00";
  }
  const sec = Math.floor(seconds);
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remainingSecs = sec % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
}

/**
 * Formats seconds to SRT timestamp format (00:00:00,000)
 */
export function formatSrtTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms
    .toString()
    .padStart(3, "0")}`;
}

/**
 * Formats seconds to VTT timestamp format (00:00:00.000)
 */
export function formatVttTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms
    .toString()
    .padStart(3, "0")}`;
}

/**
 * Converts transcript segments into SRT subtitle format
 */
export function generateSrt(result: TranscriptionResult): string {
  if (!result.segments || result.segments.length === 0) {
    // Fallback if no segments: create a single subtitle from start to end
    return `1\n00:00:00,000 --> ${formatSrtTimestamp(result.duration || 60)}\n${result.text}\n`;
  }

  return result.segments
    .map((seg, idx) => {
      return `${idx + 1}\n${formatSrtTimestamp(seg.start)} --> ${formatSrtTimestamp(seg.end)}\n${seg.text.trim()}\n`;
    })
    .join("\n");
}

/**
 * Converts transcript segments into WebVTT subtitle format
 */
export function generateVtt(result: TranscriptionResult): string {
  let vtt = "WEBVTT\n\n";
  if (!result.segments || result.segments.length === 0) {
    return vtt + `00:00:00.000 --> ${formatVttTimestamp(result.duration || 60)}\n${result.text}\n`;
  }

  vtt += result.segments
    .map((seg, idx) => {
      return `${idx + 1}\n${formatVttTimestamp(seg.start)} --> ${formatVttTimestamp(seg.end)}\n${seg.text.trim()}`;
    })
    .join("\n\n");

  return vtt;
}

/**
 * Generates a clean Markdown document for a transcript
 */
export function generateMarkdown(result: TranscriptionResult): string {
  const title = result.metadata?.title || "TikTok Video Transcript";
  const author = result.metadata?.author ? `@${result.metadata.author}` : "Unknown Creator";
  const duration = formatDuration(result.duration || result.metadata?.duration);
  const date = new Date().toLocaleDateString();

  let md = `# ${title}\n\n`;
  md += `- **Creator:** ${author}\n`;
  md += `- **URL:** ${result.url}\n`;
  md += `- **Duration:** ${duration}\n`;
  md += `- **Transcribed Date:** ${date}\n\n`;
  md += `## Transcript\n\n`;

  if (result.segments && result.segments.length > 0) {
    result.segments.forEach((seg) => {
      const timeStr = `[${formatDuration(seg.start)} - ${formatDuration(seg.end)}]`;
      md += `**${timeStr}** ${seg.text.trim()}\n\n`;
    });
  } else {
    md += `${result.text}\n\n`;
  }

  return md;
}

/**
 * Generates combined Markdown for multiple transcripts
 */
export function generateCombinedMarkdown(results: TranscriptionResult[]): string {
  const completed = results.filter((r) => r.status === "completed");
  if (completed.length === 0) return "";

  let md = `# TikTok Transcripts Collection (${completed.length} Videos)\n`;
  md += `Exported on ${new Date().toLocaleString()}\n\n---\n\n`;

  completed.forEach((res, idx) => {
    md += `## Video ${idx + 1}: ${res.metadata?.title || res.url}\n`;
    if (res.metadata?.author) md += `**Creator:** @${res.metadata.author} | `;
    md += `**URL:** ${res.url}\n\n`;
    md += `### Transcript:\n`;
    md += `${res.text}\n\n`;
    md += `---\n\n`;
  });

  return md;
}

/**
 * Generates combined plain text for multiple transcripts
 */
export function generateCombinedPlainText(results: TranscriptionResult[]): string {
  const completed = results.filter((r) => r.status === "completed");
  if (completed.length === 0) return "";

  return completed
    .map((res, idx) => {
      const header = `--- Video ${idx + 1} (${res.metadata?.author ? "@" + res.metadata.author : res.url}) ---`;
      return `${header}\n${res.text}\n`;
    })
    .join("\n\n");
}

/**
 * Copy text to clipboard with fallback for various browser environments
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback using textarea
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    return false;
  }
}

/**
 * Trigger browser file download
 */
export function downloadFile(filename: string, content: string, mimeType: string = "text/plain;charset=utf-8"): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download audio file from data URI or URL
 */
export async function downloadAudioFile(filename: string, audioUrl: string): Promise<void> {
  if (!audioUrl) return;

  const cleanFilename = filename.endsWith(".mp3") ? filename : `${filename}.mp3`;

  if (audioUrl.startsWith("data:")) {
    try {
      const parts = audioUrl.split(",");
      const mime = parts[0].match(/:(.*?);/)?.[1] || "audio/mp3";
      const byteCharacters = atob(parts[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mime });
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = cleanFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      return;
    } catch (e) {
      console.warn("Base64 conversion failed, falling back to direct anchor:", e);
    }
  }

  // Remote or local URL
  try {
    const res = await fetch(audioUrl);
    if (!res.ok) throw new Error("HTTP error");
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = cleanFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = cleanFilename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

