<script setup lang="ts">
import { computed } from 'vue';
import type { CombinationStats, RouletteNumber } from '@/types/roulette';

const props = defineProps<{
  combinationStats: CombinationStats | null;
  totalSpins: number;
}>();

const tripleKeys = computed(() => {
  if (!props.combinationStats?.triplesByPrev2Prev1) return [];
  return Object.keys(props.combinationStats.triplesByPrev2Prev1).sort();
});

const quadrupleKeys = computed(() => {
  if (!props.combinationStats?.quadruplesByPrev3Prev2Prev1) return [];
  return Object.keys(props.combinationStats.quadruplesByPrev3Prev2Prev1).sort();
});

function formatTripleKey(key: string): string {
  return key.split('-').map((n) => n + 'x').join('→');
}

function formatQuadrupleKey(key: string): string {
  return key.split('-').map((n) => n + 'x').join('→');
}
</script>

<template>
  <div class="combinations-panel">
    <h2>Что выпадает после чего</h2>
    <p class="hint">После какого числа чаще всего выпадает следующее (по всей истории)</p>

    <div v-if="!combinationStats || totalSpins < 2" class="empty-state">
      <p>Нужно хотя бы 2 спина</p>
    </div>

    <div v-else class="combinations-content">
      <div class="totals-row">
        <span>Всего переходов (пар): <strong>{{ combinationStats.totalPairs }}</strong></span>
        <span v-if="totalSpins >= 3">Троек подряд: <strong>{{ combinationStats.totalTriples }}</strong></span>
        <span v-if="totalSpins >= 4">Четвёрок подряд: <strong>{{ combinationStats.totalQuadruples }}</strong></span>
      </div>
      <div class="combinations-grid">
      <div
        v-for="prev in [2, 3, 5, 10]"
        :key="prev"
        class="prev-block"
      >
        <div class="prev-label">Если выпало {{ prev }}x, дальше чаще:</div>
        <div class="pairs-list">
          <div
            v-for="pair in combinationStats.pairsByPrev[prev as RouletteNumber]"
            :key="`${pair.prev}-${pair.next}`"
            class="pair-row"
            :class="{ 'pair-high': pair.percentage >= 30 }"
          >
            <span class="pair-next">{{ pair.next }}x</span>
            <span class="pair-count">{{ pair.count }} раз</span>
            <span class="pair-pct">{{ pair.percentage.toFixed(2) }}%</span>
          </div>
        </div>
      </div>
      </div>
      <div v-if="totalSpins >= 3" class="triples-section">
        <div class="subtitle">Тройки подряд (два последних → следующее)</div>
        <div class="triples-grid">
          <div
            v-for="key in tripleKeys"
            :key="key"
            class="triple-block"
          >
            <div class="triple-label">{{ formatTripleKey(key) }} → дальше:</div>
            <div
              v-for="t in combinationStats.triplesByPrev2Prev1[key]"
              :key="`${t.prev2}-${t.prev1}-${t.next}`"
              class="triple-row"
              :class="{ 'triple-high': t.percentage >= 30 }"
            >
              <span>{{ t.next }}x</span>
              <span>{{ t.count }} раз, {{ t.percentage.toFixed(2) }}%</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="totalSpins >= 4" class="quadruples-section">
        <div class="subtitle">Четвёрки подряд (три последних → следующее)</div>
        <div class="quadruples-grid">
          <div
            v-for="key in quadrupleKeys"
            :key="key"
            class="quadruple-block"
          >
            <div class="quadruple-label">{{ formatQuadrupleKey(key) }} → дальше:</div>
            <div
              v-for="q in combinationStats.quadruplesByPrev3Prev2Prev1[key]"
              :key="`${q.prev3}-${q.prev2}-${q.prev1}-${q.next}`"
              class="quadruple-row"
              :class="{ 'quadruple-high': q.percentage >= 30 }"
            >
              <span>{{ q.next }}x</span>
              <span>{{ q.count }} раз, {{ q.percentage.toFixed(2) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.combinations-panel {
  h2 {
    margin-bottom: 0.25rem;
    color: #f2a100;
  }

  .hint {
    font-size: 0.9rem;
    opacity: 0.8;
    margin-bottom: 1rem;
  }

  .subtitle {
    font-size: 1rem;
    margin: 1rem 0 0.5rem;
    opacity: 0.9;
    color: #f2a100;
  }

  .subtitle:first-of-type {
    margin-top: 0;
  }
}

.combinations-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.triples-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.totals-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.9rem;
  opacity: 0.9;

  strong {
    color: #f2a100;
  }
}

.triples-section,
.quadruples-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.triple-block {
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.triple-label {
  font-weight: 600;
  margin-bottom: 0.35rem;
  color: #f2a100;
  font-size: 0.85rem;
}

.triple-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  padding: 0.2rem 0;

  &.triple-high {
    color: #10b981;
    font-weight: 600;
  }
}

.quadruples-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.quadruple-block {
  font-size: 0.85rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.quadruple-label {
  font-weight: 600;
  margin-bottom: 0.35rem;
  color: #f2a100;
  font-size: 0.8rem;
}

.quadruple-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  padding: 0.2rem 0;

  &.quadruple-high {
    color: #10b981;
    font-weight: 600;
  }
}

.empty-state {
  padding: 1.5rem;
  text-align: center;
  opacity: 0.7;
}

.combinations-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.prev-block {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.prev-label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  color: #f2a100;
}

.pairs-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.pair-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  padding: 0.25rem 0;

  &.pair-high {
    color: #10b981;
    font-weight: 600;
  }

  .pair-next {
    font-weight: 600;
  }

  .pair-pct {
    opacity: 0.9;
  }
}
</style>
