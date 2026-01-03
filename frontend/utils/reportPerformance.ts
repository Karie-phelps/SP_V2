import {
  recordLexicalPerformance,
  type LexicalPerformanceEvent,
  type ModuleSlug,
  type ExerciseType,
} from "@/lib/api/progress";
import {
  isNearMiss,
  areSimilarWords,
  normalizeText,
} from "@/utils/PerformanceTracker";

/**
 * Report a single lexical item interaction to the backend.
 *
 * @param params - contextual info about the exercise and the item
 */
export async function reportLexicalItemPerformance(params: {
  module: ModuleSlug;
  exerciseType: ExerciseType;
  lemmaId: string;
  // raw text shown as correct answer
  correctAnswer: string;
  // what the learner actually answered/selected
  userAnswer: string;
  // for MCQ, this can be the *displayed* correct choice text
  // difficulty of the question as shown to the learner (if applicable)
  difficultyShown?: "easy" | "medium" | "hard";
  // optional numeric score for this interaction (0–100)
  score?: number;
}) {
  const {
    module,
    exerciseType,
    lemmaId,
    correctAnswer,
    userAnswer,
    difficultyShown,
    score,
  } = params;

  const normCorrect = normalizeText(correctAnswer);
  const normUser = normalizeText(userAnswer);

  const correct = normCorrect === normUser;

  // Near-miss: off by 1–2 characters (Levenshtein)
  const nearMiss = !correct && isNearMiss(userAnswer, correctAnswer);

  // Confusable: very similar but not equal (e.g., synonym/antonym trap)
  const confusableError =
    !correct && areSimilarWords(userAnswer, correctAnswer);

  const event: LexicalPerformanceEvent = {
    module,
    exercise_type: exerciseType,
    lemma_id: lemmaId,
    correct,
    is_near_miss: nearMiss,
    is_confusable_error: confusableError,
    score,
    difficulty_shown: difficultyShown,
  };

  try {
    await recordLexicalPerformance(event);
  } catch (e) {
    // You might want to log this somewhere; for now just swallow to avoid UX breakage
    console.error("Failed to record lexical performance", e);
  }
}