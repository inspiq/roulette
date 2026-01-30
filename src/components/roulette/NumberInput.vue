<script setup lang="ts">
import { ref, onMounted } from 'vue';
import gsap from 'gsap';
import { ROULETTE_NUMBERS } from '@/types/roulette';
import type { RouletteNumber } from '@/types/roulette';

// Эмиты
const emit = defineEmits<{
  addNumber: [number: RouletteNumber];
}>();

// Цвета для каждого числа
const numberColors: Record<RouletteNumber, string> = {
  2: '#4CAF50',
  3: '#2196F3',
  5: '#FF9800',
  10: '#E91E63',
};

// Последнее добавленное число для анимации
const lastAddedNumber = ref<RouletteNumber | null>(null);

// Обработчик клика на число
function handleNumberClick(number: RouletteNumber, event: MouseEvent): void {
  emit('addNumber', number);
  lastAddedNumber.value = number;

  // Анимация кнопки
  const button = event.currentTarget as HTMLElement;
  gsap.fromTo(
    button,
    {
      scale: 1,
    },
    {
      scale: 1.2,
      duration: 0.15,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
    }
  );

  // Создание анимированной частицы
  createParticle(number, event);
}

// Создание анимированной частицы при клике
function createParticle(number: RouletteNumber, event: MouseEvent): void {
  const particle = document.createElement('div');
  particle.className = 'number-particle';
  particle.textContent = String(number);
  particle.style.left = `${event.clientX}px`;
  particle.style.top = `${event.clientY}px`;
  particle.style.color = numberColors[number];
  document.body.appendChild(particle);

  gsap.to(particle, {
    y: -100,
    opacity: 0,
    duration: 1,
    ease: 'power2.out',
    onComplete: () => {
      particle.remove();
    },
  });
}

// Получение цвета для числа
function getNumberColor(number: RouletteNumber): string {
  return numberColors[number];
}

onMounted(() => {
  // Отключаем анимацию для отладки - кнопки должны быть видны сразу
  // Анимация появления кнопок
  // const buttons = document.querySelectorAll('.number-button');
  // if (buttons.length > 0) {
  //   gsap.fromTo(
  //     buttons,
  //     {
  //       scale: 0,
  //       opacity: 0,
  //     },
  //     {
  //       scale: 1,
  //       opacity: 1,
  //       duration: 0.5,
  //       stagger: 0.1,
  //       ease: 'back.out(1.7)',
  //     }
  //   );
  // }
});
</script>

<template>
  <div class="number-input">
    <h2>Введите выпавшее число</h2>
    <div class="numbers-grid">
      <button
        v-for="number in [2, 3, 5, 10]"
        :key="number"
        class="number-button"
        :class="{ active: lastAddedNumber === number }"
        :style="{ '--number-color': getNumberColor(number) }"
        @click="handleNumberClick(number, $event)"
      >
        {{ number }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.number-input {
  h2 {
    text-align: center;
    margin-bottom: 1.5rem;
    font-size: 1.3rem;
  }
}

.numbers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.number-button {
  position: relative;
  padding: 2rem 1rem;
  font-size: 2rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid var(--number-color);
  border-radius: 12px;
  color: var(--number-color);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  opacity: 1;
  transform: scale(1);
  visibility: visible;

  &:hover {
    background: var(--number-color);
    color: #fff;
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: translateY(-2px);
  }

  &.active {
    animation: pulse 0.6s ease;
  }
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 var(--number-color);
  }
  50% {
    box-shadow: 0 0 0 20px transparent;
  }
}

// Стили для частиц
:global(.number-particle) {
  position: fixed;
  font-size: 2rem;
  font-weight: 700;
  pointer-events: none;
  z-index: 9999;
  text-shadow: 0 0 10px currentColor;
}

@media (prefers-color-scheme: light) {
  .number-button {
    background: rgba(0, 0, 0, 0.03);

    &:hover {
      background: var(--number-color);
      color: #fff;
    }
  }
}
</style>
