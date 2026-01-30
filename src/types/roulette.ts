// Допустимые числа рулетки
export const ROULETTE_NUMBERS = [2, 3, 5, 10] as const;
export type RouletteNumber = typeof ROULETTE_NUMBERS[number];

// Запись в истории
export interface HistoryEntry {
  id: string;
  number: RouletteNumber;
  timestamp: number;
}

// Статистика для каждого числа (все счётчики — целые числа, доли без округления)
export interface NumberStatistics {
  number: RouletteNumber;
  count: number;                    // точное число выпадений
  percentage: number;               // 100 * count / totalSpins (полная точность)
  lastSeenIndex: number | null;
  averageInterval: number;
  isHot: boolean;
  isCold: boolean;
  countLast5: number;   // сколько раз в последних 5 спинах
  countLast10: number;
  countLast20: number;
  pctLast5: number;    // 100 * countLast5 / min(5, totalSpins)
  pctLast10: number;
  pctLast20: number;
}

// Анализ вероятностей
export interface ProbabilityAnalysis {
  number: RouletteNumber;
  probability: number; // от 0 до 100 (при наличии комбинации — процент по комбинации)
  frequencyScore: number; // частотный вес по всей истории
  hotColdScore: number; // вес горячих/холодных чисел
  trendScore: number; // вес тренда
  confidence: number; // уровень уверенности (0-1)
  // Процент по комбинациям: что выпадает после последнего (пары) или после двух последних (тройки)
  combinationScore: number; // 0–100, процент по комбинации
  combinationSource: 'pair' | 'triple' | 'quadruple' | null; // пара / тройка / четвёрка
  combinationCount: number; // сколько раз такая комбинация встречалась в истории
}

// Рекомендация
export interface Recommendation {
  number: RouletteNumber;
  probability: number;
  confidence: number;
  reason: string; // причина рекомендации
  combinationSource: 'pair' | 'triple' | 'quadruple' | null;
  combinationCount: number;
}

// Комбинация: пара чисел подряд (предыдущее → следующее)
export interface PairCombination {
  prev: RouletteNumber;   // что выпало перед
  next: RouletteNumber;  // что выпало после
  count: number;         // сколько раз такая пара встречалась
  percentage: number;    // доля от всех пар с таким prev
}

// Тройка подряд: prev2 → prev1 → next
export interface TripleCombination {
  prev2: RouletteNumber;
  prev1: RouletteNumber;
  next: RouletteNumber;
  count: number;
  percentage: number;
}

// Четвёрка подряд: prev3 → prev2 → prev1 → next (что выпадает после трёх последних)
export interface QuadrupleCombination {
  prev3: RouletteNumber;
  prev2: RouletteNumber;
  prev1: RouletteNumber;
  next: RouletteNumber;
  count: number;
  percentage: number;
}

// Статистика комбинаций по всей истории (пары + тройки + четвёрки)
export interface CombinationStats {
  pairs: PairCombination[];
  pairsByPrev: Record<RouletteNumber, PairCombination[]>;
  totalPairs: number;
  triples: TripleCombination[];
  triplesByPrev2Prev1: Record<string, TripleCombination[]>; // ключ "prev2-prev1"
  totalTriples: number;
  quadruples: QuadrupleCombination[];
  quadruplesByPrev3Prev2Prev1: Record<string, QuadrupleCombination[]>; // ключ "prev3-prev2-prev1"
  totalQuadruples: number; // history.length - 3 при length >= 4
}

// На какой длине серии число обрывается: "после 1 раза" — count, "после 2 раз" — count и т.д.
export interface StreakBreakItem {
  streakLength: number;   // длина серии (1, 2, 3, ...)
  count: number;         // сколько раз серия оборвалась на этой длине
  percentage: number;    // доля от всех обрывов этого числа
}

// Аналитика по частотам: где обрывается или "падает" число
export interface StreakBreakStats {
  number: RouletteNumber;
  breakDistribution: StreakBreakItem[];  // распределение обрывов по длине серии
  totalStreaks: number;                  // всего серий (обрывов)
  averageStreakLength: number;          // средняя длина серии до обрыва
  mostCommonBreakAfter: number;         // чаще всего обрывается после N подряд (мода)
  maxObservedStreak: number;            // макс. наблюдаемая длина серии
}

// Общая статистика
export interface OverallStatistics {
  totalSpins: number;
  numberStats: NumberStatistics[];
  probabilities: ProbabilityAnalysis[];
  recommendations: Recommendation[];
  combinationStats: CombinationStats;
  streakBreakStats: StreakBreakStats[]; // аналитика по обрывам серий
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
