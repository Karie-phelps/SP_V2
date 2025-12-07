"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import Flashcard from "@/components/flashcard-exercise/Flashcard";
import FlashcardProgress from "@/components/flashcard-exercise/FlashcardProgress";
import FlashcardCompletionModal from "@/components/flashcard-exercise/FlashcardCompletionModal";
import { useVocabularyProgress } from "@/hooks/useVocabularyProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import { vocabularyData } from "@/data/vocabulary-dataset";
import { isLowFrequencyWord } from "@/utils/PerformanceTracker";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";

type CardStatus = "unseen" | "learning" | "mastered";

interface CardState {
  id: number;
  status: CardStatus;
  flips: number; // Track flips
}

export default function FlashcardsPage() {
  const { updateProgress } = useVocabularyProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();

  const [sessionWords] = useState(() => {
    const shuffled = [...vocabularyData].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 15);
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStates, setCardStates] = useState<CardState[]>(
    sessionWords.map((word) => ({ id: word.id, status: "unseen", flips: 0 }))
  );
  const [showCompletion, setShowCompletion] = useState(false);

  const currentWord = sessionWords[currentIndex];
  const masteredCount = cardStates.filter(
    (c) => c.status === "mastered"
  ).length;
  const learningCount = cardStates.filter(
    (c) => c.status === "learning"
  ).length;
  const isLastCard = currentIndex === sessionWords.length - 1;

  const handleFlip = () => {
    // Track flips
    const newStates = [...cardStates];
    newStates[currentIndex].flips++;
    setCardStates(newStates);
    setIsFlipped(!isFlipped);
  };

  const handleKnowIt = () => {
    const newStates = [...cardStates];
    newStates[currentIndex].status = "mastered";
    setCardStates(newStates);
    nextCard();
  };

  const handleStillLearning = () => {
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

    // Calculate performance metrics
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

    // Get current difficulty
    const history = getPerformanceHistory("vocabulary", "flashcards");
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
    addPerformanceMetrics("vocabulary", "flashcards", metrics);

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

  const resetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardStates(
      sessionWords.map((word) => ({ id: word.id, status: "unseen", flips: 0 }))
    );
    setShowCompletion(false);
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
            Flashcards Practice
          </h1>
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
      <div className="flex-1 flex flex-col justify-center px-4 md:px-8 py-6 space-y-6 max-w-4xl mx-auto w-full">
        <FlashcardProgress
          current={currentIndex}
          total={sessionWords.length}
          masteredCount={masteredCount}
          learningCount={learningCount}
        />

        <div className="flex justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="w-full"
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
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-2xl mx-auto w-full">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStillLearning}
            className="flex items-center justify-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold py-4 px-8 rounded-xl shadow-lg transition-colors border-2 border-orange-300 flex-1"
          >
            <X className="w-5 h-5" />
            <span>Still Learning</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleKnowIt}
            className="flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 font-bold py-4 px-8 rounded-xl shadow-lg transition-colors border-2 border-green-300 flex-1"
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
