"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, TrendingUp, Award, Target } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface QuizCompletionModalProps {
  isOpen: boolean;
  score: number;
  correctCount: number;
  totalQuestions: number;
  onClose: () => void;
}

export default function QuizCompletionModal({
  isOpen,
  score,
  correctCount,
  totalQuestions,
  onClose,
}: QuizCompletionModalProps) {
  useEffect(() => {
    if (isOpen && score >= 70) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen, score]);

  const getPerformanceMessage = () => {
    if (score >= 90) return "🌟 Outstanding! Perfect mastery!";
    if (score >= 80) return "🎉 Excellent work! Keep it up!";
    if (score >= 70) return "👍 Good job! You're doing great!";
    if (score >= 60) return "💪 Not bad! Review and try again.";
    return "📚 Keep practicing! You'll improve!";
  };

  const getGrade = () => {
    if (score >= 90) return "A+";
    if (score >= 85) return "A";
    if (score >= 80) return "B+";
    if (score >= 75) return "B";
    if (score >= 70) return "C+";
    if (score >= 60) return "C";
    return "D";
  };

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
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    score >= 70
                      ? "bg-green-100"
                      : score >= 60
                      ? "bg-yellow-100"
                      : "bg-red-100"
                  }`}
                >
                  {score >= 70 ? (
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  ) : (
                    <Target className="w-12 h-12 text-yellow-600" />
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Quiz Complete!
                </h2>
                <p className="text-gray-600">
                  You've finished the vocabulary quiz.
                </p>
              </div>

              {/* Grade Badge */}
              {/* <div className="flex justify-center">
                <div
                  className={`px-8 py-4 rounded-2xl ${
                    score >= 80
                      ? "bg-green-500"
                      : score >= 70
                      ? "bg-blue-500"
                      : score >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  } text-white`}
                >
                  <div className="text-center">
                    <p className="text-sm font-semibold opacity-90">
                      Your Grade
                    </p>
                    <p className="text-5xl font-bold">{getGrade()}</p>
                  </div>
                </div>
              </div> */}

              {/* Stats */}
              <div className="space-y-3 bg-purple-50 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Score
                  </span>
                  <span className="text-2xl font-bold text-purple-600">
                    {score}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Correct Answers
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    {correctCount}/{totalQuestions}
                  </span>
                </div>
              </div>

              {/* Performance Message */}
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-800 font-medium">
                  {getPerformanceMessage()}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <Link
                  href="/vocabulary/fill-blanks"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center"
                >
                  Continue to Fill-in-the-Blanks →
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Retake Quiz
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
