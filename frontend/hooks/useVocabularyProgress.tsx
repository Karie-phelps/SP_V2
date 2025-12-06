"use client";

import { useLearningProgress } from "@/contexts/LearningProgressContext";

// Re-export types for backward compatibility
export type {
  ExerciseType,
  ExerciseStatus,
  ExerciseProgress,
} from "@/contexts/LearningProgressContext";

export function useVocabularyProgress() {
  const {
    progress,
    updateProgress,
    getModuleProgress,
    getNextRecommended,
    canAccessExercise,
  } = useLearningProgress();

  return {
    progress: progress.vocabulary,
    updateProgress: (exercise: any, data: any) =>
      updateProgress("vocabulary", exercise, data),
    getOverallProgress: () => getModuleProgress("vocabulary"),
    getNextRecommended: () => getNextRecommended("vocabulary"),
    canAccessExercise: (exercise: any) =>
      canAccessExercise("vocabulary", exercise),
  };
}
