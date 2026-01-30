import type {
  HistoryEntry,
  NumberStatistics,
  ProbabilityAnalysis,
  Recommendation,
  OverallStatistics,
  AnalysisConfig,
  PairCombination,
  CombinationStats,
  RouletteNumber,
} from '@/types/roulette';
import { ROULETTE_NUMBERS } from '@/types/roulette';

// Конфигурация по умолчанию
const DEFAULT_CONFIG: AnalysisConfig = {
  recentSpinsWindow: 15, // анализируем последние 15 спинов для "горячих" чисел
  hotThreshold: 0.35, // если число выпало >35% в последних спинах - горячее
  coldThreshold: 0.1, // если число выпало <10% в последних спинах - холодное
  frequencyWeight: 0.6, // основной вес — по всей истории
  hotColdWeight: 0.2,
  trendWeight: 0.2,
};

// Вычисление статистики для каждого числа
function calculateNumberStatistics(
  history: HistoryEntry[],
  config: AnalysisConfig = DEFAULT_CONFIG
): NumberStatistics[] {
  const totalSpins = history.length;

  return ROULETTE_NUMBERS.map((number) => {
    const occurrences = history.filter((entry) => entry.number === number);
    const count = occurrences.length;
    const percentage = totalSpins > 0 ? (count / totalSpins) * 100 : 0;

    // Находим индекс последнего выпадения
    let lastSeenIndex: number | null = null;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].number === number) {
        lastSeenIndex = history.length - 1 - i;
        break;
      }
    }

    // Вычисляем средний интервал между выпадениями
    let averageInterval = 0;
    if (occurrences.length > 1) {
      const intervals: number[] = [];
      let lastIndex = -1;

      history.forEach((entry, index) => {
        if (entry.number === number) {
          if (lastIndex !== -1) {
            intervals.push(index - lastIndex);
          }
          lastIndex = index;
        }
      });

      if (intervals.length > 0) {
        averageInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      }
    }

    // Анализ последних спинов для определения "горячих" и "холодных" чисел
    const recentSpins = history.slice(-config.recentSpinsWindow);
    const recentCount = recentSpins.filter((entry) => entry.number === number).length;
    const recentPercentage = recentSpins.length > 0 ? recentCount / recentSpins.length : 0;

    const isHot = recentPercentage >= config.hotThreshold;
    const isCold = recentPercentage <= config.coldThreshold && recentSpins.length >= config.recentSpinsWindow;

    return {
      number,
      count,
      percentage,
      lastSeenIndex,
      averageInterval,
      isHot,
      isCold,
    };
  });
}

// Расчет частотного веса
function calculateFrequencyScore(stats: NumberStatistics, totalSpins: number): number {
  if (totalSpins === 0) return 25; // базовое значение при отсутствии данных

  // Чем чаще выпадало - тем выше вес
  return stats.percentage;
}

// Расчет веса горячих/холодных чисел
function calculateHotColdScore(
  stats: NumberStatistics,
  history: HistoryEntry[],
  recentWindow: number
): number {
  const recentSpins = history.slice(-recentWindow);
  if (recentSpins.length === 0) return 25; // базовое значение

  const recentCount = recentSpins.filter((entry) => entry.number === stats.number).length;
  const recentPercentage = (recentCount / recentSpins.length) * 100;

  // Горячие числа получают бонус
  if (stats.isHot) {
    return Math.min(recentPercentage * 1.5, 100);
  }

  // Холодные числа получают пенальти, но не слишком большой
  // (может быть "должно скоро выпасть")
  if (stats.isCold) {
    return Math.max(recentPercentage * 0.5 + 15, 10);
  }

  return recentPercentage;
}

// Комбинации по ВСЕЙ истории: пары подряд (prev → next)
function computeCombinationStats(history: HistoryEntry[]): CombinationStats {
  const pairCounts = new Map<string, number>(); // ключ "prev-next"
  const prevTotals = new Map<number, number>(); // сколько раз каждое число было prev

  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1].number;
    const next = history[i].number;
    const key = `${prev}-${next}`;
    pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
    prevTotals.set(prev, (prevTotals.get(prev) ?? 0) + 1);
  }

  const pairs: PairCombination[] = [];
  const pairsByPrev: Record<RouletteNumber, PairCombination[]> = {
    2: [],
    3: [],
    5: [],
    10: [],
  };

  ROULETTE_NUMBERS.forEach((prev) => {
    const totalPrev = prevTotals.get(prev) ?? 0;
    ROULETTE_NUMBERS.forEach((next) => {
      const key = `${prev}-${next}`;
      const count = pairCounts.get(key) ?? 0;
      const percentage = totalPrev > 0 ? (count / totalPrev) * 100 : 0;
      const pair: PairCombination = { prev, next, count, percentage };
      pairs.push(pair);
      pairsByPrev[prev].push(pair);
    });
    pairsByPrev[prev].sort((a, b) => b.percentage - a.percentage);
  });

  return { pairs, pairsByPrev };
}

