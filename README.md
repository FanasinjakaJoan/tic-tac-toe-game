# ⚡ Neon Tic Tac Toe · Arcade

Un jeu de **Morpion / Tic Tac Toe** au look **arcade néon**, pétillant et rempli d'effets :
combos, particules, vibrations, sons synthétisés en WebAudio et un **Hall of Fame local**.

> *« best of nerve »* — le classique revisité façon salle d'arcade.

![Stack](https://img.shields.io/badge/React-19-blue?logo=react)
![Stack](https://img.shields.io/badge/Vite-7-purple?logo=vite)
![Stack](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Stack](https://img.shields.io/badge/Tailwind-4-cyan?logo=tailwindcss)

---

## ✨ Fonctionnalités

- **Deux modes de jeu**
  - ⚡ **VS CPU** — affrontez une IA à trois niveaux de difficulté.
  - 👥 **2 Players** — duel local (hot-seat) sur le même écran.
- **Trois niveaux de difficulté** (mode IA), chacun avec son propre multiplicateur de score :
  - **Novice** (×1) — fait des erreurs, parfait pour apprendre.
  - **Skilled** (×1.6) — punit les erreurs.
  - **Unbeatable** (×2.6) — jeu parfait, le nul est une victoire.
- **Système de vies** : 3 cœurs par partie en mode IA. Perdre une manche coûte une vie.
- **Score & combos** : points selon la difficulté, les séries de victoires (streak) et les victoires **parfaites** (3 symboles).
- **Hall of Fame local** : les 7 meilleurs scores enregistrés dans le navigateur (localStorage).
- **Effets "juice"** : particules, secousses d'écran, flashs, textes flottants, vibrations mobiles.
- **Sons synthétisés** en WebAudio — aucun asset audio, aucune dépendance supplémentaire.
- **Contrôles au clavier, à la souris et au tactile**.
- **Design responsive** et adapté au mobile (touch-friendly).

---

## 🎮 Comment jouer

### Modes

| Mode | Description |
|------|-------------|
| **VS CPU** | Vous jouez les **X** (cyan), l'IA joue les **O** (rose). Vous avez 3 vies. |
| **2 Players** | Duel enchaîné sur le même écran, sans score multiplié — pur prestige. |

### Difficultés (VS CPU)

| Difficulté | Multiplicateur | Comportement |
|------------|:--------------:|--------------|
| **Novice** | ×1 | Une chance de faire une erreur (72 %) |
| **Skilled** | ×1.6 | Joue bien mais glisse une erreur de temps en temps (30 %) |
| **Unbeatable** | ×2.6 | Jeu parfait (minimax). Le nul est le meilleur résultat possible. |

### Objectif & scoring

- Alignez **3 symboles** (horizontale, verticale ou diagonale) pour gagner la manche.
- **Points par manche** ≈ `(100 + streak × 50) × multiplicateur`.
- **Bonus de victoire parfaite** : +150 si vous gagnez avec seulement 3 symboles, +75 avec 4.
- **Draw (nul)** : `30 × multiplicateur` points, la série (streak) est conservée.
- **Perte** : pas de points, une vie en moins, la série retombe à 0.
- **Partie terminée** : plus de vies (mode IA) ou quand vous quittez — le score final est enregistré.

### Contrôles

| Action | Souris / Tactile | Clavier |
|--------|------------------|---------|
| Se déplacer | survol | `← ↑ ↓ →` ou `W A S D` |
| Placer un symbole | clic / tap | `Espace` ou `Entrée` |
| Choix direct d'une case | clic | `1` – `9` (pavé) |
| Recommencer la manche | bouton | `R` |
| Pause | bouton | `Échap` ou `P` |
| Couper le son | 🔇 / 🔊 | `M` |
| Valider un écran | bouton | `Espace` / `Entrée` |
| Retour au menu | bouton | `Échap` |

---

## 🚀 Démarrage rapide

> Prérequis : [Node.js](https://nodejs.org) **≥ 20** et npm.

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev
```

Ouvrez l'URL affichée (par défaut `http://localhost:5173`).

### Build de production

```bash
# Compiler en production (vite-plugin-singlefile produit un seul fichier HTML autonome)
npm run build

# Prévisualiser le build
npm run preview
```

Le build est généré dans `dist/`.

---

## 🧠 Fonctionnement (détails techniques)

### IA (minimax)
Le moteur de jeu (`src/game/logic.ts`) implémente une recherche **minimax** amplifiée
avec élagage (alpha-beta abrégé). L'IA ne choisit pas toujours le même coup parmi les
meilleurs, ce qui la rend variée. Selon la difficulté, une probabilité d'erreur
(`mistakeRate`) introduit des blunders — mais **jamais** en cas de victoire immédiate.
- **Unbeatable** : `mistakeRate = 0` → jeu parfait.

### Effets "juice" (`src/juice/JuiceProvider.tsx`)
- Système de **particules** sur canvas (plafonné à 700 particules pour rester fluide à 60 fps).
- **Secousses d'écran**, **flashs**, **textes flottants** (+points).
- Redimensionnement plafonné au `devicePixelRatio` pour les mobiles.

### Audio (`src/game/audio.ts`)
- **Synthèse WebAudio** (oscillateurs + bruit) — aucun fichier audio, zéro latence.
- Les sons sont déverrouillés à la **première interaction** (exigence des navigateurs).

### Sauvegarde (`src/game/storage.ts`)
- **Hall of Fame** : les 7 meilleurs scores (`neon-ttt.highscores.v1`).
- **Préférences** : difficulté, mode, son coupé (`neon-ttt.prefs.v1`).

### Architecture

```
.
├── index.html                  # Point d'entrée HTML
├── vite.config.ts              # Config Vite (+ vitesinglefile, alias "@")
├── tsconfig.json               # Config TypeScript
├── package.json
└── src/
    ├── main.tsx                # Montage React (StrictMode)
    ├── App.tsx                 # Boucle de jeu (phases, score, entrées)
    ├── index.css               # Styles / thème néon (Tailwind)
    ├── components/
    │   ├── Board.tsx           # Grille & ray de victoire
    │   ├── Hud.tsx             # Score, vies, streak, tour
    │   ├── Marks.tsx           # Glyphes X / O
    │   └── Screens.tsx         # Menu, pause, fin de manche, game over, HOF
    ├── game/
    │   ├── logic.ts            # Évaluation, minimax, difficultés
    │   ├── audio.ts            # Synthèse WebAudio + vibrations
    │   └── storage.ts          # Scores & préférences (localStorage)
    ├── juice/
    │   └── JuiceProvider.tsx   # Particules, secousses, flashs
    └── utils/
        └── cn.ts               # Concaténation de classes Tailwind
```

---

## 🛠️ Stack technique

- **React 19** + **TypeScript**
- **Vite 7** (bundler / dev server)
- **Tailwind CSS 4** (`@tailwindcss/vite`)
- **vite-plugin-singlefile** (build en un seul fichier autonome)
- **Web Audio API** & **Canvas** (aucune dépendance externe pour l'audio/les effets)

---

## 📄 Licence

Distribué sous la **GNU General Public License v3.0** — voir le fichier [`LICENSE`](./LICENSE).

---

*Fait avec ⚡ et beaucoup de "juice".*
