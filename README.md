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
```
