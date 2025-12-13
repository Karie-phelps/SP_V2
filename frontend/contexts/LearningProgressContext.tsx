"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Types
export type ModuleType =
  | "vocabulary"
  | "grammar"
  | "sentence-construction"
  | "reading-comprehension";
export type ExerciseType = "flashcards" | "quiz" | "fill-blanks";
export type ExerciseStatus =
  | "locked"
  | "available"
  | "in-progress"
  | "completed";

export interface PerformanceMetrics {
  difficulty: "easy" | "medium" | "hard";
  score: number;
  missedLowFreq: number;
  similarChoiceErrors: number;
  timestamp: string;
}

export interface ExerciseProgress {
  status: ExerciseStatus;
  score: number | null;
  completedAt: string | null;
  attempts: number;
  lastDifficulty: "easy" | "medium" | "hard";
  errorTags: string[];
  performanceHistory: PerformanceMetrics[]; // NEW
}

export interface ModuleProgress {
  flashcards: ExerciseProgress;
  quiz: ExerciseProgress;
  "fill-blanks": ExerciseProgress;
  lastAccessedAt: string | null;
}

export interface AllModulesProgress {
  vocabulary: ModuleProgress;
  grammar: ModuleProgress;
  "sentence-construction": ModuleProgress;
  "reading-comprehension": ModuleProgress;
  recommendedModule: ModuleType;
  lastCompletedModule: ModuleType | null;
}

interface LearningProgressContextType {
  progress: AllModulesProgress;
  updateProgress: (
    module: ModuleType,
    exercise: ExerciseType,
    data: Partial<ExerciseProgress>
  ) => void;
  resetProgress: (module?: ModuleType) => void;
  getModuleProgress: (module: ModuleType) => number;
  getOverallProgress: () => number;
  getNextRecommended: (module: ModuleType) => ExerciseType | null;
  canAccessExercise: (module: ModuleType, exercise: ExerciseType) => boolean;
  isModuleCompleted: (module: ModuleType) => boolean;
  getRecommendedModule: () => ModuleType;
  markModuleAccessed: (module: ModuleType) => void;
  getModuleRecommendationReason: (module: ModuleType) => string;
  addPerformanceMetrics: (
    module: ModuleType,
    exercise: ExerciseType,
    metrics: PerformanceMetrics
  ) => void;
  getPerformanceHistory: (
    module: ModuleType,
    exercise: ExerciseType
  ) => PerformanceMetrics[];
}

// Default exercise state
const defaultExerciseProgress: ExerciseProgress = {
  status: "locked",
  score: null,
  completedAt: null,
  attempts: 0,
  lastDifficulty: "easy",
  errorTags: [],
  performanceHistory: [], // NEW
};

// Default module state
const defaultModuleProgress: ModuleProgress = {
  flashcards: { ...defaultExerciseProgress, status: "available" },
  quiz: { ...defaultExerciseProgress },
  "fill-blanks": { ...defaultExerciseProgress },
  lastAccessedAt: null,
};

// Default all modules
const defaultProgress: AllModulesProgress = {
  vocabulary: { ...defaultModuleProgress },
  grammar: { ...defaultModuleProgress },
  "sentence-construction": { ...defaultModuleProgress },
  "reading-comprehension": { ...defaultModuleProgress },
  recommendedModule: "vocabulary",
  lastCompletedModule: null,
};

const LearningProgressContext = createContext<
  LearningProgressContextType | undefined
>(undefined);

