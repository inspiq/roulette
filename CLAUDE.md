# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vue 3 + TypeScript roulette analysis web application that tracks spin history and provides probability analysis, recommendations, and statistical insights for numbers 2, 3, 5, and 10.

**Stack:** Vue 3 (Composition API), TypeScript, Vite, SCSS, GSAP animations

## Commands

```bash
npm run dev       # Development server (port 3000)
npm run build     # TypeScript + Vite production build
npm run preview   # Preview production build (port 8080)
npx eslint . --ext .ts,.vue  # Lint (no npm script exists)
```

## Architecture

### Data Flow
```
NumberInput (user clicks)
  → history array (localStorage via useLocalStorage composable)
    → RouletteAnalyzer (computed analysis)
      → analysisService (calculations)
        → UI components (RecommendationsPanel, ProbabilityChart, etc.)
```

### Key Files
- `src/types/roulette.ts` - All TypeScript interfaces and the `ROULETTE_NUMBERS` constant `[2, 3, 5, 10]`
- `src/services/analysisService.ts` - Core analysis engine (~640 lines): probability calculations, combination tracking (pairs/triples/quadruples), streak analysis, recommendations
- `src/composables/useLocalStorage.ts` - localStorage persistence, export/import JSON
- `src/components/roulette/RouletteAnalyzer.vue` - Main orchestrator component

### Analysis Logic
- **Probability weights:** 60% frequency, 20% hot/cold (15-spin window), 20% trend
- **Combination tracking:** Pair (1→next), triple (2→next), quadruple (3→next) patterns
- **Thresholds:** Hot >35%, Cold <10%
- Minimum 5 spins required for recommendations

### UI Components
All in `src/components/roulette/`:
- `NumberInput.vue` - 4 clickable number buttons with GSAP animations
- `RecommendationsPanel.vue` - Top 2 recommendations with probability and reasoning
- `ProbabilityChart.vue` - Animated probability bars sorted by likelihood
- `HistoryList.vue` - Spin history with timestamps and delete capability
- `StatisticsPanel.vue`, `CombinationsPanel.vue`, `StreakBreakPanel.vue` - Currently commented out in main view

### Color Scheme per Number
- 2: Green (#4CAF50)
- 3: Blue (#2196F3)
- 5: Orange (#FF9800)
- 10: Pink (#E91E63)

## Code Style

- 4-space indentation
- Single quotes, semicolons required
- Trailing commas in multiline
- UI text and comments in Russian
- Path alias: `@` → `/src`
