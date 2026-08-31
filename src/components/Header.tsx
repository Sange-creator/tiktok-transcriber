"use client";

import React from "react";
import { Mic, Settings, Sparkles, Video, HelpCircle } from "lucide-react";

interface HeaderProps {
  onOpenSettings: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-tiktok-pink to-tiktok-cyan p-0.5 shadow-lg shadow-tiktok-pink/20">
            <div className="w-full h-full bg-[#0d0f17] rounded-[10px] flex items-center justify-center">
              <Mic className="w-5 h-5 text-tiktok-cyan animate-pulse-slow" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                TikTok Transcriber
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-tiktok-pink/15 text-tiktok-pink border border-tiktok-pink/30">
                AI Powered
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Fast speech-to-text for single & batch TikTok videos
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 border border-white/10 transition-all hover:scale-105 active:scale-95 shadow-sm"
            title="Configure AI API keys and transcription settings"
          >
            <Settings className="w-4 h-4 text-tiktok-cyan" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
