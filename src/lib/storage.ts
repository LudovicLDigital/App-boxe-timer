import { DEFAULT_CONFIG, type TimerConfig } from '@/timer';

const KEY = 'boxe-timer:last-config';

export function loadLastConfig(): TimerConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<TimerConfig>), warningSec: 10 };
  } catch {
    /* stockage indisponible ou corrompu */
  }
  return DEFAULT_CONFIG;
}

export function saveLastConfig(config: TimerConfig) {
  try {
    localStorage.setItem(KEY, JSON.stringify(config));
  } catch {
    /* navigation privée : on ignore */
  }
}
