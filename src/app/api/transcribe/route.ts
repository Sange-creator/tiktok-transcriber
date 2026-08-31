import { NextRequest, NextResponse } from "next/server";
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

    // Step 1: Download & Extract Audio
    const { metadata, audioFilePath, audioFilename, duration } =
      await downloadTikTokAudio(cleanUrl);

    // Step 2: Transcribe the Audio
    const transcription = await transcribeAudio({
      audioFilePath,
      settings,
    });

    const endTime = Date.now();
    const wordCount = transcription.text
      ? transcription.text.trim().split(/\s+/).length
      : 0;

    const result: TranscriptionResult = {
      id: metadata.id || `${Date.now()}`,
      url: cleanUrl,
      metadata,
      text: transcription.text,
      segments: transcription.segments,
      language: transcription.language,
      duration: duration || transcription.duration || metadata.duration,
      audioUrl: `/api/audio/${audioFilename}`,
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
