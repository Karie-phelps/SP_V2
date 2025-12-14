"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Lightbulb } from "lucide-react";
import { useReviewDeck } from "@/contexts/ReviewDeckProvider";
import { vocabularyData } from "@/data/vocabulary-dataset";
import AIExplanation from "@/components/common/AIExplanation";

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
  const { addToReviewDeck, removeFromReviewDeck, isInReviewDeck } =
    useReviewDeck();

  // Find word ID
  const wordData = vocabularyData.find((w) => w.word === word);
  const wordId = wordData?.id || 0;
  const inReviewDeck = isInReviewDeck(wordId);

  const showExplanation =
    showResult && selectedAnswer && selectedAnswer !== correctAnswer;

  const handleToggleReviewDeck = () => {
    if (inReviewDeck) {
      removeFromReviewDeck(wordId);
    } else {
      addToReviewDeck(wordId);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Question Header */}
      <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
          Ano ang kahulugan ng &quot;{word}&quot;?
        </h2>
      </div>

      {/* Options and Explanation Side by Side */}
      <div className="flex flex-col lg:flex-row gap-6 items-center">
        {/* Options Container */}
        <motion.div
          animate={{
            flex: showExplanation ? "0 0 42%" : "1 1 100%",
          }}
          transition={{ duration: 0.3 }}
          className={`w-full mx-3 ${
            showExplanation ? "lg:flex-[0_0_42%]" : "lg:mx-60"
          }`}
        >
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
                        ? "bg-blue-500 text-white"
                        : "bg-blue-100 text-blue-700"
                  }`}
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
              <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-6 h-full">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-100">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-purple-900">
                    AI Explanation
                  </h3>
                </div>
                <AIExplanation
                  mode="quiz"
                  word={word}
                  correct={correctAnswer}
                  selected={selectedAnswer}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
