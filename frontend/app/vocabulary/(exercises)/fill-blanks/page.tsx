"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight, Lightbulb } from "lucide-react";
import Link from "next/link";
import FillBlanksQuestion from "@/components/fillblanks-exercise/FillBlanksQuestion";
import FillBlanksProgress from "@/components/fillblanks-exercise/FillBlanksProgress";
import FillBlanksCompletionModal from "@/components/fillblanks-exercise/FillBlanksCompletionModal";
import { useVocabularyProgress } from "@/hooks/useVocabularyProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import { vocabularyData } from "@/data/vocabulary-dataset";
import {
  isLowFrequencyWord,
  isNearMiss,
  normalizeText,
  areSimilarWords,
} from "@/utils/PerformanceTracker";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";
import AIExplanation from "@/components/common/AIExplanation";

interface FillBlanksItem {
  id: number;
  word: string;
  sentence: string;
  meaning: string;
  correctAnswer: string;
}

interface FillBlanksAnswer {
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  word: string;
  isNearMiss: boolean;
  showedAnswer: boolean;
}

export default function FillBlanksPage() {
  const { updateProgress } = useVocabularyProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();

  const [questions] = useState<FillBlanksItem[]>(() => {
    const shuffled = [...vocabularyData].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);

    return selected.map((word) => ({
      id: word.id,
      word: word.word,
      sentence: word.example,
      meaning: word.meaning,
      correctAnswer: word.word,
    }));
  });

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>(
    Array(questions.length).fill(null)
  );
  const [detailedAnswers, setDetailedAnswers] = useState<FillBlanksAnswer[]>(
    []
  );
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const currentItem = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const showExplanation = showResult && answers[currentQuestion] === false;

  const handleSubmit = () => {
    const normalizedUser = normalizeText(userAnswer);
    const normalizedCorrect = normalizeText(currentItem.correctAnswer);
    const isCorrect = normalizedUser === normalizedCorrect;
    const nearMiss = isNearMiss(userAnswer, currentItem.correctAnswer);

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = isCorrect;
    setAnswers(newAnswers);

    // Store detailed answer for analysis
    setDetailedAnswers([
      ...detailedAnswers,
      {
        isCorrect,
        userAnswer,
        correctAnswer: currentItem.correctAnswer,
        word: currentItem.word,
        isNearMiss: nearMiss,
        showedAnswer: answerRevealed,
      },
    ]);

    setShowResult(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      completeExercise();
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setUserAnswer("");
      setShowResult(false);
      setAnswerRevealed(false);
    }
  };

  const completeExercise = () => {
    const correctCount = answers.filter((a) => a === true).length;
    const score = Math.round((correctCount / questions.length) * 100);

    // Calculate performance metrics
    let missedLowFreq = 0;
    let similarChoiceErrors = 0;

    detailedAnswers.forEach((answer, index) => {
      const question = questions[index];

      // Count missed low-frequency words
      if (!answer.isCorrect && isLowFrequencyWord(question.word)) {
        missedLowFreq++;
      }

      // Count near-miss errors (spelling confusion)
      if (answer.isNearMiss) {
        similarChoiceErrors++;
      }

      // Count if they used "Show Answer" (indicates struggle)
      if (answer.showedAnswer) {
        similarChoiceErrors++;
      }

      // Check for similar word confusion
      if (!answer.isCorrect && answer.userAnswer) {
        const allWords = vocabularyData;
        const userWord = allWords.find(
          (w) => normalizeText(w.word) === normalizeText(answer.userAnswer)
        );
        const correctWord = allWords.find(
          (w) => normalizeText(w.word) === normalizeText(answer.correctAnswer)
        );

        if (
          userWord &&
          correctWord &&
          areSimilarWords(userWord.word, correctWord.word)
        ) {
          similarChoiceErrors++;
        }
      }
    });

    // Get current difficulty
    const history = getPerformanceHistory("vocabulary", "fill-blanks");
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
    addPerformanceMetrics("vocabulary", "fill-blanks", metrics);

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
    setCurrentQuestion(0);
    setUserAnswer("");
    setShowResult(false);
    setAnswers(Array(questions.length).fill(null));
    setDetailedAnswers([]);
    setAnswerRevealed(false);
    setShowCompletion(false);
    window.location.reload();
  };

  return (
    <div className="h-screen bg-blue-50 overflow-auto flex flex-col scrollbar-blue">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-blue-200">
        <Link
          href="/vocabulary"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-blue-900">
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
          totalQuestions={questions.length}
          answers={answers}
          id={currentItem.id}
        />

        {/* Question and Explanation Side by Side */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Fill Blanks Question - slides left on desktop when explanation appears */}
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{
              opacity: 1,
              x: 0,
              flex: showExplanation ? "0 0 42%" : "1 1 100%",
            }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <FillBlanksQuestion
              questionNumber={currentQuestion + 1}
              totalQuestions={questions.length}
              sentence={currentItem.sentence}
              blankWord={currentItem.word}
              correctAnswer={currentItem.correctAnswer}
              hint={currentItem.meaning}
              userAnswer={userAnswer}
              onAnswerChange={setUserAnswer}
              onSubmit={handleSubmit}
              showResult={showResult}
              isCorrect={answers[currentQuestion]}
              onAnswerRevealed={setAnswerRevealed}
            />
          </motion.div>

          {/* AI Explanation Panel - slides in from right */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, x: 100, width: 0 }}
                animate={{ opacity: 1, x: 0, width: "auto" }}
                exit={{ opacity: 0, x: 100, width: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full lg:flex-[0_0_55%]"
              >
                <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6 h-full space-y-4">
                  {/* Answer Comparison */}
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-2 space-y-2">
                    <div className="border-red-200 pt-2 flex flex-row items-center justify-center gap-4">
                      <p className="text-sm font-semibold text-green-900">
                        Correct Answer:
                      </p>
                      <p className="text-lg text-green-700 font-bold">
                        {currentItem.correctAnswer}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pb-3 border-b border-blue-100">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-blue-900">
                      AI Explanation
                    </h3>
                  </div>

                  {/* AI Explanation */}
                  <AIExplanation
                    mode="fill-blanks"
                    word={currentItem.word}
                    correct={currentItem.correctAnswer}
                    selected={userAnswer}
                    showProTip={false}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center pb-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors"
            >
              {isLastQuestion ? "Finish Exercise" : "Next Question"}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </div>

      <FillBlanksCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (answers.filter((a) => a === true).length / questions.length) * 100
        )}
        correctCount={answers.filter((a) => a === true).length}
        totalQuestions={questions.length}
        onClose={() => setShowCompletion(false)}
      />
    </div>
  );
}
