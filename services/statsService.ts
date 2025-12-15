import { ExamStats, Result } from '../types';

// Simple T-distribution CDF approximation for large degrees of freedom (Normal approx)
// This is a simplification for the web app demo without heavy math libraries.
const approxPValue = (t: number, df: number): number => {
    // We use a simplified error function approximation for 2-tailed test
    const x = Math.abs(t);
    // Approximate complementary error function
    const t_val = 1.0 / (1.0 + 0.5 * x);
    const ans = t_val * Math.exp(-x * x - 1.26551223 +
                                    t_val * (1.00002368 +
                                    t_val * (0.37409196 +
                                    t_val * (0.09678418 +
                                    t_val * (-0.18628806 +
                                    t_val * (0.27886807 +
                                    t_val * (-1.13520398 +
                                    t_val * (1.48851587 +
                                    t_val * (-0.82215223 +
                                    t_val * 0.17087277)))))))));
    return ans; // This is roughly the 1-sided p-value for Normal dist. Good enough for this demo.
};

export const calculateStats = (results: Result[], totalQuestions: number): ExamStats => {
  if (results.length === 0) {
    return { mean: 0, median: 0, mode: 0, min: 0, max: 0, stdDev: 0, count: 0, tValue: 0, pValue: 0 };
  }

  // Convert raw scores to percentages for consistent stats
  const scores = results.map(r => (r.score / totalQuestions) * 100);
  const count = scores.length;
  const sum = scores.reduce((a, b) => a + b, 0);
  const mean = sum / count;

  // Min/Max
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  // Median
  const sorted = [...scores].sort((a, b) => a - b);
  const mid = Math.floor(count / 2);
  const median = count % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // Mode
  const freq: Record<number, number> = {};
  scores.forEach(s => freq[s] = (freq[s] || 0) + 1);
  let mode = sorted[0];
  let maxFreq = 0;
  for (const s in freq) {
    if (freq[s] > maxFreq) {
      maxFreq = freq[s];
      mode = parseFloat(s);
    }
  }

  // Standard Deviation
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  // One-sample T-test
  // Null Hypothesis (H0): The class average is 50% (random guessing)
  const mu0 = 50;
  const stdErr = stdDev / Math.sqrt(count);
  const tValue = stdErr === 0 ? 0 : (mean - mu0) / stdErr;
  const pValue = approxPValue(tValue, count - 1);

  return {
    mean,
    median,
    mode,
    min,
    max,
    stdDev,
    count,
    tValue,
    pValue
  };
};