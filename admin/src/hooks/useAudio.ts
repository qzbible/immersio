import { useRef, useEffect, useCallback } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/** Resolve audio URL: prepend backend base for local /static/ paths */
const resolveUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('/static/')) return `${BACKEND_URL}${url}`;
  return url;
};

interface AudioConfig {
  bg_music?: string;
  sfx_success?: string;
  sfx_fail?: string;
  sfx_click?: string;
  volume?: number;
}

export const useAudio = (config: AudioConfig = {}) => {
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const volume = config.volume ?? 0.3;

  // Start background music on mount
  useEffect(() => {
    const url = resolveUrl(config.bg_music);
    if (!url) return;
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = volume;
    bgMusicRef.current = audio;
    audio.play().catch(() => {
      // Browsers may block autoplay; user interaction required
    });
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [config.bg_music, volume]);

  const playSound = useCallback((url?: string) => {
    const resolved = resolveUrl(url);
    if (!resolved) return;
    const sfx = new Audio(resolved);
    sfx.volume = Math.min(volume * 2, 1);
    sfx.play().catch(() => {});
  }, [volume]);

  const playSuccess = useCallback(() => playSound(config.sfx_success), [config.sfx_success, playSound]);
  const playFail    = useCallback(() => playSound(config.sfx_fail),    [config.sfx_fail, playSound]);
  const playClick   = useCallback(() => playSound(config.sfx_click),   [config.sfx_click, playSound]);

  const stopMusic = () => {
    bgMusicRef.current?.pause();
  };

  return { playSuccess, playFail, playClick, stopMusic };
};
