"use client";

import { useRef, useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "demo-voiceover-muted";
const AUDIO_BASE_PATH = "/audio/demo";

// Screen IDs — must match the order in ProductDemo's screens array
const SCREEN_AUDIO_FILES = [
  "dashboard",
  "advisor-chat",
  "content-engine",
  "documents",
  "company-library",
  "goals",
  "roundtable",
];

export function useDemoAudio() {
  // Audio element refs — one per screen, preloaded
  const audioRefs = useRef<HTMLAudioElement[]>([]);

  // Mute state — default to true (muted), respects autoplay policy
  const [isMuted, setIsMuted] = useState(true);

  // Track whether user has interacted (for autoplay unlock)
  const hasInteracted = useRef(false);

  // Initialize: preload all audio elements and restore mute preference
  useEffect(() => {
    // Restore mute preference from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setIsMuted(stored === "true");
      }
    } catch {
      // localStorage unavailable, keep default (muted)
    }

    // Create and preload audio elements
    audioRefs.current = SCREEN_AUDIO_FILES.map((id) => {
      const audio = new Audio(`${AUDIO_BASE_PATH}/${id}.mp3`);
      audio.preload = "auto";
      return audio;
    });

    // Cleanup: pause and release all audio on unmount
    return () => {
      audioRefs.current.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      audioRefs.current = [];
    };
  }, []);

  // Persist mute state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isMuted));
    } catch {
      // Ignore
    }
  }, [isMuted]);

  // Play audio for a specific screen index
  const playScreenAudio = useCallback(
    (screenIndex: number) => {
      // Stop any currently playing audio
      audioRefs.current.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });

      if (isMuted || !hasInteracted.current) return;

      const audio = audioRefs.current[screenIndex];
      if (!audio) return;

      audio.currentTime = 0;
      audio.play().catch(() => {
        // Autoplay blocked — silently fail
      });
    },
    [isMuted]
  );

  // Pause the currently playing audio
  const pauseAudio = useCallback(() => {
    audioRefs.current.forEach((audio) => {
      audio.pause();
    });
  }, []);

  // Resume the audio for the current screen
  const resumeAudio = useCallback(
    (screenIndex: number) => {
      if (isMuted || !hasInteracted.current) return;

      const audio = audioRefs.current[screenIndex];
      if (!audio) return;

      audio.play().catch(() => {
        // Autoplay blocked
      });
    },
    [isMuted]
  );

  // Toggle mute — also marks user as having interacted
  const toggleMute = useCallback(() => {
    hasInteracted.current = true;
    setIsMuted((prev) => {
      const newMuted = !prev;
      if (newMuted) {
        // Muting: pause all audio
        audioRefs.current.forEach((audio) => audio.pause());
      }
      return newMuted;
    });
  }, []);

  // Mark that user has interacted (call from any click handler)
  const markInteracted = useCallback(() => {
    hasInteracted.current = true;
  }, []);

  return {
    isMuted,
    toggleMute,
    playScreenAudio,
    pauseAudio,
    resumeAudio,
    markInteracted,
  };
}
