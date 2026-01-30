import type {
  HistoryEntry,
  NumberStatistics,
  ProbabilityAnalysis,
  Recommendation,
  OverallStatistics,
  AnalysisConfig,
  PairCombination,
  TripleCombination,
  QuadrupleCombination,
  CombinationStats,
  StreakBreakStats,
  StreakBreakItem,
  RouletteNumber,
} from '@/types/roulette';
import { ROULETTE_NUMBERS } from '@/types/roulette';

// Точный процент: 100 * count / total (total === 0 → 0)
function exactPercent(count: number, total: number): number {
  if (total <= 0) return 0;
  return (count / total) * 100;
}

// Нормализация: сумма процентов в группе = 100 (только при наличии данных, исправление погрешности float)
function normalizePercentages<T extends { count: number; percentage: number }>(items: T[]): void {
  if (items.length === 0) return;
  const sum = items.reduce((s, i) => s + i.percentage, 0);
  if (sum < 0.01) return; // нет данных — не присваивать 100% одному элементу
  const diff = 100 - sum;
  if (Math.abs(diff) < 1e-10) return;
  const maxIdx = items.reduce((best, item, i) => (item.count > (items[best]?.count ?? -1) ? i : best), 0);
  items[maxIdx].percentage += diff;
}

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
    const percentage = exactPercent(count, totalSpins);

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

    // Точные счётчики за последние 5, 10, 20 спинов (без округления)
    const last5 = history.slice(-5);
    const last10 = history.slice(-10);
    const last20 = history.slice(-20);
    const countLast5 = last5.filter((e) => e.number === number).length;
    const countLast10 = last10.filter((e) => e.number === number).length;
    const countLast20 = last20.filter((e) => e.number === number).length;
    const denom5 = totalSpins > 0 ? Math.min(5, totalSpins) : 1;
    const denom10 = totalSpins > 0 ? Math.min(10, totalSpins) : 1;
    const denom20 = totalSpins > 0 ? Math.min(20, totalSpins) : 1;
    const pctLast5 = exactPercent(countLast5, denom5);
    const pctLast10 = exactPercent(countLast10, denom10);
    const pctLast20 = exactPercent(countLast20, denom20);

    return {
      number,
      count,
      percentage,
      lastSeenIndex,
      averageInterval,
      isHot,
      isCold,
      countLast5,
      countLast10,
      countLast20,
      pctLast5,
      pctLast10,
      pctLast20,
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

// Комбинации по ВСЕЙ истории.
// Пара: (history[i-1], history[i]). Всего пар = length - 1.
// Тройка: (history[i-2], history[i-1], history[i]). Всего троек = length - 2.
// Четвёрка: (history[i-3], history[i-2], history[i-1], history[i]). Всего четвёрок = length - 3.
function computeCombinationStats(history: HistoryEntry[]): CombinationStats {
  const totalPairs = Math.max(0, history.length - 1);
  const totalTriples = Math.max(0, history.length - 2);
  const totalQuadruples = Math.max(0, history.length - 3);

  const pairCounts = new Map<string, number>(); // ключ "prev-next", значение — сколько раз эта пара подряд
  const prevTotals = new Map<number, number>(); // для каждого prev: сколько раз он был предыдущим спином

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
      const percentage = exactPercent(count, totalPrev);
      const pair: PairCombination = { prev, next, count, percentage };
      pairs.push(pair);
      pairsByPrev[prev].push(pair);
    });
    normalizePercentages(pairsByPrev[prev]);
    pairsByPrev[prev].sort((a, b) => b.percentage - a.percentage);
  });

  // Тройки: prev2 → prev1 → next (ключ "prev2-prev1", значение — массив троек по next)
  const tripleCounts = new Map<string, number>(); // ключ "prev2-prev1-next"
  const prev2Prev1Totals = new Map<string, number>(); // ключ "prev2-prev1"

  for (let i = 2; i < history.length; i++) {
    const prev2 = history[i - 2].number;
    const prev1 = history[i - 1].number;
    const next = history[i].number;
    const key = `${prev2}-${prev1}-${next}`;
    const keyPrev = `${prev2}-${prev1}`;
    tripleCounts.set(key, (tripleCounts.get(key) ?? 0) + 1);
    prev2Prev1Totals.set(keyPrev, (prev2Prev1Totals.get(keyPrev) ?? 0) + 1);
  }

  const triples: TripleCombination[] = [];
  const triplesByPrev2Prev1: Record<string, TripleCombination[]> = {};

  const prevPairs: Array<[RouletteNumber, RouletteNumber]> = [];
  ROULETTE_NUMBERS.forEach((p2) => {
    ROULETTE_NUMBERS.forEach((p1) => {
      prevPairs.push([p2, p1]);
    });
  });

  prevPairs.forEach(([prev2, prev1]) => {
    const keyPrev = `${prev2}-${prev1}`;
    const totalPrev2Prev1 = prev2Prev1Totals.get(keyPrev) ?? 0;
    const list: TripleCombination[] = [];
    ROULETTE_NUMBERS.forEach((next) => {
      const key = `${prev2}-${prev1}-${next}`;
      const count = tripleCounts.get(key) ?? 0;
      const percentage = exactPercent(count, totalPrev2Prev1);
      const triple: TripleCombination = { prev2, prev1, next, count, percentage };
      triples.push(triple);
      list.push(triple);
    });
    normalizePercentages(list);
    list.sort((a, b) => b.percentage - a.percentage);
    triplesByPrev2Prev1[keyPrev] = list;
  });

  // Четвёрки: prev3 → prev2 → prev1 → next (ключ "prev3-prev2-prev1")
  const quadCounts = new Map<string, number>(); // "prev3-prev2-prev1-next"
  const prev3Prev2Prev1Totals = new Map<string, number>(); // "prev3-prev2-prev1"

  for (let i = 3; i < history.length; i++) {
    const prev3 = history[i - 3].number;
    const prev2 = history[i - 2].number;
    const prev1 = history[i - 1].number;
    const next = history[i].number;
    const key = `${prev3}-${prev2}-${prev1}-${next}`;
    const keyPrev = `${prev3}-${prev2}-${prev1}`;
    quadCounts.set(key, (quadCounts.get(key) ?? 0) + 1);
    prev3Prev2Prev1Totals.set(keyPrev, (prev3Prev2Prev1Totals.get(keyPrev) ?? 0) + 1);
  }

  const quadruples: QuadrupleCombination[] = [];
  const quadruplesByPrev3Prev2Prev1: Record<string, QuadrupleCombination[]> = {};

  const prevTriples: Array<[RouletteNumber, RouletteNumber, RouletteNumber]> = [];
  ROULETTE_NUMBERS.forEach((p3) => {
    ROULETTE_NUMBERS.forEach((p2) => {
      ROULETTE_NUMBERS.forEach((p1) => {
        prevTriples.push([p3, p2, p1]);
      });
    });
  });

  prevTriples.forEach(([prev3, prev2, prev1]) => {
    const keyPrev = `${prev3}-${prev2}-${prev1}`;
    const totalPrev3Prev2Prev1 = prev3Prev2Prev1Totals.get(keyPrev) ?? 0;
    const list: QuadrupleCombination[] = [];
    ROULETTE_NUMBERS.forEach((next) => {
      const key = `${prev3}-${prev2}-${prev1}-${next}`;
      const count = quadCounts.get(key) ?? 0;
      const percentage = exactPercent(count, totalPrev3Prev2Prev1);
      const quad: QuadrupleCombination = { prev3, prev2, prev1, next, count, percentage };
      quadruples.push(quad);
      list.push(quad);
    });
    normalizePercentages(list);
    list.sort((a, b) => b.percentage - a.percentage);
    quadruplesByPrev3Prev2Prev1[keyPrev] = list;
  });

  return {
    pairs,
    pairsByPrev,
    totalPairs,
    triples,
    triplesByPrev2Prev1,
    totalTriples,
    quadruples,
    quadruplesByPrev3Prev2Prev1,
    totalQuadruples,
  };
}

