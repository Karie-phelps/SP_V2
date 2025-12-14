"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, TrendingUp, Award } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface CompletionModalProps {
  isOpen: boolean;
  score: number;
  masteredCount: number;
  totalCards: number;
  onClose: () => void;
}

export default function FlashcardCompletionModal({
  isOpen,
  score,
  masteredCount,
  totalCards,
  onClose,
}: CompletionModalProps) {
  useEffect(() => {
    if (isOpen && score >= 70) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen, score]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Flashcards Complete!
                </h2>
                <p className="text-gray-600">
                  Great job! You've reviewed all the vocabulary words.
                </p>
              </div>

              {/* Stats */}
              <div className="space-y-3 bg-blue-50 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    Mastery Score
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {score}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Words Mastered
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    {masteredCount}/{totalCards}
                  </span>
                </div>
              </div>

              {/* Performance Message */}
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-800 font-medium">
                  {score >= 90
                    ? "🌟 Excellent! You're ready for the quiz!"
                    : score >= 70
                    ? "👍 Good job! Practice more to improve."
                    : "💪 Keep practicing! Review the flashcards again."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <Link
                  href="/vocabulary/quiz"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center"
                >
                  Continue to Quiz →
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Practice Again
                </button>
                <Link
                  href="/vocabulary"
                  className="w-full text-center text-gray-600 hover:text-gray-800 py-2 text-sm"
                >
                  Back to Vocabulary
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
