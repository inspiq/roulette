<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import gsap from 'gsap';
import type { ProbabilityAnalysis, RouletteNumber } from '@/types/roulette';

// Props
const props = defineProps<{
  probabilities: ProbabilityAnalysis[];
}>();

// Цвета для каждого числа
const numberColors: Record<RouletteNumber, string> = {
  2: '#4CAF50',
  3: '#2196F3',
  5: '#FF9800',
  10: '#E91E63',
};

// Ссылки на прогресс-бары для анимации
const progressRefs = ref<Record<number, HTMLElement | null>>({});

// Получение цвета для числа
function getNumberColor(number: RouletteNumber): string {
  return numberColors[number];
}

// Нормализация вероятностей для отображения
const normalizedProbabilities = computed(() => {
  const maxProb = Math.max(...props.probabilities.map((p) => p.probability), 1);

  return props.probabilities.map((prob) => ({
    ...prob,
    displayPercentage: maxProb > 0 ? (prob.probability / maxProb) * 100 : 25,
  }));
});

// Сортировка по вероятности (по убыванию)
const sortedProbabilities = computed(() => {
  return [...normalizedProbabilities.value].sort((a, b) => b.probability - a.probability);
});

// Получение класса цвета прогресс-бара
function getProbabilityClass(probability: number): string {
  const maxProb = Math.max(...props.probabilities.map((p) => p.probability));
  const relative = (probability / maxProb) * 100;

  if (relative >= 80) return 'very-high';
  if (relative >= 60) return 'high';
  if (relative >= 40) return 'medium';
  if (relative >= 20) return 'low';
  return 'very-low';
}

// Анимация прогресс-баров
function animateProgressBars(): void {
  sortedProbabilities.value.forEach((prob, index) => {
    const element = progressRefs.value[prob.number];
    if (element) {
      gsap.fromTo(
        element,
        { width: '0%' },
        {
          width: `${prob.displayPercentage}%`,
          duration: 1,
          delay: index * 0.1,
          ease: 'power2.out',
        }
      );
    }
  });
}

// Установка ссылки на элемент
function setProgressRef(number: RouletteNumber): (el: any) => void {
  return (el: any) => {
    if (el) {
      progressRefs.value[number] = el;
    }
  };
}

// Наблюдение за изменениями вероятностей
watch(
  () => props.probabilities,
  () => {
    animateProgressBars();
  },
  { deep: true }
);

onMounted(() => {
  animateProgressBars();
});
</script>

<template>
  <div class="probability-chart">
    <div v-if="probabilities.length === 0" class="empty-state">
      <p>График появится после добавления данных</p>
    </div>

    <div v-else class="chart-container">
      <div
        v-for="prob in sortedProbabilities"
        :key="prob.number"
        class="probability-bar"
        :style="{ '--number-color': getNumberColor(prob.number) }"
      >
        <div class="bar-header">
          <div class="bar-label">
            <span class="bar-number">{{ prob.number }}</span>
            <span class="bar-value">{{ prob.probability.toFixed(1) }}%</span>
          </div>
          <div class="confidence-badge" :title="`Уровень уверенности: ${(prob.confidence * 100).toFixed(0)}%`">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" :opacity="prob.confidence"></circle>
              <path d="M12 6v6l4 2" :opacity="prob.confidence"></path>
            </svg>
            <span>{{ (prob.confidence * 100).toFixed(0) }}%</span>
          </div>
        </div>

        <div class="bar-track">
          <div
            :ref="setProgressRef(prob.number)"
            class="bar-fill"
            :class="getProbabilityClass(prob.probability)"
            :style="{ width: `${prob.displayPercentage}%` }"
          ></div>
        </div>

        <div class="bar-details">
          <div class="detail-item">
            <span class="detail-label">Частота:</span>
            <span class="detail-value">{{ prob.frequencyScore.toFixed(1) }}%</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Горячесть:</span>
            <span class="detail-value">{{ prob.hotColdScore.toFixed(1) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.probability-chart {
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  opacity: 0.6;
  font-size: 1.1rem;
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.probability-bar {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateX(5px);
  }
}

.bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.bar-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  .bar-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--number-color);
    color: #fff;
    font-size: 1.3rem;
    font-weight: 700;
    border-radius: 8px;
  }

  .bar-value {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--number-color);
  }
}

.confidence-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 0.85rem;
  opacity: 0.8;

  svg {
    color: #f2a100;
  }
}

.bar-track {
  position: relative;
  width: 100%;
  height: 30px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 8px;
  transition: width 0.3s ease;

  &.very-high {
    background: linear-gradient(90deg, #10b981, #059669);
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
  }

  &.high {
    background: linear-gradient(90deg, #3b82f6, #2563eb);
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
  }

  &.medium {
    background: linear-gradient(90deg, #f59e0b, #d97706);
    box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
  }

  &.low {
    background: linear-gradient(90deg, #ef4444, #dc2626);
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
  }

  &.very-low {
    background: linear-gradient(90deg, #6b7280, #4b5563);
    box-shadow: 0 0 20px rgba(107, 114, 128, 0.4);
  }
}

.bar-details {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.85rem;
}

.detail-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;

  .detail-label {
    opacity: 0.7;
  }

  .detail-value {
    font-weight: 600;
    color: var(--number-color);
  }
}

@media (prefers-color-scheme: light) {
  .probability-bar {
    background: rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.1);

    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }
  }

  .bar-track {
    background: rgba(0, 0, 0, 0.05);
  }

  .confidence-badge {
    background: rgba(0, 0, 0, 0.05);
  }
}
</style>
