"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Lock, CheckCircle, Play, Sparkles } from "lucide-react";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import { useState } from "react";

interface GrammarCardProps {
  name: string;
  description: string;
  imagePath: string;
  color: string;
  url: string;
  exerciseType: "error-identification" | "sentence-correction" | "fill-blanks";
}

export default function GrammarCard({
  name,
  description,
  imagePath,
  color,
  url,
  exerciseType,
}: GrammarCardProps) {
  const {
    getExerciseProgress,
    canAccessExercise,
    getNextRecommended,
    getExerciseMastery,
  } = useGrammarProgress();
  const [showWarning, setShowWarning] = useState(false);

  const progress = getExerciseProgress(exerciseType);
  const isLocked = !canAccessExercise(exerciseType);
  const isCompleted = progress.status === "completed";
  const isRecommended = getNextRecommended() === exerciseType;
  const exerciseMastery = getExerciseMastery(progress);

  const handleClick = (e: React.MouseEvent) => {
    if (isLocked) {
      e.preventDefault();
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
    }
  };

  return (
    <div className="relative">
      <motion.div
        whileHover={!isLocked ? { scale: 1.03, y: -4 } : {}}
        whileTap={!isLocked ? { scale: 0.98 } : {}}
      >
        <Link
          href={isLocked ? "#" : url}
          className={`block ${isLocked ? "pointer-events-none" : ""}`}
          onClick={handleClick}
        >
          <div
            className={`relative rounded-3xl shadow-lg overflow-hidden border-2 transition-all ${
              isLocked
                ? "border-gray-300 bg-gray-100 opacity-60"
                : isCompleted
                ? "border-green-300 bg-green-50"
                : isRecommended
                ? "border-green-500 ring-4 ring-green-300"
                : "border-green-200 hover:border-green-400"
            } ${color}`}
          >
            {/* Status Badge */}
            <div className="absolute top-3 right-3 z-10">
              {isLocked ? (
                <div className="bg-gray-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                  <Lock className="w-3 h-3" />
                  Locked
                </div>
              ) : isRecommended ? (
                <div className="bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold shadow-md">
                  <Sparkles className="w-3 h-3" />
                  Next
                </div>
              ) : isCompleted ? (
                <div className="bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                  <CheckCircle className="w-3 h-3" />
                  Completed
                </div>
              ) : (
                <div className="bg-green-600 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                  <Play className="w-3 h-3" />
                  Start
                </div>
              )}
            </div>

            {/* Image */}
            <div className="relative h-40 w-full bg-white/50">
              <Image
                src={imagePath}
                alt={name}
                fill
                className="object-contain p-4"
                priority
              />
            </div>

            {/* Content */}
            <div className="p-5 bg-white/80 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-green-900 mb-2">{name}</h3>
              <p className="text-sm text-gray-700 mb-3">{description}</p>

              {/* Progress Info */}
              {!isLocked && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{exerciseMastery.icon}</span>
                    <div>
                      <p className="font-semibold text-green-700 capitalize">
                        {exerciseMastery.level}
                      </p>
                      <p className="text-gray-600">
                        Avg: {exerciseMastery.avgScore}% •{" "}
                        {exerciseMastery.difficulty}
                      </p>
                    </div>
                  </div>
                  {(progress.attempts ?? 0) > 0 && (
                    <div className="text-right">
                      <p className="text-gray-600">
                        {progress.attempts} attempt
                        {(progress.attempts ?? 0) > 1 ? "s" : ""}
                      </p>
                      {progress.score !== null && (
                        <p className="font-semibold text-green-700">
                          Best: {progress.score}%
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Warning Message */}
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute -bottom-16 left-0 right-0 bg-red-500 text-white text-sm p-3 rounded-lg shadow-lg text-center z-50"
        >
          Complete previous exercises first! 🔒
        </motion.div>
      )}
    </div>
  );
}
