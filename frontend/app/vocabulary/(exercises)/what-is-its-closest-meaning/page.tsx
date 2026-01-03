"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight, Lightbulb } from "lucide-react";
import Link from "next/link";
import QuizQuestion from "@/components/vocabulary/closest-meaning-exercise/QuizQuestion";
import QuizProgress from "@/components/vocabulary/closest-meaning-exercise/QuizProgress";
import QuizCompletionModal from "@/components/vocabulary/closest-meaning-exercise/QuizCompletionModal";
import { useVocabularyProgress } from "@/hooks/useVocabularyProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import {
  getVocabularyExercises,
  getLexiconData,
  type VocabularyExerciseItem,
  type LexiconItem,
} from "@/lib/api/exercises";
import {
  isLowFrequencyWord,
  areSimilarWords,
} from "@/utils/PerformanceTracker";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";
import { reportLexicalItemPerformance } from "@/utils/reportPerformance";

interface QuizItem {
  id: string;
  lemma_id: string;
  sentence: string;
  underlinedWord: string;
  correctAnswer: string;
  options: string[];
}

interface QuizAnswer {
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  word: string;
}

// Helper function to underline a word in a sentence (FIXED VERSION)
function underlineWordInSentence(
  sentence: string,
  wordToUnderline: string
): string {
  const escapedWord = wordToUnderline.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `(?<=\\s|^)(${escapedWord})(?=\\s|$|[.,!?;:])`,
    "gi"
  );
  return sentence.replace(regex, "<u>$1</u>");
}

// Generate quiz questions from AI service data
async function generateQuizQuestionsFromService(): Promise<QuizItem[]> {
  const [vocabExercises, lexiconData] = await Promise.all([
    getVocabularyExercises(),
    getLexiconData(),
  ]);

  const lexiconMap = new Map(
    lexiconData.map((item: LexiconItem) => [item.lemma_id, item])
  );

  console.log("📚 Vocab Exercises:", vocabExercises.length);
  console.log("📖 Lexicon Data:", lexiconData.length);

  const quizItems: QuizItem[] = vocabExercises
    .map((vocabItem: VocabularyExerciseItem) => {
      const lexiconEntry = lexiconMap.get(vocabItem.lemma_id);
      if (!lexiconEntry) {
        console.warn(`⚠️ No lexicon entry for: ${vocabItem.lemma_id}`);
        return null;
      }

      const sentence =
        vocabItem.sentence_example_1 || vocabItem.sentence_example_2;
      if (!sentence) {
        console.warn(`⚠️ No sentence for: ${vocabItem.lemma_id}`);
        return null;
      }

      const wordsToConsider = [
        lexiconEntry.lemma,
        ...(lexiconEntry.surface_forms || []),
      ];

      let underlinedWord = lexiconEntry.lemma;
      for (const word of wordsToConsider) {
        const lowerSentence = sentence.toLowerCase();
        const lowerWord = word.toLowerCase();
        const wordRegex = new RegExp(`\\b${lowerWord}\\b`, "i");
        if (wordRegex.test(lowerSentence)) {
          underlinedWord = word;
          break;
        }
      }

      const useDefinitions = Math.random() > 0.5;

      let correctAnswer: string;
      let distractors: string[] = [];

      if (useDefinitions) {
        // Option set: base definitions
        correctAnswer = lexiconEntry.base_definition;

        const otherLexicons = lexiconData.filter(
          (lex: LexiconItem) => lex.lemma_id !== vocabItem.lemma_id
        );
        const shuffled = otherLexicons.sort(() => Math.random() - 0.5);
        distractors = shuffled
          .slice(0, 3)
          .map((lex: LexiconItem) => lex.base_definition);
      } else {
        // Option set: synonyms, if available
        const synonyms = lexiconEntry.relations?.synonyms || [];
        if (synonyms.length > 0) {
          correctAnswer = synonyms[0];

          const otherSynonyms: string[] = [];
          lexiconData.forEach((lex: LexiconItem) => {
            if (
              lex.lemma_id !== vocabItem.lemma_id &&
              lex.relations?.synonyms
            ) {
              otherSynonyms.push(...lex.relations.synonyms);
            }
          });

          const shuffledSynonyms = otherSynonyms.sort(
            () => Math.random() - 0.5
          );
          distractors = shuffledSynonyms.slice(0, 3);
        } else {
          // Fallback to definitions
          correctAnswer = lexiconEntry.base_definition;
          const otherLexicons = lexiconData.filter(
            (lex: LexiconItem) => lex.lemma_id !== vocabItem.lemma_id
          );
          const shuffled = otherLexicons.sort(() => Math.random() - 0.5);
          distractors = shuffled
            .slice(0, 3)
            .map((lex: LexiconItem) => lex.base_definition);
        }
      }

      const allOptions = [correctAnswer, ...distractors].sort(
        () => Math.random() - 0.5
      );

      const underlinedSentence = underlineWordInSentence(
        sentence,
        underlinedWord
      );

      return {
        id: vocabItem.item_id,
        lemma_id: vocabItem.lemma_id,
        sentence: underlinedSentence,
        underlinedWord,
        correctAnswer,
        options: allOptions,
      };
    })
    .filter((item): item is QuizItem => item !== null);

  // Shuffle & limit
  const shuffled = quizItems.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(15, shuffled.length));
}

