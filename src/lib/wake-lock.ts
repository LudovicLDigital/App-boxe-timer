import { useEffect } from 'react';

/**
 * Garde l'écran allumé pendant la séance (Screen Wake Lock API, Safari 16.4+).
 * Le navigateur relâche le verrou quand la page est masquée : on le redemande au retour.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const s = await navigator.wakeLock.request('screen');
        if (cancelled) void s.release();
        else sentinel = s;
      } catch {
        /* refusé (batterie faible, page masquée…) : on réessaiera au prochain retour */
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void request();
    };

    void request();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinel?.release();
    };
  }, [active]);
}
