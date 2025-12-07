import { vocabularyData } from "@/data/vocabulary-dataset";

// Levenshtein distance for near-miss detection
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Check if word is low frequency (rare/uncommon)
export function isLowFrequencyWord(word: string): boolean {
  const wordData = vocabularyData.find(
    (w) => w.word.toLowerCase() === word.toLowerCase()
  );
  return wordData?.difficulty === "hard";
}

// Check if two words are similar (confusable)
export function areSimilarWords(word1: string, word2: string): boolean {
  const distance = levenshteinDistance(
    word1.toLowerCase(),
    word2.toLowerCase()
  );
  const maxLength = Math.max(word1.length, word2.length);
  const similarity = 1 - distance / maxLength;
  return similarity >= 0.7; // 70% similarity threshold
}

// Check if answer is near-miss
export function isNearMiss(userAnswer: string, correctAnswer: string): boolean {
  const distance = levenshteinDistance(
    userAnswer.toLowerCase(),
    correctAnswer.toLowerCase()
  );
  return distance > 0 && distance <= 2; // Off by 1-2 characters
}

// Normalize text for comparison
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
