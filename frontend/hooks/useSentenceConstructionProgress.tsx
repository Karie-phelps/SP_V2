"use client";

import { useLearningProgress } from "@/contexts/LearningProgressContext";
import type {
  ExerciseProgress,
  ExerciseType,
} from "@/contexts/LearningProgressContext";

// Re-export types for backward compatibility
export type {
  ExerciseType,
  ExerciseStatus,
  ExerciseProgress,
} from "@/contexts/LearningProgressContext";

export type MasteryLevel =
  | "beginner"
  | "developing"
  | "proficient"
  | "advanced"
  | "master";

export interface SentenceConstructionMastery {
  level: MasteryLevel;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  icon: string;
}

export interface ExerciseMastery {
  level: MasteryLevel;
  icon: string;
  difficulty: "easy" | "medium" | "hard";
  sessionsAtDifficulty: number;
  avgScore: number;
}

export function useSentenceConstructionProgress() {
  const {
    progress,
    updateProgress: updateLearningProgress,
    getModuleProgress,
    getNextRecommended: getNextRecommendedContext,
    canAccessExercise: canAccessExerciseContext,
  } = useLearningProgress();

  const getSentenceConstructionMastery = (): SentenceConstructionMastery => {
    const sentenceConstruction = progress["sentence-construction"];

    // Aggregate all exercise histories
    const allHistory = [
      ...sentenceConstruction.flashcards.performanceHistory, // maps to sentence-ordering
      ...sentenceConstruction.quiz.performanceHistory, // maps to fill-missing
      ...sentenceConstruction["fill-blanks"].performanceHistory, // maps to create-sentence
    ];

    if (allHistory.length === 0) {
      return {
        level: "beginner",
        difficulty: "easy",
        description: "Start building sentences",
        icon: "🌱",
      };
    }

    // Get current difficulty (highest across exercises)
    const difficulties = [
      sentenceConstruction.flashcards.lastDifficulty,
      sentenceConstruction.quiz.lastDifficulty,
      sentenceConstruction["fill-blanks"].lastDifficulty,
    ];

    const currentDiff = difficulties.reduce((max, diff) => {
      if (diff === "hard") return "hard";
      if (diff === "medium" && max !== "hard") return "medium";
      return max;
    }, "easy" as "easy" | "medium" | "hard");

    // Count sessions at current difficulty
    const sessionsAtDiff = allHistory.filter(
      (h) => h.difficulty === currentDiff
    ).length;

    // Average score at current difficulty
    const scoresAtDiff = allHistory
      .filter((h) => h.difficulty === currentDiff)
      .map((h) => h.score);

    const avgScore =
      scoresAtDiff.length > 0
        ? scoresAtDiff.reduce((a, b) => a + b, 0) / scoresAtDiff.length
        : 0;

    // Determine mastery level based on sessions and performance
    if (currentDiff === "hard" && sessionsAtDiff >= 5 && avgScore >= 90) {
      return {
        level: "master",
        difficulty: "hard",
        description: "Sentence master! Exceptional construction skills",
        icon: "👑",
      };
    }

    if (currentDiff === "hard" && sessionsAtDiff >= 3) {
      return {
        level: "advanced",
        difficulty: "hard",
        description: "Crafting complex sentences with confidence",
        icon: "🏆",
      };
    }

    if (currentDiff === "medium" && sessionsAtDiff >= 3 && avgScore >= 75) {
      return {
        level: "proficient",
        difficulty: "medium",
        description: "Building strong sentence foundations",
        icon: "⭐",
      };
    }

    if (sessionsAtDiff >= 3 || currentDiff === "medium") {
      return {
        level: "developing",
        difficulty: currentDiff,
        description: "Making steady progress",
        icon: "🔧",
      };
    }

    return {
      level: "beginner",
      difficulty: "easy",
      description: "Just getting started",
      icon: "🐣",
    };
  };

  const getExerciseMastery = (exercise: ExerciseProgress): ExerciseMastery => {
    const currentDiff = exercise.lastDifficulty;
    const history = exercise.performanceHistory.filter(
      (h) => h.difficulty === currentDiff
    );

    const sessionsAtDifficulty = history.length;
    const avgScore =
      history.length > 0
        ? history.reduce((sum, h) => sum + h.score, 0) / history.length
        : 0;

    let level: MasteryLevel = "beginner";
    let icon = "🐣";

    if (currentDiff === "hard" && sessionsAtDifficulty >= 5 && avgScore >= 90) {
      level = "master";
      icon = "👑";
    } else if (currentDiff === "hard" && sessionsAtDifficulty >= 3) {
      level = "advanced";
      icon = "🏆";
    } else if (
      currentDiff === "medium" &&
      sessionsAtDifficulty >= 3 &&
      avgScore >= 75
    ) {
      level = "proficient";
      icon = "⭐";
    } else if (sessionsAtDifficulty >= 3 || currentDiff === "medium") {
      level = "developing";
      icon = "🔧";
    }

    return {
      level,
      icon,
      difficulty: currentDiff,
      sessionsAtDifficulty,
      avgScore: Math.round(avgScore),
    };
  };

  const getExerciseProgress = (
    exercise: "sentence-ordering" | "fill-missing" | "create-sentence"
  ): ExerciseProgress => {
    // Map custom exercise names to standard ExerciseType
    const mapping: Record<string, ExerciseType> = {
      "sentence-ordering": "flashcards",
      "fill-missing": "quiz",
      "create-sentence": "fill-blanks",
    };
    return progress["sentence-construction"][mapping[exercise]];
  };

  return {
    progress: progress["sentence-construction"],
    updateProgress: (exercise: ExerciseType, data: Partial<ExerciseProgress>) =>
      updateLearningProgress("sentence-construction", exercise, data),
    getOverallProgress: () => getModuleProgress("sentence-construction"),
    getNextRecommended: () =>
      getNextRecommendedContext("sentence-construction"),
    canAccessExercise: (exercise: ExerciseType) =>
      canAccessExerciseContext("sentence-construction", exercise),
    getSentenceConstructionMastery,
    getExerciseMastery,
    getExerciseProgress,
  };
}
