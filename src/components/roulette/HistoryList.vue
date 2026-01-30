<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import gsap from 'gsap';
import type { HistoryEntry, RouletteNumber } from '@/types/roulette';

// Props
const props = defineProps<{
  history: HistoryEntry[];
}>();

// Эмиты
const emit = defineEmits<{
  removeEntry: [id: string];
}>();

// Цвета для каждого числа
const numberColors: Record<RouletteNumber, string> = {
  2: '#4CAF50',
  3: '#2196F3',
  5: '#FF9800',
  10: '#E91E63',
};

// Максимальное количество отображаемых записей
const maxVisible = ref(50);

// Отображаемая история (последние N записей)
const displayedHistory = computed(() => {
  return [...props.history].reverse().slice(0, maxVisible.value);
});

// Ссылка на контейнер для анимации
const historyListRef = ref<HTMLElement | null>(null);
const previousLength = ref(props.history.length);

// Форматирование времени
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Получение цвета для числа
function getNumberColor(number: RouletteNumber): string {
  return numberColors[number];
}

// Удаление записи
function handleRemove(id: string): void {
  emit('removeEntry', id);
}

// Анимация новых элементов
watch(
  () => props.history.length,
  (newLength) => {
    if (newLength > previousLength.value && historyListRef.value) {
      const newItem = historyListRef.value.querySelector('.history-item:first-child');
      if (newItem) {
        gsap.fromTo(
          newItem,
          {
            x: -100,
            opacity: 0,
          },
          {
            x: 0,
            opacity: 1,
            duration: 0.5,
            ease: 'back.out(1.7)',
          }
        );
      }
    }
    previousLength.value = newLength;
  }
);

onMounted(() => {
  if (historyListRef.value) {
    gsap.from('.history-item', {
      x: -50,
      opacity: 0,
      duration: 0.5,
      stagger: 0.05,
      ease: 'power2.out',
    });
  }
});
</script>

<template>
  <div class="history-list-wrapper">
    <div v-if="displayedHistory.length === 0" class="empty-state">
      <p>История пуста</p>
      <p class="empty-hint">Добавьте выпавшие числа, чтобы начать анализ</p>
    </div>

    <div v-else ref="historyListRef" class="history-list">
      <div
        v-for="(entry, index) in displayedHistory"
        :key="entry.id"
        class="history-item"
        :style="{ '--number-color': getNumberColor(entry.number) }"
      >
        <div class="item-number">
          <span class="number-badge">{{ entry.number }}</span>
        </div>
        <div class="item-info">
          <span class="item-index">#{{ history.length - index }}</span>
          <span class="item-time">{{ formatTime(entry.timestamp) }}</span>
        </div>
        <button class="item-remove" @click="handleRemove(entry.id)" title="Удалить">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="history.length > maxVisible" class="show-more">
      <p>Показано {{ maxVisible }} из {{ history.length }} записей</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.history-list-wrapper {
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  opacity: 0.6;

  p {
    margin: 0;
    font-size: 1.2rem;
  }

  .empty-hint {
    margin-top: 0.5rem;
    font-size: 0.9rem;
  }
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 0.5rem;

  /* Стилизация скроллбара */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.history-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-left: 3px solid var(--number-color);
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateX(5px);

    .item-remove {
      opacity: 1;
    }
  }
}

.item-number {
  .number-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    background: var(--number-color);
    color: #fff;
    font-size: 1.5rem;
    font-weight: 700;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;

  .item-index {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--number-color);
  }

  .item-time {
    font-size: 0.85rem;
    opacity: 0.7;
  }
}

.item-remove {
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 6px;
  color: #ef4444;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(239, 68, 68, 0.3);
    transform: scale(1.1);
  }

  @media (max-width: 767px) {
    opacity: 1; // Всегда показываем на мобильных
  }
}

.show-more {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.9rem;
  opacity: 0.7;
  font-style: italic;
}

@media (prefers-color-scheme: light) {
  .history-list {
    &::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);

      &:hover {
        background: rgba(0, 0, 0, 0.3);
      }
    }
  }

  .history-item {
    background: rgba(0, 0, 0, 0.02);

    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }
  }
}
</style>
