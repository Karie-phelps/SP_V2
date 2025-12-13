"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";

const steps = [
  { id: 1, name: "Error ID", key: "error-identification" as const },
  { id: 2, name: "Correction", key: "sentence-correction" as const },
  { id: 3, name: "Fill Blanks", key: "fill-blanks" as const },
];

export default function GrammarProgressStepper() {
  const { getExerciseProgress } = useGrammarProgress();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: "0%" }}
            animate={{
              width: `${
                (steps.filter(
                  (s) => getExerciseProgress(s.key).status === "completed"
                ).length /
                  steps.length) *
                100
              }%`,
            }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Steps */}
        {steps.map((step) => {
          const progress = getExerciseProgress(step.key);
          const isCompleted = progress.status === "completed";

          return (
            <div key={step.id} className="flex flex-col items-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                  isCompleted
                    ? "bg-green-500 border-green-500 text-white"
                    : "bg-white border-gray-300 text-gray-500"
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : step.id}
              </motion.div>
              <p
                className={`mt-2 text-xs font-medium ${
                  isCompleted ? "text-green-700" : "text-gray-500"
                }`}
              >
                {step.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
