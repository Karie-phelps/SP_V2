"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Lightbulb } from "lucide-react";

interface FillBlanksQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  sentence: string;
  choices: string[];
  correctAnswer: string;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  showResult: boolean;
  explanation: string;
}

export default function FillBlanksQuestion({
  questionNumber,
  totalQuestions,
  sentence,
  choices,
  correctAnswer,
  selectedAnswer,
  onSelectAnswer,
  showResult,
  explanation,
}: FillBlanksQuestionProps) {
  const showExplanation =
    showResult && selectedAnswer && selectedAnswer !== correctAnswer;

  // Split sentence by blank marker
  const parts = sentence.split("_____");

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Sentence with Blank */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200 lg:mx-40">
        <div className="text-center">
          <p className="text-lg md:text-2xl text-gray-900 font-medium leading-relaxed">
            {parts[0]}
            <span className="inline-block mx-2 px-4 border-b-4 border-green-400 border-dashed min-w-[120px] text-center">
              {showResult && selectedAnswer ? (
                <span
                  className={
                    selectedAnswer === correctAnswer
                      ? "text-green-600 font-bold"
                      : "text-red-600 font-bold"
                  }
                >
                  {selectedAnswer}
                </span>
              ) : (
                <span className="text-gray-400 text-sm"></span>
              )}
            </span>
            {parts[1]}
          </p>
        </div>
      </div>

      {/* Instruction */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Fill in the blank with the correct word
        </p>
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
                      ? "bg-green-50 border-green-400"
                      : "bg-white border-green-200 hover:border-green-400"
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
                          ? "bg-green-400 text-white"
                          : "bg-green-100 text-green-700"
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

        {/* Explanation - slides in from right */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, x: 100, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: 100, width: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full lg:flex-[0_0_55%]"
            >
              <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 p-6 h-full">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-green-100">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-green-900">
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
