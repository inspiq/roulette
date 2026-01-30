<script setup lang="ts">
import { computed, ref } from 'vue';
import { useLocalStorage } from '@/composables/useLocalStorage';
import { analyzeRouletteHistory } from '@/services/analysisService';
import type { RouletteNumber, HistoryEntry } from '@/types/roulette';
import NumberInput from './NumberInput.vue';
import HistoryList from './HistoryList.vue';
// import StatisticsPanel from './StatisticsPanel.vue';
import ProbabilityChart from './ProbabilityChart.vue';
import RecommendationsPanel from './RecommendationsPanel.vue';
// import CombinationsPanel from './CombinationsPanel.vue';
// import StreakBreakPanel from './StreakBreakPanel.vue';

// Инициализация хранилища
const { history, clearStorage } = useLocalStorage();

// Состояние подтверждения очистки
const showConfirmClear = ref(false);

// Добавление нового числа в историю
function addNumber(number: RouletteNumber): void {
  const newEntry: HistoryEntry = {
    id: `${Date.now()}-${Math.random()}`,
    number,
    timestamp: Date.now(),
  };
  history.value.push(newEntry);
}

// Удаление записи из истории
function removeEntry(id: string): void {
  const index = history.value.findIndex((entry) => entry.id === id);
  if (index !== -1) {
    history.value.splice(index, 1);
  }
}

// Очистка всей истории
function handleClearHistory(): void {
  showConfirmClear.value = true;
}

function confirmClear(): void {
  clearStorage();
  showConfirmClear.value = false;
}

function cancelClear(): void {
  showConfirmClear.value = false;
}

// Анализ данных
const analysis = computed(() => {
  return analyzeRouletteHistory(history.value);
});
</script>

<template>
  <div class="roulette-analyzer">
    <div class="analyzer-header">
      <h1>Анализатор рулетки</h1>
    </div>

    <div class="analyzer-content">
      <!-- Панель ввода -->
      <section class="section input-section">
        <NumberInput @add-number="addNumber" />
      </section>

      <!-- На что ставить (рекомендации) -->
      <section class="section recommendations-section">
        <h2 class="section-title">На что ставить</h2>
        <RecommendationsPanel
          :recommendations="analysis.recommendations"
          :total-spins="analysis.totalSpins"
        />
      </section>

      <!-- Шансы по числам -->
      <section class="section chart-section">
        <h2>Шансы выпадения по числам</h2>
        <ProbabilityChart :probabilities="analysis.probabilities" />
      </section>

      <!-- Что за чем выпадает -->
      <!-- <section class="section combinations-section">
        <CombinationsPanel
          :combination-stats="analysis.combinationStats"
          :total-spins="analysis.totalSpins"
        />
      </section> -->

      <!-- Когда число перестаёт идти подряд -->
      <!-- <section class="section streak-break-section">
        <StreakBreakPanel
          :streak-break-stats="analysis.streakBreakStats"
          :total-spins="analysis.totalSpins"
        />
      </section> -->

      <!-- Сводка по каждому числу -->
      <!-- <section class="section statistics-section">
        <h2>Сводка по каждому числу</h2>
        <StatisticsPanel :statistics="analysis.numberStats" :total-spins="analysis.totalSpins" />
      </section> -->

      <!-- История спинов -->
      <section class="section history-section">
        <div class="history-header">
          <h2>История спинов</h2>
          <button
            class="clear-button"
            @click="handleClearHistory"
            :disabled="history.length === 0"
          >
            Очистить всё
          </button>
        </div>
        <HistoryList :history="history" @remove-entry="removeEntry" />
      </section>
    </div>

    <!-- Модальное окно подтверждения очистки -->
    <div v-if="showConfirmClear" class="modal-overlay" @click="cancelClear">
      <div class="modal-content" @click.stop>
        <h3>Очистить всё?</h3>
        <p>Вся история спинов будет удалена. Отменить нельзя.</p>
        <div class="modal-buttons">
          <button class="btn-cancel" @click="cancelClear">Отмена</button>
          <button class="btn-confirm" @click="confirmClear">Да, очистить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.roulette-analyzer {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

.analyzer-header {
  text-align: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #f2a100, #ff6b6b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    font-size: 1.1rem;
    opacity: 0.8;
  }
}

.analyzer-content {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #f2a100;
  }
}

.input-section {
  grid-column: 1 / -1;
}

.recommendations-section {
  grid-column: 1 / -1;
}

.chart-section {
  @media (min-width: 768px) {
    grid-column: 1 / -1;
  }
}

.statistics-section {
  @media (min-width: 768px) {
    grid-column: 1 / -1;
  }
}

.history-section {
  grid-column: 1 / -1;

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;

    h2 {
      margin-bottom: 0;
    }
  }

  .clear-button {
    padding: 0.5rem 1rem;
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: 1px solid #ef4444;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.3);
      transform: scale(1.05);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

// Модальное окно
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: #2a2a2a;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);

  h3 {
    margin-bottom: 1rem;
    color: #f2a100;
  }

  p {
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }

  .modal-buttons {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;

    button {
      padding: 0.6rem 1.5rem;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .btn-cancel {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
      }
    }

    .btn-confirm {
      background: #ef4444;
      color: #fff;

      &:hover {
        background: #dc2626;
        transform: scale(1.05);
      }
    }
  }
}

@media (prefers-color-scheme: light) {
  .section {
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  .modal-content {
    background: #f5f5f5;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
}
</style>