// Аналитика по частотам: на какой длине серии число обрывается (падает)
function computeStreakBreakStats(history: HistoryEntry[]): StreakBreakStats[] {
  // Собираем длины всех серий для каждого числа
  const streakLengthsByNumber: Record<RouletteNumber, number[]> = {
    2: [],
    3: [],
    5: [],
    10: [],
  };

  let i = 0;
  while (i < history.length) {
    const num = history[i].number;
    let run = 0;
    while (i < history.length && history[i].number === num) {
      run++;
      i++;
    }
    if (run > 0) {
      streakLengthsByNumber[num].push(run);
    }
  }

  return ROULETTE_NUMBERS.map((number) => {
    const lengths = streakLengthsByNumber[number];
    const totalStreaks = lengths.length;
    const maxObservedStreak = totalStreaks > 0 ? Math.max(...lengths) : 0;
    const averageStreakLength =
      totalStreaks > 0 ? lengths.reduce((s, l) => s + l, 0) / totalStreaks : 0;

    // Распределение: сколько раз серия оборвалась на длине 1, 2, 3, ...
    const countByLength = new Map<number, number>();
    lengths.forEach((len) => {
      countByLength.set(len, (countByLength.get(len) ?? 0) + 1);
    });

    const breakDistribution: StreakBreakItem[] = [];
    let mostCommonBreakAfter = 1;
    let maxCount = 0;
    for (let len = 1; len <= maxObservedStreak; len++) {
      const count = countByLength.get(len) ?? 0;
      const percentage = exactPercent(count, totalStreaks);
      breakDistribution.push({ streakLength: len, count, percentage });
      if (count > maxCount) {
        maxCount = count;
        mostCommonBreakAfter = len;
      }
    }
    normalizePercentages(breakDistribution);
    breakDistribution.sort((a, b) => b.percentage - a.percentage);

    return {
      number,
      breakDistribution,
      totalStreaks,
      averageStreakLength,
      mostCommonBreakAfter,
      maxObservedStreak,
    };
  });
}

