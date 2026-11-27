import { describe, expect, it } from 'vitest';

import {
  addCycle,
  buildPlan,
  cuesBetween,
  DEFAULT_CONFIG,
  elapsedMs,
  formatClock,
  pause,
  positionAt,
  previousPhase,
  resume,
  skipPhase,
  startSession,
  type TimerConfig,
} from '..';

const cfg = (over: Partial<TimerConfig> = {}): TimerConfig => ({
  prepareSec: 10,
  roundSec: 180,
  restSec: 60,
  roundsPerCycle: 3,
  cycles: 2,
  cycleRestSec: 120,
  warningSec: 10,
  ...over,
});

describe('buildPlan', () => {
  it('enchaîne préparation, rounds, repos et repos de cycle sans repos final', () => {
    const plan = buildPlan(cfg());
    expect(plan.phases.map((p) => p.kind)).toEqual([
      'prepare',
      'round', 'rest', 'round', 'rest', 'round',
      'cycleRest',
      'round', 'rest', 'round', 'rest', 'round',
    ]);
    // 10 + 6×180 + 4×60 + 120
    expect(plan.totalMs).toBe((10 + 6 * 180 + 4 * 60 + 120) * 1000);
  });

  it('numérote les rounds par cycle et sur toute la séance', () => {
    const rounds = buildPlan(cfg()).phases.filter((p) => p.kind === 'round');
    expect(rounds.map((r) => [r.cycle, r.roundInCycle, r.roundOverall])).toEqual([
      [1, 1, 1], [1, 2, 2], [1, 3, 3],
      [2, 1, 4], [2, 2, 5], [2, 3, 6],
    ]);
  });

  it('omet les phases de durée nulle (pas de préparation, pas de repos)', () => {
    const plan = buildPlan(cfg({ prepareSec: 0, restSec: 0, cycles: 1 }));
    expect(plan.phases.map((p) => p.kind)).toEqual(['round', 'round', 'round']);
    expect(plan.phases[0].startMs).toBe(0);
  });

  it('gère un seul round', () => {
    const plan = buildPlan(cfg({ roundsPerCycle: 1, cycles: 1, prepareSec: 0 }));
    expect(plan.phases).toHaveLength(1);
    expect(plan.totalMs).toBe(180_000);
  });

  it('utilise des débuts contigus', () => {
    const { phases } = buildPlan(DEFAULT_CONFIG);
    for (let i = 1; i < phases.length; i++) {
      expect(phases[i].startMs).toBe(phases[i - 1].startMs + phases[i - 1].durationMs);
    }
  });
});

describe('positionAt', () => {
  const plan = buildPlan(cfg());
  it('trouve la phase courante et le temps restant', () => {
    expect(positionAt(plan, 0)).toMatchObject({ index: 0, remainingMs: 10_000 });
    expect(positionAt(plan, 10_000)).toMatchObject({ index: 1, remainingMs: 180_000 });
    expect(positionAt(plan, 189_500)).toMatchObject({ index: 1, remainingMs: 500 });
  });
  it('signale la fin', () => {
    expect(positionAt(plan, plan.totalMs).finished).toBe(true);
  });
});

