import { useRef, useEffect, useCallback } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

/** Resolve audio URL: prepend backend base for local /static/ paths */
const resolveUrl = (url) => {
  if (!url) return undefined;
  if (url.startsWith('/static/')) return `${BACKEND_URL}${url}`;
  return url;
};

/**
 * useAudio — manages background music (looped) and SFX playback for a game mode.
 * @param {object} config - { bg_music, sfx_success, sfx_fail, sfx_click, volume }
 */
export const useAudio = (config = {}) => {
  const bgMusicRef = useRef(null);
  const volume = config.volume ?? 0.3;

  // Start background music on mount (stops on unmount)
  useEffect(() => {
    const url = resolveUrl(config.bg_music);
    if (!url) return;
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = volume;
    bgMusicRef.current = audio;
    audio.play().catch(() => {
      // Browser may require user gesture before playing
    });
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [config.bg_music, volume]);

  const playSound = useCallback((url) => {
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