// Текущая серия в конце истории: сколько раз подряд выпало число
function getCurrentStreak(history: HistoryEntry[], number: RouletteNumber): number {
  if (history.length === 0) return 0;
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].number === number) streak++;
    else break;
  }
  return streak;
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

// Процент по комбинации: приоритет — четвёрка (3 последних спина) > тройка (2 последних) > пара (1 последний)
function getCombinationScore(
  number: RouletteNumber,
  history: HistoryEntry[],
  combinationStats: CombinationStats
): { score: number; source: 'pair' | 'triple' | 'quadruple' | null; count: number } {
  // Четвёрка: последние три спина (prev3, prev2, prev1) → что выпадает следующим
  if (history.length >= 4) {
    const prev3 = history[history.length - 3].number;
    const prev2 = history[history.length - 2].number;
    const prev1 = history[history.length - 1].number;
    const key = `${prev3}-${prev2}-${prev1}`;
    const list = combinationStats.quadruplesByPrev3Prev2Prev1[key];
    if (list) {
      const quad = list.find((q) => q.next === number);
      return {
        score: quad?.percentage ?? 0,
        source: 'quadruple',
        count: quad?.count ?? 0,
      };
    }
  }
  // Тройка: последние два спина (prev2, prev1) → что выпадает следующим
  if (history.length >= 2) {
    const prev2 = history[history.length - 2].number;
    const prev1 = history[history.length - 1].number;
    const key = `${prev2}-${prev1}`;
    const list = combinationStats.triplesByPrev2Prev1[key];
    if (list) {
      const triple = list.find((t) => t.next === number);
      return {
        score: triple?.percentage ?? 0,
        source: 'triple',
        count: triple?.count ?? 0,
      };
    }
  }
  // Пара: последний спин (prev) → что выпадает следующим
  if (history.length >= 1) {
    const prev = history[history.length - 1].number;
    const list = combinationStats.pairsByPrev[prev];
    if (list) {
      const pair = list.find((p) => p.next === number);
      return {
        score: pair?.percentage ?? 0,
        source: 'pair',
        count: pair?.count ?? 0,
      };
    }
  }
  return { score: 0, source: null, count: 0 };
}

