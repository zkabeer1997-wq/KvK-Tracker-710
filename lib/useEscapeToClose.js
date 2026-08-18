'use client';

import { useEffect } from 'react';

// Closes an overlay (drawer, modal) on Escape while it's open.
export function useEscapeToClose(active, onClose) {
  useEffect(() => {
    if (!active) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onClose]);
}
