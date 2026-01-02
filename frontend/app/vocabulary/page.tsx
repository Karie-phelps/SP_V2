"use client";

import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import VocabularyCard from "@/components/VocabularyCard";
import ProgressStepper from "./_progress/ProgressStepper";
import { useVocabularyProgress } from "@/hooks/useVocabularyProgress";
import { useReviewDeck } from "@/contexts/ReviewDeckProvider";

export default function VocabularyPage() {
  const { getVocabularyMastery } = useVocabularyProgress();
  const { reviewDeck } = useReviewDeck();
  const mastery = getVocabularyMastery();

  const masteryColors = {
    beginner: "bg-gray-100 text-gray-700 border-gray-300",
    developing: "bg-blue-100 text-blue-700 border-blue-300",
    proficient: "bg-blue-100 text-blue-700 border-blue-300",
    advanced: "bg-orange-100 text-orange-700 border-orange-300",
    master: "bg-yellow-100 text-yellow-700 border-yellow-400",
  };

  return (
    <div className="w-full min-h-screen flex items-start justify-center py-4 px-6 md:p-7 bg-gray-50">
      <div className="w-full md:max-w-7xl">
        {/* Top Bar - Back Button & Mastery Display */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          {/* Back Button - Left */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Mastery Display - Right */}
          <div className="flex flex-col items-end gap-2">
            <div
              className={`flex items-center gap-3 px-4 py-2 rounded-full border-2 shadow-sm ${
                masteryColors[mastery.level]
              }`}
            >
              <span className="text-xl">{mastery.icon}</span>
              <div className="text-left">
                <p className="text-xs font-medium opacity-75">
                  Vocabulary Mastery
                </p>
                <p className="text-base font-bold capitalize">
                  {mastery.level}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 text-right max-w-xs">
              {mastery.description} • Focus:{" "}
              <span className="font-semibold capitalize">
                {mastery.difficulty}
              </span>
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-2 text-center">
            Vocabulary Activities
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Build mastery through continuous practice
          </p>

          {/* Progress Stepper */}
          <ProgressStepper />

          {/* Review Deck Link */}
          {/* {reviewDeck.length > 0 && (
                <div className="flex justify-center mt-6">
              <Link
                href="/vocabulary/review-deck"
                className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all hover:scale-105"
              >
                <BookOpen className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm opacity-90">Review Deck</p>
                  <p className="text-xs opacity-75">
                    {reviewDeck.length} card{reviewDeck.length !== 1 ? "s" : ""}{" "}
                    to review
                  </p>
                </div>
              </Link>
            </div>
          )} */}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <VocabularyCard
            name="Flashcards"
            description="Practice with interactive flashcards"
            imagePath="/art/card1.png"
            color="bg-yellow-50"
            url="/vocabulary/flashcards"
            exerciseType="flashcards"
          />
          <VocabularyCard
            name="Multiple Choice Quiz"
            description="Test your knowledge with quizzes"
            imagePath="/art/card2.png"
            color="bg-blue-50"
            url="/vocabulary/what-is-its-closest-meaning"
            exerciseType="quiz"
          />
          <VocabularyCard
            name="Fill-in-the-Blanks"
            description="Complete sentences with correct words"
            imagePath="/art/card3.png"
            color="bg-green-50"
            url="/vocabulary/antonym-of-the-word"
            exerciseType="fill-blanks"
          />
        </div>
      </div>
    </div>
  );
}
