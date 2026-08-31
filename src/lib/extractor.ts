import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";
import { VideoMetadata } from "./types";

const execAsync = promisify(exec);

// Standard temp directory for downloaded audio
const AUDIO_DIR = path.join(os.tmpdir(), "tiktok_transcriber_audio");
if (!fs.existsSync(AUDIO_DIR)) {
  try {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create audio temp directory:", err);
  }
}

export function getAudioDir(): string {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }
  return AUDIO_DIR;
}

export interface ExtractedAudioResult {
  metadata: VideoMetadata;
  audioFilePath: string;
  audioFilename: string;
  duration?: number;
}

/**
 * Normalizes and cleans a TikTok URL by removing analytics & tracking parameters
 */
export function normalizeTikTokUrl(rawUrl: string): string {
  let clean = rawUrl.trim();
  try {
    const parsed = new URL(clean);
    // Keep host and pathname, drop all UTM / tracking query params
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return clean;
  }
}

/**
 * Fetch video metadata from TikTok URL using TikWM POST API or oembed/yt-dlp
 */
export async function extractTikTokMetadata(url: string): Promise<VideoMetadata> {
  const cleanUrl = normalizeTikTokUrl(url);
  const id = Buffer.from(cleanUrl).toString("base64").slice(0, 16);

  // Strategy 1: High-speed TikWM POST API
  try {
    const params = new URLSearchParams();
    params.append("url", cleanUrl);
    params.append("web", "1");
    params.append("hd", "1");

    const response = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: params.toString(),
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.code === 0 && data.data) {
        const item = data.data;
        return {
          id: item.id || id,
          url: cleanUrl,
          title: item.title || "TikTok Video",
          author: item.author?.unique_id || item.author?.nickname || "tiktok_user",
          authorNickname: item.author?.nickname,
          avatarUrl: item.author?.avatar?.startsWith("/")
            ? `https://www.tikwm.com${item.author.avatar}`
            : item.author?.avatar,
          coverUrl: item.cover?.startsWith("/")
            ? `https://www.tikwm.com${item.cover}`
            : item.cover || item.origin_cover,
          duration: item.duration || 0,
          viewCount: item.play_count,
          likeCount: item.digg_count,
        };
      }
    }
  } catch (err) {
    console.warn("TikWM metadata POST fetch failed:", err);
  }

  // Strategy 2: Official TikTok oembed
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanUrl)}`;
    const response = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      const data = await response.json();
      return {
        id,
        url: cleanUrl,
        title: data.title || "TikTok Video",
        author: data.author_unique_id || data.author_name || "creator",
        authorNickname: data.author_name,
        coverUrl: data.thumbnail_url,
      };
    }
  } catch (err) {
    console.warn("TikTok oembed fetch failed:", err);
  }

  // Strategy 3: yt-dlp metadata extraction
  try {
    const ytdlpPath = findYtDlpPath();
    const { stdout } = await execAsync(
      `"${ytdlpPath}" --dump-json --no-playlist --skip-download "${cleanUrl}"`,
      { timeout: 12000, env: { ...process.env, PATH: `/opt/homebrew/bin:${process.env.PATH}` } }
    );
    const info = JSON.parse(stdout);
    return {
      id: info.id || id,
      url: cleanUrl,
      title: info.title || info.description || "TikTok Video",
      author: info.uploader_id || info.uploader || "creator",
      authorNickname: info.uploader,
      coverUrl: info.thumbnail,
      duration: info.duration,
      viewCount: info.view_count,
      likeCount: info.like_count,
    };
  } catch (err) {
    console.warn("yt-dlp metadata extraction fallback:", err);
  }

  // Default fallback
  return {
    id,
    url: cleanUrl,
    title: "TikTok Video",
    author: "TikTok User",
  };
}

/**
 * Downloads the TikTok audio directly into a fast 16kHz mono speech-optimized MP3
 */
export async function downloadTikTokAudio(url: string): Promise<ExtractedAudioResult> {
  const cleanUrl = normalizeTikTokUrl(url);
  const audioDir = getAudioDir();
  const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const audioFilename = `${fileId}.mp3`;
  const audioFilePath = path.join(audioDir, audioFilename);
  const ffmpegPath = findFfmpegPath();

  // Strategy 1: Fast TikWM Direct API with Audio-first Extraction
  try {
    const params = new URLSearchParams();
    params.append("url", cleanUrl);
    params.append("web", "1");
    params.append("hd", "1");

    const response = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: params.toString(),
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.code === 0 && data.data) {
        const item = data.data;
        const metadata: VideoMetadata = {
          id: item.id || `${Date.now()}`,
          url: cleanUrl,
          title: item.title || "TikTok Video",
          author: item.author?.unique_id || item.author?.nickname || "tiktok_user",
          authorNickname: item.author?.nickname,
          avatarUrl: item.author?.avatar?.startsWith("/")
            ? `https://www.tikwm.com${item.author.avatar}`
            : item.author?.avatar,
          coverUrl: item.cover?.startsWith("/")
            ? `https://www.tikwm.com${item.cover}`
            : item.cover || item.origin_cover,
          duration: item.duration || 0,
          viewCount: item.play_count,
          likeCount: item.digg_count,
        };

        // 1. First priority: Direct audio music stream (only ~300KB, downloads in <0.2s!)
        const musicUrl = item.music || item.music_info?.play;
        if (musicUrl) {
          const resolvedMusicUrl = musicUrl.startsWith("/")
            ? `https://www.tikwm.com${musicUrl}`
            : musicUrl;

          try {
            const mRes = await fetch(resolvedMusicUrl, {
              headers: { "User-Agent": "Mozilla/5.0", Referer: "https://www.tiktok.com/" },
              signal: AbortSignal.timeout(10000),
            });

            if (mRes.ok) {
              const arrayBuffer = await mRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              if (buffer.length > 5000) {
                const tempRaw = path.join(audioDir, `${fileId}_mraw`);
                fs.writeFileSync(tempRaw, buffer);

                // Convert to ultra-compact 16kHz mono speech MP3
                try {
                  await execAsync(
                    `"${ffmpegPath}" -y -i "${tempRaw}" -vn -ar 16000 -ac 1 -b:a 32k -preset ultrafast "${audioFilePath}"`,
                    { env: { ...process.env, PATH: `/opt/homebrew/bin:${process.env.PATH}` } }
                  );
                } catch {
                  fs.copyFileSync(tempRaw, audioFilePath);
                } finally {
                  if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw);
                }

                if (fs.existsSync(audioFilePath) && fs.statSync(audioFilePath).size > 1000) {
                  return {
                    metadata,
                    audioFilePath,
                    audioFilename,
                    duration: metadata.duration,
                  };
                }
              }
            }
          } catch (mErr) {
            console.warn("Direct music fetch failed, falling back to video stream:", mErr);
          }
        }

        // 2. Second priority: Stream from video URL directly via FFmpeg
        const videoUrl = item.play || item.wmplay;
        if (videoUrl) {
          const resolvedVideoUrl = videoUrl.startsWith("/")
            ? `https://www.tikwm.com${videoUrl}`
            : videoUrl;

          try {
            // Direct streaming extraction: FFmpeg connects to HTTP stream and extracts audio without full video download
            await execAsync(
              `"${ffmpegPath}" -y -headers "User-Agent: Mozilla/5.0\r\nReferer: https://www.tiktok.com/\r\n" -i "${resolvedVideoUrl}" -vn -ar 16000 -ac 1 -b:a 32k -preset ultrafast "${audioFilePath}"`,
              { timeout: 20000, env: { ...process.env, PATH: `/opt/homebrew/bin:${process.env.PATH}` } }
            );

            if (fs.existsSync(audioFilePath) && fs.statSync(audioFilePath).size > 1000) {
              return {
                metadata,
                audioFilePath,
                audioFilename,
                duration: metadata.duration,
              };
            }
          } catch (streamErr) {
            console.warn("FFmpeg stream extraction failed, trying buffered download:", streamErr);
          }
        }
      }
    }
  } catch (tikwmErr) {
    console.warn("TikWM extraction failed, falling back to yt-dlp:", tikwmErr);
  }

  // Strategy 2: yt-dlp Download & Extraction Fallback
  try {
    const metadata = await extractTikTokMetadata(cleanUrl);
    const ytdlpPath = findYtDlpPath();
    const outputTemplate = path.join(audioDir, `${fileId}.%(ext)s`);

    const command = `"${ytdlpPath}" -x --audio-format mp3 --ffmpeg-location "${ffmpegPath}" --audio-quality 0 -o "${outputTemplate}" --no-playlist "${cleanUrl}"`;
    await execAsync(command, {
      timeout: 30000,
      env: { ...process.env, PATH: `/opt/homebrew/bin:${process.env.PATH}` },
    });

    if (fs.existsSync(audioFilePath)) {
      return {
        metadata,
        audioFilePath,
        audioFilename,
        duration: metadata.duration,
      };
    }

    const matchedFiles = fs.readdirSync(audioDir).filter((f) => f.startsWith(fileId));
    if (matchedFiles.length > 0) {
      const foundFile = path.join(audioDir, matchedFiles[0]);
      return {
        metadata,
        audioFilePath: foundFile,
        audioFilename: matchedFiles[0],
        duration: metadata.duration,
      };
    }
  } catch (ytdlpErr: any) {
    console.error("yt-dlp fallback error:", ytdlpErr);
  }

  throw new Error(
    "Could not extract audio from this TikTok URL. Please verify the URL is public and accessible."
  );
}

function findYtDlpPath(): string {
  const possiblePaths = [
    "/opt/homebrew/bin/yt-dlp",
    "/usr/local/bin/yt-dlp",
    "/usr/bin/yt-dlp",
    "yt-dlp",
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return "yt-dlp";
}

function findFfmpegPath(): string {
  const possiblePaths = [
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/usr/bin/ffmpeg",
    "ffmpeg",
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return "ffmpeg";
}
