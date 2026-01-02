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
import { getGrammarExercises, GrammarExerciseItem } from "@/lib/api/exercises";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";

interface ErrorAnswer {
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  sentence: string;
}

interface ProcessedErrorItem {
  item_id: string;
  sentence: string;
  question: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
}

// Helper function to extract unique phrases from sentence
function extractPhrasesFromSentence(sentence: string): string[] {
  // Remove HTML tags
  const cleanSentence = sentence.replace(/<[^>]*>/g, "");

  // Split by common delimiters
  const words = cleanSentence.split(/[\s,./;:!?]+/).filter((w) => w.length > 0);

  // Create phrases (1-3 words)
  const phrases: string[] = [];

  for (let i = 0; i < words.length; i++) {
    // Single word
    if (words[i].length > 2) {
      phrases.push(words[i]);
    }

    // Two words
    if (i < words.length - 1) {
      phrases.push(`${words[i]} ${words[i + 1]}`);
    }

    // Three words
    if (i < words.length - 2) {
      phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
  }

  // Remove duplicates and return
  return Array.from(new Set(phrases));
}

// Convert grammar items to error identification format
function convertToErrorFormat(
  items: GrammarExerciseItem[]
): ProcessedErrorItem[] {
  return items.map((item) => {
    const allPhrases = extractPhrasesFromSentence(item.error_sentence);

    // Shuffle and take 3 random phrases as distractors (if not "No error")
    let choices: string[];

    if (item.errorCorrectAnswer === "No error") {
      // If no error, generate distractors from sentence
      const shuffled = allPhrases.sort(() => Math.random() - 0.5);
      const distractors = shuffled.slice(0, 3);
      choices = [...distractors, "No error"];
    } else {
      // If there's an error, use it as correct answer and generate distractors
      const distractors = allPhrases
        .filter((p) => p !== item.errorCorrectAnswer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      choices = [...distractors, item.errorCorrectAnswer];
    }

    // Shuffle choices
    choices = choices.sort(() => Math.random() - 0.5);

    return {
      item_id: item.item_id,
      sentence: item.error_sentence,
      question: "Alin sa mga sumusunod ang may mali sa pangungusap?",
      choices,
      correct_answer: item.errorCorrectAnswer,
      explanation: item.error_explanation,
    };
  });
}

export default function ErrorIdentificationPage() {
  const { updateProgress } = useGrammarProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();

  const [errorQuestions, setErrorQuestions] = useState<ProcessedErrorItem[]>(
    []
  );
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<ErrorAnswer[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load questions from AI service
  useEffect(() => {
    async function loadQuestions() {
      try {
        setIsLoading(true);
        const exercises = await getGrammarExercises();

        if (exercises.length === 0) {
          throw new Error("No grammar exercises available");
        }

        // Convert to error identification format
        const processedItems = convertToErrorFormat(exercises);

        // Shuffle and select 10 questions
        const shuffled = [...processedItems].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(10, shuffled.length));

        setErrorQuestions(selected);
        setAnswers(Array(selected.length).fill(null));
        setError(null);
      } catch (err) {
        console.error("Failed to load exercises:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load exercises. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadQuestions();
  }, []);

  // ... rest of the component remains the same (loading states, handlers, etc.)

  if (isLoading) {
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-red-600 font-semibold">Loading exercises...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || errorQuestions.length === 0) {
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
          <div className="text-center max-w-md px-4">
            <p className="text-red-600 font-semibold mb-4">
              {error || "No exercises available"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentError = errorQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === errorQuestions.length - 1;

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentError.correct_answer;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = isCorrect;
    setAnswers(newAnswers);

    setDetailedAnswers([
      ...detailedAnswers,
      {
        isCorrect,
        selectedAnswer: answer,
        correctAnswer: currentError.correct_answer,
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

    let missedLowFreq = 0;
    let similarChoiceErrors = 0;

    detailedAnswers.forEach((answer) => {
      if (!answer.isCorrect) {
        similarChoiceErrors++;
      }
    });

    const history = getPerformanceHistory("grammar", "flashcards");
    const currentDifficulty =
      history.length > 0 ? history[history.length - 1].difficulty : "easy";

    const metrics = {
      difficulty: currentDifficulty,
      score,
      missedLowFreq,
      similarChoiceErrors,
      timestamp: new Date().toISOString(),
    };

    addPerformanceMetrics("grammar", "flashcards", metrics);

    const allHistory = [...history, metrics];
    const evaluation = evaluateUserPerformance(allHistory);

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

  const resetExercise = async () => {
    try {
      setIsLoading(true);
      const exercises = await getGrammarExercises();
      const processedItems = convertToErrorFormat(exercises);
      const shuffled = [...processedItems].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(10, shuffled.length));

      setErrorQuestions(selected);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setAnswers(Array(selected.length).fill(null));
      setDetailedAnswers([]);
      setShowCompletion(false);
    } catch (err) {
      console.error("Failed to reload exercises:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-red-50 overflow-auto flex flex-col scrollbar-red scrollbar-purple">
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

      <div className="flex-1 flex flex-col justify-start px-4 md:px-8 py-6 space-y-1 max-w-7xl mx-auto w-full">
        <ErrorProgress
          currentQuestion={currentQuestion}
          totalQuestions={errorQuestions.length}
          answers={answers}
        />

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
            question={currentError.question}
            choices={currentError.choices}
            correctAnswer={currentError.correct_answer}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={handleSelectAnswer}
            showResult={showResult}
            explanation={currentError.explanation}
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
