"use client";

import { motion } from "framer-motion";

interface FlashcardProgressProps {
  current: number;
  total: number;
  masteredCount: number;
  learningCount: number;
}

export default function FlashcardProgress({
  current,
  total,
  masteredCount,
  learningCount,
}: FlashcardProgressProps) {
  const progress = ((current + 1) / total) * 100;

  return (
    <div className="w-full space-y-3">
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex justify-between text-xs text-gray-600 mb-1.5">
          <span className="font-semibold">
            Card {current + 1} of {total}
          </span>
          <span className="font-semibold">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2.5 bg-purple-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 justify-center">
        <div className="flex items-center gap-1.5 bg-green-100 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-xs font-semibold text-green-700">
            Mastered: {masteredCount}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-orange-100 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 bg-orange-500 rounded-full" />
          <span className="text-xs font-semibold text-orange-700">
            Learning: {learningCount}
          </span>
        </div>
      </div>
    </div>
  );
}
