import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TikTok Video Transcriber - Fast & Accurate Speech to Text",
  description:
    "Transcribe single or multiple TikTok videos into text with a single click. Copy transcripts to clipboard or export as Markdown, SRT subtitles, and plain text.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen flex flex-col selection:bg-tiktok-pink selection:text-white">
        {children}
      </body>
    </html>
  );
}
