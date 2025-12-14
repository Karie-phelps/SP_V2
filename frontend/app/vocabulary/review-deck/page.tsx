"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, RotateCcw, X, Trash2 } from "lucide-react";
import Link from "next/link";
import Flashcard from "@/components/vocabulary/flashcard-exercise/Flashcard";
import FlashcardProgress from "@/components/vocabulary/flashcard-exercise/FlashcardProgress";
import { useReviewDeck } from "@/contexts/ReviewDeckProvider";
import { vocabularyData } from "@/data/vocabulary-dataset";

type CardStatus = "unseen" | "learning" | "mastered";

interface CardState {
  id: number;
  status: CardStatus;
  flips: number;
}

export default function ReviewDeckPage() {
  const { reviewDeck, removeFromReviewDeck, clearReviewDeck } = useReviewDeck();

  // Get words from review deck
  const reviewWords = vocabularyData.filter((word) =>
    reviewDeck.includes(word.id)
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStates, setCardStates] = useState<CardState[]>(
    reviewWords.map((word) => ({ id: word.id, status: "unseen", flips: 0 }))
  );

  if (reviewWords.length === 0) {
    return (
      <div className="h-screen bg-blue-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-blue-200">
          <Link
            href="/vocabulary"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-blue-900">
            Review Deck
          </h1>
          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <div className="text-6xl">📚</div>
            <h2 className="text-2xl font-bold text-gray-700">
              Your Review Deck is Empty
            </h2>
            <p className="text-gray-600">
              Add words from exercises to review them later!
            </p>
            <Link
              href="/vocabulary"
              className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Go to Exercises
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentWord = reviewWords[currentIndex];
  const masteredCount = cardStates.filter(
    (c) => c.status === "mastered"
  ).length;
  const learningCount = cardStates.filter(
    (c) => c.status === "learning"
  ).length;
  const isLastCard = currentIndex === reviewWords.length - 1;

  const handleFlip = () => {
    const newStates = [...cardStates];
    newStates[currentIndex].flips++;
    setCardStates(newStates);
    setIsFlipped(!isFlipped);
  };

  const handleKnowIt = () => {
    const newStates = [...cardStates];
    newStates[currentIndex].status = "mastered";
    setCardStates(newStates);
    removeFromReviewDeck(currentWord.id);
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
      setCurrentIndex(0);
      setIsFlipped(false);
    } else {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 300);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardStates(
      reviewWords.map((word) => ({ id: word.id, status: "unseen", flips: 0 }))
    );
  };

  const handleClearAll = () => {
    if (
      confirm("Are you sure you want to clear all cards from the review deck?")
    ) {
      clearReviewDeck();
    }
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
        <h1 className="text-xl md:text-2xl font-bold text-blue-900">
          Review Deck ({reviewWords.length} cards)
        </h1>
        <div className="w-20" />
      </div>

      <div className="flex gap-2">
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold text-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline">Clear All</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-700 font-semibold text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-4 md:px-8 py-6 space-y-6 max-w-4xl mx-auto w-full">
        <FlashcardProgress
          current={currentIndex}
          total={reviewWords.length}
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
                wordId={currentWord.id}
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
            <span>Mastered (Remove)</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
