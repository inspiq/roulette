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

// Общая статистика
export interface OverallStatistics {
  totalSpins: number;
  numberStats: NumberStatistics[];
  probabilities: ProbabilityAnalysis[];
  recommendations: Recommendation[];
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
