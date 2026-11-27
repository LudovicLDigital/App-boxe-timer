/** Configuration d'une séance. Toutes les durées sont en secondes. */
export type TimerConfig = {
  /** Compte à rebours avant le premier round (0 = désactivé). */
  prepareSec: number;
  /** Durée d'un round. */
  roundSec: number;
  /** Repos entre deux rounds d'un même cycle. */
  restSec: number;
  /** Nombre de rounds par cycle. */
  roundsPerCycle: number;
  /** Nombre de cycles. */
  cycles: number;
  /** Repos entre deux cycles (peut être égal à restSec). */
  cycleRestSec: number;
  /** Alerte « fin proche » N secondes avant la fin d'un round (0 = désactivée). Fixée à 10 s dans l'UI. */
  warningSec: number;
};

export type PhaseKind = 'prepare' | 'round' | 'rest' | 'cycleRest';

export type Phase = {
  kind: PhaseKind;
  durationMs: number;
  /** Début de la phase, en ms depuis le début de la séance. */
  startMs: number;
  /** Cycle concerné (1-based). */
  cycle: number;
  /** Round dans le cycle (1-based). Pour un repos : le round qui vient de se terminer. */
  roundInCycle: number;
  /** Numéro de round sur toute la séance (1-based). */
  roundOverall: number;
};

export type Plan = {
  config: TimerConfig;
  phases: Phase[];
  totalMs: number;
};

export type Cue =
  | { type: 'phaseStart'; phase: Phase; index: number }
  | { type: 'warning'; phase: Phase; index: number }
  | { type: 'countdown'; phase: Phase; index: number; secondsLeft: number }
  | { type: 'finished' };
