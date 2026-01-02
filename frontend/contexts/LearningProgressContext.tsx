"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import * as ProgressAPI from "@/lib/api/progress";

// Types (keep existing types)
export type ModuleType =
  | "vocabulary"
  | "grammar"
  | "sentence-construction"
  | "reading-comprehension";

export type ExerciseType = "flashcards" | "quiz" | "fill-blanks" | "antonym";

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
  performanceHistory: PerformanceMetrics[];
}

// ✅ ADDED "antonym" to ModuleProgress
export interface ModuleProgress {
  flashcards: ExerciseProgress;
  quiz: ExerciseProgress;
  "fill-blanks": ExerciseProgress;
  antonym: ExerciseProgress;
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
  isLoading: boolean;
  error: string | null;
  updateProgress: (
    module: ModuleType,
    exercise: ExerciseType,
    data: Partial<ExerciseProgress>
  ) => Promise<void>;
  resetProgress: (module?: ModuleType) => Promise<void>;
  syncProgress: () => Promise<void>;
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
  ) => Promise<void>;
  getPerformanceHistory: (
    module: ModuleType,
    exercise: ExerciseType
  ) => PerformanceMetrics[];
}

// Default states (keep existing defaults)
const defaultExerciseProgress: ExerciseProgress = {
  status: "locked",
  score: null,
  completedAt: null,
  attempts: 0,
  lastDifficulty: "easy",
  errorTags: [],
  performanceHistory: [],
};

