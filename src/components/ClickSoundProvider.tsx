import React, { useEffect, useRef, useCallback, useState } from 'react';
import safeStorage from '../utils/storage';

const STORAGE_KEY = 'clickSoundEnabled';

interface ClickSoundContextType {
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const ClickSoundContext = React.createContext<ClickSoundContextType>({
  isEnabled: false,
  setEnabled: () => {},
});

export const useClickSoundContext = () => React.useContext(ClickSoundContext);

export const ClickSoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEnabled, setIsEnabledState] = useState(() => {
    return safeStorage.getItem(STORAGE_KEY) === 'true';
  });
  const audioContextRef = useRef<AudioContext | null>(null);

  const setEnabled = useCallback((enabled: boolean) => {
    safeStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    setIsEnabledState(enabled);
  }, []);

  const playSound = useCallback(() => {
    if (!isEnabled || !audioContextRef.current) return;

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
  }, [isEnabled]);

  useEffect(() => {
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
        target.closest('[role="button"]') ||
        target.closest('.clickable')
      ) {
        playSound();
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [playSound]);

  return (
    <ClickSoundContext.Provider value={{ isEnabled, setEnabled }}>
      {children}
    </ClickSoundContext.Provider>
  );
};
