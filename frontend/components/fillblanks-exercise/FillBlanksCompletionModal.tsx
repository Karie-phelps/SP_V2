"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, TrendingUp, Award, Trophy } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface FillBlanksCompletionModalProps {
  isOpen: boolean;
  score: number;
  correctCount: number;
  totalQuestions: number;
  onClose: () => void;
}

export default function FillBlanksCompletionModal({
  isOpen,
  score,
  correctCount,
  totalQuestions,
  onClose,
}: FillBlanksCompletionModalProps) {
  useEffect(() => {
    if (isOpen && score >= 70) {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#9333ea", "#ec4899", "#06b6d4"],
      });
    }
  }, [isOpen, score]);

  const getPerformanceMessage = () => {
    if (score === 100) return "🏆 Perfect Score! You're a vocabulary master!";
    if (score >= 90) return "🌟 Outstanding! Excellent work!";
    if (score >= 80) return "🎉 Great job! You're doing amazing!";
    if (score >= 70) return "👍 Good work! Keep practicing!";
    if (score >= 60) return "💪 Not bad! Review and improve!";
    return "📚 Keep studying! You'll get better!";
  };

  const getGrade = () => {
    if (score === 100) return "A++";
    if (score >= 95) return "A+";
    if (score >= 90) return "A";
    if (score >= 85) return "B+";
    if (score >= 80) return "B";
    if (score >= 75) return "C+";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
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
                  className={`w-24 h-24 rounded-full flex items-center justify-center ${
                    score === 100
                      ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                      : score >= 80
                      ? "bg-green-100"
                      : score >= 60
                      ? "bg-blue-100"
                      : "bg-red-100"
                  }`}
                >
                  {score === 100 ? (
                    <Trophy className="w-14 h-14 text-white" />
                  ) : score >= 70 ? (
                    <CheckCircle className="w-14 h-14 text-green-600" />
                  ) : (
                    <Award className="w-14 h-14 text-blue-600" />
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {score === 100 ? "Perfect! 🎊" : "Activity Complete! 🎉"}
                </h2>
                <p className="text-gray-600">
                  You've finished all vocabulary exercises!
                </p>
              </div>

              {/* Grade Badge */}
              {/* <div className="flex justify-center">
                <div
                  className={`px-10 py-5 rounded-2xl ${
                    score === 100
                      ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                      : score >= 80
                      ? "bg-green-500"
                      : score >= 70
                      ? "bg-blue-500"
                      : score >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  } text-white shadow-xl`}
                >
                  <div className="text-center">
                    <p className="text-sm font-semibold opacity-90">
                      Final Grade
                    </p>
                    <p className="text-6xl font-bold">{getGrade()}</p>
                  </div>
                </div>
              </div> */}

              {/* Stats */}
              <div className="space-y-3 bg-purple-50 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Final Score
                  </span>
                  <span className="text-3xl font-bold text-purple-600">
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
              <div
                className={`text-center p-4 rounded-xl ${
                  score >= 80
                    ? "bg-green-50 border-2 border-green-200"
                    : score >= 70
                    ? "bg-blue-50 border-2 border-blue-200"
                    : "bg-yellow-50 border-2 border-yellow-200"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    score >= 80
                      ? "text-green-800"
                      : score >= 70
                      ? "text-blue-800"
                      : "text-yellow-800"
                  }`}
                >
                  {getPerformanceMessage()}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <Link
                  href="/vocabulary"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center"
                >
                  Back to Vocabulary
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Practice Again
                </button>
                <Link
                  href="/dashboard"
                  className="w-full text-center text-gray-600 hover:text-gray-800 py-2 text-sm"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
