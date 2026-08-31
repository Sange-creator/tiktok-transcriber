"use client";

import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  animated?: boolean;
}

export function Logo({
  size = "md",
  className = "",
  showText = false,
  animated = true,
}: LogoProps) {
  // Dimension maps
  const dimensionMap = {
    sm: { box: "w-8 h-8", svg: 32, text: "text-sm", sub: "text-[9px]" },
    md: { box: "w-10 h-10", svg: 40, text: "text-lg", sub: "text-xs" },
    lg: { box: "w-14 h-14", svg: 56, text: "text-2xl", sub: "text-sm" },
    xl: { box: "w-20 h-20", svg: 80, text: "text-4xl", sub: "text-base" },
  };

  const dim = dimensionMap[size] || dimensionMap.md;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Logo Icon Mark */}
      <div
        className={`relative ${dim.box} shrink-0 rounded-2xl flex items-center justify-center p-[2px] transition-all hover:scale-105 ${
          animated ? "group" : ""
        }`}
      >
        {/* Neon Glow backdrop */}
        <div className="absolute -inset-1 bg-gradient-to-r from-tiktok-pink via-[#fe2c55] to-tiktok-cyan rounded-2xl opacity-40 group-hover:opacity-75 blur-md transition duration-300 pointer-events-none" />

        {/* Outer border gradient container */}
        <div className="relative w-full h-full rounded-[14px] bg-gradient-to-br from-zinc-800 via-zinc-950 to-black p-[1.5px] shadow-2xl overflow-hidden border border-white/10 flex items-center justify-center">
          {/* Subtle radial shine inside */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

          {/* Precision SVG Vector Art */}
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full p-1.5 drop-shadow-md"
          >
            <defs>
              <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#25F4EE" />
                <stop offset="100%" stopColor="#00c8c2" />
              </linearGradient>

              <linearGradient id="pinkGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FE2C55" />
                <stop offset="100%" stopColor="#d6002f" />
              </linearGradient>

              <linearGradient id="whiteSilver" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>

              <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Cyan Offset Layer (Chromatic Aberration) */}
            <g transform="translate(-2.5, -2)">
              {/* Note stem & flag */}
              <path
                d="M48 24V62C48 68.627 42.627 74 36 74C29.373 74 24 68.627 24 62C24 55.373 29.373 50 36 50C38.2 50 40.2 50.6 42 51.6V24C42 24 53 19 68 24V36C58 32 48 24 48 24Z"
                fill="#25F4EE"
                opacity="0.9"
              />
              {/* Audio waves */}
              <rect x="74" y="38" width="5" height="24" rx="2.5" fill="#25F4EE" opacity="0.85" />
              <rect x="83" y="44" width="5" height="12" rx="2.5" fill="#25F4EE" opacity="0.75" />
            </g>

            {/* Pink / Red Offset Layer (Chromatic Aberration) */}
            <g transform="translate(2.5, 2)">
              {/* Note stem & flag */}
              <path
                d="M48 24V62C48 68.627 42.627 74 36 74C29.373 74 24 68.627 24 62C24 55.373 29.373 50 36 50C38.2 50 40.2 50.6 42 51.6V24C42 24 53 19 68 24V36C58 32 48 24 48 24Z"
                fill="#FE2C55"
                opacity="0.9"
              />
              {/* Audio waves */}
              <rect x="74" y="38" width="5" height="24" rx="2.5" fill="#FE2C55" opacity="0.85" />
              <rect x="83" y="44" width="5" height="12" rx="2.5" fill="#FE2C55" opacity="0.75" />
            </g>

            {/* Crisp Center Core (White / Silver with Transcriber Mic wave) */}
            <g transform="translate(0, 0)">
              {/* Musical Note Core */}
              <path
                d="M48 24V62C48 68.627 42.627 74 36 74C29.373 74 24 68.627 24 62C24 55.373 29.373 50 36 50C38.2 50 40.2 50.6 42 51.6V24C42 24 53 19 68 24V36C58 32 48 24 48 24Z"
                fill="url(#whiteSilver)"
              />
              {/* Equalizer Soundwave Bars (Speech Transcriber) */}
              <rect x="65" y="32" width="5.5" height="36" rx="2.75" fill="#FFFFFF" />
              <rect x="74" y="38" width="5.5" height="24" rx="2.75" fill="#FFFFFF" />
              <rect x="83" y="44" width="5.5" height="12" rx="2.75" fill="#FFFFFF" />

              {/* Sparkle dot in note head */}
              <circle cx="36" cy="62" r="4.5" fill="#0b0e14" />
              <circle cx="36" cy="62" r="2.5" fill="#25F4EE" />
            </g>
          </svg>
        </div>
      </div>

      {/* Optional Brand Typography Lockup */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`font-black tracking-tight ${dim.text} bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent`}
            >
              TikTok <span className="bg-gradient-to-r from-tiktok-pink via-[#fe2c55] to-tiktok-cyan bg-clip-text text-transparent">Transcriber</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-tiktok-pink/20 to-tiktok-cyan/20 text-tiktok-cyan border border-tiktok-cyan/30 shadow-sm">
              AI 100 Turbo
            </span>
          </div>
          <p className={`${dim.sub} text-zinc-400 font-medium leading-none mt-0.5 hidden sm:block`}>
            Lightning Fast Batch Speech-to-Text
          </p>
        </div>
      )}
    </div>
  );
}
