import type {
  HistoryEntry,
  NumberStatistics,
  ProbabilityAnalysis,
  Recommendation,
  OverallStatistics,
  AnalysisConfig,
} from '@/types/roulette';
import { ROULETTE_NUMBERS } from '@/types/roulette';

// Конфигурация по умолчанию
const DEFAULT_CONFIG: AnalysisConfig = {
  recentSpinsWindow: 15, // анализируем последние 15 спинов для "горячих" чисел
  hotThreshold: 0.35, // если число выпало >35% в последних спинах - горячее
  coldThreshold: 0.1, // если число выпало <10% в последних спинах - холодное
  frequencyWeight: 0.3, // вес частотного анализа
  hotColdWeight: 0.4, // вес горячих/холодных чисел
  trendWeight: 0.3, // вес тренда
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

// Генерация рекомендаций
function generateRecommendations(
  probabilities: ProbabilityAnalysis[],
  statistics: NumberStatistics[]
): Recommendation[] {
  // Сортируем по вероятности
  const sorted = [...probabilities].sort((a, b) => b.probability - a.probability);

  // Берем топ-2 числа
  return sorted.slice(0, 2).map((prob) => {
    const stats = statistics.find((s) => s.number === prob.number)!;

    // Генерируем причину рекомендации
    let reason = '';
    if (stats.isHot) {
      reason = `Горячее число: выпадает часто в последних спинах (${prob.hotColdScore.toFixed(1)}%)`;
    } else if (stats.isCold) {
      reason = `Холодное число: давно не выпадало, может скоро выпасть`;
    } else if (prob.trendScore > prob.frequencyScore && prob.trendScore > prob.hotColdScore) {
      reason = `Растущий тренд: выпадения становятся чаще`;
    } else if (prob.frequencyScore > 30) {
      reason = `Высокая частота: часто выпадает в общей статистике (${stats.percentage.toFixed(1)}%)`;
    } else {
      reason = `Сбалансированный выбор на основе комбинированного анализа`;
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
  const recommendations = generateRecommendations(probabilities, numberStats);

  return {
    totalSpins: history.length,
    numberStats,
    probabilities,
    recommendations,
  };
}

// Экспорт конфигурации по умолчанию
export { DEFAULT_CONFIG };
