"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Lock, CheckCircle, Play } from "lucide-react";
import { useSentenceConstructionProgress } from "@/hooks/useSentenceConstructionProgress";
import type { ExerciseType } from "@/contexts/LearningProgressContext";

interface SentenceConstructionCardProps {
  name: string;
  description: string;
  imagePath: string;
  color: string;
  url: string;
  exerciseType: "sentence-ordering" | "fill-missing" | "create-sentence";
}

export default function SentenceConstructionCard({
  name,
  description,
  imagePath,
  color,
  url,
  exerciseType,
}: SentenceConstructionCardProps) {
  const { getExerciseProgress, getExerciseMastery } =
    useSentenceConstructionProgress();

  const progress = getExerciseProgress(exerciseType);
  const mastery = getExerciseMastery(progress);
  const isLocked = progress.status === "locked";
  const isCompleted = progress.status === "completed";

  return (
    <motion.div
      whileHover={!isLocked ? { scale: 1.03, y: -4 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
      className="relative"
    >
      <Link
        href={isLocked ? "#" : url}
        className={`block ${isLocked ? "pointer-events-none" : ""}`}
      >
        <div
          className={`relative rounded-3xl shadow-lg overflow-hidden border-2 transition-all ${
            isLocked
              ? "border-gray-300 bg-gray-100 opacity-60"
              : isCompleted
              ? "border-orange-300 bg-orange-50"
              : "border-orange-200 hover:border-orange-400"
          } ${color}`}
        >
          {/* Status Badge */}
          <div className="absolute top-3 right-3 z-10">
            {isLocked ? (
              <div className="bg-gray-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                <Lock className="w-3 h-3" />
                Locked
              </div>
            ) : isCompleted ? (
              <div className="bg-orange-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                <CheckCircle className="w-3 h-3" />
                Completed
              </div>
            ) : (
              <div className="bg-orange-600 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
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
            <h3 className="text-xl font-bold text-orange-900 mb-2">{name}</h3>
            <p className="text-sm text-gray-700 mb-3">{description}</p>

            {/* Progress Info */}
            {!isLocked && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{mastery.icon}</span>
                  <div>
                    <p className="font-semibold text-orange-700 capitalize">
                      {mastery.level}
                    </p>
                    <p className="text-gray-600">
                      Avg: {mastery.avgScore}% • {mastery.difficulty}
                    </p>
                  </div>
                </div>
                {progress.attempts > 0 && (
                  <div className="text-right">
                    <p className="text-gray-600">
                      {progress.attempts} attempt
                      {progress.attempts > 1 ? "s" : ""}
                    </p>
                    {progress.score !== null && (
                      <p className="font-semibold text-orange-700">
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
  );
}