// Анализ вероятностей: при наличии истории — процент по комбинациям (пары/тройки), иначе по частоте
function analyzeProbabilities(
  statistics: NumberStatistics[],
  history: HistoryEntry[],
  combinationStats: CombinationStats,
  config: AnalysisConfig = DEFAULT_CONFIG,
  streakBreakStats?: StreakBreakStats[]
): ProbabilityAnalysis[] {
  const totalSpins = history.length;
  const hasCombinationData = totalSpins >= 1;

  return statistics.map((stats) => {
    const frequencyScore = calculateFrequencyScore(stats, totalSpins);
    const hotColdScore = calculateHotColdScore(stats, history, config.recentSpinsWindow);
    const trendScore = calculateTrendScore(stats, history);

    const { score: combinationScore, source: combinationSource, count: combinationCount } =
      getCombinationScore(stats.number, history, combinationStats);

    // Если есть комбинация (пара / тройка / четвёрка) — вероятность = процент по комбинации
    let probability: number;
    if (hasCombinationData && (combinationSource === 'pair' || combinationSource === 'triple' || combinationSource === 'quadruple')) {
      probability = combinationScore;
      // Лёгкая подмесь частоты, если по комбинации 0% (такая комбинация не встречалась)
      if (probability === 0) probability = Math.min(15, frequencyScore * 0.5);
    } else {
      probability =
        frequencyScore * config.frequencyWeight +
        hotColdScore * config.hotColdWeight +
        trendScore * config.trendWeight;
    }

    // Учёт серии подряд: если число уже выпало N раз подряд, снижаем шанс по статистике обрывов
    const currentStreak = getCurrentStreak(history, stats.number);
    if (currentStreak >= 1 && streakBreakStats?.length) {
      const streakStat = streakBreakStats.find((s) => s.number === stats.number);
      if (streakStat?.breakDistribution?.length) {
        const breakAtThisLength = streakStat.breakDistribution.find(
          (b) => b.streakLength === currentStreak
        );
        const cumulativeBreakPct = streakStat.breakDistribution
          .filter((b) => b.streakLength <= currentStreak)
          .reduce((sum, b) => sum + b.percentage, 0);
        const penalty = Math.min(35, (breakAtThisLength?.percentage ?? cumulativeBreakPct * 0.5) * 0.8);
        probability = Math.max(5, probability - penalty);
      }
    }

    let confidence = 0;
    if (totalSpins >= 50) confidence = 0.9;
    else if (totalSpins >= 30) confidence = 0.75;
    else if (totalSpins >= 15) confidence = 0.6;
    else if (totalSpins >= 5) confidence = 0.4;
    else confidence = 0.2;
    if (hasCombinationData && combinationCount > 0) confidence = Math.min(0.95, confidence + 0.1);

    return {
      number: stats.number,
      probability,
      frequencyScore,
      hotColdScore,
      trendScore,
      confidence,
      combinationScore,
      combinationSource,
      combinationCount,
    };
  });
}

