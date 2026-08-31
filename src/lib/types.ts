export interface VideoMetadata {
  id: string;
  url: string;
  title: string;
  author: string;
  authorNickname?: string;
  avatarUrl?: string;
  coverUrl?: string;
  duration?: number; // in seconds
  viewCount?: number;
  likeCount?: number;
}

export interface TranscriptSegment {
  id: number;
  start: number; // in seconds
  end: number; // in seconds
  text: string;
}

export interface TranscriptionResult {
  id: string;
  url: string;
  metadata?: VideoMetadata;
  text: string;
  segments?: TranscriptSegment[];
  language?: string;
  duration?: number;
  audioUrl?: string;
  audioFilename?: string;
  error?: string;
  status: "idle" | "extracting" | "transcribing" | "completed" | "error";
  progress?: number; // 0-100
  startedAt?: number;
  completedAt?: number;
  wordCount?: number;
}

export type TranscriptionProvider = "groq" | "openai" | "gemini" | "auto";

export interface TikTokAccountSession {
  id: string;
  name: string;
  sessionId: string; // sessionid or full cookie string
  active: boolean;
  createdAt?: number;
}

export interface TranscriberSettings {
  provider: TranscriptionProvider;
  groqApiKey?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  language?: string; // 'auto' or 'en', 'es', etc.
  includeTimestamps: boolean;
  temperature?: number;
  concurrency?: number; // Parallel batch worker count (default 4)
  tiktokCookies?: string; // Legacy/direct single cookie string
  tiktokSessions?: TikTokAccountSession[]; // Multi-account session pool
  rotateSessions?: boolean; // Enable round-robin session rotation
}

export type ExportFormat = "text" | "srt" | "vtt" | "markdown" | "json";
