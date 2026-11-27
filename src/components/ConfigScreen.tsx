import { useState } from 'react';

import { buildPlan, formatClock, PRESETS, type TimerConfig } from '@/timer';
import { Stepper } from './Stepper';

const secs = (s: number) => (s === 0 ? 'Off' : formatClock(s * 1000));
/** Le repos entre cycles n'a pas d'effet avec un seul cycle : on l'ignore dans la comparaison. */
const sameConfig = (a: TimerConfig, b: TimerConfig) =>
  (Object.keys(a) as (keyof TimerConfig)[]).every(
    (k) => a[k] === b[k] || (k === 'cycleRestSec' && a.cycles === 1 && b.cycles === 1),
  );

type Props = { initial: TimerConfig; onStart: (config: TimerConfig) => void };

export function ConfigScreen({ initial, onStart }: Props) {
  const [config, setConfig] = useState(initial);
  const set =
    <K extends keyof TimerConfig>(key: K) =>
    (value: TimerConfig[K]) =>
      setConfig((c) => ({ ...c, [key]: value }));

  const plan = buildPlan(config);

  return (
    <div className="config">
      <header className="config-header">
        <h1>Boxe Timer</h1>
      </header>

      <main className="config-body">
        <div className="presets">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              className={`preset ${sameConfig(p.config, config) ? 'active' : ''}`}
              onClick={() => setConfig(p.config)}>
              <strong>{p.name}</strong>
              <span>{p.description}</span>
            </button>
          ))}
        </div>

        <h2>Rounds</h2>
        <Stepper label="Durée du round" value={config.roundSec} onChange={set('roundSec')} step={15} min={15} max={1800} format={secs} />
        <Stepper label="Repos entre rounds" value={config.restSec} onChange={set('restSec')} step={15} min={0} max={600} format={secs} />
        <Stepper label="Rounds par cycle" value={config.roundsPerCycle} onChange={set('roundsPerCycle')} step={1} min={1} max={30} />

        <h2>Cycles</h2>
        <Stepper label="Nombre de cycles" value={config.cycles} onChange={set('cycles')} step={1} min={1} max={20} />
        {config.cycles > 1 && (
          <Stepper label="Repos entre cycles" value={config.cycleRestSec} onChange={set('cycleRestSec')} step={15} min={0} max={1800} format={secs} />
        )}

        <h2>Départ</h2>
        <Stepper label="Préparation" value={config.prepareSec} onChange={set('prepareSec')} step={5} min={0} max={60} format={secs} />
      </main>

      <footer className="config-footer">
        <p className="total">
          Durée totale : <strong>{formatClock(plan.totalMs)}</strong> · {config.roundsPerCycle * config.cycles} rounds
        </p>
        <button type="button" className="start" onClick={() => onStart(config)}>
          DÉMARRER
        </button>
      </footer>
    </div>
  );
}
