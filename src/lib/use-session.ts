import { useEffect, useRef, useState } from 'react';

import {
  addCycle,
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
/** Au-delà de cet écart entre deux ticks (onglet masqué), on ne rejoue pas les signaux ratés. */
const MAX_REPLAY_GAP_MS = 1500;

/** Pilote une séance : horloge, contrôles, et émission des signaux (onCue). */
export function useSession(initialPlan: Plan, onCue: (cue: Cue) => void) {
  const [session, setSession] = useState<Session>(() => startSession(initialPlan, Date.now()));
  const [now, setNow] = useState(() => Date.now());
  const lastElapsed = useRef(-1);
  const onCueRef = useRef(onCue);
  useEffect(() => {
    onCueRef.current = onCue;
  });

  useEffect(() => {
    const emit = () => {
      const t = Date.now();
      const e = elapsedMs(session, t);
      const from = lastElapsed.current;
      if (e > from && e - from <= MAX_REPLAY_GAP_MS) {
        for (const cue of cuesBetween(session.plan, from, e)) onCueRef.current(cue);
      }
      lastElapsed.current = e;
      setNow(t);
    };
    emit();
    const id = setInterval(emit, TICK_MS);
    return () => clearInterval(id);
  }, [session]);

  const apply = (fn: (s: Session, t: number) => Session, announce: boolean) => {
    const t = Date.now();
    const next = fn(session, t);
    const e = elapsedMs(next, t);
    // Après un saut manuel, on annonce le début de la nouvelle phase.
    lastElapsed.current = announce ? e - 1 : e;
    setSession(next);
    setNow(t);
  };

  const elapsed = elapsedMs(session, now);
  return {
    plan: session.plan,
    position: positionAt(session.plan, elapsed),
    paused: isPaused(session),
    togglePause: () => apply((s, t) => (isPaused(s) ? resume(s, t) : pause(s, t)), false),
    skip: () => apply(skipPhase, true),
    back: () => apply(previousPhase, true),
    addCycle: () => apply(addCycle, false),
  };
}
