"use client";

import { useVocabularyProgress } from "@/hooks/useVocabularyProgress";
import { Lock, Circle } from "lucide-react";
import { ExerciseType } from "@/contexts/LearningProgressContext";

const steps = [
  { id: "flashcards" as ExerciseType, label: "Flashcards", number: 1 },
  { id: "quiz" as ExerciseType, label: "Quiz", number: 2 },
  { id: "fill-blanks" as ExerciseType, label: "Fill-in-the-Blanks", number: 3 },
];

export default function ProgressStepper() {
  const { progress, getExerciseMastery } = useVocabularyProgress();

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
          <div
            className="h-full bg-purple-600 transition-all duration-500"
            style={{
              width: `${
                ([
                  progress.flashcards,
                  progress.quiz,
                  progress["fill-blanks"],
                ].filter((p) => p.performanceHistory.length > 0).length /
                  3) *
                100
              }%`,
            }}
          />
        </div>

        {steps.map((step) => {
          const exerciseProgress = progress[step.id];
          const hasStarted = exerciseProgress.performanceHistory.length > 0;
          const isAvailable =
            exerciseProgress.status === "available" ||
            exerciseProgress.status === "in-progress" ||
            exerciseProgress.status === "completed";
          const isLocked = exerciseProgress.status === "locked";

          const mastery = hasStarted
            ? getExerciseMastery(exerciseProgress)
            : null;

          return (
            <div key={step.id} className="flex flex-col items-center relative">
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                  hasStarted
                    ? "bg-purple-600 text-white"
                    : isAvailable
                    ? "bg-purple-100 text-purple-600 border-2 border-purple-600"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {hasStarted && mastery ? (
                  <span>{mastery.icon}</span>
                ) : isLocked ? (
                  <Lock size={16} />
                ) : (
                  <Circle size={16} />
                )}
              </div>

              {/* Label */}
              <span
                className={`mt-2 text-xs md:text-sm font-medium text-center max-w-[80px] ${
                  hasStarted || isAvailable
                    ? "text-purple-900"
                    : "text-gray-400"
                }`}
              >
                {step.label}
              </span>

              {/* Mastery badge */}
              {hasStarted && mastery && (
                <div className="mt-1 flex flex-col items-center gap-1">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold capitalize">
                    {mastery.level}
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold capitalize">
                    {mastery.difficulty}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
