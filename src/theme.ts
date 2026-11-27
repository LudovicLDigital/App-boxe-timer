import type { PhaseKind } from '@/timer';

/** Couleur plein écran par phase : lisible d'un coup d'œil à 2-3 m. */
export const phaseColors: Record<PhaseKind, string> = {
  prepare: '#E65100',
  round: '#C62828',
  rest: '#2E7D32',
  cycleRest: '#1565C0',
};

export const phaseLabels: Record<PhaseKind, string> = {
  prepare: 'PRÊT ?',
  round: 'ROUND',
  rest: 'REPOS',
  cycleRest: 'REPOS CYCLE',
};
