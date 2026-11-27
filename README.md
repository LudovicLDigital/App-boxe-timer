# Boxe Timer

Timer de rounds pour la boxe, à poser pendant la séance. C'est une PWA : elle s'ouvre dans Safari et s'installe sur l'écran d'accueil de l'iPhone, sans App Store.

**App en ligne :** https://ludovicldigital.github.io/App-boxe-timer/

Réglages : durée des rounds, repos entre rounds, rounds par cycle, nombre de cycles, repos entre cycles, préparation. Trois presets de base, et la dernière config est mémorisée.

## Installer sur iPhone

1. Ouvrir le lien ci-dessus dans **Safari**.
2. Bouton Partager → **Sur l'écran d'accueil**.
3. Lancer l'app depuis l'icône : plein écran, et elle fonctionne hors-ligne.

Le bouton latéral silencieux de l'iPhone coupe les sons des pages web : il faut le laisser en mode sonnerie.

## Sons

| Moment | Son |
|---|---|
| Début de round | 1 coup de cloche |
| Fin de round (début du repos) | 3 coups de cloche |
| 10 s avant la fin du round | « tac-tac » aigu |
| 3, 2, 1 avant chaque round | bips |
| Fin de séance | 5 coups de cloche |

Les sons sont synthétisés (Web Audio), sans fichiers. Sur Safari, l'app demande de **baisser** la musique en cours pendant l'alerte, pas de la couper (`navigator.audioSession.type = 'transient'`).

## Développement

```bash
npm install
npm run dev        # serveur accessible sur le réseau local, pour tester sur l'iPhone
npm test           # tests du moteur (Vitest)
npm run typecheck
npm run build
```

Stack : Vite + React 19 + TypeScript, `vite-plugin-pwa` (manifest et service worker).

Chaque push sur `main` est testé, buildé et déployé sur GitHub Pages par `.github/workflows/deploy.yml`.

## Organisation du code

- `src/timer/` : moteur, en TypeScript pur et testé.
  - `plan.ts` : transforme une config en liste de phases (préparation, round, repos, repos de cycle). Pas de repos après le dernier round.
  - `session.ts` : pause, reprise, phase suivante et précédente, +1 cycle. Le temps est calculé depuis `Date.now()` et non en comptant des ticks, donc il ne dérive pas.
  - `cues.ts` : signaux à déclencher entre deux instants (début de phase, alerte des 10 s, décompte 3-2-1, fin).
  - `presets.ts` : les 3 presets.
- `src/lib/` : intégration navigateur (sons, Wake Lock pour garder l'écran allumé, stockage local, hook de séance).
- `src/components/` : écrans de réglages et de séance.
- `scripts/make-icons.py` : génère les icônes dans `public/`.
