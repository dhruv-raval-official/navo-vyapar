import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from './Icons';

interface FullscreenButtonProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
  iconSize?: number;
}

export default function FullscreenButton({
  className = '',
  showLabel = false,
  compact = false,
  iconSize = 14,
}: FullscreenButtonProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    // Check if fullscreen API is available in this browser
    const doc = document as any;
    const isSupported = Boolean(
      doc.fullscreenEnabled ||
      doc.webkitFullscreenEnabled ||
      doc.mozFullScreenEnabled ||
      doc.msFullscreenEnabled
    );
    setSupported(isSupported);

    const updateFullscreenState = () => {
      const active = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(active);
    };

    updateFullscreenState();

    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    document.addEventListener('mozfullscreenchange', updateFullscreenState);
    document.addEventListener('MSFullscreenChange', updateFullscreenState);

    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreenState);
      document.removeEventListener('webkitfullscreenchange', updateFullscreenState);
      document.removeEventListener('mozfullscreenchange', updateFullscreenState);
      document.removeEventListener('MSFullscreenChange', updateFullscreenState);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      const doc = document as any;
      const elem = document.documentElement as any;

      const active = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );

      if (!active) {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          await elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed or denied by user browser:', err);
    }
  };

  if (!supported) return null;

  return (
    <button
      onClick={toggleFullscreen}
      className={`btn-secondary transition-all duration-200 flex items-center justify-center gap-1.5 ${
        compact ? 'py-1 px-1.5 text-[11px]' : 'py-1 sm:py-1.5 px-2 sm:px-2.5 text-xs'
      } ${isFullscreen ? 'border-gold-400/60 bg-gold-500/15 text-gold-300' : ''} ${className}`}
      title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen'}
      aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
    >
      {isFullscreen ? (
        <Minimize2 size={iconSize} className="text-gold-400 shrink-0" />
      ) : (
        <Maximize2 size={iconSize} className="text-gold-400 shrink-0" />
      )}
      {showLabel && (
        <span className="hidden sm:inline font-medium">
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </span>
      )}
    </button>
  );
}
