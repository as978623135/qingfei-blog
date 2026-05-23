import { useEffect, useRef, useCallback } from 'react';
import safeStorage from '../utils/storage';

const STORAGE_KEY = 'clickSoundEnabled';

export const useClickSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef<boolean>(false);

  const isEnabled = () => {
    return safeStorage.getItem(STORAGE_KEY) === 'true';
  };

  const setEnabled = (enabled: boolean) => {
    safeStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    enabledRef.current = enabled;
  };

  const playSound = useCallback(() => {
    if (!enabledRef.current || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }, []);

  useEffect(() => {
    enabledRef.current = isEnabled();
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      audioContextRef.current = null;
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]')
      ) {
        playSound();
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [playSound]);

  return { isEnabled, setEnabled };
};
