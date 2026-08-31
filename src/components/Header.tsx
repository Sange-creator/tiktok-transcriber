"use client";

import React from "react";
import { Settings } from "lucide-react";
import { Logo } from "./Logo";

interface HeaderProps {
  onOpenSettings: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <Logo size="md" showText={true} animated={true} />

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
