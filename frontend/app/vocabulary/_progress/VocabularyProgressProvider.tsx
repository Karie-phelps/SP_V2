// "use client";

// import React, { createContext, useContext, useState, useEffect } from "react";

// // Types
// export type ExerciseType = "flashcards" | "quiz" | "fill-blanks";
// export type ExerciseStatus =
//   | "locked"
//   | "available"
//   | "in-progress"
//   | "completed";

// export interface ExerciseProgress {
//   status: ExerciseStatus;
//   score: number | null;
//   completedAt: string | null;
//   attempts: number;
//   lastDifficulty: "easy" | "medium" | "hard";
//   errorTags: string[];
// }

// export interface VocabularyProgress {
//   flashcards: ExerciseProgress;
//   quiz: ExerciseProgress;
//   "fill-blanks": ExerciseProgress;
// }

// interface VocabularyProgressContextType {
//   progress: VocabularyProgress;
//   updateProgress: (
//     exercise: ExerciseType,
//     data: Partial<ExerciseProgress>
//   ) => void;
//   resetProgress: () => void;
//   getNextRecommended: () => ExerciseType | null;
//   canAccessExercise: (exercise: ExerciseType) => boolean;
//   getOverallProgress: () => number;
// }

// // Default state
// const defaultProgress: VocabularyProgress = {
//   flashcards: {
//     status: "available",
//     score: null,
//     completedAt: null,
//     attempts: 0,
//     lastDifficulty: "easy",
//     errorTags: [],
//   },
//   quiz: {
//     status: "locked",
//     score: null,
//     completedAt: null,
//     attempts: 0,
//     lastDifficulty: "easy",
//     errorTags: [],
//   },
//   "fill-blanks": {
//     status: "locked",
//     score: null,
//     completedAt: null,
//     attempts: 0,
//     lastDifficulty: "easy",
//     errorTags: [],
//   },
// };

// const VocabularyProgressContext = createContext<
//   VocabularyProgressContextType | undefined
// >(undefined);

// export function VocabularyProgressProvider({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const [progress, setProgress] = useState<VocabularyProgress>(defaultProgress);

//   // Load from localStorage on mount
//   useEffect(() => {
//     const stored = localStorage.getItem("vocabulary-progress");
//     if (stored) {
//       try {
//         setProgress(JSON.parse(stored));
//       } catch (e) {
//         console.error("Failed to load progress:", e);
//       }
//     }
//   }, []);

//   // Save to localStorage whenever progress changes
//   useEffect(() => {
//     localStorage.setItem("vocabulary-progress", JSON.stringify(progress));
//   }, [progress]);

//   // Update exercise progress
//   const updateProgress = (
//     exercise: ExerciseType,
//     data: Partial<ExerciseProgress>
//   ) => {
//     setProgress((prev) => {
//       const updated = {
//         ...prev,
//         [exercise]: {
//           ...prev[exercise],
//           ...data,
//         },
//       };

//       // Sequential unlock logic
//       if (exercise === "flashcards" && data.status === "completed") {
//         updated.quiz.status = "available";
//       }
//       if (exercise === "quiz" && data.status === "completed") {
//         updated["fill-blanks"].status = "available";
//       }

//       return updated;
//     });
//   };

//   // Reset all progress
//   const resetProgress = () => {
//     setProgress(defaultProgress);
//     localStorage.removeItem("vocabulary-progress");
//   };

//   // Get next recommended exercise
//   const getNextRecommended = (): ExerciseType | null => {
//     if (progress.flashcards.status !== "completed") return "flashcards";
//     if (progress.quiz.status !== "completed") return "quiz";
//     if (progress["fill-blanks"].status !== "completed") return "fill-blanks";
//     return null; // All completed
//   };

//   // Check if user can access exercise
//   const canAccessExercise = (exercise: ExerciseType): boolean => {
//     return progress[exercise].status !== "locked";
//   };

//   // Calculate overall progress percentage
//   const getOverallProgress = (): number => {
//     const completed = Object.values(progress).filter(
//       (ex) => ex.status === "completed"
//     ).length;
//     return Math.round((completed / 3) * 100);
//   };

//   return (
//     <VocabularyProgressContext.Provider
//       value={{
//         progress,
//         updateProgress,
//         resetProgress,
//         getNextRecommended,
//         canAccessExercise,
//         getOverallProgress,
//       }}
//     >
//       {children}
//     </VocabularyProgressContext.Provider>
//   );
// }

// // Custom hook
// export function useVocabularyProgress() {
//   const context = useContext(VocabularyProgressContext);
//   if (!context) {
//     throw new Error(
//       "useVocabularyProgress must be used within VocabularyProgressProvider"
//     );
//   }
//   return context;
// }
