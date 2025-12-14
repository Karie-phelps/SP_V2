"use client";

import { motion } from "framer-motion";
import { useReviewDeck } from "@/contexts/ReviewDeckProvider";
import { BookmarkCheck, BookmarkPlus } from "lucide-react";

interface FlashcardProgressProps {
  current: number;
  total: number;
  masteredCount: number;
  learningCount: number;
  wordId: number;
}

export default function FlashcardProgress({
  current,
  total,
  masteredCount,
  learningCount,
  wordId,
}: FlashcardProgressProps) {
  const progress = ((current + 1) / total) * 100;
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
    <div className="w-full space-y-3">
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex justify-between text-xs text-gray-600 mb-1.5">
          <span className="font-semibold">
            Card {current + 1} of {total}
          </span>
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

      {/* Stats */}
      <div className="flex flex-row justify-between">
        <div className="flex gap-3 justify-start">
          <div className="flex items-center gap-1.5 bg-green-100 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs font-semibold text-green-700">
              Mastered: {masteredCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-orange-100 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            <span className="text-xs font-semibold text-orange-700">
              Learning: {learningCount}
            </span>
          </div>
        </div>
        {/* Add to Review Deck Button */}
        <button
          onClick={handleToggleReviewDeck}
          className={`p-2 rounded-lg transition-all ${
            inReviewDeck
              ? "bg-purple-600 text-white"
              : "bg-white text-purple-600 border-2 border-purple-300"
          } hover:scale-110`}
        >
          {inReviewDeck ? (
            <div className="text-xs flex flex-row justify-center items-center">
              <BookmarkCheck className="w-4 h-4" />
              <p className="ml-1">Remove from review deck</p>
            </div>
          ) : (
            <div className="text-xs flex flex-row justify-center items-center">
              <BookmarkPlus className="w-4 h-4" />
              <p className="ml-1">Add to review deck</p>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
