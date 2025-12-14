"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  TrendingUp,
  Award,
  Target,
  Sparkles,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";
import { useLearningProgress } from "@/contexts/LearningProgressContext";

interface QuizCompletionModalProps {
  isOpen: boolean;
  score: number;
  correctCount: number;
  totalQuestions: number;
  onClose: () => void;
  onRetake?: () => void;
}

export default function QuizCompletionModal({
  isOpen,
  score,
  correctCount,
  totalQuestions,
  onClose,
  onRetake,
}: QuizCompletionModalProps) {
  const { getPerformanceHistory } = useLearningProgress();
  const [showTips, setShowTips] = useState(false);
  const [tips, setTips] = useState<string>("");
  const [loadingTips, setLoadingTips] = useState(false);

  useEffect(() => {
    if (isOpen && score >= 70) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen, score]);

  const handleGetTips = async () => {
    setLoadingTips(true);
    try {
      const history = getPerformanceHistory("vocabulary", "quiz");
      const latestMetrics = history[history.length - 1];

      const response = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: latestMetrics?.score ?? score,
          missedLowFreq: latestMetrics?.missedLowFreq ?? 0,
          similarChoiceErrors: latestMetrics?.similarChoiceErrors ?? 0,
          lastDifficulty: latestMetrics?.difficulty ?? "easy",
        }),
      });

      const data = await response.json();
      if (data.tips) {
        setTips(data.tips);
        setShowTips(true);
      }
    } catch (error) {
      console.error("Failed to fetch tips:", error);
      setTips("Unable to generate tips at this time. Please try again later.");
      setShowTips(true);
    } finally {
      setLoadingTips(false);
    }
  };

  const handleRetake = () => {
    setShowTips(false);
    setTips("");
    if (onRetake) {
      onRetake();
    } else {
      window.location.reload();
    }
  };

  const getPerformanceMessage = () => {
    if (score >= 90) return "🌟 Outstanding! Perfect mastery!";
    if (score >= 80) return "🎉 Excellent work! Keep it up!";
    if (score >= 70) return "👍 Good job! You're doing great!";
    if (score >= 60) return "💪 Not bad! Review and try again.";
    return "📚 Keep practicing! You'll improve!";
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

          {/* Modal Container - Centered, then shifts when tips appear */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div
              className={`flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch w-full transition-all duration-500 ${
                showTips ? "max-w-5xl" : "max-w-md"
              }`}
            >
              {/* Main Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: showTips ? 0 : 0,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className={`bg-white rounded-3xl shadow-2xl w-full flex-shrink-0 ${
                  showTips ? "lg:w-96" : ""
                }`}
              >
                <div className="p-8 space-y-6 h-full flex flex-col">
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

                  {/* Stats */}
                  <div className="space-y-3 bg-blue-50 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-medium flex items-center gap-2">
                        <Award className="w-5 h-5 text-blue-600" />
                        Score
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
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

                  {/* AI Tips Button */}
                  {!showTips && (
                    <button
                      onClick={handleGetTips}
                      disabled={loadingTips}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingTips ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating Tips...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Get AI Tips
                        </>
                      )}
                    </button>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 mt-auto">
                    <Link
                      href="/vocabulary/fill-blanks"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center"
                    >
                      Continue to Fill-in-the-Blanks →
                    </Link>
                    <button
                      onClick={handleRetake}
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

              {/* AI Tips Panel - Beside Modal */}
              <AnimatePresence>
                {showTips && tips && (
                  <motion.div
                    initial={{ opacity: 0, x: 100, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: "auto" }}
                    exit={{ opacity: 0, x: 100, width: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="bg-white rounded-3xl shadow-2xl flex-1 overflow-hidden"
                  >
                    <div className="h-full flex flex-col">
                      {/* Header */}
                      <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-pink-50">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white rounded-lg shadow-sm">
                                <Sparkles className="w-6 h-6 text-blue-600" />
                              </div>
                              <h3 className="text-xl font-bold text-blue-900">
                                Personalized Study Tips
                              </h3>
                            </div>
                          </div>

                      {/* Content - Scrollable */}
                      <div className="flex-1 overflow-y-auto p-6">
                        <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                          {tips}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