describe('cuesBetween', () => {
  const plan = buildPlan(cfg({ cycles: 1 }));

  it('déclenche le début de la première phase au démarrage', () => {
    expect(cuesBetween(plan, -1, 0)).toEqual([expect.objectContaining({ type: 'phaseStart', index: 0 })]);
  });

  it('déclenche le décompte 3-2-1 puis le début du round', () => {
    const cues = cuesBetween(plan, 6_500, 10_000);
    expect(cues.map((c) => (c.type === 'countdown' ? c.secondsLeft : c.type))).toEqual([3, 2, 1, 'phaseStart']);
  });

  it('déclenche l\'alerte fin proche 10 s avant la fin du round', () => {
    const end = 10_000 + 180_000;
    expect(cuesBetween(plan, end - 10_001, end - 10_000)).toEqual([
      expect.objectContaining({ type: 'warning', index: 1 }),
    ]);
  });

  it('ne déclenche pas d\'alerte si elle est plus longue que le round', () => {
    const p = buildPlan(cfg({ roundSec: 5, warningSec: 10 }));
    expect(cuesBetween(p, -1, p.totalMs).some((c) => c.type === 'warning')).toBe(false);
  });

  it('signale la fin de séance', () => {
    expect(cuesBetween(plan, plan.totalMs - 100, plan.totalMs).at(-1)).toEqual({ type: 'finished' });
  });

  it('rattrape tous les signaux après un grand saut, dans l\'ordre', () => {
    const all = cuesBetween(plan, -1, plan.totalMs);
    expect(all.filter((c) => c.type === 'phaseStart')).toHaveLength(plan.phases.length);
    expect(all.filter((c) => c.type === 'warning')).toHaveLength(3);
    expect(all.at(-1)).toEqual({ type: 'finished' });
  });

  it('ne déclenche rien deux fois sur des intervalles adjacents', () => {
    const a = cuesBetween(plan, -1, 50_000);
    const b = cuesBetween(plan, 50_000, plan.totalMs);
    expect(a.length + b.length).toBe(cuesBetween(plan, -1, plan.totalMs).length);
  });
});

describe('session', () => {
  const plan = buildPlan(cfg());

  it('mesure le temps écoulé avec pause et reprise', () => {
    let s = startSession(plan, 1_000);
    expect(elapsedMs(s, 6_000)).toBe(5_000);
    s = pause(s, 6_000);
    expect(elapsedMs(s, 60_000)).toBe(5_000);
    s = resume(s, 60_000);
    expect(elapsedMs(s, 61_000)).toBe(6_000);
  });

  it('passe à la phase suivante', () => {
    const s = skipPhase(startSession(plan, 0), 2_000);
    expect(elapsedMs(s, 2_000)).toBe(10_000);
  });

  it('revient au début de la phase, puis à la précédente', () => {
    let s = startSession(plan, 0);
    // 20 s dans le round 1 → retour au début du round 1
    s = previousPhase(s, 30_000);
    expect(elapsedMs(s, 30_000)).toBe(10_000);
    // juste au début du round 1 → retour à la préparation
    s = previousPhase(s, 30_500);
    expect(elapsedMs(s, 30_500)).toBe(0);
  });

  it('ajoute un cycle sans décaler le temps écoulé', () => {
    const s = startSession(plan, 0);
    const next = addCycle(s, 50_000);
    expect(next.plan.config.cycles).toBe(3);
    expect(elapsedMs(next, 50_000)).toBe(50_000);
    expect(next.plan.phases.slice(0, plan.phases.length - 0).map((p) => p.startMs)).toEqual(
      plan.phases.map((p) => p.startMs),
    );
    expect(next.plan.phases[plan.phases.length].kind).toBe('cycleRest');
  });

  it('reprend sur le repos de cycle quand on ajoute un cycle après la fin', () => {
    const s = startSession(plan, 0);
    const later = plan.totalMs + 30_000;
    const next = addCycle(s, later);
    expect(elapsedMs(next, later)).toBe(plan.totalMs);
    expect(positionAt(next.plan, elapsedMs(next, later)).phase?.kind).toBe('cycleRest');
  });

  it('ne dépasse jamais la fin', () => {
    const s = startSession(plan, 0);
    expect(elapsedMs(s, plan.totalMs * 2)).toBe(plan.totalMs);
  });
});

describe('formatClock', () => {
  it('formate en m:ss avec arrondi supérieur', () => {
    expect(formatClock(185_000)).toBe('3:05');
    expect(formatClock(100)).toBe('0:01');
    expect(formatClock(0)).toBe('0:00');
  });
});
