"use client";

import { motion } from "framer-motion";
import { Check, Circle, X, BookmarkCheck, BookmarkPlus } from "lucide-react";
import { useReviewDeck } from "@/contexts/ReviewDeckProvider";

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  answers: (boolean | null)[];
  wordId: number;
}

export default function QuizProgress({
  currentQuestion,
  totalQuestions,
  answers,
  wordId,
}: QuizProgressProps) {
  const progress = (currentQuestion / totalQuestions) * 100;
  const correctCount = answers.filter((a) => a === true).length;
  const wrongCount = answers.filter((a) => a === false).length;
  const { addToReviewDeck, removeFromReviewDeck, isInReviewDeck } =
    useReviewDeck();
  const inReviewDeck = isInReviewDeck(wordId);

  const handleToggleReviewDeck = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inReviewDeck) {
      removeFromReviewDeck(wordId);
    } else {
      addToReviewDeck(wordId);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span className="font-semibold">Progress</span>
          <span className="font-semibold">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Mobile Layout - Stack vertically */}
      <div className="flex flex-col gap-4 md:hidden">
        {/* Stats Row */}
        <div className="flex gap-3 justify-between items-center">
          <div className="flex items-center gap-1.5 bg-green-100 px-3 py-1.5 rounded-full">
            <Check size={14} className="text-green-600" />
            <span className="text-xs font-semibold text-green-700">
              {correctCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-red-100 px-3 py-1.5 rounded-full">
            <X size={14} className="text-red-600" />
            <span className="text-xs font-semibold text-red-700">
              {wrongCount}
            </span>
          </div>
          {/* Add to Review Deck Button */}
          <button
            onClick={handleToggleReviewDeck}
            className={`p-2 rounded-lg transition-all ${
              inReviewDeck
                ? "bg-purple-600 text-white"
                : "bg-white text-purple-600 border-2 border-purple-300"
            } hover:scale-110`}
            title={
              inReviewDeck ? "Remove from review deck" : "Add to review deck"
            }
          >
            {inReviewDeck ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <BookmarkPlus className="w-4 h-4" />
            )}
          </button>
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
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
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
                  <Check size={14} />
                ) : isAnswered ? (
                  <X size={14} />
                ) : isCurrent ? (
                  index + 1
                ) : (
                  <Circle size={10} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop/Tablet Layout - Horizontal */}
      <div className="hidden md:flex md:flex-row justify-between items-center">
        {/* Stats */}
        <div className="flex gap-4">
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

        {/* Add to Review Deck Button */}
        <button
          onClick={handleToggleReviewDeck}
          className={`p-2 rounded-lg transition-all ${
            inReviewDeck
              ? "bg-purple-600 text-white"
              : "bg-white text-purple-600 border-2 border-purple-300"
          } hover:scale-110`}
          title={
            inReviewDeck ? "Remove from review deck" : "Add to review deck"
          }
        >
          {inReviewDeck ? (
            <BookmarkCheck className="w-4 h-4" />
          ) : (
            <BookmarkPlus className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
