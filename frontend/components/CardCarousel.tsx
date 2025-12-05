"use client";

import React, { useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  animate,
  AnimatePresence,
} from "framer-motion";
import { useSwipeable } from "react-swipeable";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ClassroomCard from "./ClassroomCard";

const CARD_WIDTH = 352;
const CARD_GAP = 32;

interface Card {
  name: string;
}

interface CardCarouselProps {
  skill_cards?: Card[];
}

const CardCarousel = ({ skill_cards = [] }: CardCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const x = useMotionValue(0);

  const nextCard = () =>
    setCurrentIndex((prev) => Math.min(prev + 1, skill_cards.length - 1));
  const prevCard = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));

  useEffect(() => {
    const offset = window.innerWidth / 2 - CARD_WIDTH / 2;
    const targetX = -currentIndex * (CARD_WIDTH + CARD_GAP) + offset;
    const controls = animate(x, targetX, {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });
    return controls.stop;
  }, [currentIndex, x]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: nextCard,
    onSwipedRight: prevCard,
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  if (skill_cards.length === 0) {
    return (
      <div className="relative flex items-center justify-center h-full w-full">
        <p className="text-gray-500 text-xl">No cards available</p>
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center justify-center h-full w-full overflow-hidden mt-10"
      {...swipeHandlers}
    >
      {/* Left Fade Shadow */}
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 z-10 bg-gradient-to-r from-white via-white/50 to-transparent pointer-events-none" />

      {/* Right Fade Shadow */}
      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 z-10 bg-gradient-to-l from-white via-white/50 to-transparent pointer-events-none" />

      {/* Left Button */}
      {currentIndex === 0 ? (
        <div className="absolute left-4 z-20">
          <span className="text-purple-600 text-xs">Back to Home</span>
        </div>
      ) : (
        <div className="absolute left-4 z-20">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevCard}
            className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-all duration-300 shadow-lg"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>
        </div>
      )}

      {/* Cards Container */}
      <div className="w-full h-full flex items-center justify-center">
        <motion.div className="flex gap-8 items-center" style={{ x }}>
          {skill_cards.map((card, index) => (
            <div
              key={index}
              className="flex-shrink-0"
              style={{ width: CARD_WIDTH }}
            >
              <ClassroomCard />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right Button */}
      {currentIndex === skill_cards.length - 1 ? (
        <div className="absolute right-4 z-20">
          <span className="text-purple-600 text-xs">Back to Home</span>
        </div>
      ) : (
        <div className="absolute right-4 z-20">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextCard}
            className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-all duration-300 shadow-lg"
            aria-label="Next card"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default CardCarousel;
