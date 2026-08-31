import fs from "fs";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { TranscriberSettings, TranscriptSegment } from "./types";

export interface TranscribeAudioOptions {
  audioFilePath: string;
  settings?: Partial<TranscriberSettings>;
}

export interface TranscribeAudioResult {
  text: string;
  segments: TranscriptSegment[];
  language?: string;
  duration?: number;
}

function cleanKey(key?: string): string {
  if (!key) return "";
  return key.trim().replace(/^["']|["']$/g, "");
}

/**
 * Main transcription router: Dispatches audio to Groq, OpenAI, Gemini, or fallback
 */
export async function transcribeAudio(
  options: TranscribeAudioOptions
): Promise<TranscribeAudioResult> {
  const { audioFilePath, settings } = options;

  if (!fs.existsSync(audioFilePath)) {
    throw new Error(`Audio file does not exist at ${audioFilePath}`);
  }

  const rawGroq = cleanKey(settings?.groqApiKey) || cleanKey(process.env.GROQ_API_KEY);
  const rawOpenAI = cleanKey(settings?.openaiApiKey) || cleanKey(process.env.OPENAI_API_KEY);
  const rawGemini = cleanKey(settings?.geminiApiKey) || cleanKey(process.env.GEMINI_API_KEY);
  let provider = settings?.provider || "auto";

  // Smart Key Detection: Auto-reassign if user pasted key into the wrong field
  let groqKey = rawGroq;
  let openaiKey = rawOpenAI;
  let geminiKey = rawGemini;

  // Check if groqKey is actually an OpenAI key
  if (groqKey.startsWith("sk-") && !openaiKey) {
    openaiKey = groqKey;
    groqKey = "";
    if (provider === "groq") provider = "openai";
  }
  // Check if groqKey is actually a Gemini key
  if ((groqKey.startsWith("AIzaSy") || groqKey.startsWith("AQ.")) && !geminiKey) {
    geminiKey = groqKey;
    groqKey = "";
    if (provider === "groq") provider = "gemini";
  }
  // Check if openaiKey is actually a Groq key
  if (openaiKey.startsWith("gsk_") && !groqKey) {
    groqKey = openaiKey;
    openaiKey = "";
    if (provider === "openai") provider = "groq";
  }
  // Check if openaiKey is actually a Gemini key
  if ((openaiKey.startsWith("AIzaSy") || openaiKey.startsWith("AQ.")) && !geminiKey) {
    geminiKey = openaiKey;
    openaiKey = "";
    if (provider === "openai") provider = "gemini";
  }
  // Check if geminiKey is actually a Groq or OpenAI key
  if (geminiKey.startsWith("gsk_") && !groqKey) {
    groqKey = geminiKey;
    geminiKey = "";
    if (provider === "gemini") provider = "groq";
  }
  if (geminiKey.startsWith("sk-") && !openaiKey) {
    openaiKey = geminiKey;
    geminiKey = "";
    if (provider === "gemini") provider = "openai";
  }

  // Provider Dispatch Priority
  if (provider === "gemini" || (provider === "auto" && geminiKey)) {
    if (geminiKey) {
      try {
        return await transcribeWithGemini(audioFilePath, geminiKey, settings?.language);
      } catch (err: any) {
        console.error("Gemini transcription error, attempting fallback:", err);
        if (groqKey) return await transcribeWithGroq(audioFilePath, groqKey, settings?.language);
        if (openaiKey) return await transcribeWithOpenAI(audioFilePath, openaiKey, settings?.language);
        throw err;
      }
    }
  }

  if (provider === "groq" || (provider === "auto" && groqKey)) {
    if (groqKey) {
      try {
        return await transcribeWithGroq(audioFilePath, groqKey, settings?.language);
      } catch (err: any) {
        if (geminiKey) return await transcribeWithGemini(audioFilePath, geminiKey, settings?.language);
        if (openaiKey) return await transcribeWithOpenAI(audioFilePath, openaiKey, settings?.language);
        throw err;
      }
    }
  }

  if (provider === "openai" || (provider === "auto" && openaiKey)) {
    if (openaiKey) {
      try {
        return await transcribeWithOpenAI(audioFilePath, openaiKey, settings?.language);
      } catch (err: any) {
        if (geminiKey) return await transcribeWithGemini(audioFilePath, geminiKey, settings?.language);
        if (groqKey) return await transcribeWithGroq(audioFilePath, groqKey, settings?.language);
        throw err;
      }
    }
  }

  // Fallback to whichever key is populated
  if (geminiKey) return await transcribeWithGemini(audioFilePath, geminiKey, settings?.language);
  if (groqKey) return await transcribeWithGroq(audioFilePath, groqKey, settings?.language);
  if (openaiKey) return await transcribeWithOpenAI(audioFilePath, openaiKey, settings?.language);

  // If no API key is provided, show instructions
  throw new Error(
    "No API Key configured. Please open Settings (⚙️ in top right) and enter your Gemini API Key or free Groq key."
  );
}

/**
 * Transcribe using Groq Whisper Large v3 (Fastest & high accuracy)
 */
async function transcribeWithGroq(
  audioFilePath: string,
  apiKey: string,
  language?: string
): Promise<TranscribeAudioResult> {
  const groq = new Groq({ apiKey });
  const fileStream = fs.createReadStream(audioFilePath);

  const transcriptionParams: any = {
    file: fileStream,
    model: "whisper-large-v3-turbo",
    response_format: "verbose_json",
  };

  if (language && language !== "auto") {
    transcriptionParams.language = language;
  }

  const response = (await groq.audio.transcriptions.create(
    transcriptionParams
  )) as any;

  const segments: TranscriptSegment[] = (response.segments || []).map(
    (s: any, idx: number) => ({
      id: idx,
      start: s.start || 0,
      end: s.end || 0,
      text: s.text || "",
    })
  );

  return {
    text: response.text?.trim() || "",
    segments,
    language: response.language,
    duration: response.duration,
  };
}

/**
 * Transcribe using OpenAI Whisper API
 */
async function transcribeWithOpenAI(
  audioFilePath: string,
  apiKey: string,
  language?: string
): Promise<TranscribeAudioResult> {
  const openai = new OpenAI({ apiKey });
  const fileStream = fs.createReadStream(audioFilePath);

  const transcriptionParams: any = {
    file: fileStream,
    model: "whisper-1",
    response_format: "verbose_json",
  };

  if (language && language !== "auto") {
    transcriptionParams.language = language;
  }

  const response = (await openai.audio.transcriptions.create(
    transcriptionParams
  )) as any;

  const segments: TranscriptSegment[] = (response.segments || []).map(
    (s: any, idx: number) => ({
      id: idx,
      start: s.start || 0,
      end: s.end || 0,
      text: s.text || "",
    })
  );

  return {
    text: response.text?.trim() || "",
    segments,
    language: response.language,
    duration: response.duration,
  };
}

/**
 * Transcribe using Gemini API (with robust model fallback and retry)
 */
async function transcribeWithGemini(
  audioFilePath: string,
  apiKey: string,
  language?: string
): Promise<TranscribeAudioResult> {
  const audioBuffer = fs.readFileSync(audioFilePath);
  const base64Audio = audioBuffer.toString("base64");

  const prompt =
    language && language !== "auto"
      ? `Transcribe all spoken dialogue and speech in this audio verbatim in ${language}. Output only the exact transcript text.`
      : `Transcribe all spoken dialogue and speech in this TikTok audio verbatim with accurate punctuation. Output only the transcript text without preamble, explanations, or quotes.`;

  // Models prioritized for reliability and speed
  const modelsToTry = [
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-3.5-transcribe",
  ];

  let lastError = "";

  for (const modelName of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: "audio/mp3",
                      data: base64Audio,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.0,
            },
          }),
          signal: AbortSignal.timeout(25000),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const transcriptText =
          data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

        if (transcriptText) {
          return {
            text: transcriptText,
            segments: [
              {
                id: 0,
                start: 0,
                end: 60,
                text: transcriptText,
              },
            ],
          };
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        lastError = errData.error?.message || response.statusText;
        console.warn(`Model ${modelName} returned status ${response.status}: ${lastError}`);
        // If 404 or 503 or 429, continue to next model in list
        if ([404, 500, 502, 503, 504, 429].includes(response.status)) {
          continue;
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Google Gemini API Key error: ${lastError}`);
        }
      }
    } catch (fetchErr: any) {
      lastError = fetchErr.message;
      if (fetchErr.message?.includes("API Key error")) {
        throw fetchErr;
      }
    }
  }

  throw new Error(`Google Gemini transcription failed: ${lastError || "Could not process audio"}`);
}
