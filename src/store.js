/**
 * JuniorIQ State Management — store.js
 * Centralised localStorage wrapper for scores and recognition speed.
 */

const STORAGE_KEY = 'junioriq_state';

const CATEGORIES = ['math', 'letters', 'reading', 'patterns', 'science'];

const DEFAULT_STATE = () =>
  Object.fromEntries(
    CATEGORIES.map(cat => [
      cat,
      { correct: 0, incorrect: 0, totalTime: 0, attempts: 0 }
    ])
  );

/** Load state from localStorage, initialising if absent. */
export function getState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE();
    const parsed = JSON.parse(raw);
    // Ensure all categories exist (future-proofing)
    const base = DEFAULT_STATE();
    CATEGORIES.forEach(cat => {
      if (!parsed[cat]) parsed[cat] = base[cat];
    });
    return parsed;
  } catch {
    return DEFAULT_STATE();
  }
}

/** Persist state to localStorage. */
function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Record a single answer.
 * @param {string} category  - one of CATEGORIES
 * @param {boolean} isCorrect
 * @param {number} responseTimeMs - milliseconds taken to answer
 */
export function recordAnswer(category, isCorrect, responseTimeMs = 0) {
  if (!CATEGORIES.includes(category)) return;
  const state = getState();
  const cat = state[category];
  if (isCorrect) {
    cat.correct += 1;
  } else {
    cat.incorrect += 1;
  }
  cat.totalTime += Math.max(0, responseTimeMs);
  cat.attempts += 1;
  saveState(state);
}

/**
 * Get computed stats for one category.
 * @returns {{ correct, incorrect, attempts, accuracy, avgSpeedMs }}
 */
export function getStats(category) {
  const state = getState();
  const cat = state[category] || DEFAULT_STATE()[category];
  const accuracy = cat.attempts > 0 ? cat.correct / cat.attempts : 0;
  const avgSpeedMs = cat.attempts > 0 ? cat.totalTime / cat.attempts : 0;
  return {
    correct: cat.correct,
    incorrect: cat.incorrect,
    attempts: cat.attempts,
    accuracy,           // 0–1
    avgSpeedMs          // milliseconds
  };
}

/**
 * Compute a 0–100 radar score per category.
 * Formula: score = (accuracy * 0.6) + (speedBonus * 0.4)
 * speedBonus: 100 at ≤500ms, 0 at ≥3000ms, linear between.
 */
export function getRadarScores() {
  return Object.fromEntries(
    CATEGORIES.map(cat => {
      const { accuracy, avgSpeedMs, attempts } = getStats(cat);
      if (attempts === 0) return [cat, 0];
      const clampedMs = Math.min(Math.max(avgSpeedMs, 500), 3000);
      const speedBonus = 1 - (clampedMs - 500) / 2500;
      const score = Math.round((accuracy * 0.6 + speedBonus * 0.4) * 100);
      return [cat, score];
    })
  );
}

/**
 * Clear only the JuniorIQ session data (not the whole localStorage).
 */
export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}
