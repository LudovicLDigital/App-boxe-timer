import type { Phase, Plan, TimerConfig } from './types';

export const DEFAULT_CONFIG: TimerConfig = {
  prepareSec: 10,
  roundSec: 180,
  restSec: 60,
  roundsPerCycle: 3,
  cycles: 1,
  cycleRestSec: 120,
  warningSec: 10,
};

/**
 * Construit la liste ordonnée des phases d'une séance.
 * Pas de repos après le tout dernier round.
 */
export function buildPlan(config: TimerConfig): Plan {
  const phases: Phase[] = [];
  let t = 0;
  let roundOverall = 0;

  const push = (p: Omit<Phase, 'startMs'>) => {
    if (p.durationMs <= 0) return;
    phases.push({ ...p, startMs: t });
    t += p.durationMs;
  };

  push({ kind: 'prepare', durationMs: config.prepareSec * 1000, cycle: 1, roundInCycle: 0, roundOverall: 0 });

  for (let cycle = 1; cycle <= config.cycles; cycle++) {
    for (let r = 1; r <= config.roundsPerCycle; r++) {
      roundOverall++;
      push({ kind: 'round', durationMs: config.roundSec * 1000, cycle, roundInCycle: r, roundOverall });

      const lastRoundOfCycle = r === config.roundsPerCycle;
      const lastCycle = cycle === config.cycles;
      if (lastRoundOfCycle && lastCycle) break;

      if (lastRoundOfCycle) {
        push({ kind: 'cycleRest', durationMs: config.cycleRestSec * 1000, cycle, roundInCycle: r, roundOverall });
      } else {
        push({ kind: 'rest', durationMs: config.restSec * 1000, cycle, roundInCycle: r, roundOverall });
      }
    }
  }

  return { config, phases, totalMs: t };
}

export type Position = {
  /** Index de la phase courante (phases.length si terminé). */
  index: number;
  phase: Phase | null;
  remainingMs: number;
  finished: boolean;
};

/** Phase courante à un instant donné (ms depuis le début de la séance). */
export function positionAt(plan: Plan, elapsedMs: number): Position {
  if (elapsedMs >= plan.totalMs || plan.phases.length === 0) {
    return { index: plan.phases.length, phase: null, remainingMs: 0, finished: true };
  }
  const t = Math.max(0, elapsedMs);
  // Peu de phases : une recherche linéaire suffit.
  for (let i = 0; i < plan.phases.length; i++) {
    const p = plan.phases[i];
    if (t < p.startMs + p.durationMs) {
      return { index: i, phase: p, remainingMs: p.startMs + p.durationMs - t, finished: false };
    }
  }
  return { index: plan.phases.length, phase: null, remainingMs: 0, finished: true };
}
