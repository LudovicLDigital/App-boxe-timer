import type { Cue, Plan } from './types';

const COUNTDOWN_SECONDS = [3, 2, 1];

/**
 * Signaux sonores à déclencher entre deux instants (fromMs exclu, toMs inclus).
 * Le calcul est basé sur des instants absolus : si l'app rate des ticks
 * (arrière-plan, ralentissement), on retrouve exactement ce qui s'est passé.
 */
export function cuesBetween(plan: Plan, fromMs: number, toMs: number): Cue[] {
  const cues: Cue[] = [];
  if (toMs <= fromMs) return cues;
  const inRange = (at: number) => at > fromMs && at <= toMs;

  plan.phases.forEach((phase, index) => {
    const endMs = phase.startMs + phase.durationMs;

    // Le début de la toute première phase est déclenché par le bouton Démarrer (t=0).
    if (phase.startMs === 0 ? fromMs < 0 && toMs >= 0 : inRange(phase.startMs)) {
      cues.push({ type: 'phaseStart', phase, index });
    }

    const warningSec = plan.config.warningSec;
    if (phase.kind === 'round' && warningSec > 0 && warningSec * 1000 < phase.durationMs) {
      if (inRange(endMs - warningSec * 1000)) cues.push({ type: 'warning', phase, index });
    }

    // Décompte 3-2-1 avant le début du round suivant (fin de préparation ou de repos).
    if (phase.kind !== 'round') {
      for (const s of COUNTDOWN_SECONDS) {
        const at = endMs - s * 1000;
        if (at > phase.startMs && inRange(at)) cues.push({ type: 'countdown', phase, index, secondsLeft: s });
      }
    }
  });

  if (plan.totalMs > 0 && inRange(plan.totalMs)) cues.push({ type: 'finished' });

  // Ordre chronologique garanti par construction pour un intervalle court ;
  // on trie quand même pour les grands sauts (retour d'arrière-plan).
  const timeOf = (c: Cue) => {
    if (c.type === 'finished') return plan.totalMs;
    const end = c.phase.startMs + c.phase.durationMs;
    if (c.type === 'phaseStart') return c.phase.startMs;
    if (c.type === 'warning') return end - plan.config.warningSec * 1000;
    return end - c.secondsLeft * 1000;
  };
  return cues.sort((a, b) => timeOf(a) - timeOf(b));
}
