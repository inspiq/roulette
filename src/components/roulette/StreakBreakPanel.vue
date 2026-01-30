<script setup lang="ts">
import type { StreakBreakStats, RouletteNumber } from '@/types/roulette';

defineProps<{
  streakBreakStats: StreakBreakStats[];
  totalSpins: number;
}>();

const numberColors: Record<RouletteNumber, string> = {
  2: '#4CAF50',
  3: '#2196F3',
  5: '#FF9800',
  10: '#E91E63',
};

function getNumberColor(number: RouletteNumber): string {
  return numberColors[number];
}

function streakLabel(len: number): string {
  if (len === 1) return '1 раз подряд';
  if (len >= 2 && len <= 4) return `${len} раза подряд`;
  return `${len} раз подряд`;
}
</script>

<template>
  <div class="streak-break-panel">
    <h2>Когда число перестаёт идти подряд</h2>
    <p class="hint">Как часто серия обрывается: после 1 раза подряд, после 2 раз подряд и т.д.</p>

    <div v-if="totalSpins < 2" class="empty-state">
      <p>Нужно хотя бы 2 спина</p>
    </div>

    <div v-else class="stats-grid">
      <div
        v-for="stat in streakBreakStats"
        :key="stat.number"
        class="stat-card"
        :style="{ '--number-color': getNumberColor(stat.number) }"
      >
        <div class="card-header">
          <span class="number-badge">{{ stat.number }}x</span>
          <span v-if="stat.totalStreaks > 0" class="summary">
            Чаще всего выпадает <strong>{{ stat.mostCommonBreakAfter }}</strong> раз подряд и сменяется
          </span>
        </div>

        <div v-if="stat.totalStreaks === 0" class="no-data">
          Это число ещё не выпадало подряд
        </div>

        <template v-else>
          <div class="meta-row">
            <span>Сколько раз было подряд: {{ stat.totalStreaks }}</span>
            <span>В среднем подряд: {{ stat.averageStreakLength.toFixed(1) }}</span>
            <span>Максимум подряд: {{ stat.maxObservedStreak }}</span>
          </div>

          <div class="distribution">
            <div
              v-for="item in stat.breakDistribution"
              :key="item.streakLength"
              class="dist-row"
              :class="{ 'dist-high': item.percentage >= 40 }"
            >
              <span class="dist-label">Обрыв после {{ streakLabel(item.streakLength) }}:</span>
              <span class="dist-count">{{ item.count }} раз</span>
              <span class="dist-pct">{{ item.percentage.toFixed(2) }}%</span>
              <div class="dist-bar" :style="{ width: `${item.percentage}%` }"></div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.streak-break-panel {
  h2 {
    margin-bottom: 0.25rem;
    color: #f2a100;
  }

  .hint {
    font-size: 0.9rem;
    opacity: 0.8;
    margin-bottom: 1rem;
  }
}

.empty-state {
  padding: 1.5rem;
  text-align: center;
  opacity: 0.7;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid var(--number-color);
  border-radius: 10px;
  padding: 1rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;

  .number-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    height: 44px;
    padding: 0 0.5rem;
    background: var(--number-color);
    color: #fff;
    font-size: 1.25rem;
    font-weight: 700;
    border-radius: 8px;
  }

  .summary {
    font-size: 0.9rem;
    opacity: 0.95;

    strong {
      color: var(--number-color);
    }
  }
}

.no-data {
  font-size: 0.9rem;
  opacity: 0.7;
  font-style: italic;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.8rem;
  opacity: 0.85;
  margin-bottom: 0.75rem;
}

.distribution {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dist-row {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.85rem;
  padding: 0.25rem 0;

  &.dist-high {
    color: var(--number-color);
    font-weight: 600;
  }

  .dist-label {
    grid-column: 1;
  }

  .dist-count {
    grid-column: 2;
    opacity: 0.9;
  }

  .dist-pct {
    grid-column: 3;
    min-width: 2.5rem;
    text-align: right;
    font-weight: 600;
  }

  .dist-bar {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 3px;
    background: var(--number-color);
    border-radius: 2px;
    opacity: 0.4;
    max-width: 100%;
  }
}
</style>
