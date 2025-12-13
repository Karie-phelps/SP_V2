"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import GrammarCard from "@/components/GrammarCard";
import ProgressStepper from "./_progress/ProgressStepper";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";

export default function GrammarPage() {
  const { getGrammarMastery } = useGrammarProgress();
  const mastery = getGrammarMastery();

  const masteryColors = {
    beginner: "bg-gray-100 text-gray-700 border-gray-300",
    developing: "bg-blue-100 text-blue-700 border-blue-300",
    proficient: "bg-purple-100 text-purple-700 border-purple-300",
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
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold text-sm transition-colors"
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
                  Grammar Mastery
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
          <h1 className="text-3xl md:text-4xl font-bold text-green-900 mb-2 text-center">
            Grammar Activities
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Master Filipino grammar through targeted practice
          </p>

          {/* Progress Stepper */}
          <ProgressStepper />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <GrammarCard
            name="Error Identification"
            description="Identify grammatical errors in sentences"
            imagePath="/art/grammar-icon1.png"
            color="bg-red-50"
            url="/grammar/error-identification"
            exerciseType="error-identification"
          />
          <GrammarCard
            name="Sentence Correction"
            description="Choose the correctly written sentence"
            imagePath="/art/grammar-icon1.png"
            color="bg-blue-50"
            url="/grammar/sentence-correction"
            exerciseType="sentence-correction"
          />
          <GrammarCard
            name="Fill-in-the-Blanks"
            description="Complete sentences with proper grammar"
            imagePath="/art/grammar-icon1.png"
            color="bg-green-50"
            url="/grammar/fill-blanks"
            exerciseType="fill-blanks"
          />
        </div>
      </div>
    </div>
  );
}
