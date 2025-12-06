"use client";

import { useLearningProgress } from "@/contexts/LearningProgressContext";
import { ArrowRight, Check } from "lucide-react";

const moduleNames = {
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  "sentence-construction": "Sentence Construction",
  "reading-comprehension": "Reading Comprehension",
};

export default function RecommendedPathIndicator() {
  const { progress, getRecommendedModule, isModuleCompleted } =
    useLearningProgress();

  const recommended = getRecommendedModule();

  const steps = [
    "vocabulary",
    "grammar",
    "sentence-construction",
    "reading-comprehension",
  ] as const;

  return (
    <div className="w-full bg-white rounded-xl p-4 shadow-lg border-2 border-purple-200 mb-4">
      <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
        <span className="text-purple-600">🎯</span>
        Recommended Learning Path
      </h3>

      <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
        {steps.map((module, index) => {
          const isCompleted = isModuleCompleted(module);
          const isRecommended = recommended === module;

          return (
            <div key={module} className="flex items-center gap-2">
              <div
                className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                  isCompleted
                    ? "bg-green-100 text-green-700"
                    : isRecommended
                    ? "bg-purple-600 text-white ring-2 ring-purple-300 animate-pulse"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isCompleted && <Check size={14} />}
                  {moduleNames[module]}
                </div>
              </div>

              {index < steps.length - 1 && (
                <ArrowRight
                  size={16}
                  className={isCompleted ? "text-green-500" : "text-gray-300"}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
