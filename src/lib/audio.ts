/**
 * Sons synthétisés avec la Web Audio API : pas de fichiers à charger, fonctionne hors-ligne.
 *
 * iOS : le son ne peut démarrer qu'après un geste de l'utilisateur. On appelle
 * `unlockAudio()` dans le gestionnaire du bouton Démarrer.
 */
import type { Cue } from '@/timer';

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

let ctx: AudioContext | null = null;

function setAudioSessionType() {
  // Safari 16.4+ : « transient » joue par-dessus la musique en la baissant (ducking) au lieu de la couper.
  const nav = navigator as AudioSessionNavigator;
  if (nav.audioSession) {
    try {
      nav.audioSession.type = 'transient';
    } catch {
      /* non supporté : on garde le comportement par défaut */
    }
  }
}

export function unlockAudio() {
  setAudioSessionType();
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state !== 'running') void ctx.resume();
  // Un buffer silencieux joué pendant le geste débloque définitivement le son sur iOS.
  const buffer = ctx.createBuffer(1, 1, 22050);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start();
}

/** À appeler au retour au premier plan : iOS suspend le contexte audio en arrière-plan. */
export function resumeAudio() {
  if (ctx && ctx.state !== 'running') void ctx.resume();
}

function output(): { ctx: AudioContext; out: GainNode } | null {
  if (!ctx) return null;
  const out = ctx.createGain();
  out.gain.value = 0.9;
  out.connect(ctx.destination);
  return { ctx, out };
}

/** Cloche de ring : partiels inharmoniques avec décroissance exponentielle. */
function bell(at: number, ctx: AudioContext, out: AudioNode, length = 1.8) {
  const f0 = 720;
  const partials = [
    [1, 1],
    [2.0, 0.6],
    [2.76, 0.45],
    [5.4, 0.25],
    [8.93, 0.12],
  ];
  for (const [ratio, gain] of partials) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f0 * ratio;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain * 0.35, at + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, at + length / Math.sqrt(ratio));
    osc.connect(g).connect(out);
    osc.start(at);
    osc.stop(at + length);
  }
}

function beep(at: number, ctx: AudioContext, out: AudioNode, freq: number, dur: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(0.18, at + 0.005);
  g.gain.setValueAtTime(0.18, at + dur - 0.02);
  g.gain.linearRampToValueAtTime(0, at + dur);
  osc.connect(g).connect(out);
  osc.start(at);
  osc.stop(at + dur);
}

export type SoundName = 'roundStart' | 'roundEnd' | 'warning' | 'countdown' | 'finished';

export function playSound(name: SoundName) {
  const o = output();
  if (!o) return;
  const { ctx, out } = o;
  const t = ctx.currentTime + 0.01;
  switch (name) {
    case 'roundStart':
      bell(t, ctx, out);
      break;
    case 'roundEnd':
      [0, 0.35, 0.7].forEach((d) => bell(t + d, ctx, out, 1.4));
      break;
    case 'finished':
      [0, 0.35, 0.7, 1.05, 1.4].forEach((d) => bell(t + d, ctx, out, 1.6));
      break;
    case 'warning':
      // « Tac-tac » des 10 dernières secondes.
      [0, 0.18].forEach((d) => beep(t + d, ctx, out, 1760, 0.09));
      break;
    case 'countdown':
      beep(t, ctx, out, 880, 0.15);
      break;
  }
}

/** Associe un signal du moteur à un son. */
export function soundForCue(cue: Cue): SoundName | null {
  switch (cue.type) {
    case 'finished':
      return 'finished';
    case 'warning':
      return 'warning';
    case 'countdown':
      return 'countdown';
    case 'phaseStart':
      if (cue.phase.kind === 'round') return 'roundStart';
      if (cue.phase.kind === 'rest' || cue.phase.kind === 'cycleRest') return 'roundEnd';
      return null;
  }
  return null;
}
