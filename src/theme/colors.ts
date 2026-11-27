import type { PhaseKind } from '@/timer';

export const colors = {
  background: '#0B0B0F',
  surface: '#1A1A22',
  text: '#FFFFFF',
  textDim: '#9A9AA8',
  accent: '#E53935',
};

/** Couleur plein écran par phase : lisible d'un coup d'œil à 2-3 m. */
export const phaseColors: Record<PhaseKind, string> = {
  prepare: '#F57C00',
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
