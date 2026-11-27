import { useEffect, useMemo, useState } from 'react';

import { playSound, resumeAudio, soundForCue } from '@/lib/audio';
import { useSession } from '@/lib/use-session';
import { useWakeLock } from '@/lib/wake-lock';
import { phaseColors, phaseLabels } from '@/theme';
import { buildPlan, formatClock, type Cue, type TimerConfig } from '@/timer';

type Props = { config: TimerConfig; onExit: () => void };

const onCue = (cue: Cue) => {
  const sound = soundForCue(cue);
  if (sound) playSound(sound);
};

export function SessionScreen({ config: initialConfig, onExit }: Props) {
  const initialPlan = useMemo(() => buildPlan(initialConfig), [initialConfig]);
  const { plan, position, paused, togglePause, skip, back, addCycle } = useSession(initialPlan, onCue);
  const [confirmStop, setConfirmStop] = useState(false);
  const { phase } = position;
  const { config } = plan;

  useWakeLock(true);

  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && resumeAudio();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // Le bouton « Arrêter » repasse en état normal au bout de 3 s sans confirmation.
  useEffect(() => {
    if (!confirmStop) return;
    const id = setTimeout(() => setConfirmStop(false), 3000);
    return () => clearTimeout(id);
  }, [confirmStop]);

  const background = phase ? phaseColors[phase.kind] : '#0b0b0f';
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background);
    return () => document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0b0b0f');
  }, [background]);

  const totalRounds = config.roundsPerCycle * config.cycles;

  if (!phase) {
    return (
      <div className="session" style={{ background }}>
        <div className="session-center">
          <div className="phase-label">TERMINÉ</div>
          <div className="sub-label">
            {totalRounds} rounds · {formatClock(plan.totalMs)}
          </div>
        </div>
        <div className="session-actions">
          <button type="button" className="big" onClick={addCycle}>
            +1 CYCLE
          </button>
          <button type="button" className="big" onClick={onExit}>
            RETOUR
          </button>
        </div>
      </div>
    );
  }

  const next = plan.phases[position.index + 1];
  const roundInfo =
    phase.kind === 'prepare'
      ? `${totalRounds} rounds au programme`
      : `Round ${phase.roundInCycle}/${config.roundsPerCycle}` + (config.cycles > 1 ? ` · Cycle ${phase.cycle}/${config.cycles}` : '');
  const warning = phase.kind === 'round' && position.remainingMs <= config.warningSec * 1000;

  return (
    <div className="session" style={{ background }}>
      <div className="session-center">
        <div className="phase-label">{phaseLabels[phase.kind]}</div>
        <div className="sub-label">{roundInfo}</div>
        <div className={`clock ${warning ? 'warning' : ''}`}>{formatClock(position.remainingMs)}</div>
        {paused && <div className="paused">EN PAUSE</div>}
        {next && (
          <div className="next">
            Ensuite : {phaseLabels[next.kind].toLowerCase()} {formatClock(next.durationMs)}
          </div>
        )}
      </div>

      <div className="session-controls">
        <button type="button" className="round-btn" aria-label="Phase précédente" onClick={back}>
          ⏮
        </button>
        <button type="button" className="big" onClick={togglePause}>
          {paused ? 'REPRENDRE' : 'PAUSE'}
        </button>
        <button type="button" className="round-btn" aria-label="Phase suivante" onClick={skip}>
          ⏭
        </button>
      </div>

      <div className="session-footer">
        <button type="button" className="link" onClick={() => (confirmStop ? onExit() : setConfirmStop(true))}>
          {confirmStop ? 'Toucher encore pour arrêter' : 'Arrêter'}
        </button>
        <button type="button" className="link" onClick={addCycle}>
          +1 cycle
        </button>
      </div>
    </div>
  );
}
