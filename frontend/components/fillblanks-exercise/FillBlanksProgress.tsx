"use client";

import { motion } from "framer-motion";
import { Check, Circle, X } from "lucide-react";

interface FillBlanksProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  answers: (boolean | null)[];
}

export default function FillBlanksProgress({
  currentQuestion,
  totalQuestions,
  answers,
}: FillBlanksProgressProps) {
  const progress = (currentQuestion / totalQuestions) * 100;
  const correctCount = answers.filter((a) => a === true).length;
  const wrongCount = answers.filter((a) => a === false).length;

  return (
    <div className="w-full space-y-4">
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span className="font-semibold">Progress</span>
          <span className="font-semibold">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2.5 bg-purple-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Question Indicators */}
      <div className="flex gap-2 flex-wrap justify-center">
        {Array.from({ length: totalQuestions }).map((_, index) => {
          const isAnswered = answers[index] !== null;
          const isCorrect = answers[index] === true;
          const isCurrent = index === currentQuestion;

          return (
            <div
              key={index}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                isCurrent
                  ? "border-purple-500 bg-purple-100 text-purple-700 scale-110"
                  : isCorrect
                  ? "border-green-500 bg-green-100 text-green-700"
                  : isAnswered
                  ? "border-red-500 bg-red-100 text-red-700"
                  : "border-gray-300 bg-white text-gray-400"
              }`}
            >
              {isCorrect ? (
                <Check size={16} />
              ) : isAnswered ? (
                <X size={16} />
              ) : isCurrent ? (
                index + 1
              ) : (
                <Circle size={12} />
              )}
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="flex gap-4 justify-center">
        <div className="flex items-center gap-1.5 bg-green-100 px-3 py-1.5 rounded-full">
          <Check size={14} className="text-green-600" />
          <span className="text-xs font-semibold text-green-700">
            Correct: {correctCount}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-red-100 px-3 py-1.5 rounded-full">
          <X size={14} className="text-red-600" />
          <span className="text-xs font-semibold text-red-700">
            Wrong: {wrongCount}
          </span>
        </div>
      </div>
    </div>
  );
}