// Расчет веса тренда (учитываем недавние выпадения с большим весом)
function calculateTrendScore(stats: NumberStatistics, history: HistoryEntry[]): number {
  if (history.length === 0) return 25; // базовое значение

  // Взвешенный анализ: последние спины имеют больший вес
  let weightedSum = 0;
  let totalWeight = 0;

  history.slice(-20).forEach((entry, index) => {
    const weight = index + 1; // вес растет для более свежих данных
    totalWeight += weight;
    if (entry.number === stats.number) {
      weightedSum += weight;
    }
  });

  if (totalWeight === 0) return 25;

  const weightedPercentage = (weightedSum / totalWeight) * 100;

  // Учитываем, сколько спинов прошло с последнего выпадения
  if (stats.lastSeenIndex !== null) {
    const recencyBonus = Math.max(0, 20 - stats.lastSeenIndex * 2);
    return Math.min(weightedPercentage + recencyBonus, 100);
  }

  return weightedPercentage;
}

// Анализ вероятностей с комбинированным подходом
function analyzeProbabilities(
  statistics: NumberStatistics[],
  history: HistoryEntry[],
  config: AnalysisConfig = DEFAULT_CONFIG
): ProbabilityAnalysis[] {
  const totalSpins = history.length;

  return statistics.map((stats) => {
    const frequencyScore = calculateFrequencyScore(stats, totalSpins);
    const hotColdScore = calculateHotColdScore(stats, history, config.recentSpinsWindow);
    const trendScore = calculateTrendScore(stats, history);

    // Комбинированная вероятность
    const probability =
      frequencyScore * config.frequencyWeight +
      hotColdScore * config.hotColdWeight +
      trendScore * config.trendWeight;

    // Уровень уверенности зависит от количества данных
    let confidence = 0;
    if (totalSpins >= 50) confidence = 0.9;
    else if (totalSpins >= 30) confidence = 0.75;
    else if (totalSpins >= 15) confidence = 0.6;
    else if (totalSpins >= 5) confidence = 0.4;
    else confidence = 0.2;

    return {
      number: stats.number,
      probability,
      frequencyScore,
      hotColdScore,
      trendScore,
      confidence,
    };
  });
}

// Генерация рекомендаций (по всей истории + комбинации)
function generateRecommendations(
  probabilities: ProbabilityAnalysis[],
  statistics: NumberStatistics[],
  history: HistoryEntry[],
  combinationStats: CombinationStats
): Recommendation[] {
  const sorted = [...probabilities].sort((a, b) => b.probability - a.probability);
  const lastNumber = history.length > 0 ? history[history.length - 1].number : null;

  return sorted.slice(0, 2).map((prob) => {
    const stats = statistics.find((s) => s.number === prob.number)!;
    let reason = '';

    // Приоритет: комбинации по всей истории (после какого числа чаще выпадает)
    if (lastNumber !== null && combinationStats.pairsByPrev[lastNumber]?.length) {
      const bestAfter = combinationStats.pairsByPrev[lastNumber][0];
      if (bestAfter.next === prob.number && bestAfter.count > 0) {
        reason = `По всей истории после ${lastNumber} чаще всего выпадает ${prob.number} (${bestAfter.percentage.toFixed(0)}%, ${bestAfter.count} раз)`;
      }
    }
    if (!reason && prob.frequencyScore >= 25) {
      reason = `По всей истории: выпадает в ${stats.percentage.toFixed(0)}% спинов (${stats.count} раз)`;
    }
    if (!reason && stats.isHot) {
      reason = `Горячее: часто в последних спинах (${prob.hotColdScore.toFixed(0)}%)`;
    }
    if (!reason && stats.isCold) {
      reason = `Холодное: давно не выпадало, может скоро выпасть`;
    }
    if (!reason) {
      reason = `Сбалансированный выбор (частота ${prob.frequencyScore.toFixed(0)}%)`;
    }

    return {
      number: prob.number,
      probability: prob.probability,
      confidence: prob.confidence,
      reason,
    };
  });
}

// Главная функция анализа
export function analyzeRouletteHistory(
  history: HistoryEntry[],
  config: AnalysisConfig = DEFAULT_CONFIG
): OverallStatistics {
  const numberStats = calculateNumberStatistics(history, config);
  const probabilities = analyzeProbabilities(numberStats, history, config);
  const combinationStats = computeCombinationStats(history);
  const recommendations = generateRecommendations(
    probabilities,
    numberStats,
    history,
    combinationStats
  );

  return {
    totalSpins: history.length,
    numberStats,
    probabilities,
    recommendations,
    combinationStats,
  };
}

// Экспорт конфигурации по умолчанию
export { DEFAULT_CONFIG };