// ✅ ADDED antonym with default progress
const defaultModuleProgress: ModuleProgress = {
  flashcards: { ...defaultExerciseProgress, status: "available" },
  quiz: { ...defaultExerciseProgress },
  "fill-blanks": { ...defaultExerciseProgress },
  antonym: { ...defaultExerciseProgress },
  lastAccessedAt: null,
};

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
  const { user, tokens } = useAuth();
  const [progress, setProgress] = useState<AllModulesProgress>(defaultProgress);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ ADDED "antonym" to exercise type map
  const exerciseTypeMap: Record<ExerciseType, string> = {
    flashcards: "flashcards",
    quiz: "quiz",
    "fill-blanks": "fill-blanks",
    antonym: "antonym",
  };

  // Convert backend data to frontend format
  const convertBackendToFrontend = (
    backendModules: ProgressAPI.ModuleProgress[]
  ): AllModulesProgress => {
    const frontendProgress = { ...defaultProgress };

    backendModules.forEach((module) => {
      const moduleKey = module.module as ModuleType;
      if (moduleKey in frontendProgress) {
        const moduleProgress: ModuleProgress = {
          flashcards: { ...defaultExerciseProgress, status: "available" },
          quiz: { ...defaultExerciseProgress },
          "fill-blanks": { ...defaultExerciseProgress },
          antonym: { ...defaultExerciseProgress },
          lastAccessedAt: module.last_accessed_at,
        };

        // Map exercises
        module.exercises.forEach((exercise) => {
          const exerciseKey = exercise.exercise_type as ExerciseType;
          if (exerciseKey in moduleProgress) {
            moduleProgress[exerciseKey] = {
              status: exercise.status as ExerciseStatus,
              score: exercise.last_score,
              completedAt: exercise.last_completed_at,
              attempts: exercise.attempts,
              lastDifficulty: exercise.last_difficulty as any,
              errorTags: [],
              performanceHistory: exercise.performance_history.map((p) => ({
                difficulty: p.difficulty as any,
                score: p.score,
                missedLowFreq: p.missed_low_freq,
                similarChoiceErrors: p.similar_choice_errors,
                timestamp: p.timestamp,
              })),
            };
          }
        });

        frontendProgress[moduleKey] = moduleProgress;
      }
    });

    return frontendProgress;
  };

  // Load progress from backend on mount or when user changes
  const syncProgress = async () => {
    if (!user || !tokens) {
      setProgress(defaultProgress);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const backendModules = await ProgressAPI.getAllProgress();
      const convertedProgress = convertBackendToFrontend(backendModules);
      setProgress(convertedProgress);

      // Also save to localStorage as backup
      localStorage.setItem(
        "learning-progress-backup",
        JSON.stringify(convertedProgress)
      );
    } catch (err: any) {
      console.error("Failed to load progress from backend:", err);
      setError(err.message);

      // Fallback to localStorage
      const backup = localStorage.getItem("learning-progress-backup");
      if (backup) {
        try {
          setProgress(JSON.parse(backup));
        } catch {
          setProgress(defaultProgress);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncProgress();
  }, [user?.id]);

  // Update progress with optimistic update + backend sync
  const updateProgress = async (
    module: ModuleType,
    exercise: ExerciseType,
    data: Partial<ExerciseProgress>
  ) => {
    // Optimistic update (update UI immediately)
    setProgress((prev) => {
      const moduleProgress = { ...prev[module] };
      moduleProgress[exercise] = {
        ...moduleProgress[exercise],
        ...data,
      };

      // ✅ UPDATED: Sequential unlock logic for vocabulary module
      if (module === "vocabulary") {
        if (exercise === "flashcards" && data.status === "completed") {
          moduleProgress.quiz.status = "available";
        }
        if (exercise === "quiz" && data.status === "completed") {
          moduleProgress.antonym.status = "available";
        }
        if (exercise === "antonym" && data.status === "completed") {
          moduleProgress["fill-blanks"].status = "available";
        }
      } else {
        // For other modules, keep the old logic
        if (exercise === "flashcards" && data.status === "completed") {
          moduleProgress.quiz.status = "available";
        }
        if (exercise === "quiz" && data.status === "completed") {
          moduleProgress["fill-blanks"].status = "available";
        }
      }

      const updated = {
        ...prev,
        [module]: moduleProgress,
      };

      // ✅ UPDATED: Check if module is completed (now includes antonym for vocabulary)
      const exercises: ExerciseType[] =
        module === "vocabulary"
          ? ["flashcards", "quiz", "antonym", "fill-blanks"]
          : ["flashcards", "quiz", "fill-blanks"];

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

    // Sync to backend
    if (user && tokens) {
      try {
        await ProgressAPI.updateExerciseProgress(
          module,
          exerciseTypeMap[exercise],
          {
            status: data.status,
            score: data.score || undefined,
            attempts: data.attempts,
            completedAt: data.completedAt || undefined,
            lastDifficulty: data.lastDifficulty,
          }
        );
      } catch (err) {
        console.error("Failed to sync progress to backend:", err);
      }
    }
  };

  // Add performance metrics
  const addPerformanceMetrics = async (
    module: ModuleType,
    exercise: ExerciseType,
    metrics: PerformanceMetrics
  ) => {
    // Optimistic update
    setProgress((prev) => {
      const moduleProgress = { ...prev[module] };
      const exerciseProgress = { ...moduleProgress[exercise] };

      exerciseProgress.performanceHistory = [
        ...exerciseProgress.performanceHistory,
        metrics,
      ];
      exerciseProgress.lastDifficulty = metrics.difficulty;

      moduleProgress[exercise] = exerciseProgress;

      return {
        ...prev,
        [module]: moduleProgress,
      };
    });

    // Sync to backend
    if (user && tokens) {
      try {
        await ProgressAPI.updateExerciseProgress(
          module,
          exerciseTypeMap[exercise],
          {
            lastDifficulty: metrics.difficulty,
            performanceMetrics: {
              difficulty: metrics.difficulty,
              score: metrics.score,
              missedLowFreq: metrics.missedLowFreq,
              similarChoiceErrors: metrics.similarChoiceErrors,
              errorTags: [],
            },
          }
        );
      } catch (err) {
        console.error("Failed to add performance metrics:", err);
      }
    }
  };

  // Reset progress
  const resetProgress = async (module?: ModuleType) => {
    if (user && tokens) {
      try {
        await ProgressAPI.resetProgress(module);
        await syncProgress();
      } catch (err) {
        console.error("Failed to reset progress:", err);
      }
    } else {
      if (module) {
        setProgress((prev) => ({
          ...prev,
          [module]: { ...defaultModuleProgress },
        }));
      } else {
        setProgress(defaultProgress);
      }
    }
  };

  // ✅ UPDATED: getModuleProgress to include antonym for vocabulary
  const getModuleProgress = (module: ModuleType): number => {
    const moduleData = progress[module];

    const exercises =
      module === "vocabulary"
        ? [
            moduleData.flashcards,
            moduleData.quiz,
            moduleData.antonym,
            moduleData["fill-blanks"],
          ]
        : [moduleData.flashcards, moduleData.quiz, moduleData["fill-blanks"]];

    const completed = exercises.filter(
      (ex) => ex.status === "completed"
    ).length;

    return Math.round((completed / exercises.length) * 100);
  };

  // ✅ UPDATED: getOverallProgress to count antonym
  const getOverallProgress = (): number => {
    const totalExercises = 15; // 4 exercises for vocabulary, 3 for each of the other 3 modules
    const moduleTypes: ModuleType[] = [
      "vocabulary",
      "grammar",
      "sentence-construction",
      "reading-comprehension",
    ];

    let completedExercises = 0;

    moduleTypes.forEach((module) => {
      const exerciseTypes: ExerciseType[] =
        module === "vocabulary"
          ? ["flashcards", "quiz", "antonym", "fill-blanks"]
          : ["flashcards", "quiz", "fill-blanks"];

      exerciseTypes.forEach((exercise) => {
        if (progress[module][exercise].status === "completed") {
          completedExercises++;
        }
      });
    });

    return Math.round((completedExercises / totalExercises) * 100);
  };

  // ✅ UPDATED: getNextRecommended to include antonym
  const getNextRecommended = (module: ModuleType): ExerciseType | null => {
    const moduleData = progress[module];

    if (moduleData.flashcards.status !== "completed") return "flashcards";
    if (moduleData.quiz.status !== "completed") return "quiz";

    if (module === "vocabulary") {
      if (moduleData.antonym.status !== "completed") return "antonym";
    }

    if (moduleData["fill-blanks"].status !== "completed") return "fill-blanks";

    return null;
  };

  const canAccessExercise = (
    module: ModuleType,
    exercise: ExerciseType
  ): boolean => {
    return progress[module][exercise].status !== "locked";
  };

  // ✅ UPDATED: isModuleCompleted to include antonym for vocabulary
  const isModuleCompleted = (module: ModuleType): boolean => {
    const moduleData = progress[module];

    if (module === "vocabulary") {
      return (
        moduleData.flashcards.status === "completed" &&
        moduleData.quiz.status === "completed" &&
        moduleData.antonym.status === "completed" &&
        moduleData["fill-blanks"].status === "completed"
      );
    }

    return (
      moduleData.flashcards.status === "completed" &&
      moduleData.quiz.status === "completed" &&
      moduleData["fill-blanks"].status === "completed"
    );
  };

  const getRecommendedModule = (): ModuleType => {
    return progress.recommendedModule;
  };

  const markModuleAccessed = (module: ModuleType) => {
    setProgress((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        lastAccessedAt: new Date().toISOString(),
      },
    }));
  };

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

  const getPerformanceHistory = (
    module: ModuleType,
    exercise: ExerciseType
  ): PerformanceMetrics[] => {
    return progress[module][exercise].performanceHistory || [];
  };

  return (
    <LearningProgressContext.Provider
      value={{
        progress,
        isLoading,
        error,
        updateProgress,
        resetProgress,
        syncProgress,
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

export function useLearningProgress() {
  const context = useContext(LearningProgressContext);
  if (!context) {
    throw new Error(
      "useLearningProgress must be used within LearningProgressProvider"
    );
  }
  return context;
}
