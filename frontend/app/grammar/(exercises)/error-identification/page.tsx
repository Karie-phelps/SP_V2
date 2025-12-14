"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";
import Link from "next/link";
import ErrorQuestion from "@/components/grammar/error-identification/ErrorQuestion";
import ErrorProgress from "@/components/grammar/error-identification/ErrorProgress";
import ErrorCompletionModal from "@/components/grammar/error-identification/ErrorCompletionModal";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import { grammarData } from "@/data/grammar-dataset";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";

interface ErrorAnswer {
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  sentence: string;
}

export default function ErrorIdentificationPage() {
  const { updateProgress } = useGrammarProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();

  const [errorQuestions, setErrorQuestions] = useState<typeof grammarData>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<ErrorAnswer[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);

  // Initialize questions on client side only
  useEffect(() => {
    const errorExercises = grammarData.filter(
      (item) => item.exerciseType === "error_identification"
    );
    const shuffled = [...errorExercises].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    setErrorQuestions(selected);
    setAnswers(Array(selected.length).fill(null));
  }, []);

  // Show loading state while initializing
  if (errorQuestions.length === 0) {
    return (
      <div className="h-screen bg-red-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-red-200">
          <Link
            href="/grammar"
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-red-900">
              Error Identification
            </h1>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  const currentError = errorQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === errorQuestions.length - 1;

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentError.correctAnswer;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = isCorrect;
    setAnswers(newAnswers);

    // Store detailed answer for analysis
    setDetailedAnswers([
      ...detailedAnswers,
      {
        isCorrect,
        selectedAnswer: answer,
        correctAnswer: currentError.correctAnswer,
        sentence: currentError.sentence,
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
    const score = Math.round((correctCount / errorQuestions.length) * 100);

    // Calculate performance metrics
    let missedLowFreq = 0;
    let similarChoiceErrors = 0;

    detailedAnswers.forEach((answer) => {
      // Count errors by difficulty
      const question = errorQuestions.find(
        (q) => q.sentence === answer.sentence
      );
      if (!answer.isCorrect && question?.difficulty === "hard") {
        missedLowFreq++;
      }

      // Count similar error pattern mistakes
      if (!answer.isCorrect) {
        similarChoiceErrors++;
      }
    });

    // Get current difficulty
    const history = getPerformanceHistory("grammar", "flashcards"); // Maps to flashcards
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
    addPerformanceMetrics("grammar", "flashcards", metrics);

    // Evaluate and get next difficulty + tags
    const allHistory = [...history, metrics];
    const evaluation = evaluateUserPerformance(allHistory);

    // Update progress with evaluation results
    updateProgress("error-identification", {
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
    const errorExercises = grammarData.filter(
      (item) => item.exerciseType === "error_identification"
    );
    const shuffled = [...errorExercises].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    setErrorQuestions(selected);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswers(Array(selected.length).fill(null));
    setDetailedAnswers([]);
    setShowCompletion(false);
  };

  return (
    <div className="h-screen bg-red-50 overflow-auto flex flex-col scrollbar-red scrollbar-purple">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-red-200">
        <Link
          href="/grammar"
          className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-red-900">
            Error Identification
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
      <div className="flex-1 flex flex-col justify-start px-4 md:px-8 py-6 space-y-1 max-w-7xl mx-auto w-full">
        <ErrorProgress
          currentQuestion={currentQuestion}
          totalQuestions={errorQuestions.length}
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
          <ErrorQuestion
            questionNumber={currentQuestion + 1}
            totalQuestions={errorQuestions.length}
            sentence={currentError.sentence}
            question={
              currentError.question ||
              "Which part contains the grammatical error?"
            }
            choices={currentError.choices}
            correctAnswer={currentError.correctAnswer}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={handleSelectAnswer}
            showResult={showResult}
            explanation={currentError.explanation || ""}
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
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors"
            >
              {isLastQuestion ? "Finish Exercise" : "Next Question"}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        ) : (
          <div className="text-center text-xs text-red-600">
            🔍 Identify the part of the sentence that contains a grammatical
            error
          </div>
        )}
      </div>

      <ErrorCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (answers.filter((a) => a === true).length / errorQuestions.length) *
            100
        )}
        correctCount={answers.filter((a) => a === true).length}
        totalQuestions={errorQuestions.length}
        onClose={() => setShowCompletion(false)}
        onRetake={resetExercise}
      />
    </div>
  );
}
