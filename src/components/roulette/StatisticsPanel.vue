<script setup lang="ts">
import { computed } from 'vue';
import type { NumberStatistics, RouletteNumber } from '@/types/roulette';

// Props
const props = defineProps<{
  statistics: NumberStatistics[];
  totalSpins: number;
}>();

// Цвета для каждого числа
const numberColors: Record<RouletteNumber, string> = {
  2: '#4CAF50',
  3: '#2196F3',
  5: '#FF9800',
  10: '#E91E63',
};

// Получение цвета для числа
function getNumberColor(number: RouletteNumber): string {
  return numberColors[number];
}

// Форматирование процентов
function formatPercentage(value: number): string {
  return value.toFixed(1);
}

// Вычисление текста последнего выпадения
function getLastSeenText(stat: NumberStatistics): string {
  if (stat.lastSeenIndex === null) {
    return 'Ещё не выпадало';
  }
  if (stat.lastSeenIndex === 0) {
    return 'Последний спин';
  }
  return `${stat.lastSeenIndex} ${getSpinWord(stat.lastSeenIndex)} назад`;
}

// Склонение слова "спин"
function getSpinWord(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'спинов';
  }
  if (lastDigit === 1) {
    return 'спин';
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'спина';
  }
  return 'спинов';
}

// Сортировка по частоте (по убыванию)
const sortedStatistics = computed(() => {
  return [...props.statistics].sort((a, b) => b.count - a.count);
});
</script>

<template>
  <div class="statistics-panel">
    <div v-if="totalSpins === 0" class="empty-state">
      <p>Статистика появится после добавления данных</p>
    </div>

    <div v-else class="stats-container">
      <div class="total-spins">
        <span class="label">Всего спинов:</span>
        <span class="value">{{ totalSpins }}</span>
      </div>

      <div class="stats-grid">
        <div
          v-for="stat in sortedStatistics"
          :key="stat.number"
          class="stat-card"
          :style="{ '--number-color': getNumberColor(stat.number) }"
        >
          <div class="stat-header">
            <div class="stat-number">{{ stat.number }}</div>
            <div class="stat-badges">
              <span v-if="stat.isHot" class="badge hot">Горячее</span>
              <span v-if="stat.isCold" class="badge cold">Холодное</span>
            </div>
          </div>

          <div class="stat-details">
            <div class="stat-row">
              <span class="stat-label">Выпало раз:</span>
              <span class="stat-value">{{ stat.count }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Процент:</span>
              <span class="stat-value">{{ formatPercentage(stat.percentage) }}%</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Последнее:</span>
              <span class="stat-value small">{{ getLastSeenText(stat) }}</span>
            </div>
            <div v-if="stat.averageInterval > 0" class="stat-row">
              <span class="stat-label">Средний интервал:</span>
              <span class="stat-value small">{{ stat.averageInterval.toFixed(1) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.statistics-panel {
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  opacity: 0.6;
  font-size: 1.1rem;
}

.stats-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.total-spins {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, rgba(242, 161, 0, 0.2), rgba(242, 161, 0, 0.1));
  border-radius: 10px;
  border: 1px solid rgba(242, 161, 0, 0.3);

  .label {
    font-size: 1.1rem;
    font-weight: 500;
  }

  .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #f2a100;
  }
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
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    background: rgba(255, 255, 255, 0.08);
  }
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--number-color);
}

.stat-badges {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.hot {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.4);
  }

  &.cold {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
    border: 1px solid rgba(59, 130, 246, 0.4);
  }
}

.stat-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;

  .stat-label {
    opacity: 0.8;
  }

  .stat-value {
    font-weight: 600;
    color: var(--number-color);

    &.small {
      font-size: 0.85rem;
    }
  }
}

@media (prefers-color-scheme: light) {
  .stat-card {
    background: rgba(0, 0, 0, 0.02);

    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }
  }

  .stat-header {
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
}
</style>