export function LearningProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [progress, setProgress] = useState<AllModulesProgress>(defaultProgress);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("learning-progress");
    if (stored) {
      try {
        setProgress(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load progress:", e);
      }
    }
  }, []);

  // Save to localStorage whenever progress changes
  useEffect(() => {
    localStorage.setItem("learning-progress", JSON.stringify(progress));
  }, [progress]);

  // Update exercise progress
  const updateProgress = (
    module: ModuleType,
    exercise: ExerciseType,
    data: Partial<ExerciseProgress>
  ) => {
    setProgress((prev) => {
      const moduleProgress = { ...prev[module] };

      moduleProgress[exercise] = {
        ...moduleProgress[exercise],
        ...data,
      };

      // Sequential unlock logic within module
      if (exercise === "flashcards" && data.status === "completed") {
        moduleProgress.quiz.status = "available";
      }
      if (exercise === "quiz" && data.status === "completed") {
        moduleProgress["fill-blanks"].status = "available";
      }

      const updated = {
        ...prev,
        [module]: moduleProgress,
      };

      // Check if module is now completed - only check exercise properties
      const exercises: ExerciseType[] = ["flashcards", "quiz", "fill-blanks"];
      const isModuleComplete = exercises.every(
        (ex) => moduleProgress[ex].status === "completed"
      );

      if (isModuleComplete) {
        updated.lastCompletedModule = module;
        const moduleOrder: ModuleType[] = [
          "vocabulary",
          "grammar",
          "sentence-construction",
          "reading-comprehension",
        ];
        const currentIndex = moduleOrder.indexOf(module);
        if (currentIndex < moduleOrder.length - 1) {
          updated.recommendedModule = moduleOrder[currentIndex + 1];
        }
      }

      return updated;
    });
  };

  // NEW: Add performance metrics
  const addPerformanceMetrics = (
    module: ModuleType,
    exercise: ExerciseType,
    metrics: PerformanceMetrics
  ) => {
    setProgress((prev) => {
      const moduleProgress = { ...prev[module] };
      const exerciseProgress = { ...moduleProgress[exercise] };

      // Add to history
      exerciseProgress.performanceHistory = [
        ...exerciseProgress.performanceHistory,
        metrics,
      ];

      // Update difficulty and error tags
      exerciseProgress.lastDifficulty = metrics.difficulty;

      moduleProgress[exercise] = exerciseProgress;

      return {
        ...prev,
        [module]: moduleProgress,
      };
    });
  };

  // NEW: Get performance history
  const getPerformanceHistory = (
    module: ModuleType,
    exercise: ExerciseType
  ): PerformanceMetrics[] => {
    return progress[module][exercise].performanceHistory || [];
  };

  // Reset progress
  const resetProgress = (module?: ModuleType) => {
    if (module) {
      setProgress((prev) => ({
        ...prev,
        [module]: { ...defaultModuleProgress },
      }));
    } else {
      setProgress(defaultProgress);
      localStorage.removeItem("learning-progress");
    }
  };

  // Get module completion percentage
  const getModuleProgress = (module: ModuleType): number => {
    const moduleData = progress[module];
    const exercises = [
      moduleData.flashcards,
      moduleData.quiz,
      moduleData["fill-blanks"],
    ];
    const completed = exercises.filter(
      (ex) => ex.status === "completed"
    ).length;
    return Math.round((completed / 3) * 100);
  };

  // Get overall completion percentage
  const getOverallProgress = (): number => {
    const totalExercises = 12; // 4 modules * 3 exercises
    const moduleTypes: ModuleType[] = [
      "vocabulary",
      "grammar",
      "sentence-construction",
      "reading-comprehension",
    ];
    const exerciseTypes: ExerciseType[] = ["flashcards", "quiz", "fill-blanks"];

    let completedExercises = 0;
    moduleTypes.forEach((module) => {
      exerciseTypes.forEach((exercise) => {
        if (progress[module][exercise].status === "completed") {
          completedExercises++;
        }
      });
    });

    return Math.round((completedExercises / totalExercises) * 100);
  };

  // Get next recommended exercise
  const getNextRecommended = (module: ModuleType): ExerciseType | null => {
    const moduleData = progress[module];
    if (moduleData.flashcards.status !== "completed") return "flashcards";
    if (moduleData.quiz.status !== "completed") return "quiz";
    if (moduleData["fill-blanks"].status !== "completed") return "fill-blanks";
    return null;
  };

  // Check if user can access exercise
  const canAccessExercise = (
    module: ModuleType,
    exercise: ExerciseType
  ): boolean => {
    return progress[module][exercise].status !== "locked";
  };

  // Check if module is completed
  const isModuleCompleted = (module: ModuleType): boolean => {
    const moduleData = progress[module];
    return (
      moduleData.flashcards.status === "completed" &&
      moduleData.quiz.status === "completed" &&
      moduleData["fill-blanks"].status === "completed"
    );
  };

  // Get recommended module
  const getRecommendedModule = (): ModuleType => {
    return progress.recommendedModule;
  };

  // Mark module as accessed
  const markModuleAccessed = (module: ModuleType) => {
    setProgress((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        lastAccessedAt: new Date().toISOString(),
      },
    }));
  };

  // Get recommendation reason
  const getModuleRecommendationReason = (module: ModuleType): string => {
    const moduleProgress = getModuleProgress(module);
    const isRecommended = progress.recommendedModule === module;
    const isCompleted = isModuleCompleted(module);

    if (isCompleted) {
      return "✓ Completed";
    }

    if (isRecommended) {
      if (moduleProgress === 0) {
        return "📌 Recommended: Start here";
      } else {
        return `📌 Recommended: Continue (${moduleProgress}% complete)`;
      }
    }

    if (moduleProgress > 0 && moduleProgress < 100) {
      return `📊 In Progress: ${moduleProgress}% complete`;
    }

    return "Available";
  };

  return (
    <LearningProgressContext.Provider
      value={{
        progress,
        updateProgress,
        resetProgress,
        getModuleProgress,
        getOverallProgress,
        getNextRecommended,
        canAccessExercise,
        isModuleCompleted,
        getRecommendedModule,
        markModuleAccessed,
        getModuleRecommendationReason,
        addPerformanceMetrics,
        getPerformanceHistory,
      }}
    >
      {children}
    </LearningProgressContext.Provider>
  );
}

// Custom hook
export function useLearningProgress() {
  const context = useContext(LearningProgressContext);
  if (!context) {
    throw new Error(
      "useLearningProgress must be used within LearningProgressProvider"
    );
  }
  return context;
}
