"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import Flashcard from "@/components/vocabulary/flashcard-exercise/Flashcard";
import FlashcardProgress from "@/components/vocabulary/flashcard-exercise/FlashcardProgress";
import FlashcardCompletionModal from "@/components/vocabulary/flashcard-exercise/FlashcardCompletionModal";
import { useVocabularyProgress } from "@/hooks/useVocabularyProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import { useAuth } from "@/contexts/AuthContext";
import { isLowFrequencyWord } from "@/utils/PerformanceTracker";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";
import {
  getVocabularyExercisesAdaptive,
  getLexiconData,
  VocabularyExerciseItem,
  LexiconItem,
} from "@/lib/api/exercises";
import { reportLexicalItemPerformance } from "@/utils/reportPerformance";

type CardStatus = "unseen" | "learning" | "mastered";

interface FlashcardData {
  id: string;
  lemma_id: string;
  word: string;
  meaning: string;
  example: string;
}

interface CardState {
  id: string;
  status: CardStatus;
  flips: number;
}

export default function FlashcardsPage() {
  const { updateProgress, getExerciseProgress } = useVocabularyProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();
  const { user, tokens } = useAuth();

  const [sessionWords, setSessionWords] = useState<FlashcardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStates, setCardStates] = useState<CardState[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<
    "easy" | "medium" | "hard"
  >("easy");

  // ✅ Initialize session words with adaptive difficulty
  useEffect(() => {
    async function loadExercises() {
      try {
        setIsLoading(true);

        // ✅ 1. Get performance history and current progress
        const performanceHistory = getPerformanceHistory(
          "vocabulary",
          "flashcards"
        );
        const exerciseProgress = getExerciseProgress("flashcards");

        console.log("📊 Performance History:", performanceHistory);
        console.log("📈 Exercise Progress:", exerciseProgress);

        // ✅ 2. Determine target difficulty for THIS session
        let targetDifficulty: "easy" | "medium" | "hard" = "easy";

        if (performanceHistory.length > 0) {
          // Use evaluateUserPerformance to determine next difficulty
          const evaluation = evaluateUserPerformance(performanceHistory);
          targetDifficulty = evaluation.nextDifficulty;
          console.log(
            "🎯 Evaluated Target Difficulty:",
            targetDifficulty,
            "| Tags:",
            evaluation.tags
          );
        } else {
          // First session - use lastDifficulty from progress or default to easy
          targetDifficulty = exerciseProgress.lastDifficulty || "easy";
          console.log("🆕 First Session - Using difficulty:", targetDifficulty);
        }

        setCurrentDifficulty(targetDifficulty);

        // ✅ 3. Fetch adaptive vocabulary exercises
        console.log(
          "🔄 Fetching adaptive exercises with difficulty:",
          targetDifficulty
        );

        const [vocabExercises, lexiconData] = await Promise.all([
          getVocabularyExercisesAdaptive({
            userId: user?.id,
            targetDifficulty,
            limit: 15,
            accessToken: tokens?.access,
          }),
          getLexiconData(),
        ]);

        console.log("📚 Adaptive Vocabulary Exercises:", vocabExercises.length);
        console.log("📖 Lexicon Data:", lexiconData.length);

        // ✅ 4. Create a lookup map for faster searching
        const lexiconMap = new Map(
          lexiconData.map((item: LexiconItem) => [item.lemma_id, item])
        );

        // ✅ 5. Combine vocabulary exercises with lexicon data
        const combinedData: FlashcardData[] = vocabExercises
          .map((vocabItem: VocabularyExerciseItem) => {
            const lexiconEntry = lexiconMap.get(vocabItem.lemma_id);

            if (!lexiconEntry) {
              console.warn(
                `⚠️ No lexicon entry found for lemma_id: ${vocabItem.lemma_id}`
              );
              return null;
            }

            return {
              id: vocabItem.item_id,
              lemma_id: vocabItem.lemma_id,
              word: lexiconEntry.lemma,
              meaning: lexiconEntry.base_definition,
              example:
                vocabItem.sentence_example_1 ||
                vocabItem.sentence_example_2 ||
                "No example available",
            };
          })
          .filter((item): item is FlashcardData => item !== null);

        console.log(
          "✅ Combined Data:",
          combinedData.length,
          "flashcards loaded"
        );

        if (combinedData.length === 0) {
          throw new Error(
            "No valid flashcard data available for this difficulty"
          );
        }

        setSessionWords(combinedData);
        setCardStates(
          combinedData.map((word) => ({
            id: word.id,
            status: "unseen" as CardStatus,
            flips: 0,
          }))
        );
        setError(null);
      } catch (err) {
        console.error("❌ Failed to load exercises:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load exercises. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadExercises();
  }, [user?.id, tokens?.access]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-semibold">
            Loading adaptive flashcards...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Difficulty: {currentDifficulty}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
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

  const currentWord = sessionWords[currentIndex];

  // Additional safety check
  if (!currentWord) {
    return (
      <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-blue-50">
        <div className="flex-shrink-0 flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-blue-200">
          <Link
            href="/vocabulary"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-blue-900">
              Flashcards Practice
            </h1>
          </div>
          <div className="w-20"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-blue-600">Loading session...</div>
        </div>
      </div>
    );
  }

  const masteredCount = cardStates.filter(
    (c) => c.status === "mastered"
  ).length;
  const learningCount = cardStates.filter(
    (c) => c.status === "learning"
  ).length;
  const isLastCard = currentIndex === sessionWords.length - 1;

  const handleFlip = () => {
    const newStates = [...cardStates];
    newStates[currentIndex].flips++;
    setCardStates(newStates);
    setIsFlipped(!isFlipped);
  };

  const handleKnowIt = async () => {
    // ✅ Report lexical performance when user knows the word
    await reportLexicalItemPerformance({
      module: "vocabulary",
      exerciseType: "flashcards",
      lemmaId: currentWord.lemma_id,
      correctAnswer: currentWord.word,
      userAnswer: currentWord.word, // User indicated they know it
      difficultyShown: currentDifficulty,
      score: 100, // Perfect score for "I Know This"
    });

    const newStates = [...cardStates];
    newStates[currentIndex].status = "mastered";
    setCardStates(newStates);
    nextCard();
  };

  const handleStillLearning = async () => {
    // ✅ Report lexical performance when user is still learning
    await reportLexicalItemPerformance({
      module: "vocabulary",
      exerciseType: "flashcards",
      lemmaId: currentWord.lemma_id,
      correctAnswer: currentWord.word,
      userAnswer: "", // User doesn't know it yet
      difficultyShown: currentDifficulty,
      score: 0, // Zero score for still learning
    });

    const newStates = [...cardStates];
    if (newStates[currentIndex].status === "unseen") {
      newStates[currentIndex].status = "learning";
    }
    setCardStates(newStates);
    nextCard();
  };

  const nextCard = () => {
    if (isLastCard) {
      completeSession();
    } else {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 300);
    }
  };

  const completeSession = () => {
    const score = Math.round((masteredCount / sessionWords.length) * 100);

    // ✅ Calculate performance metrics
    let missedLowFreq = 0;
    let similarChoiceErrors = 0;

    cardStates.forEach((state, index) => {
      const word = sessionWords[index];

      // Count missed low-frequency words
      if (state.status !== "mastered" && isLowFrequencyWord(word.word)) {
        missedLowFreq++;
      }

      // Count cards flipped multiple times (struggling)
      if (state.flips > 2) {
        similarChoiceErrors++;
      }
    });

    // ✅ Create performance metrics with CURRENT session difficulty
    const metrics = {
      difficulty: currentDifficulty,
      score,
      missedLowFreq,
      similarChoiceErrors,
      timestamp: new Date().toISOString(),
    };

    console.log("📊 Session Completed - Metrics:", metrics);

    // ✅ Add to performance history
    addPerformanceMetrics("vocabulary", "flashcards", metrics);

    // ✅ Get updated history and evaluate for NEXT session
    const history = getPerformanceHistory("vocabulary", "flashcards");
    const allHistory = [...history, metrics];
    const evaluation = evaluateUserPerformance(allHistory);

    console.log(
      "🎯 Next Session Difficulty:",
      evaluation.nextDifficulty,
      "| Error Tags:",
      evaluation.tags
    );

    // ✅ Update progress with evaluation results
    updateProgress("flashcards", {
      status: "completed",
      score,
      completedAt: new Date().toISOString(),
      attempts: (history.length || 0) + 1,
      lastDifficulty: evaluation.nextDifficulty, // This will be used next time
      errorTags: evaluation.tags,
    });

    setShowCompletion(true);
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardStates(
      sessionWords.map((word) => ({
        id: word.id,
        status: "unseen" as CardStatus,
        flips: 0,
      }))
    );
    setShowCompletion(false);
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-blue-50">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-blue-200">
        <Link
          href="/vocabulary"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-blue-900">
            Flashcards Practice
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Difficulty:{" "}
            <span className="font-semibold capitalize">
              {currentDifficulty}
            </span>
          </p>
        </div>

        <button
          onClick={resetSession}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-700 font-semibold text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-4 md:px-8 py-4 md:py-6 gap-3 md:gap-4 max-w-4xl mx-auto w-full min-h-0 overflow-y-auto scrollbar-blue md:overflow-hidden">
        {/* Progress - Fixed Height */}
        <div className="flex-shrink-0">
          <FlashcardProgress
            current={currentIndex}
            total={sessionWords.length}
            masteredCount={masteredCount}
            learningCount={learningCount}
            wordId={currentWord.lemma_id}
          />
        </div>

        {/* Flashcard - Responsive Height */}
        <div className="flex-shrink-0 md:flex-1 flex items-center justify-center md:min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full flex items-center justify-center"
            >
              <Flashcard
                word={currentWord.word}
                meaning={currentWord.meaning}
                example={currentWord.example}
                isFlipped={isFlipped}
                onFlip={handleFlip}
                wordId={currentWord.lemma_id}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Buttons - Fixed Height */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-2xl mx-auto w-full">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStillLearning}
            className="flex items-center justify-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold py-3 px-8 rounded-xl shadow-lg transition-colors border-2 border-orange-300 flex-1"
          >
            <X className="w-5 h-5" />
            <span>Still Learning</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleKnowIt}
            className="flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 font-bold py-3 px-8 rounded-xl shadow-lg transition-colors border-2 border-green-300 flex-1"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{isLastCard ? "Finish" : "I Know This"}</span>
          </motion.button>
        </div>
      </div>

      <FlashcardCompletionModal
        isOpen={showCompletion}
        score={Math.round((masteredCount / sessionWords.length) * 100)}
        masteredCount={masteredCount}
        totalCards={sessionWords.length}
        onClose={() => setShowCompletion(false)}
      />
    </div>
  );
}
