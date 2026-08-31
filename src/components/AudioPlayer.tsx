"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  duration?: number;
}

const SPEEDS = [1, 1.25, 1.5, 2];

export function AudioPlayer({ src, duration: initialDuration }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0);

  // Sync duration if prop updates
  useEffect(() => {
    if (initialDuration && initialDuration > 0) {
      setDuration(initialDuration);
    }
  }, [initialDuration]);

  // Setup audio element listeners and handle src changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reset playback state when src changes
    setIsPlaying(false);
    setCurrentTime(0);

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (err) {
      console.warn("Audio playback issue:", err);
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const restartAudio = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.currentTime = 0;
      setCurrentTime(0);
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn("Audio restart issue:", err);
    }
  };

  const cycleSpeed = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextIndex = (speedIndex + 1) % SPEEDS.length;
    const nextSpeed = SPEEDS[nextIndex];
    audio.playbackRate = nextSpeed;
    setSpeedIndex(nextIndex);
  };

  if (!src) return null;

  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/50 border border-white/10 w-full shadow-inner">
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
      />

      {/* Play / Pause */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r from-tiktok-pink to-tiktok-cyan text-white transition hover:scale-105 active:scale-95 shadow-md shrink-0"
        title={isPlaying ? "Pause audio" : "Play audio"}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      {/* Restart */}
      <button
        type="button"
        onClick={restartAudio}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition shrink-0"
        title="Restart from beginning"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      {/* Time & Slider */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="text-[11px] font-mono text-zinc-400 shrink-0">
          {formatDuration(currentTime)}
        </span>
        <input
          type="range"
          min="0"
          max={duration > 0 ? duration : 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-tiktok-pink"
        />
        <span className="text-[11px] font-mono text-zinc-400 shrink-0">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Speed Selector */}
      <button
        type="button"
        onClick={cycleSpeed}
        className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 text-[10px] font-mono font-bold transition shrink-0"
        title="Cycle playback speed"
      >
        {SPEEDS[speedIndex]}x
      </button>

      {/* Mute */}
      <button
        type="button"
        onClick={toggleMute}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition shrink-0"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
