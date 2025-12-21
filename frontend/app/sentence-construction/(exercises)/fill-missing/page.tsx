"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";
import Link from "next/link";
import FillMissingQuestion from "@/components/sentence-construction/fill-missing-exercise/FillMissingQuestion";
import FillMissingProgress from "@/components/sentence-construction/fill-missing-exercise/FillMissingProgress";
import FillMissingCompletionModal from "@/components/sentence-construction/fill-missing-exercise/FillMissingCompletionModal";
import { useSentenceConstructionProgress } from "@/hooks/useSentenceConstructionProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import {
  sentenceConstructionData,
  type FillMissingWordsItem,
} from "@/data/sentence-construction-dataset";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";

interface FillMissingAnswer {
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  sentence: string;
}

export default function FillMissingPage() {
  const { updateProgress } = useSentenceConstructionProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();

  const [fillMissingQuestions, setFillMissingQuestions] = useState<
    FillMissingWordsItem[]
  >([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<FillMissingAnswer[]>(
    []
  );
  const [showCompletion, setShowCompletion] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Initialize questions on client side only
  useEffect(() => {
    setIsClient(true);

    // Type guard to filter only fill_missing_words items
    const fillMissingExercises = sentenceConstructionData.filter(
      (item): item is FillMissingWordsItem =>
        item.exerciseType === "fill_missing_words"
    );

    const shuffled = [...fillMissingExercises].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    setFillMissingQuestions(selected);
    setAnswers(Array(selected.length).fill(null));
  }, []);

  // Show loading state while initializing
  if (!isClient || fillMissingQuestions.length === 0) {
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
              Fill Missing Words
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

  const currentFillMissing = fillMissingQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === fillMissingQuestions.length - 1;

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentFillMissing.correctAnswer;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = isCorrect;
    setAnswers(newAnswers);

    // Store detailed answer for analysis
    setDetailedAnswers([
      ...detailedAnswers,
      {
        isCorrect,
        selectedAnswer: answer,
        correctAnswer: currentFillMissing.correctAnswer,
        sentence: currentFillMissing.sentence,
      },
    ]);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      completeExercise();
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const completeExercise = () => {
    const correctCount = answers.filter((a) => a === true).length;
    const score = Math.round(
      (correctCount / fillMissingQuestions.length) * 100
    );

    // Calculate performance metrics
    let missedLowFreq = 0;
    let similarChoiceErrors = 0;

    detailedAnswers.forEach((answer) => {
      const question = fillMissingQuestions.find(
        (q) => q.sentence === answer.sentence
      );
      if (!answer.isCorrect && question?.difficulty === "hard") {
        missedLowFreq++;
      }

      if (!answer.isCorrect) {
        similarChoiceErrors++;
      }
    });

    // Get current difficulty
    const history = getPerformanceHistory("sentence-construction", "quiz");
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
    addPerformanceMetrics("sentence-construction", "quiz", metrics);

    // Evaluate and get next difficulty + tags
    const allHistory = [...history, metrics];
    const evaluation = evaluateUserPerformance(allHistory);

    // Update progress with evaluation results
    updateProgress("quiz", {
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
    // Type guard to filter only fill_missing_words items
    const fillMissingExercises = sentenceConstructionData.filter(
      (item): item is FillMissingWordsItem =>
        item.exerciseType === "fill_missing_words"
    );

    const shuffled = [...fillMissingExercises].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    setFillMissingQuestions(selected);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswers(Array(selected.length).fill(null));
    setDetailedAnswers([]);
    setShowCompletion(false);
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
            Fill Missing Words
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
        <FillMissingProgress
          currentQuestion={currentQuestion}
          totalQuestions={fillMissingQuestions.length}
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
          <FillMissingQuestion
            questionNumber={currentQuestion + 1}
            totalQuestions={fillMissingQuestions.length}
            sentence={currentFillMissing.sentence}
            choices={currentFillMissing.choices}
            correctAnswer={currentFillMissing.correctAnswer}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={handleSelectAnswer}
            showResult={showResult}
            explanation={currentFillMissing.explanation}
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
            📝 Choose the correct word to complete the sentence
          </div>
        )}
      </div>

      <FillMissingCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (answers.filter((a) => a === true).length /
            fillMissingQuestions.length) *
            100
        )}
        correctCount={answers.filter((a) => a === true).length}
        totalQuestions={fillMissingQuestions.length}
        onClose={() => setShowCompletion(false)}
        onRetake={resetExercise}
      />
    </div>
  );
}
