"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

interface QuizQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  word: string;
  options: string[];
  correctAnswer: string;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  showResult: boolean;
}

export default function QuizQuestion({
  questionNumber,
  totalQuestions,
  word,
  options,
  correctAnswer,
  selectedAnswer,
  onSelectAnswer,
  showResult,
}: QuizQuestionProps) {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Question Header */}
      <div className="text-center space-y-2">
        {/* <p className="text-sm text-purple-600 font-semibold">
          Tanong {questionNumber} ng {totalQuestions}
        </p> */}
        <h2 className="text-2xl md:text-3xl font-bold text-purple-900">
          Ano ang kahulugan ng &quot;{word}&quot;?
        </h2>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === correctAnswer;
          const showCorrect = showResult && isCorrect;
          const showWrong = showResult && isSelected && !isCorrect;

          return (
            <motion.button
              key={index}
              whileHover={!showResult ? { scale: 1.02 } : {}}
              whileTap={!showResult ? { scale: 0.98 } : {}}
              onClick={() => !showResult && onSelectAnswer(option)}
              disabled={showResult}
              className={`relative p-4 rounded-xl border-3 text-left transition-all duration-300 ${
                showCorrect
                  ? "bg-green-100 border-green-500"
                  : showWrong
                  ? "bg-red-100 border-red-500"
                  : isSelected
                  ? "bg-purple-100 border-purple-500"
                  : "bg-white border-purple-200 hover:border-purple-400"
              } ${showResult ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Option Letter */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    showCorrect
                      ? "bg-green-500 text-white"
                      : showWrong
                      ? "bg-red-500 text-white"
                      : isSelected
                      ? "bg-purple-500 text-white"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {String.fromCharCode(65 + index)}
                </div>

                {/* Option Text */}
                <div className="flex-1 text-sm md:text-base text-gray-800 font-medium">
                  {option}
                </div>

                {/* Result Icon */}
                {showResult && (
                  <div className="flex-shrink-0">
                    {isCorrect ? (
                      <Check className="w-6 h-6 text-green-600" />
                    ) : (
                      isSelected && <X className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
