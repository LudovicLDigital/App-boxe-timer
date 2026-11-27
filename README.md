# Boxe Timer

Timer de rounds pour la boxe, pensé pour être posé pendant la séance (iPhone en priorité).

Réglages : durée des rounds, durée du repos entre rounds, nombre de rounds par cycle, nombre de cycles, repos entre cycles (durée propre ou identique).

## Stack

- [Expo](https://expo.dev) SDK 58 + React Native + TypeScript
- Expo Router (routes dans `src/app/`)

## Lancer le projet

```bash
npm install
npx expo start
```

Scanne le QR code avec l'app **Expo Go** sur ton iPhone.

## Vérifications

```bash
npx tsc --noEmit
npx expo lint
npm test
```

## Organisation du code

- `src/timer/` : moteur du timer, en TypeScript pur, sans dépendance à React Native, et testé.
  - `plan.ts` : transforme une config en une liste de phases (préparation, round, repos, repos de cycle).
  - `session.ts` : pause, reprise, phase suivante et précédente. Le temps est calculé depuis `Date.now()`, pas en comptant des ticks, donc il ne dérive pas et reste juste après un passage en arrière-plan.
  - `cues.ts` : signaux à déclencher entre deux instants (début de phase, alerte de fin de round, décompte 3-2-1, fin).
- `src/hooks/use-session.ts` : relie le moteur à React (tick toutes les 100 ms, émission des signaux).
- `src/app/index.tsx` : écran de réglages.
- `src/app/session.tsx` : écran de séance (plein écran coloré par phase, écran maintenu allumé).
