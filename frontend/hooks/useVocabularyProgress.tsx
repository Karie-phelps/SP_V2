"use client";

import { useLearningProgress } from "@/contexts/LearningProgressContext";
import type {
  ExerciseProgress,
  ExerciseType,
} from "@/contexts/LearningProgressContext";

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

export interface VocabularyMastery {
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

export function useVocabularyProgress() {
  const {
    progress,
    updateProgress: updateLearningProgress,
    getModuleProgress,
    getNextRecommended: getNextRecommendedContext,
    canAccessExercise: canAccessExerciseContext,
  } = useLearningProgress();

  const getVocabularyMastery = (): VocabularyMastery => {
    const vocab = progress.vocabulary;

    const allHistory = [
      ...vocab.flashcards.performanceHistory,
      ...vocab.quiz.performanceHistory,
      ...vocab.antonym.performanceHistory,
    ];

    if (allHistory.length === 0) {
      return {
        level: "beginner",
        difficulty: "easy",
        description: "Start your vocabulary journey",
        icon: "🌱",
      };
    }

    const difficulties = [
      vocab.flashcards.lastDifficulty,
      vocab.quiz.lastDifficulty,
      vocab.antonym.lastDifficulty,
    ];

    const currentDiff = difficulties.reduce((max, diff) => {
      if (diff === "hard") return "hard";
      if (diff === "medium" && max !== "hard") return "medium";
      return max;
    }, "easy" as "easy" | "medium" | "hard");

    const sessionsAtDiff = allHistory.filter(
      (h) => h.difficulty === currentDiff
    ).length;

    const scoresAtDiff = allHistory
      .filter((h) => h.difficulty === currentDiff)
      .map((h) => h.score);

    const avgScore =
      scoresAtDiff.length > 0
        ? scoresAtDiff.reduce((a, b) => a + b, 0) / scoresAtDiff.length
        : 0;

    if (currentDiff === "hard" && sessionsAtDiff >= 5 && avgScore >= 90) {
      return {
        level: "master",
        difficulty: "hard",
        description: "Vocabulary master! Exceptional performance",
        icon: "👑",
      };
    }

    if (currentDiff === "hard" && sessionsAtDiff >= 3) {
      return {
        level: "advanced",
        difficulty: "hard",
        description: "Tackling advanced vocabulary with confidence",
        icon: "🏆",
      };
    }

    if (currentDiff === "medium" && sessionsAtDiff >= 3 && avgScore >= 75) {
      return {
        level: "proficient",
        difficulty: "medium",
        description: "Building strong vocabulary foundations",
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

  const getExerciseProgress = (exercise: ExerciseType): ExerciseProgress => {
    return progress.vocabulary[exercise];
  };

  return {
    progress: progress.vocabulary,
    updateProgress: (exercise: ExerciseType, data: Partial<ExerciseProgress>) =>
      updateLearningProgress("vocabulary", exercise, data),
    getOverallProgress: () => getModuleProgress("vocabulary"),
    getNextRecommended: () => getNextRecommendedContext("vocabulary"),
    canAccessExercise: (exercise: ExerciseType) =>
      canAccessExerciseContext("vocabulary", exercise),
    getVocabularyMastery,
    getExerciseMastery,
    getExerciseProgress,
  };
}
