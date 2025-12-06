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

export interface ExerciseProgress {
  status: ExerciseStatus;
  score: number | null;
  completedAt: string | null;
  attempts: number;
  lastDifficulty: "easy" | "medium" | "hard";
  errorTags: string[];
}

export interface ModuleProgress {
  flashcards: ExerciseProgress;
  quiz: ExerciseProgress;
  "fill-blanks": ExerciseProgress;
  lastAccessedAt: string | null; // Add this
}

export interface AllModulesProgress {
  vocabulary: ModuleProgress;
  grammar: ModuleProgress;
  "sentence-construction": ModuleProgress;
  "reading-comprehension": ModuleProgress;
  recommendedModule: ModuleType; // Add this - tracks what system recommends
  lastCompletedModule: ModuleType | null; // Add this - tracks last finished module
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
  // New functions for Layer 1
  getRecommendedModule: () => ModuleType;
  markModuleAccessed: (module: ModuleType) => void;
  getModuleRecommendationReason: (module: ModuleType) => string;
}

// Default exercise state
const defaultExerciseProgress: ExerciseProgress = {
  status: "locked",
  score: null,
  completedAt: null,
  attempts: 0,
  lastDifficulty: "easy",
  errorTags: [],
};

// Default module state
const defaultModuleProgress: ModuleProgress = {
  flashcards: { ...defaultExerciseProgress, status: "available" },
  quiz: { ...defaultExerciseProgress },
  "fill-blanks": { ...defaultExerciseProgress },
  lastAccessedAt: null, // Add this
};

// Default all modules
const defaultProgress: AllModulesProgress = {
  vocabulary: { ...defaultModuleProgress },
  grammar: { ...defaultModuleProgress },
  "sentence-construction": { ...defaultModuleProgress },
  "reading-comprehension": { ...defaultModuleProgress },
  recommendedModule: "vocabulary", // Start with vocabulary
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

      // Check if module is now completed
      const isModuleComplete = (
        Object.values(moduleProgress) as ExerciseProgress[]
      )
        .filter((ex) => typeof ex.status !== "undefined")
        .every((ex) => ex.status === "completed");

      if (isModuleComplete) {
        updated.lastCompletedModule = module;
        // Auto-recommend next module in sequence
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

  // Reset progress (all modules or specific module)
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

  // Get overall completion percentage (all modules)
  const getOverallProgress = (): number => {
    const totalExercises = 12; // 4 modules × 3 exercises
    const completedExercises = (Object.values(progress) as ModuleProgress[])
      .flatMap((module) => Object.values(module) as ExerciseProgress[])
      .filter((ex) => ex.status === "completed").length;
    return Math.round((completedExercises / totalExercises) * 100);
  };

  // Get next recommended exercise for a module
  const getNextRecommended = (module: ModuleType): ExerciseType | null => {
    const moduleData = progress[module];
    if (moduleData.flashcards.status !== "completed") return "flashcards";
    if (moduleData.quiz.status !== "completed") return "quiz";
    if (moduleData["fill-blanks"].status !== "completed") return "fill-blanks";
    return null; // Module completed
  };

  // Check if user can access exercise
  const canAccessExercise = (
    module: ModuleType,
    exercise: ExerciseType
  ): boolean => {
    return progress[module][exercise].status !== "locked";
  };

  // Check if entire module is completed
  const isModuleCompleted = (module: ModuleType): boolean => {
    const moduleData = progress[module];
    return (
      moduleData.flashcards.status === "completed" &&
      moduleData.quiz.status === "completed" &&
      moduleData["fill-blanks"].status === "completed"
    );
  };

  // NEW: Get recommended module (Layer 1)
  const getRecommendedModule = (): ModuleType => {
    return progress.recommendedModule;
  };

  // NEW: Mark module as accessed (for tracking last accessed)
  const markModuleAccessed = (module: ModuleType) => {
    setProgress((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        lastAccessedAt: new Date().toISOString(),
      },
    }));
  };

  // NEW: Get recommendation reason for a module
  const getModuleRecommendationReason = (module: ModuleType): string => {
    const moduleProgress = getModuleProgress(module);
    const isRecommended = progress.recommendedModule === module;
    const isCompleted = isModuleCompleted(module);
    const lastCompleted = progress.lastCompletedModule;

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

    if (lastCompleted) {
      return "Available: You can start anytime";
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
