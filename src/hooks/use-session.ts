import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  cuesBetween,
  elapsedMs,
  isPaused,
  pause,
  positionAt,
  previousPhase,
  resume,
  skipPhase,
  startSession,
  type Cue,
  type Plan,
  type Session,
} from '@/timer';

const TICK_MS = 100;
/** Au-delà de cet écart entre deux ticks (retour d'arrière-plan), on ne rejoue pas les signaux ratés. */
const MAX_REPLAY_GAP_MS = 1500;

/**
 * Pilote une séance : horloge, contrôles, et émission des signaux (onCue).
 */
export function useSession(plan: Plan, onCue: (cue: Cue) => void) {
  const [session, setSession] = useState<Session>(() => startSession(plan, Date.now()));
  const [now, setNow] = useState(() => Date.now());
  const lastElapsed = useRef(-1);
  const onCueRef = useRef(onCue);
  useEffect(() => {
    onCueRef.current = onCue;
  });

  const emit = useCallback((s: Session, t: number) => {
    const e = elapsedMs(s, t);
    const from = lastElapsed.current;
    if (e > from && e - from <= MAX_REPLAY_GAP_MS) {
      for (const cue of cuesBetween(s.plan, from, e)) onCueRef.current(cue);
    }
    lastElapsed.current = e;
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      emit(session, t);
    }, TICK_MS);
    emit(session, Date.now());
    return () => clearInterval(id);
  }, [session, emit]);

  // Au retour au premier plan : resynchronise sans rejouer les signaux ratés.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') lastElapsed.current = elapsedMs(session, Date.now());
    });
    return () => sub.remove();
  }, [session]);

  const apply = (fn: (s: Session, t: number) => Session, replayStart = false) => {
    const t = Date.now();
    const next = fn(session, t);
    const e = elapsedMs(next, t);
    // Après un saut manuel, on annonce le début de la nouvelle phase.
    lastElapsed.current = replayStart ? e - 1 : e;
    setSession(next);
    setNow(t);
  };

  const elapsed = elapsedMs(session, now);
  return {
    position: positionAt(plan, elapsed),
    elapsedMs: elapsed,
    paused: isPaused(session),
    togglePause: () => apply((s, t) => (isPaused(s) ? resume(s, t) : pause(s, t))),
    skip: () => apply(skipPhase, true),
    back: () => apply(previousPhase, true),
  };
}