// Генерация рекомендаций (по всей истории + комбинации + учёт серий подряд)
function generateRecommendations(
  probabilities: ProbabilityAnalysis[],
  statistics: NumberStatistics[],
  history: HistoryEntry[],
  combinationStats: CombinationStats,
  streakBreakStats?: StreakBreakStats[]
): Recommendation[] {
  const sorted = [...probabilities].sort((a, b) => b.probability - a.probability);
  const lastNumber = history.length > 0 ? history[history.length - 1].number : null;
  const lastNumberStreak = lastNumber !== null ? getCurrentStreak(history, lastNumber) : 0;
  const lastNumberBreakStat = lastNumber !== null && lastNumberStreak >= 1
    ? streakBreakStats?.find((s) => s.number === lastNumber)?.breakDistribution?.find(
        (b) => b.streakLength === lastNumberStreak
      )
    : null;
  const streakContext =
    lastNumber !== null &&
    lastNumberStreak >= 2 &&
    lastNumberBreakStat &&
    lastNumberBreakStat.percentage >= 20
      ? `${lastNumber} уже ${lastNumberStreak} раз подряд — по истории серия часто обрывается. `
      : '';

  return sorted.slice(0, 2).map((prob) => {
    const stats = statistics.find((s) => s.number === prob.number)!;
    let reason = '';

    const currentStreak = getCurrentStreak(history, prob.number);
    const streakStat = streakBreakStats?.find((s) => s.number === prob.number);
    const breakAtStreak = streakStat?.breakDistribution?.find((b) => b.streakLength === currentStreak);

    const prefix = streakContext && prob.number !== lastNumber ? streakContext : '';

    // Число уже долго идёт подряд — по истории серия часто обрывается (снижаем шанс)
    if (currentStreak >= 1 && breakAtStreak && breakAtStreak.percentage >= 25) {
      reason = `Сейчас ${prob.number} выпало ${currentStreak} раз подряд — в ${breakAtStreak.percentage.toFixed(2)}% случаев серия обрывается на этой длине`;
    }
    // Процент по комбинации: пара / тройка / четвёрка
    if (!reason && (prob.combinationSource === 'pair' || prob.combinationSource === 'triple' || prob.combinationSource === 'quadruple') && prob.combinationCount > 0) {
      if (prob.combinationSource === 'quadruple' && history.length >= 4) {
        const prev3 = history[history.length - 3].number;
        const prev2 = history[history.length - 2].number;
        const prev1 = history[history.length - 1].number;
        reason = `${prefix}По комбинации (после ${prev3}→${prev2}→${prev1}): выпадает в ${prob.combinationScore.toFixed(2)}% случаев (${prob.combinationCount} раз)`;
      } else if (prob.combinationSource === 'triple' && history.length >= 2) {
        const prev2 = history[history.length - 2].number;
        const prev1 = history[history.length - 1].number;
        reason = `${prefix}По комбинации (после ${prev2}→${prev1}): выпадает в ${prob.combinationScore.toFixed(2)}% случаев (${prob.combinationCount} раз)`;
      } else if (prob.combinationSource === 'pair' && lastNumber !== null) {
        reason = `${prefix}По комбинации (после ${lastNumber}): выпадает в ${prob.combinationScore.toFixed(2)}% случаев (${prob.combinationCount} раз)`;
      }
    }
    if (!reason && lastNumber !== null && combinationStats.pairsByPrev[lastNumber]?.length) {
      const bestAfter = combinationStats.pairsByPrev[lastNumber][0];
      if (bestAfter.next === prob.number && bestAfter.count > 0) {
        reason = `${prefix}После ${lastNumber} чаще всего выпадает ${prob.number} (${bestAfter.percentage.toFixed(2)}%, ${bestAfter.count} раз)`;
      }
    }
    if (!reason && prob.frequencyScore >= 25) {
      reason = `${prefix}По всей истории: выпадает в ${stats.percentage.toFixed(2)}% спинов (${stats.count} раз)`;
    }
    if (!reason && stats.isHot) {
      reason = `${prefix}Горячее: часто в последних спинах (${prob.hotColdScore.toFixed(2)}%)`;
    }
    if (!reason && stats.isCold) {
      reason = `${prefix}Холодное: давно не выпадало, может скоро выпасть`;
    }
    if (!reason) {
      reason = `${prefix}Сбалансированный выбор (частота ${prob.frequencyScore.toFixed(2)}%)`;
    }
    reason = reason.trim();

    return {
      number: prob.number,
      probability: prob.probability,
      confidence: prob.confidence,
      reason,
      combinationSource: prob.combinationSource,
      combinationCount: prob.combinationCount,
    };
  });
}

// Главная функция анализа
export function analyzeRouletteHistory(
  history: HistoryEntry[],
  config: AnalysisConfig = DEFAULT_CONFIG
): OverallStatistics {
  const numberStats = calculateNumberStatistics(history, config);
  const combinationStats = computeCombinationStats(history);
  const streakBreakStats = computeStreakBreakStats(history);
  const probabilities = analyzeProbabilities(
    numberStats,
    history,
    combinationStats,
    config,
    streakBreakStats
  );
  const recommendations = generateRecommendations(
    probabilities,
    numberStats,
    history,
    combinationStats,
    streakBreakStats
  );

  return {
    totalSpins: history.length,
    numberStats,
    probabilities,
    recommendations,
    combinationStats,
    streakBreakStats,
  };
}

// Экспорт конфигурации по умолчанию
export { DEFAULT_CONFIG };
