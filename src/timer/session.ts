import { buildPlan, positionAt } from './plan';
import type { Plan } from './types';

/**
 * État d'une séance en cours, basé sur l'horloge et non sur un compteur de ticks :
 * pas de dérive, et le temps reste juste si l'app passe en arrière-plan.
 */
export type Session = {
  plan: Plan;
  /** Temps écoulé accumulé avant la dernière reprise. */
  accumulatedMs: number;
  /** Date.now() de la dernière reprise, null si en pause. */
  runningSince: number | null;
};

export function startSession(plan: Plan, now: number): Session {
  return { plan, accumulatedMs: 0, runningSince: now };
}

export function elapsedMs(s: Session, now: number): number {
  const e = s.accumulatedMs + (s.runningSince === null ? 0 : now - s.runningSince);
  return Math.min(e, s.plan.totalMs);
}

export function isPaused(s: Session): boolean {
  return s.runningSince === null;
}

export function pause(s: Session, now: number): Session {
  if (s.runningSince === null) return s;
  return { ...s, accumulatedMs: elapsedMs(s, now), runningSince: null };
}

export function resume(s: Session, now: number): Session {
  if (s.runningSince !== null) return s;
  return { ...s, runningSince: now };
}

function seek(s: Session, now: number, targetMs: number): Session {
  const clamped = Math.max(0, Math.min(targetMs, s.plan.totalMs));
  return { ...s, accumulatedMs: clamped, runningSince: s.runningSince === null ? null : now };
}

/** Passe directement à la phase suivante. */
export function skipPhase(s: Session, now: number): Session {
  const pos = positionAt(s.plan, elapsedMs(s, now));
  if (!pos.phase) return s;
  return seek(s, now, pos.phase.startMs + pos.phase.durationMs);
}

/** Seuil sous lequel « retour » renvoie à la phase précédente plutôt qu'au début de la courante. */
const BACK_THRESHOLD_MS = 3000;

/** Revient au début de la phase courante, ou à la phase précédente si on vient d'y entrer. */
export function previousPhase(s: Session, now: number): Session {
  const e = elapsedMs(s, now);
  const pos = positionAt(s.plan, e);
  const index = pos.finished ? s.plan.phases.length - 1 : pos.index;
  const current = s.plan.phases[index];
  if (!current) return s;
  if (e - current.startMs > BACK_THRESHOLD_MS || index === 0) return seek(s, now, current.startMs);
  return seek(s, now, s.plan.phases[index - 1].startMs);
}

/**
 * Ajoute un cycle à la séance en cours (y compris depuis l'écran de fin).
 * Les phases déjà prévues ne bougent pas : on insère un repos de cycle puis un cycle complet à la fin.
 */
export function addCycle(s: Session, now: number): Session {
  const plan = buildPlan({ ...s.plan.config, cycles: s.plan.config.cycles + 1 });
  // On fige le temps écoulé (borné à l'ancienne fin) pour ne pas sauter dans le repos ajouté.
  const accumulatedMs = elapsedMs(s, now);
  return { plan, accumulatedMs, runningSince: s.runningSince === null ? null : now };
}
