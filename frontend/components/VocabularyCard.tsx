"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  useVocabularyProgress,
  ExerciseType,
} from "@/hooks/useVocabularyProgress";
import { Check, Lock, Sparkles } from "lucide-react";
import { useState } from "react";

interface VocabularyCardProps {
  name: string;
  description: string;
  imagePath?: string;
  color?: string;
  url: string;
  exerciseType: ExerciseType;
}

export default function VocabularyCard({
  name,
  description,
  imagePath,
  color = "bg-white",
  url,
  exerciseType,
}: VocabularyCardProps) {
  const { progress, canAccessExercise, getNextRecommended } =
    useVocabularyProgress();
  const [showWarning, setShowWarning] = useState(false);

  const exerciseProgress = progress[exerciseType];
  const isLocked = !canAccessExercise(exerciseType);
  const isCompleted = exerciseProgress.status === "completed";
  const isRecommended = getNextRecommended() === exerciseType;

  const handleClick = (e: React.MouseEvent) => {
    if (isLocked) {
      e.preventDefault();
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
    }
  };

  return (
    <div className="relative">
      <Link
        href={isLocked ? "#" : url}
        className={`group block ${isLocked ? "cursor-not-allowed" : ""}`}
        onClick={handleClick}
      >
        <motion.div
          whileHover={isLocked ? {} : { scale: 1.05, y: -5 }}
          whileTap={isLocked ? {} : { scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`relative flex flex-col items-center justify-between gap-4 p-6 border-4 ${
            isRecommended
              ? "border-purple-500 ring-4 ring-purple-300 animate-pulse"
              : isCompleted
              ? "border-green-400"
              : isLocked
              ? "border-gray-300"
              : "border-purple-300"
          } ${color} rounded-2xl shadow-lg hover:shadow-2xl ${
            !isLocked && "hover:border-purple-500"
          } transition-all duration-300 h-full min-h-[16rem] ${
            isLocked ? "opacity-60" : ""
          }`}
        >
          {/* Status Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {isCompleted && (
              <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                <Check size={14} />
                <span>Completed</span>
              </div>
            )}
            {isRecommended && !isCompleted && (
              <div className="flex items-center gap-1 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                <Sparkles size={14} />
                <span>Next</span>
              </div>
            )}
            {isLocked && (
              <div className="flex items-center gap-1 bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                <Lock size={14} />
                <span>Locked</span>
              </div>
            )}
          </div>

          {/* Score Badge */}
          {isCompleted && exerciseProgress.score !== null && (
            <div className="absolute top-3 right-3 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
              {exerciseProgress.score}%
            </div>
          )}

          {/* Icon */}
          <div className="flex-shrink-0 mt-8">
            <Image
              src={imagePath || "/art/flashcards-icon.png"}
              alt={`${name} icon`}
              width={150}
              height={150}
              className={`object-contain transition-transform duration-300 ${
                !isLocked && "group-hover:scale-110"
              } ${isLocked ? "grayscale" : ""}`}
            />
          </div>

          {/* Content */}
          <div className="flex flex-col items-center text-center gap-2 flex-grow justify-end">
            <h3
              className={`text-lg md:text-xl font-bold transition-colors ${
                isLocked
                  ? "text-gray-500"
                  : isCompleted
                  ? "text-green-700"
                  : "text-purple-900 group-hover:text-purple-600"
              }`}
            >
              {name}
            </h3>
            <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
              {description}
            </p>
          </div>

          {/* Hover indicator */}
          {!isLocked && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            </div>
          )}
        </motion.div>
      </Link>

      {/* Warning Message */}
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute -bottom-16 left-0 right-0 bg-red-500 text-white text-sm p-3 rounded-lg shadow-lg text-center"
        >
          Complete previous exercises first! 🔒
        </motion.div>
      )}
    </div>
  );
}
