"use client";

import Header from "@/components/Header";
import { motion, AnimatePresence } from "framer-motion";
import ClassroomCard from "@/components/ClassroomCard";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CardCarousel from "@/components/CardCarousel";
import MainBG from "@/components/MainBG";
import { ModuleType } from "@/contexts/LearningProgressContext";
import RecommendedPathIndicator from "@/components/RecommendedPathIndicator";
import { useLearningProgress } from "@/contexts/LearningProgressContext";

interface Card {
  title: string;
  skill: string;
  imagePath: string;
  description: string;
  color: string;
  url: string;
  moduleType: ModuleType;
}

const cards: Card[] = [
  {
    title: "Word Power",
    skill: "Vocabulary",
    imagePath: "/art/vocabulary.png",
    description:
      "Palawakin ang talasalitaan sa pamamagitan ng mabilis at interaktibong pagsasanay.",
    color: "bg-yellow-100",
    url: "/vocabulary",
    moduleType: "vocabulary",
  },
  {
    title: "Grammar Mastery",
    skill: "Grammar Accuracy",
    imagePath: "/art/grammar.png",
    description:
      "Sanayin ang tamang anyo at gamit ng salita para sa mas malinaw na pagsulat.",
    color: "bg-green-100",
    url: "/grammar",
    moduleType: "grammar",
  },
  {
    title: "Build-a-Sentence",
    skill: "Sentence Construction",
    imagePath: "/art/sentence-construction.png",
    description:
      "Ayusin at buuin ang mga pangungusap para sa mas mahusay na pag-unawa at pagpapahayag.",
    color: "bg-blue-100",
    url: "/sentence-construction",
    moduleType: "sentence-construction",
  },
  {
    title: "Read & Understand",
    skill: "Reading Comprehension",
    imagePath: "/art/reading-comprehension.png",
    description:
      "Basahin ang maiikling teksto at sagutin ang tanong para hasain ang comprehension skills.",
    color: "bg-pink-100",
    url: "/reading-comprehension",
    moduleType: "reading-comprehension",
  },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"recommended" | "strengths">(
    "recommended"
  );
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { updateProgress, resetProgress } = useLearningProgress();

  // ADD THESE TEST BUTTONS
  const simulateVocabularyProgress = () => {
    updateProgress("vocabulary", "flashcards", {
      status: "completed",
      score: 85,
      completedAt: new Date().toISOString(),
    });
  };

  const simulateCompleteVocabulary = () => {
    updateProgress("vocabulary", "flashcards", {
      status: "completed",
      score: 90,
    });
    updateProgress("vocabulary", "quiz", { status: "completed", score: 85 });
    updateProgress("vocabulary", "fill-blanks", {
      status: "completed",
      score: 88,
    });
  };

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const bentoGridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { when: "beforeChildren", staggerChildren: 0.1 },
    },
  };

  return (
    <div className="flex m-0 w-full h-screen flex-col">
      {/* Header */}
      <Header />
      {/* TEST BUTTONS - REMOVE LATER */}
      {/* <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={simulateVocabularyProgress}
          className="bg-green-500 text-white px-3 py-1 rounded text-xs"
        >
          Test: 33% Vocab Progress
        </button>
        <button
          onClick={simulateCompleteVocabulary}
          className="bg-blue-500 text-white px-3 py-1 rounded text-xs"
        >
          Test: Complete Vocab
        </button>
        <button
          onClick={() => resetProgress()}
          className="bg-red-500 text-white px-3 py-1 rounded text-xs"
        >
          Reset All
        </button>
      </div> */}
      <div className="relative min-h-screen mx-2 pt-16 md:pt-18 pb-2 flex flex-row justify-center items-center gap-2">
        {/* Left Side */}
        <div
          className={`${
            isPanelOpen ? "hidden lg:flex" : "flex"
          } flex-col flex-[2] h-full bg-white rounded-2xl overflow-hidden border-7 border-purple-300 `}
        >
          {/* <MainBG imagePath="/bg/forestbg-learn.jpg" /> */}
          <div className="w-auto z-30 bg-white md:mx-3 md:mt-3 px-3 pt-3">
            <RecommendedPathIndicator />
          </div>
          <CardCarousel skill_cards={cards} />
        </div>

        {/* Toggle Button for Mobile */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="lg:hidden fixed bottom-6 right-6 z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-all"
          aria-label="Toggle panel"
        >
          {isPanelOpen ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>

        {/* Right Side */}
        <AnimatePresence>
          {(isPanelOpen || isDesktop) && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`${
                isPanelOpen ? "fixed inset-0 z-40 pt-16" : "hidden lg:flex"
              } lg:relative lg:flex flex-1 flex-col h-full rounded-2xl`}
            >
              {/* Overlay for mobile */}
              {isPanelOpen && (
                <div
                  onClick={() => setIsPanelOpen(false)}
                  className="lg:hidden absolute inset-0 bg-black/50 -z-10"
                />
              )}

              <div className="flex flex-col h-full bg-gray-200 lg:bg-transparent rounded-2xl p-2 lg:p-0">
                {/* Header */}
                <div className="flex w-full h-12 flex-row items-center">
                  <button
                    onClick={() => setActiveTab("recommended")}
                    className={`flex w-[60%] mr-[-5px] h-full font-semibold text-xs p-3 text-center items-center justify-center rounded-tl-2xl rounded-tr-4xl transition-all border-t border-x border-gray-300 ${
                      activeTab === "recommended"
                        ? "z-10 bg-white"
                        : "bg-gray-300 text-gray-600 shadow-[inset_0_-8px_12px_-8px_rgba(0,0,0,0.15)]"
                    }`}
                  >
                    Recommended for you
                  </button>
                  <button
                    onClick={() => setActiveTab("strengths")}
                    className={`flex w-[60%] ml-[-5px] h-full font-semibold text-xs p-3 text-center items-center justify-center rounded-tr-2xl rounded-tl-4xl transition-all border-t border-x border-gray-300 ${
                      activeTab === "strengths"
                        ? "z-10 bg-white"
                        : "bg-gray-300 text-gray-600 shadow-[inset_0_-8px_12px_-8px_rgba(0,0,0,0.15)]"
                    }`}
                  >
                    Strengths and Weaknesses
                  </button>
                </div>
                {/* Body content */}
                <div className="flex w-full flex-1 bg-white rounded-b-2xl p-5 overflow-y-auto border-b border-x border-gray-300">
                  {activeTab === "recommended" ? (
                    <div>Recommended content</div>
                  ) : (
                    <div>Strengths and Weaknesses content</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
