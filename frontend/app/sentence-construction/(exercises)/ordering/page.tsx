"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";
import Link from "next/link";
import OrderingQuestion from "@/components/sentence-construction/sentence-ordering-exercise/OrderingQuestion";
import OrderingProgress from "@/components/sentence-construction/sentence-ordering-exercise/OrderingProgress";
import OrderingCompletionModal from "@/components/sentence-construction/sentence-ordering-exercise/OrderingCompletionModal";
import { useSentenceConstructionProgress } from "@/hooks/useSentenceConstructionProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import {
  sentenceConstructionData,
  type SentenceOrderingItem,
} from "@/data/sentence-construction-dataset";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";

interface OrderingAnswer {
  isCorrect: boolean;
  userSentence: string;
  correctSentence: string;
}

// Shuffle array function
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function SentenceOrderingPage() {
  const { updateProgress } = useSentenceConstructionProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();

  const [orderingQuestions, setOrderingQuestions] = useState<
    SentenceOrderingItem[]
  >([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<OrderingAnswer[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Initialize questions on client side only
  useEffect(() => {
    setIsClient(true);

    // Type guard to filter only sentence_ordering items
    const orderingExercises = sentenceConstructionData.filter(
      (item): item is SentenceOrderingItem =>
        item.exerciseType === "sentence_ordering"
    );

    const shuffled = [...orderingExercises].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    // Shuffle the words for each question
    const questionsWithShuffledWords = selected.map((q) => ({
      ...q,
      words: shuffleArray(q.words),
    }));

    setOrderingQuestions(questionsWithShuffledWords);
    setAnswers(Array(selected.length).fill(null));
  }, []);

  // Show loading state while initializing
  if (!isClient || orderingQuestions.length === 0) {
    return (
      <div className="h-screen bg-orange-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-orange-200">
          <Link
            href="/sentence-construction"
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-orange-900">
              Sentence Ordering
            </h1>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  const currentOrdering = orderingQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === orderingQuestions.length - 1;

  const handleSubmit = (userSentence: string, correct: boolean) => {
    setIsCorrect(correct);
    setShowResult(true);

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = correct;
    setAnswers(newAnswers);

    // Store detailed answer for analysis
    setDetailedAnswers([
      ...detailedAnswers,
      {
        isCorrect: correct,
        userSentence,
        correctSentence: currentOrdering.correctSentence,
      },
    ]);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      completeExercise();
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setShowResult(false);
      setIsCorrect(null);
    }
  };

  const completeExercise = () => {
    const correctCount = answers.filter((a) => a === true).length;
    const score = Math.round((correctCount / orderingQuestions.length) * 100);

    // Calculate performance metrics
    let missedLowFreq = 0;
    let similarChoiceErrors = 0;

    detailedAnswers.forEach((answer) => {
      const question = orderingQuestions.find(
        (q) => q.correctSentence === answer.correctSentence
      );
      if (!answer.isCorrect && question?.difficulty === "hard") {
        missedLowFreq++;
      }

      if (!answer.isCorrect) {
        similarChoiceErrors++;
      }
    });

    // Get current difficulty
    const history = getPerformanceHistory(
      "sentence-construction",
      "flashcards"
    );
    const currentDifficulty =
      history.length > 0 ? history[history.length - 1].difficulty : "easy";

    // Create performance metrics
    const metrics = {
      difficulty: currentDifficulty,
      score,
      missedLowFreq,
      similarChoiceErrors,
      timestamp: new Date().toISOString(),
    };

    // Add to performance history
    addPerformanceMetrics("sentence-construction", "flashcards", metrics);

    // Evaluate and get next difficulty + tags
    const allHistory = [...history, metrics];
    const evaluation = evaluateUserPerformance(allHistory);

    // Update progress with evaluation results
    updateProgress("flashcards", {
      status: "completed",
      score,
      completedAt: new Date().toISOString(),
      attempts: (history.length || 0) + 1,
      lastDifficulty: evaluation.nextDifficulty,
      errorTags: evaluation.tags,
    });

    setShowCompletion(true);
  };

  const resetExercise = () => {
    // Type guard to filter only sentence_ordering items
    const orderingExercises = sentenceConstructionData.filter(
      (item): item is SentenceOrderingItem =>
        item.exerciseType === "sentence_ordering"
    );

    const shuffled = [...orderingExercises].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    // Shuffle the words for each question
    const questionsWithShuffledWords = selected.map((q) => ({
      ...q,
      words: shuffleArray(q.words),
    }));

    setOrderingQuestions(questionsWithShuffledWords);
    setCurrentQuestion(0);
    setShowResult(false);
    setAnswers(Array(selected.length).fill(null));
    setDetailedAnswers([]);
    setShowCompletion(false);
    setIsCorrect(null);
  };

  return (
    <div className="h-screen bg-orange-50 overflow-auto flex flex-col scrollbar-orange">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-orange-200">
        <Link
          href="/sentence-construction"
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-orange-900">
            Sentence Ordering
          </h1>
        </div>

        <button
          onClick={resetExercise}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-700 font-semibold text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-start px-4 md:px-8 py-6 space-y-8 max-w-7xl mx-auto w-full">
        <OrderingProgress
          currentQuestion={currentQuestion}
          totalQuestions={orderingQuestions.length}
          answers={answers}
        />

        {/* Question Component with Animation */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <OrderingQuestion
            questionNumber={currentQuestion + 1}
            totalQuestions={orderingQuestions.length}
            words={currentOrdering.words}
            correctSentence={currentOrdering.correctSentence}
            onSubmit={handleSubmit}
            showResult={showResult}
            isCorrect={isCorrect}
            explanation={currentOrdering.explanation}
          />
        </motion.div>

        {showResult ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors"
            >
              {isLastQuestion ? "Finish Exercise" : "Next Question"}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        ) : (
          <div className="text-center text-xs text-orange-600">
            🔄 Drag and drop words to arrange them in the correct order
          </div>
        )}
      </div>

      <OrderingCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (answers.filter((a) => a === true).length /
            orderingQuestions.length) *
            100
        )}
        correctCount={answers.filter((a) => a === true).length}
        totalQuestions={orderingQuestions.length}
        onClose={() => setShowCompletion(false)}
        onRetake={resetExercise}
      />
    </div>
  );
}
