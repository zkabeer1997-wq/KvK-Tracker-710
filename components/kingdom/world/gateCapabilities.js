// Shared device-capability detection for every Three.js scene. Three.js r163+
// no longer supports WebGL 1, so accepting a WebGL 1 context here would allow
// React Three Fiber to mount before its renderer fails asynchronously.

export function detectWebGL() {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    !window.WebGL2RenderingContext
  ) {
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false,
    });
    // Do not call WEBGL_lose_context here. That extension simulates a real
    // context loss and can poison the Three.js canvas mounted immediately
    // after this check. The detached probe canvas is garbage-collected.
    return Boolean(context);
  } catch {
    return false;
  }
}

export function detectQuality() {
  if (typeof window === 'undefined') return 'standard';
  const w = window.innerWidth;
  const mem = navigator.deviceMemory || 4;
  if (w < 820 || mem <= 2) return 'mobile';
  if (w >= 1600 && mem >= 8) return 'ultra';
  return 'standard';
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// navigator.connection is Chromium-only and absent everywhere else; treat
// its absence as "not on a constrained connection" rather than blocking
// the scene for browsers that simply don't expose the signal.
export function wantsDataSaver() {
  if (typeof navigator === 'undefined' || !navigator.connection) return false;
  return Boolean(navigator.connection.saveData);
}