export default function ClosestMeaningQuizPage() {
  const { updateProgress } = useVocabularyProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();

  const [questions, setQuestions] = useState<QuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<QuizAnswer | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load quiz items
  useEffect(() => {
    async function loadQuiz() {
      try {
        setIsLoading(true);
        const qs = await generateQuizQuestionsFromService();
        if (qs.length === 0) {
          throw new Error("No quiz items available");
        }
        setQuestions(qs);
      } catch (err) {
        console.error("Failed to load quiz items:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load quiz items. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadQuiz();
  }, []);

  const currentQuestion = questions[currentIndex];

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setCurrentAnswer(null);
    setAnswers([]);
    setShowCompletion(false);
  };

  const handleSubmit = async () => {
    if (!currentQuestion || !selectedAnswer || submitting) return;
    setSubmitting(true);

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    const answer: QuizAnswer = {
      isCorrect,
      selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      word: currentQuestion.underlinedWord,
    };

    // Local state
    setCurrentAnswer(answer);
    setAnswers((prev) => [...prev, answer]);

    // Compute error pattern features for this *question-level* (optional)
    const lowFreq = isLowFrequencyWord(currentQuestion.underlinedWord);
    const similarChoiceError =
      !isCorrect &&
      currentQuestion.options.some((opt) =>
        areSimilarWords(opt, currentQuestion.correctAnswer)
      );

    // Simple per-question score
    const score = isCorrect ? 100 : 0;

    // --- NEW: send item-level performance event for adaptivity ---
    try {
      await reportLexicalItemPerformance({
        module: "vocabulary",
        exerciseType: "quiz",
        lemmaId: currentQuestion.lemma_id,
        correctAnswer: currentQuestion.correctAnswer,
        userAnswer: selectedAnswer,
        difficultyShown: "medium", // UI difficulty; true difficulty is computed on backend
        score,
      });
    } catch (e) {
      console.error("Failed to record lexical performance", e);
    }

    // Update LearningProgressContext (session-level metrics)
    addPerformanceMetrics("vocabulary", "quiz", {
      score,
      difficulty: "medium",
      missedLowFreq: !isCorrect && lowFreq ? 1 : 0,
      similarChoiceErrors: similarChoiceError ? 1 : 0,
    });

    // Use your rule-based adaptive engine over full history
    const history = getPerformanceHistory("vocabulary", "quiz");
    const { nextDifficulty, tags } = evaluateUserPerformance(history);

    // Update difficulty / status in vocabulary progress
    updateProgress("quiz", {
      lastScore: score,
      lastDifficulty: nextDifficulty,
      status: score >= 80 ? "completed" : "available",
    });

    console.log("Adaptive tags:", tags);

    setSubmitting(false);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setCurrentAnswer(null);
    } else {
      setShowCompletion(true);
    }
  };

  // Loading & error states
  if (isLoading) {
    return (
      <div className="h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-blue-600 font-semibold">
            Loading closest-meaning quiz...
          </p>
        </div>
      </div>
    );
  }

  if (error || !currentQuestion) {
    return (
      <div className="h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-red-600 font-semibold mb-4">
            {error || "No quiz items available."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-blue-50">
      {/* Top Bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-blue-200">
        <Link
          href="/vocabulary"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vocabulary
        </Link>
        <button
          onClick={resetQuiz}
          className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-900 text-xs font-semibold border border-blue-200 rounded-full px-3 py-1 bg-blue-50"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Quiz
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row items-stretch max-w-5xl mx-auto w-full px-4 md:px-8 py-4 gap-4">
        {/* Question Area */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-2xl"
            >
              <QuizQuestion
                sentence={currentQuestion.sentence}
                options={currentQuestion.options}
                selectedAnswer={selectedAnswer}
                onSelectAnswer={setSelectedAnswer}
                currentAnswer={currentAnswer}
              />
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer || submitting || !!currentAnswer}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lightbulb className="w-4 h-4" />
              Check answer
            </button>
            <button
              onClick={handleNext}
              disabled={!currentAnswer}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
              Next question
            </button>
          </div>
        </div>

        {/* Progress Sidebar */}
        <div className="w-full md:w-72 flex-shrink-0">
          <QuizProgress
            total={questions.length}
            currentIndex={currentIndex}
            answers={answers}
          />
        </div>
      </div>

      {/* Completion Modal */}
      <QuizCompletionModal
        isOpen={showCompletion}
        onClose={() => setShowCompletion(false)}
        onRestart={resetQuiz}
        totalQuestions={questions.length}
        correctCount={answers.filter((a) => a.isCorrect).length}
      />
    </div>
  );
}
