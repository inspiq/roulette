// Допустимые числа рулетки
export const ROULETTE_NUMBERS = [2, 3, 5, 10] as const;
export type RouletteNumber = typeof ROULETTE_NUMBERS[number];

// Запись в истории
export interface HistoryEntry {
  id: string;
  number: RouletteNumber;
  timestamp: number;
}

// Статистика для каждого числа
export interface NumberStatistics {
  number: RouletteNumber;
  count: number;
  percentage: number;
  lastSeenIndex: number | null; // индекс последнего выпадения (0 = последнее)
  averageInterval: number; // средний интервал между выпадениями
  isHot: boolean; // горячее число
  isCold: boolean; // холодное число
}

// Анализ вероятностей
export interface ProbabilityAnalysis {
  number: RouletteNumber;
  probability: number; // от 0 до 100
  frequencyScore: number; // частотный вес
  hotColdScore: number; // вес горячих/холодных чисел
  trendScore: number; // вес тренда
  confidence: number; // уровень уверенности (0-1)
}

// Рекомендация
export interface Recommendation {
  number: RouletteNumber;
  probability: number;
  confidence: number;
  reason: string; // причина рекомендации
}

// Комбинация: пара чисел подряд (предыдущее → следующее)
export interface PairCombination {
  prev: RouletteNumber;   // что выпало перед
  next: RouletteNumber;  // что выпало после
  count: number;         // сколько раз такая пара встречалась
  percentage: number;    // доля от всех пар с таким prev
}

// Статистика комбинаций по всей истории
export interface CombinationStats {
  pairs: PairCombination[];  // все пары (prev → next) по всей истории
  pairsByPrev: Record<RouletteNumber, PairCombination[]>; // для каждого prev — какие next шли после
}

// Общая статистика
export interface OverallStatistics {
  totalSpins: number;
  numberStats: NumberStatistics[];
  probabilities: ProbabilityAnalysis[];
  recommendations: Recommendation[];
  combinationStats: CombinationStats; // комбинации по всей истории
}

// Данные для localStorage
export interface StorageData {
  history: HistoryEntry[];
  timestamp: number;
}

// Настройки анализа
export interface AnalysisConfig {
  recentSpinsWindow: number; // окно для анализа последних спинов
  hotThreshold: number; // порог для "горячих" чисел
  coldThreshold: number; // порог для "холодных" чисел
  frequencyWeight: number; // вес частотного анализа (0-1)
  hotColdWeight: number; // вес горячих/холодных (0-1)
  trendWeight: number; // вес тренда (0-1)
}
