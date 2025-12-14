"use client";

import { motion } from "framer-motion";
import { Volume2, Sparkles, BookmarkCheck, BookmarkPlus } from "lucide-react";
import { useState } from "react";

interface FlashcardProps {
  word: string;
  meaning: string;
  example: string;
  isFlipped: boolean;
  onFlip: () => void;
  wordId: number;
}

interface ParsedEnhancedContent {
  easyDefinition: string;
  formalDefinition: string;
  bilingualGloss: string;
  examples: string[];
}

export default function Flashcard({
  word,
  meaning,
  example,
  isFlipped,
  onFlip,
  wordId,
}: FlashcardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [enhancedContent, setEnhancedContent] =
    useState<ParsedEnhancedContent | null>(null);
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(false);

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

  const cleanText = (text: string): string => {
    return text.replace(/\*\*/g, "").trim();
  };

  const parseEnhancedContent = (content: string): ParsedEnhancedContent => {
    const lines = content.split("\n").filter((line) => line.trim());

    let easyDefinition = "";
    let formalDefinition = "";
    let bilingualGloss = "";
    let examples: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.includes("Easy definition")) {
        const colonIndex = line.lastIndexOf(":");
        if (colonIndex !== -1) {
          easyDefinition = cleanText(line.substring(colonIndex + 1));
        }
      }

      if (line.includes("Brief formal definition")) {
        const colonIndex = line.lastIndexOf(":");
        if (colonIndex !== -1) {
          formalDefinition = cleanText(line.substring(colonIndex + 1));
        }
      }

      if (line.includes("Bilingual gloss")) {
        const colonIndex = line.lastIndexOf(":");
        if (colonIndex !== -1) {
          bilingualGloss = cleanText(line.substring(colonIndex + 1));
        }
      }

      if (line.includes("Example sentences")) {
        for (let j = i + 1; j < lines.length; j++) {
          const exampleLine = lines[j].trim();
          if (exampleLine.match(/^\d+\./)) {
            examples.push(cleanText(exampleLine.replace(/^\d+\.\s*/, "")));
          } else if (
            exampleLine.includes("**") ||
            exampleLine.startsWith("-")
          ) {
            break;
          }
        }
      }
    }

    return { easyDefinition, formalDefinition, bilingualGloss, examples };
  };

  const handleImproveDefinition = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoadingEnhanced(true);

    try {
      const response = await fetch("/api/redefine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word,
          baseMeaning: meaning,
          example,
        }),
      });

      const data = await response.json();
      if (data.content) {
        const parsed = parseEnhancedContent(data.content);
        setEnhancedContent(parsed);
      }
    } catch (error) {
      console.error("Failed to fetch enhanced definition:", error);
    } finally {
      setIsLoadingEnhanced(false);
    }
  };

  return (
    <div className="perspective-1000 w-full h-full max-w-3xl mx-auto flex items-center justify-center">
      <motion.div
        className="relative w-full h-[450px] md:h-full md:max-h-[600px] cursor-pointer"
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
          <div className="w-full h-full bg-purple-100 rounded-3xl shadow-xl p-6 md:p-8 flex flex-col items-center justify-center border-4 border-purple-300 overflow-y-auto">
            <div className="text-center space-y-4 md:space-y-6">
              <p className="text-blue-600 text-sm md:text-base font-semibold">
                Salita / Word
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900">
                {word}
              </h2>
            </div>
            <p className="absolute bottom-6 text-blue-500 text-xs md:text-sm animate-pulse">
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
          <div className="w-full h-full bg-blue-100 rounded-3xl shadow-xl p-4 md:p-8 flex flex-col items-center justify-between border-4 border-blue-300 overflow-y-auto">
            <div className="text-center space-y-3 md:space-y-4 max-w-xl flex-1 flex flex-col items-center justify-center w-full">
              {enhancedContent ? (
                <div className="w-full flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <span className="text-sm md:text-base text-blue-600 font-semibold">
                      Enhanced Definition
                    </span>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 md:p-4 border-2 border-blue-200 text-center space-y-3 md:space-y-4">
                    {enhancedContent.easyDefinition && (
                      <div>
                        <h4 className="text-xs md:text-sm font-bold text-blue-700 mb-1">
                          Simple Definition:
                        </h4>
                        <p className="text-blue-900 text-base md:text-base italic">
                          {enhancedContent.easyDefinition}
                        </p>
                      </div>
                    )}

                    {enhancedContent.formalDefinition && (
                      <div>
                        <p className="text-blue-900 text-sm font-semibold md:text-base border-b border-blue-300 pb-3">
                          {enhancedContent.formalDefinition}
                        </p>
                      </div>
                    )}

                    {enhancedContent.examples[0] && (
                      <div className="pt-2">
                        <h4 className="text-xs md:text-sm font-bold text-blue-700 mb-2">
                          Example:
                        </h4>
                        <p className="text-sm md:text-base text-blue-900">
                          {enhancedContent.examples[0]}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-blue-600 text-sm md:text-base font-semibold">
                    Kahulugan / Meaning
                  </p>
                  <h3 className="text-xl md:text-3xl lg:text-4xl font-bold text-blue-900">
                    {meaning}
                  </h3>

                  <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-blue-300">
                    <p className="text-blue-600 text-xs md:text-sm font-semibold mb-2">
                      Halimbawa / Example:
                    </p>
                    <p className="text-blue-800 text-sm md:text-base lg:text-lg italic">
                      "{example}"
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col items-center gap-2 w-full mt-3 md:mt-4">
              {!enhancedContent && (
                <button
                  onClick={handleImproveDefinition}
                  disabled={isLoadingEnhanced}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-200 hover:bg-blue-300 text-blue-700 rounded-lg text-xs md:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  {isLoadingEnhanced ? "Improving..." : "Improve definition"}
                </button>
              )}

              <p className="text-blue-500 text-xs md:text-sm animate-pulse">
                ← Click to flip back
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
