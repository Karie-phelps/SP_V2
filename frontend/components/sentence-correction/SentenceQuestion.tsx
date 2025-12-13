"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Lightbulb } from "lucide-react";
import AIExplanation from "@/components/common/AIExplanation";

interface SentenceQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  sentence: string;
  prompt: string;
  choices: string[];
  correctAnswer: string;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  showResult: boolean;
  explanation: string;
}

export default function SentenceQuestion({
  questionNumber,
  totalQuestions,
  sentence,
  prompt,
  choices,
  correctAnswer,
  selectedAnswer,
  onSelectAnswer,
  showResult,
  explanation,
}: SentenceQuestionProps) {
  const showExplanation =
    showResult && selectedAnswer && selectedAnswer !== correctAnswer;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Question Header */}
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center md:mx-40 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800 font-medium mb-2">
            Original Sentence:
          </p>
          <p className="text-base md:text-lg text-gray-900 font-semibold ">
            &quot;{sentence}&quot;
          </p>
        </div>

        <div className="text-center">
          <h2 className="text-xs md:text-sm text-gray-500">{prompt}</h2>
        </div>
      </div>

      {/* Options and Explanation Side by Side */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Options Container */}
        <motion.div
          animate={{
            flex: showExplanation ? "0 0 42%" : "1 1 100%",
          }}
          transition={{ duration: 0.3 }}
          className={`w-full ${
            showExplanation ? "lg:flex-[0_0_42%]" : "lg:mx-40"
          }`}
        >
          <div className="grid grid-cols-1 gap-3">
            {choices.map((choice, index) => {
              const isSelected = selectedAnswer === choice;
              const isCorrect = choice === correctAnswer;
              const showCorrect = showResult && isCorrect;
              const showWrong = showResult && isSelected && !isCorrect;

              return (
                <motion.button
                  key={index}
                  whileHover={!showResult ? { scale: 1.02 } : {}}
                  whileTap={!showResult ? { scale: 0.98 } : {}}
                  onClick={() => !showResult && onSelectAnswer(choice)}
                  disabled={showResult}
                  className={`relative p-4 rounded-xl border-3 text-left transition-all duration-300 ${
                    showCorrect
                      ? "bg-green-100 border-green-500"
                      : showWrong
                      ? "bg-red-100 border-red-500"
                      : isSelected
                      ? "bg-blue-100 border-blue-500"
                      : "bg-white border-blue-200 hover:border-blue-400"
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
                          ? "bg-blue-500 text-white"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>

                    {/* Option Text */}
                    <div className="flex-1 text-sm md:text-base text-gray-800 font-medium">
                      {choice}
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
        </motion.div>

        {/* AI Explanation - slides in from right */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, x: 100, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: 100, width: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full lg:flex-[0_0_55%]"
            >
              <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6 h-full">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-100">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-blue-900">
                    Explanation
                  </h3>
                </div>
                <div className="text-sm text-gray-800 leading-relaxed">
                  <p className="mb-3">
                    <span className="font-semibold text-green-700">
                      Correct Answer:
                    </span>{" "}
                    {correctAnswer}
                  </p>
                  <p className="text-gray-700">{explanation}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
