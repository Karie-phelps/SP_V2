// ---- RULE-BASED ADAPTIVE ENGINE ---- //

interface HistoryEntry {
  difficulty: string,
    score: number,
    avgTime: number,
    targetTime: number,
    missedLowFreq: number,
    similarChoiceErrors: number           
}

export function evaluateUserPerformance(history: HistoryEntry[]) {
  const last = history[history.length - 1];

  const score = last.score;               // percent correct
  const avgTime = last.avgTime;           // seconds per item
  const difficulty = last.difficulty;     // 'easy' | 'medium' | 'hard'

  let nextDifficulty = difficulty;
  let tags = [];

  // ----- ERROR TAGGING RULES ----- //

  // 1. Vocabulary Gap (rare words)
  if (last.missedLowFreq > 0) {
    tags.push("vocabulary_gap");
  }

  // 2. Similar Choices (string distance)
  if (last.similarChoiceErrors > 0) {
    tags.push("similar_choices");
  }

  // 3. Time-out
  if (avgTime > last.targetTime) {
    tags.push("time_out");
  }

  // 4. Accuracy-based adaptivity
  if (score >= 85 && avgTime <= last.targetTime) {
    if (difficulty === "easy") nextDifficulty = "medium";
    else if (difficulty === "medium") nextDifficulty = "hard";
  }

  if (score <= 50) {
    if (difficulty === "hard") nextDifficulty = "medium";
    else if (difficulty === "medium") nextDifficulty = "easy";
  }

  return {
    nextDifficulty,
    tags
  };
}
