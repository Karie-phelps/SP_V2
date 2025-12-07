// ---- RULE-BASED ADAPTIVE ENGINE ---- //

interface HistoryEntry {
  difficulty: "easy" | "medium" | "hard",
  score: number,                 // percent correct (0–100)
  missedLowFreq: number,         // count of rare/uncommon words missed
  similarChoiceErrors: number    // confusing-option mistakes
}

export function evaluateUserPerformance(history: HistoryEntry[]) {
  const last = history[history.length - 1];

  const { score, difficulty } = last;

  let nextDifficulty = difficulty;
  let tags: string[] = [];

  // ----- ERROR TAGGING RULES ----- //

  // 1. Vocabulary Gap (missed rare words)
  if (last.missedLowFreq > 0) {
    tags.push("vocabulary_gap");
  }

  // 2. Similar Choice Errors (confusable words)
  if (last.similarChoiceErrors > 0) {
    tags.push("similar_choices");
  }

  // ----- DIFFICULTY ADAPTATION RULES ----- //

  // Increase difficulty (user is performing well)
  if (score >= 85) {
    if (difficulty === "easy") nextDifficulty = "medium";
    else if (difficulty === "medium") nextDifficulty = "hard";
  }

  // Decrease difficulty (user is struggling)
  if (score <= 50) {
    if (difficulty === "hard") nextDifficulty = "medium";
    else if (difficulty === "medium") nextDifficulty = "easy";
  }

  // Otherwise, keep difficulty unchanged

  return {
    nextDifficulty,
    tags
  };
}
