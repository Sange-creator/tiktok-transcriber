import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { downloadTikTokAudio } from "@/lib/extractor";
import { transcribeAudio } from "@/lib/transcriber";
import { isValidTikTokUrl } from "@/lib/utils";
import { TranscriptionResult } from "@/lib/types";

export const maxDuration = 60; // Allow long running tasks for video processing

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, settings } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid TikTok URL is required" },
        { status: 400 }
      );
    }

    const cleanUrl = url.trim();
    if (!isValidTikTokUrl(cleanUrl)) {
      return NextResponse.json(
        { error: "Invalid TikTok URL format. Please provide a link to a TikTok video." },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Resolve active cookie/sessionId from multi-account pool or direct cookie
    let activeCookie = settings?.tiktokCookies;
    if (settings?.tiktokSessions && Array.isArray(settings.tiktokSessions)) {
      const activeSessions = settings.tiktokSessions.filter(
        (s: any) => s.active && s.sessionId?.trim()
      );
      if (activeSessions.length > 0) {
        // Random/Round-robin distribution across active accounts
        const selected =
          activeSessions[Math.floor(Math.random() * activeSessions.length)];
        activeCookie = selected.sessionId.trim();
      }
    }

    // Step 1: Download & Extract Audio (supports optional TikTok login session pool)
    const { metadata, audioFilePath, audioFilename, duration } =
      await downloadTikTokAudio(cleanUrl, activeCookie);

    // Step 2: Transcribe the Audio
    const transcription = await transcribeAudio({
      audioFilePath,
      settings,
    });

    const endTime = Date.now();
    const wordCount = transcription.text
      ? transcription.text.trim().split(/\s+/).length
      : 0;

    // Convert audio file into a data URI for 100% reliable Vercel serverless playback
    let audioUrl = `/api/audio/${audioFilename}`;
    try {
      if (fs.existsSync(audioFilePath)) {
        const audioBuffer = fs.readFileSync(audioFilePath);
        if (audioBuffer.length > 0 && audioBuffer.length <= 4 * 1024 * 1024) {
          audioUrl = `data:audio/mp3;base64,${audioBuffer.toString("base64")}`;
        }
      }
    } catch (readErr) {
      console.warn("Could not encode audio as data URI, using stream endpoint:", readErr);
    }

    const result: TranscriptionResult = {
      id: metadata.id || `${Date.now()}`,
      url: cleanUrl,
      metadata,
      text: transcription.text,
      segments: transcription.segments,
      language: transcription.language,
      duration: duration || transcription.duration || metadata.duration,
      audioUrl,
      audioFilename,
      status: "completed",
      startedAt: startTime,
      completedAt: endTime,
      wordCount,
    };

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Transcription API error:", error);
    return NextResponse.json(
      {
        error: error.message || "An unexpected error occurred during transcription",
      },
      { status: 500 }
    );
  }
}
