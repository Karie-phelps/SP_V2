"use client";

import Link from "next/link";
import Image from "next/image";
import DashboardCard from "./DashboardCard";
import {
  useLearningProgress,
  ModuleType,
} from "@/contexts/LearningProgressContext";
import { Check, Circle, Sparkles, TrendingUp } from "lucide-react";

interface ClassroomCardProps {
  title: string;
  skill: string;
  imagePath: string;
  description: string;
  color: string;
  url: string;
  moduleType: ModuleType;
}

const ClassroomCard = ({
  title,
  skill,
  imagePath,
  description,
  color,
  url,
  moduleType,
}: ClassroomCardProps) => {
  const {
    getModuleProgress,
    isModuleCompleted,
    getRecommendedModule,
    getModuleRecommendationReason,
    markModuleAccessed,
  } = useLearningProgress();

  const progress = getModuleProgress(moduleType);
  const completed = isModuleCompleted(moduleType);
  const isRecommended = getRecommendedModule() === moduleType;
  const recommendationReason = getModuleRecommendationReason(moduleType);

  console.log(`${moduleType}:`, {
    progress,
    completed,
    isRecommended,
    recommendationReason,
  });

  const handleClick = () => {
    markModuleAccessed(moduleType);
  };

  return (
    <Link
      href={url}
      onClick={handleClick}
      className="flex justify-center items-center group w-full"
    >
      <DashboardCard
        title={title}
        skill={skill}
        description={description}
        color={color}
        className={`p-0 overflow-hidden relative justify-end max-w-4xl w-full min-h-[12rem] transition-all duration-300 ${
          isRecommended && !completed
            ? "ring-4 ring-purple-500 ring-offset-4 ring-offset-white shadow-2xl shadow-purple-500/70 scale-105" // ENHANCED
            : ""
        }`}
      >
        {/* Recommended Badge (Top-Left) */}
        {isRecommended && !completed && (
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-2xl animate-pulse border-2 border-white">
            <Sparkles size={16} className="animate-spin" />
            <span>RECOMMENDED NEXT</span>
          </div>
        )}

        {/* Progress Badge (Top-Right) */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          {completed ? (
            <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
              <Check size={14} />
              <span>Completed</span>
            </div>
          ) : progress > 0 ? (
            <div className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              <TrendingUp size={14} />
              <span>{progress}%</span>
            </div>
          ) : (
            <Circle size={16} className="text-white/70" />
          )}
        </div>

        {/* Image Background */}
        <Image
          src={imagePath}
          alt="Classroom Artwork"
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t ${
            isRecommended && !completed
              ? "from-purple-900/60 via-purple-800/40 to-transparent"
              : "from-black/30 via-black/10 to-transparent"
          }`}
        />

        {/* Recommendation Text (Bottom) */}
        <div className="relative z-10">
          <p className="text-sm text-purple-200 mt-2 group-hover:text-purple-100 transition-colors font-medium">
            {recommendationReason}
          </p>
        </div>
      </DashboardCard>
    </Link>
  );
};

export default ClassroomCard;
