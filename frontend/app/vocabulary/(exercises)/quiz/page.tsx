"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";
import Link from "next/link";
import QuizQuestion from "@/components/mcquiz-exercise/QuizQuestion";
import QuizProgress from "@/components/mcquiz-exercise/QuizProgress";
import QuizCompletionModal from "@/components/mcquiz-exercise/QuizCompletionModal";
import { useVocabularyProgress } from "@/hooks/useVocabularyProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import { vocabularyData } from "@/data/vocabulary-dataset";
import {
  isLowFrequencyWord,
  areSimilarWords,
} from "@/utils/PerformanceTracker";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";

interface QuizItem {
  word: string;
  correctAnswer: string;
  options: string[];
  difficulty: string;
  category: string;
}

interface QuizAnswer {
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  word: string;
}

// Generate distractors for a word
function generateDistractors(
  correctMeaning: string,
  currentWord: (typeof vocabularyData)[0],
  allWords: typeof vocabularyData
): string[] {
  const candidates = allWords.filter(
    (w) =>
      w.meaning !== correctMeaning &&
      (w.difficulty === currentWord.difficulty ||
        w.category === currentWord.category)
  );

  const shuffled = candidates.sort(() => Math.random() - 0.5);
  const distractors = shuffled.slice(0, 3).map((w) => w.meaning);

  while (distractors.length < 3) {
    const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
    if (
      randomWord.meaning !== correctMeaning &&
      !distractors.includes(randomWord.meaning)
    ) {
      distractors.push(randomWord.meaning);
    }
  }

  return distractors;
}

export default function QuizPage() {
  const { updateProgress } = useVocabularyProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();

  const [quizQuestions] = useState<QuizItem[]>(() => {
    const shuffled = [...vocabularyData].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);

    return selected.map((word) => {
      const distractors = generateDistractors(
        word.meaning,
        word,
        vocabularyData
      );
      const allOptions = [word.meaning, ...distractors];
      const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);

      return {
        word: word.word,
        correctAnswer: word.meaning,
        options: shuffledOptions,
        difficulty: word.difficulty,
        category: word.category,
      };
    });
  });

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>(
    Array(quizQuestions.length).fill(null)
  );
  const [detailedAnswers, setDetailedAnswers] = useState<QuizAnswer[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);

  const currentQuiz = quizQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === quizQuestions.length - 1;

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentQuiz.correctAnswer;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = isCorrect;
    setAnswers(newAnswers);

    // Store detailed answer for analysis
    setDetailedAnswers([
      ...detailedAnswers,
      {
        isCorrect,
        selectedAnswer: answer,
        correctAnswer: currentQuiz.correctAnswer,
        word: currentQuiz.word,
      },
    ]);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      completeQuiz();
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const completeQuiz = () => {
    const correctCount = answers.filter((a) => a === true).length;
    const score = Math.round((correctCount / quizQuestions.length) * 100);

    // Calculate performance metrics
    let missedLowFreq = 0;
    let similarChoiceErrors = 0;

    detailedAnswers.forEach((answer, index) => {
      const question = quizQuestions[index];

      // Count missed low-frequency words
      if (!answer.isCorrect && isLowFrequencyWord(question.word)) {
        missedLowFreq++;
      }

      // Count similar choice errors (chose option with similar spelling/meaning)
      if (!answer.isCorrect) {
        const allWords = vocabularyData;
        const selectedWord = allWords.find(
          (w) => w.meaning === answer.selectedAnswer
        );
        const correctWord = allWords.find(
          (w) => w.meaning === answer.correctAnswer
        );

        if (
          selectedWord &&
          correctWord &&
          areSimilarWords(selectedWord.word, correctWord.word)
        ) {
          similarChoiceErrors++;
        }
      }
    });

    // Get current difficulty
    const history = getPerformanceHistory("vocabulary", "quiz");
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
    addPerformanceMetrics("vocabulary", "quiz", metrics);

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

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswers(Array(quizQuestions.length).fill(null));
    setDetailedAnswers([]);
    setShowCompletion(false);
    window.location.reload();
  };

  return (
    <div className="h-screen bg-purple-50 overflow-auto flex flex-col scrollbar-purple">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-purple-200">
        <Link
          href="/vocabulary"
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-purple-900">
            Multiple Choice Quiz
          </h1>
        </div>

        <button
          onClick={resetQuiz}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-700 font-semibold text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-4 md:px-8 py-6 space-y-8 max-w-4xl mx-auto w-full">
        <QuizProgress
          currentQuestion={currentQuestion}
          totalQuestions={quizQuestions.length}
          answers={answers}
        />

        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <QuizQuestion
            questionNumber={currentQuestion + 1}
            totalQuestions={quizQuestions.length}
            word={currentQuiz.word}
            options={currentQuiz.options}
            correctAnswer={currentQuiz.correctAnswer}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={handleSelectAnswer}
            showResult={showResult}
          />
        </motion.div>

        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors"
            >
              {isLastQuestion ? "Finish Quiz" : "Next Question"}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}

        <div className="text-center text-xs text-purple-600">
          💡 Select the correct meaning for each word
        </div>
      </div>

      <QuizCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (answers.filter((a) => a === true).length / quizQuestions.length) *
            100
        )}
        correctCount={answers.filter((a) => a === true).length}
        totalQuestions={quizQuestions.length}
        onClose={() => setShowCompletion(false)}
      />
    </div>
  );
}
