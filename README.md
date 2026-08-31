# 🎙️ TikTok Video Transcriber

A modern, fast Next.js web application to transcribe single or multiple TikTok videos into accurate text, timestamped subtitles (SRT/VTT), and clean Markdown documents with instant copy-to-clipboard functionality.

---

## ✨ Features

- 🔗 **Single & Batch TikTok URLs**: Paste one or multiple TikTok links (separated by newlines, spaces, or commas).
- 📋 **1-Click "Paste Clipboard"**: Automatically parses TikTok video URLs directly from your clipboard.
- ⚡ **Ultra-Fast AI Speech Recognition**: Powered by **Groq Whisper Large v3** (transcribes in ~1 second), **OpenAI Whisper-1**, and **Google Gemini Flash**.
- 📋 **Instant Copy to Clipboard**:
  - **Copy Single Transcript**: Copy plain text, timestamped SRT, or Markdown with 1 click.
  - **Copy All Transcripts**: Master button to copy all batch transcripts at once.
- 🎵 **In-App Audio Player**: Listen to the extracted TikTok audio preview with waveform seeking while reading the transcript.
- 💾 **Export & Downloads**: Download as `.txt`, `.srt` subtitles, `.vtt`, `.md`, or `.json`.
- 🔍 **Real-Time Search**: Search through transcribed spoken words across all processed videos.
- 🎨 **Sleek Glassmorphic UI**: Built with Tailwind CSS, Lucide icons, and confetti celebrations.
- 🔒 **100% Client-Side Key Storage**: API keys are saved strictly in your local browser `localStorage`.

---

## 🚀 Quick Start

### 1. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Configure Your Speech Recognition Engine

1. Click the **Settings (⚙️)** button in the top right.
2. Enter your API key:
   - **Groq API Key (Recommended)**: [Get free Groq key](https://console.groq.com/keys) (Groq offers a 100% free tier with high rate limits and ~1s transcription).
   - **OpenAI API Key**: [Get OpenAI key](https://platform.openai.com/api-keys)
   - **Google Gemini API Key**: [Get free Gemini key](https://aistudio.google.com/app/apikey)
3. (Optional) Select your preferred language or leave it on **Auto-Detect**.

### 3. Transcribe Videos

1. Paste any TikTok URL (`https://www.tiktok.com/@...` or `https://vt.tiktok.com/...`).
2. Click **"Transcribe Videos"**.
3. Click **"Copy Text"** or **"Copy All Transcripts"** to paste your transcripts anywhere!

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions & API Routes)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Glassmorphism
- **Icons**: Lucide React
- **Audio Extraction**: `yt-dlp` + `ffmpeg` with direct TikWM stream fallback
- **AI Engines**: Groq SDK (Whisper Large v3), OpenAI SDK, Google Gemini REST
- **Animation**: Canvas Confetti
