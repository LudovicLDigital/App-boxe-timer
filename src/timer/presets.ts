import type { TimerConfig } from './types';

export type Preset = { name: string; description: string; config: TimerConfig };

const base = { prepareSec: 10, warningSec: 10 };

export const PRESETS: Preset[] = [
  {
    name: 'Amateur',
    description: '3 rounds de 3 min, 1 min de repos',
    config: { ...base, roundSec: 180, restSec: 60, roundsPerCycle: 3, cycles: 1, cycleRestSec: 60 },
  },
  {
    name: 'Pro',
    description: '12 rounds de 3 min, 1 min de repos',
    config: { ...base, roundSec: 180, restSec: 60, roundsPerCycle: 12, cycles: 1, cycleRestSec: 60 },
  },
  {
    name: 'Sac / cardio',
    description: '3 cycles de 4 × 2 min, 30 s de repos, 2 min entre cycles',
    config: { ...base, roundSec: 120, restSec: 30, roundsPerCycle: 4, cycles: 3, cycleRestSec: 120 },
  },
];
