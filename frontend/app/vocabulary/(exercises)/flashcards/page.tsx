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
import { isLowFrequencyWord } from "@/utils/PerformanceTracker";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";
import {
  getVocabularyExercises,
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
  const { updateProgress } = useVocabularyProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();

  const [sessionWords, setSessionWords] = useState<FlashcardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStates, setCardStates] = useState<CardState[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session words from AI service
  useEffect(() => {
    async function loadExercises() {
      try {
        setIsLoading(true);
        const [vocabExercises, lexiconData] = await Promise.all([
          getVocabularyExercises(),
          getLexiconData(),
        ]);

        console.log("📚 Vocabulary Exercises:", vocabExercises.slice(0, 2));
        console.log("📖 Lexicon Data:", lexiconData.slice(0, 2));

        // Create a lookup map for faster searching
        const lexiconMap = new Map(
          lexiconData.map((item: LexiconItem) => [item.lemma_id, item])
        );

        // Combine vocabulary exercises with lexicon data
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
          .filter((item): item is FlashcardData => item !== null); // Remove null entries

        console.log("✅ Combined Data Sample:", combinedData.slice(0, 2));

        if (combinedData.length === 0) {
          throw new Error("No valid flashcard data available");
        }

        // Shuffle and select words for session
        const shuffled = combinedData.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(15, shuffled.length));

        setSessionWords(selected);
        setCardStates(
          selected.map((word) => ({
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
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-orange-600 font-semibold">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
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
      <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-purple-50">
        <div className="flex-shrink-0 flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-purple-200">
          <Link
            href="/vocabulary"
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Vocabulary
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">No flashcards available.</p>
        </div>
      </div>
    );
  }

  const currentCardState = cardStates.find((c) => c.id === currentWord.id);

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
    setCardStates((prev) =>
      prev.map((card) =>
        card.id === currentWord.id ? { ...card, flips: card.flips + 1 } : card
      )
    );
  };

  const moveToNextCard = () => {
    setIsFlipped(false);
    if (currentIndex < sessionWords.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowCompletion(true);
    }
  };

  const handleKnowIt = async () => {
    // Update local card state
    setCardStates((prev) =>
      prev.map((card) =>
        card.id === currentWord.id
          ? { ...card, status: "mastered" as CardStatus }
          : card
      )
    );

    // Optional: update local learning progress (for dashboard)
    updateProgress("flashcards", {
      lastScore: 100,
      status: "completed",
    });

    // --- NEW: send performance event to backend ---
    // For flashcards, we treat clicking "I know this" as a correct recall.
    try {
      await reportLexicalItemPerformance({
        module: "vocabulary",
        exerciseType: "flashcards",
        lemmaId: currentWord.lemma_id,
        correctAnswer: currentWord.word,
        userAnswer: currentWord.word, // they successfully recalled it
        difficultyShown: "easy", // UI-level difficulty; learned difficulty is computed on backend
        score: 100,
      });
    } catch (e) {
      console.error("Failed to record 'know it' event", e);
    }

    moveToNextCard();
  };

  const handleStillLearning = async () => {
    // Update local card state
    setCardStates((prev) =>
      prev.map((card) =>
        card.id === currentWord.id
          ? { ...card, status: "learning" as CardStatus }
          : card
      )
    );

    updateProgress("flashcards", {
      lastScore: 0,
      status: "available",
    });

    // --- NEW: send performance event to backend ---
    // "Still learning" is effectively an incorrect recall for now.
    try {
      await reportLexicalItemPerformance({
        module: "vocabulary",
        exerciseType: "flashcards",
        lemmaId: currentWord.lemma_id,
        correctAnswer: currentWord.word,
        userAnswer: "", // effectively "I don't know"
        difficultyShown: "easy", // UI-level difficulty
        score: 0,
      });
    } catch (e) {
      console.error("Failed to record 'still learning' event", e);
    }

    moveToNextCard();
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowCompletion(false);
    setCardStates(
      sessionWords.map((word) => ({
        id: word.id,
        status: "unseen" as CardStatus,
        flips: 0,
      }))
    );
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-purple-50">
      {/* Top Bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-purple-200">
        <Link
          href="/vocabulary"
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vocabulary
        </Link>
        <button
          onClick={resetSession}
          className="inline-flex items-center gap-2 text-purple-700 hover:text-purple-900 text-xs font-semibold border border-purple-200 rounded-full px-3 py-1 bg-purple-50"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Session
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row items-stretch max-w-5xl mx-auto w-full px-4 md:px-8 py-4 gap-4">
        {/* Flashcard Area */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentWord.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md"
            >
              <Flashcard
                word={currentWord.word}
                meaning={currentWord.meaning}
                example={currentWord.example}
                isFlipped={isFlipped}
                onFlip={handleFlip}
              />
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleStillLearning}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-purple-700 border border-purple-200 hover:bg-purple-50 text-sm font-semibold shadow-sm"
            >
              <X className="w-4 h-4" />
              Still learning
            </button>
            <button
              onClick={handleKnowIt}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 text-white hover:bg-purple-700 text-sm font-semibold shadow-md"
            >
              <CheckCircle className="w-4 h-4" />I know this
            </button>
          </div>
        </div>

        {/* Progress Sidebar */}
        <div className="w-full md:w-72 flex-shrink-0">
          <FlashcardProgress
            cards={sessionWords}
            cardStates={cardStates}
            currentIndex={currentIndex}
          />
        </div>
      </div>

      {/* Completion Modal */}
      <FlashcardCompletionModal
        isOpen={showCompletion}
        onClose={() => setShowCompletion(false)}
        onRestart={resetSession}
      />
    </div>
  );
}
