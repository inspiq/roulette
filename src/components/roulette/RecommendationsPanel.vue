<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import gsap from 'gsap';
import type { Recommendation, RouletteNumber } from '@/types/roulette';

// Props
const props = defineProps<{
  recommendations: Recommendation[];
  totalSpins: number;
}>();

// Цвета для каждого числа
const numberColors: Record<RouletteNumber, string> = {
  2: '#4CAF50',
  3: '#2196F3',
  5: '#FF9800',
  10: '#E91E63',
};

// Ссылки на карточки для анимации
const cardRefs = ref<HTMLElement[]>([]);

// Получение цвета для числа
function getNumberColor(number: RouletteNumber): string {
  return numberColors[number];
}

// Получение текста уровня уверенности
function getConfidenceText(confidence: number): string {
  if (confidence >= 0.8) return 'Очень высокая';
  if (confidence >= 0.6) return 'Высокая';
  if (confidence >= 0.4) return 'Средняя';
  if (confidence >= 0.2) return 'Низкая';
  return 'Очень низкая';
}

// Получение класса для уровня уверенности
function getConfidenceClass(confidence: number): string {
  if (confidence >= 0.8) return 'very-high';
  if (confidence >= 0.6) return 'high';
  if (confidence >= 0.4) return 'medium';
  if (confidence >= 0.2) return 'low';
  return 'very-low';
}

// Установка ссылки на карточку
function setCardRef(index: number): (el: any) => void {
  return (el: any) => {
    if (el) {
      cardRefs.value[index] = el;
    }
  };
}

// Анимация карточек
function animateCards(): void {
  if (cardRefs.value.length > 0) {
    gsap.fromTo(
      cardRefs.value,
      {
        scale: 0.8,
        opacity: 0,
        rotateY: -90,
      },
      {
        scale: 1,
        opacity: 1,
        rotateY: 0,
        duration: 0.6,
        stagger: 0.2,
        ease: 'back.out(1.7)',
      }
    );
  }
}

// Наблюдение за изменениями рекомендаций
watch(
  () => props.recommendations,
  () => {
    cardRefs.value = [];
    setTimeout(() => {
      animateCards();
    }, 50);
  },
  { deep: true }
);

onMounted(() => {
  animateCards();
});
</script>

<template>
  <div class="recommendations-panel">
    <div v-if="totalSpins < 5" class="insufficient-data">
      <p>Недостаточно данных для рекомендаций</p>
      <p class="hint">Добавьте хотя бы 5 спинов для получения рекомендаций</p>
    </div>

    <div v-else-if="recommendations.length === 0" class="no-recommendations">
      <p>Рекомендации временно недоступны</p>
    </div>

    <div v-else class="recommendations-grid">
      <div
        v-for="(rec, index) in recommendations"
        :key="rec.number"
        :ref="setCardRef(index)"
        class="recommendation-card"
        :class="`rank-${index + 1}`"
        :style="{ '--number-color': getNumberColor(rec.number) }"
      >
        <div class="card-header">
          <div class="rank-badge">{{ index + 1 }}</div>
          <div class="card-number">{{ rec.number }}</div>
        </div>

        <div class="card-body">
          <div class="probability-info">
            <span class="label">Вероятность:</span>
            <span class="value">{{ rec.probability.toFixed(1) }}%</span>
          </div>

          <div class="confidence-info">
            <span class="label">Уверенность:</span>
            <div class="confidence-bar-container">
              <div
                class="confidence-bar"
                :class="getConfidenceClass(rec.confidence)"
                :style="{ width: `${rec.confidence * 100}%` }"
              ></div>
            </div>
            <span class="confidence-text">{{ getConfidenceText(rec.confidence) }}</span>
          </div>

          <div class="reason">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>{{ rec.reason }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.recommendations-panel {
  h2 {
    text-align: center;
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    color: #f2a100;
  }
}

.insufficient-data,
.no-recommendations {
  text-align: center;
  padding: 2rem 1rem;
  opacity: 0.7;

  p {
    margin: 0;
    font-size: 1.1rem;
  }

  .hint {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    opacity: 0.8;
  }
}

.recommendations-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.recommendation-card {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid var(--number-color);
  border-radius: 16px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--number-color);
  }

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  }

  &.rank-1 {
    border-width: 3px;
    box-shadow: 0 10px 40px rgba(242, 161, 0, 0.3);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.rank-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #f2a100, #ff6b6b);
  color: #fff;
  font-size: 1.1rem;
  font-weight: 700;
  border-radius: 50%;
}

.card-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 70px;
  background: var(--number-color);
  color: #fff;
  font-size: 2.5rem;
  font-weight: 700;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.probability-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;

  .label {
    opacity: 0.8;
  }

  .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--number-color);
  }
}

.confidence-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .label {
    font-size: 0.9rem;
    opacity: 0.8;
  }
}

.confidence-bar-container {
  position: relative;
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.confidence-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;

  &.very-high {
    background: linear-gradient(90deg, #10b981, #059669);
  }

  &.high {
    background: linear-gradient(90deg, #3b82f6, #2563eb);
  }

  &.medium {
    background: linear-gradient(90deg, #f59e0b, #d97706);
  }

  &.low {
    background: linear-gradient(90deg, #ef4444, #dc2626);
  }

  &.very-low {
    background: linear-gradient(90deg, #6b7280, #4b5563);
  }
}

.confidence-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--number-color);
}

.reason {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 0.9rem;
  line-height: 1.5;

  svg {
    flex-shrink: 0;
    margin-top: 0.1rem;
    color: var(--number-color);
  }
}

.top-pick-badge {
  position: absolute;
  top: 1rem;
  right: -2rem;
  background: linear-gradient(135deg, #f2a100, #ff6b6b);
  color: #fff;
  padding: 0.5rem 3rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 1px;
  transform: rotate(45deg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

@media (prefers-color-scheme: light) {
  .recommendation-card {
    background: rgba(0, 0, 0, 0.02);

    &:hover {
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }

    &.rank-1 {
      box-shadow: 0 10px 40px rgba(242, 161, 0, 0.2);
    }
  }

  .confidence-bar-container {
    background: rgba(0, 0, 0, 0.1);
  }

  .reason {
    background: rgba(0, 0, 0, 0.03);
  }
}
</style>
