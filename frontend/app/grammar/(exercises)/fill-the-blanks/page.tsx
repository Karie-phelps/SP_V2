"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";
import Link from "next/link";
import FillBlanksQuestion from "@/components/grammar/fill-the-blanks/FillBlanksQuestion";
import FillBlanksProgress from "@/components/grammar/fill-the-blanks/FillBlanksProgress";
import FillBlanksCompletionModal from "@/components/grammar/fill-the-blanks/FillBlanksCompletionModal";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import { grammarData } from "@/data/grammar-dataset";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";

interface FillBlanksAnswer {
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  sentence: string;
}

export default function GrammarFillBlanksPage() {
  const { updateProgress } = useGrammarProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();

  const [fillBlanksQuestions, setFillBlanksQuestions] = useState<
    typeof grammarData
  >([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<FillBlanksAnswer[]>(
    []
  );
  const [showCompletion, setShowCompletion] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Initialize questions on client side only
  useEffect(() => {
    setIsClient(true);
    const fillBlanksExercises = grammarData.filter(
      (item) => item.exerciseType === "fill_in_the_blanks"
    );
    const shuffled = [...fillBlanksExercises].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    setFillBlanksQuestions(selected);
    setAnswers(Array(selected.length).fill(null));
  }, []);

  // Show loading state while initializing
  if (!isClient || fillBlanksQuestions.length === 0) {
    return (
      <div className="h-screen bg-green-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-green-200">
          <Link
            href="/grammar"
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-green-900">
              Fill-in-the-Blanks
            </h1>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  const currentFillBlanks = fillBlanksQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === fillBlanksQuestions.length - 1;

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentFillBlanks.correctAnswer;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = isCorrect;
    setAnswers(newAnswers);

    // Store detailed answer for analysis
    setDetailedAnswers([
      ...detailedAnswers,
      {
        isCorrect,
        selectedAnswer: answer,
        correctAnswer: currentFillBlanks.correctAnswer,
        sentence: currentFillBlanks.sentence,
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
    const score = Math.round((correctCount / fillBlanksQuestions.length) * 100);

    // Calculate performance metrics
    let missedLowFreq = 0;
    let similarChoiceErrors = 0;

    detailedAnswers.forEach((answer) => {
      const question = fillBlanksQuestions.find(
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
    const history = getPerformanceHistory("grammar", "fill-blanks");
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
    addPerformanceMetrics("grammar", "fill-blanks", metrics);

    // Evaluate and get next difficulty + tags
    const allHistory = [...history, metrics];
    const evaluation = evaluateUserPerformance(allHistory);

    // Update progress with evaluation results
    updateProgress("fill-blanks", {
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
    const fillBlanksExercises = grammarData.filter(
      (item) => item.exerciseType === "fill_in_the_blanks"
    );
    const shuffled = [...fillBlanksExercises].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    setFillBlanksQuestions(selected);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswers(Array(selected.length).fill(null));
    setDetailedAnswers([]);
    setShowCompletion(false);
  };

  return (
    <div className="h-screen bg-green-50 overflow-auto flex flex-col scrollbar-green">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-green-200">
        <Link
          href="/grammar"
          className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-green-900">
            Fill-in-the-Blanks
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
        <FillBlanksProgress
          currentQuestion={currentQuestion}
          totalQuestions={fillBlanksQuestions.length}
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
          <FillBlanksQuestion
            questionNumber={currentQuestion + 1}
            totalQuestions={fillBlanksQuestions.length}
            sentence={currentFillBlanks.sentence}
            choices={currentFillBlanks.choices}
            correctAnswer={currentFillBlanks.correctAnswer}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={handleSelectAnswer}
            showResult={showResult}
            explanation={currentFillBlanks.explanation || ""}
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
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors"
            >
              {isLastQuestion ? "Finish Exercise" : "Next Question"}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        ) : (
          <div className="text-center text-xs text-green-600">
            📝 Fill in the blank with the correct word
          </div>
        )}
      </div>

      <FillBlanksCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (answers.filter((a) => a === true).length /
            fillBlanksQuestions.length) *
            100
        )}
        correctCount={answers.filter((a) => a === true).length}
        totalQuestions={fillBlanksQuestions.length}
        onClose={() => setShowCompletion(false)}
        onRetake={resetExercise}
      />
    </div>
  );
}
