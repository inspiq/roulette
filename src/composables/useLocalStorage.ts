import { ref, watch, type Ref } from 'vue';
import type { StorageData, HistoryEntry } from '@/types/roulette';

const STORAGE_KEY = 'roulette-analyzer-data';

export function useLocalStorage() {
  const history: Ref<HistoryEntry[]> = ref([]);
  const isLoaded = ref(false);

  // Загрузка данных из localStorage
  const loadFromStorage = (): void => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StorageData = JSON.parse(stored);
        history.value = data.history || [];
      }
      isLoaded.value = true;
    } catch (error) {
      console.error('Ошибка загрузки данных из localStorage:', error);
      history.value = [];
      isLoaded.value = true;
    }
  };

  // Сохранение данных в localStorage
  const saveToStorage = (): void => {
    try {
      const data: StorageData = {
        history: history.value,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Ошибка сохранения данных в localStorage:', error);
    }
  };

  // Очистка данных
  const clearStorage = (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      history.value = [];
    } catch (error) {
      console.error('Ошибка очистки localStorage:', error);
    }
  };

  // Экспорт данных в JSON
  const exportData = (): string => {
    const data: StorageData = {
      history: history.value,
      timestamp: Date.now(),
    };
    return JSON.stringify(data, null, 2);
  };

  // Импорт данных из JSON
  const importData = (jsonString: string): boolean => {
    try {
      const data: StorageData = JSON.parse(jsonString);
      if (data.history && Array.isArray(data.history)) {
        history.value = data.history;
        saveToStorage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Ошибка импорта данных:', error);
      return false;
    }
  };

  // Автоматическое сохранение при изменении истории
  watch(
    history,
    () => {
      if (isLoaded.value) {
        saveToStorage();
      }
    },
    { deep: true }
  );

  // Загрузка при инициализации
  loadFromStorage();

  return {
    history,
    isLoaded,
    loadFromStorage,
    saveToStorage,
    clearStorage,
    exportData,
    importData,
  };
}
