"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import * as ProgressAPI from "@/lib/api/progress";

// Types
export type ModuleType =
  | "vocabulary"
  | "grammar"
  | "sentence-construction"
  | "reading-comprehension";

export type ExerciseType =
  | "flashcards"
  | "quiz"
  | "antonym"
  | "fill-blanks"
  | "sentence-correction"
  | "error-identification";

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

export interface ModuleProgress {
  flashcards: ExerciseProgress;
  quiz: ExerciseProgress;
  "fill-blanks": ExerciseProgress;
  antonym: ExerciseProgress;
  "sentence-correction": ExerciseProgress;
  "error-identification": ExerciseProgress;
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

const defaultExerciseProgress: ExerciseProgress = {
  status: "locked",
  score: null,
  completedAt: null,
  attempts: 0,
  lastDifficulty: "easy",
  errorTags: [],
  performanceHistory: [],
};

// ✅ UPDATED: Different default module progress for vocabulary and grammar
const createDefaultModuleProgress = (module: ModuleType): ModuleProgress => {
  if (module === "vocabulary") {
    // Vocabulary: flashcards is first (available by default)
    return {
      flashcards: { ...defaultExerciseProgress, status: "available" },
      quiz: { ...defaultExerciseProgress },
      "fill-blanks": { ...defaultExerciseProgress },
      antonym: { ...defaultExerciseProgress },
      "sentence-correction": { ...defaultExerciseProgress },
      "error-identification": { ...defaultExerciseProgress },
      lastAccessedAt: null,
    };
  } else if (module === "grammar") {
    // ✅ Grammar: sentence-correction is first (available by default)
    return {
      flashcards: { ...defaultExerciseProgress },
      quiz: { ...defaultExerciseProgress },
      "fill-blanks": { ...defaultExerciseProgress },
      antonym: { ...defaultExerciseProgress },
      "sentence-correction": {
        ...defaultExerciseProgress,
        status: "available",
      },
      "error-identification": { ...defaultExerciseProgress },
      lastAccessedAt: null,
    };
  } else {
    // Other modules: flashcards is first (available by default)
    return {
      flashcards: { ...defaultExerciseProgress, status: "available" },
      quiz: { ...defaultExerciseProgress },
      "fill-blanks": { ...defaultExerciseProgress },
      antonym: { ...defaultExerciseProgress },
      "sentence-correction": { ...defaultExerciseProgress },
      "error-identification": { ...defaultExerciseProgress },
      lastAccessedAt: null,
    };
  }
};

const defaultProgress: AllModulesProgress = {
  vocabulary: createDefaultModuleProgress("vocabulary"),
  grammar: createDefaultModuleProgress("grammar"),
  "sentence-construction": createDefaultModuleProgress("sentence-construction"),
  "reading-comprehension": createDefaultModuleProgress("reading-comprehension"),
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

  const exerciseTypeMap: Record<ExerciseType, string> = {
    flashcards: "flashcards",
    quiz: "quiz",
    "fill-blanks": "fill-blanks",
    antonym: "antonym",
    "sentence-correction": "sentence-correction",
    "error-identification": "error-identification",
  };

  const convertBackendToFrontend = (
    backendModules: ProgressAPI.ModuleProgress[]
  ): AllModulesProgress => {
    const frontendProgress = { ...defaultProgress };

    backendModules.forEach((module) => {
      const moduleKey = module.module as ModuleType;
      if (moduleKey in frontendProgress) {
        // ✅ Use module-specific defaults
        const moduleProgress: ModuleProgress =
          createDefaultModuleProgress(moduleKey);

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

      localStorage.setItem(
        "learning-progress-backup",
        JSON.stringify(convertedProgress)
      );
    } catch (err: any) {
      console.error("Failed to load progress from backend:", err);
      setError(err.message);

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

  const updateProgress = async (
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

      if (module === "vocabulary") {
        // Vocabulary: flashcards → quiz → antonym
        if (exercise === "flashcards" && data.status === "completed") {
          moduleProgress.quiz.status = "available";
        }
        if (exercise === "quiz" && data.status === "completed") {
          moduleProgress.antonym.status = "available";
        }
      } else if (module === "grammar") {
        // Grammar: sentence-correction → error-identification → fill-blanks
        if (exercise === "sentence-correction" && data.status === "completed") {
          moduleProgress["error-identification"].status = "available";
        }
        if (
          exercise === "error-identification" &&
          data.status === "completed"
        ) {
          moduleProgress["fill-blanks"].status = "available";
        }
      } else {
        // Other modules: flashcards → quiz → fill-blanks
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

      const exercises = getModuleExercises(module);
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

  const getModuleExercises = (module: ModuleType): ExerciseType[] => {
    if (module === "vocabulary") {
      return ["flashcards", "quiz", "antonym"];
    } else if (module === "grammar") {
      return ["sentence-correction", "error-identification", "fill-blanks"];
    } else {
      return ["flashcards", "quiz", "fill-blanks"];
    }
  };

  const addPerformanceMetrics = async (
    module: ModuleType,
    exercise: ExerciseType,
    metrics: PerformanceMetrics
  ) => {
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
          [module]: createDefaultModuleProgress(module),
        }));
      } else {
        setProgress(defaultProgress);
      }
    }
  };

  const getModuleProgress = (module: ModuleType): number => {
    const moduleData = progress[module];
    const exercises = getModuleExercises(module);
    const exerciseProgresses = exercises.map((ex) => moduleData[ex]);

    const completed = exerciseProgresses.filter(
      (ex) => ex.status === "completed"
    ).length;

    return Math.round((completed / exercises.length) * 100);
  };

  const getOverallProgress = (): number => {
    const totalExercises = 12;
    const moduleTypes: ModuleType[] = [
      "vocabulary",
      "grammar",
      "sentence-construction",
      "reading-comprehension",
    ];

    let completedExercises = 0;

    moduleTypes.forEach((module) => {
      const exerciseTypes = getModuleExercises(module);

      exerciseTypes.forEach((exercise) => {
        if (progress[module][exercise].status === "completed") {
          completedExercises++;
        }
      });
    });

    return Math.round((completedExercises / totalExercises) * 100);
  };

  const getNextRecommended = (module: ModuleType): ExerciseType | null => {
    const moduleData = progress[module];

    if (module === "vocabulary") {
      if (moduleData.flashcards.status !== "completed") return "flashcards";
      if (moduleData.quiz.status !== "completed") return "quiz";
      if (moduleData.antonym.status !== "completed") return "antonym";
    } else if (module === "grammar") {
      if (moduleData["sentence-correction"].status !== "completed")
        return "sentence-correction";
      if (moduleData["error-identification"].status !== "completed")
        return "error-identification";
      if (moduleData["fill-blanks"].status !== "completed")
        return "fill-blanks";
    } else {
      if (moduleData.flashcards.status !== "completed") return "flashcards";
      if (moduleData.quiz.status !== "completed") return "quiz";
      if (moduleData["fill-blanks"].status !== "completed")
        return "fill-blanks";
    }

    return null;
  };

  const canAccessExercise = (
    module: ModuleType,
    exercise: ExerciseType
  ): boolean => {
    return progress[module][exercise].status !== "locked";
  };

  const isModuleCompleted = (module: ModuleType): boolean => {
    const moduleData = progress[module];
    const exercises = getModuleExercises(module);

    return exercises.every((ex) => moduleData[ex].status === "completed");
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
