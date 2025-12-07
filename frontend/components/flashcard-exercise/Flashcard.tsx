"use client";

import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { useState } from "react";

interface FlashcardProps {
  word: string;
  meaning: string;
  example: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export default function Flashcard({
  word,
  meaning,
  example,
  isFlipped,
  onFlip,
}: FlashcardProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFlip = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      onFlip();
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fil-PH";
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="perspective-1000 w-full max-w-2xl mx-auto">
      <motion.div
        className="relative w-full aspect-[4/3] cursor-pointer"
        onClick={handleFlip}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front Side - Word */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
          }}
        >
          <div className="w-full h-full bg-purple-100 rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center border-4 border-purple-300">
            <div className="text-center space-y-6">
              <p className="text-purple-600 text-sm md:text-base font-semibold">
                Salita / Word
              </p>
              <h2 className="text-4xl md:text-6xl font-bold text-purple-900">
                {word}
              </h2>
            </div>
            <p className="absolute bottom-6 text-purple-500 text-xs md:text-sm animate-pulse">
              Click to see meaning →
            </p>
          </div>
        </div>

        {/* Back Side - Meaning & Example */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="w-full h-full bg-blue-100 rounded-3xl shadow-xl p-6 md:p-8 flex flex-col items-center justify-center border-4 border-blue-300">
            <div className="text-center space-y-4 max-w-lg">
              <p className="text-blue-600 text-sm md:text-base font-semibold">
                Kahulugan / Meaning
              </p>
              <h3 className="text-2xl md:text-4xl font-bold text-blue-900">
                {meaning}
              </h3>

              <div className="mt-6 pt-4 border-t border-blue-300">
                <p className="text-blue-600 text-xs md:text-sm font-semibold mb-2">
                  Halimbawa / Example:
                </p>
                <p className="text-blue-800 text-sm md:text-lg italic">
                  "{example}"
                </p>
              </div>
            </div>
            <p className="absolute bottom-6 text-blue-500 text-xs md:text-sm animate-pulse">
              ← Click to flip back
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
