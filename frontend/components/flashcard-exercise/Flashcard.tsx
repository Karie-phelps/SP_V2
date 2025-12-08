"use client";

import { motion } from "framer-motion";
import { Volume2, Sparkles } from "lucide-react";
import { useState } from "react";

interface FlashcardProps {
  word: string;
  meaning: string;
  example: string;
  isFlipped: boolean;
  onFlip: () => void;
}

interface ParsedEnhancedContent {
  easyDefinition: string;
  bilingualGloss: string;
  examples: string[];
}

export default function Flashcard({
  word,
  meaning,
  example,
  isFlipped,
  onFlip,
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
    // Remove markdown formatting
    return text.replace(/\*\*/g, "").trim();
  };

  const parseEnhancedContent = (content: string): ParsedEnhancedContent => {
    const lines = content.split("\n").filter((line) => line.trim());

    let easyDefinition = "";
    let bilingualGloss = "";
    let examples: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Extract easy definition
      if (line.includes("Easy definition")) {
        const colonIndex = line.lastIndexOf(":");
        if (colonIndex !== -1) {
          easyDefinition = cleanText(line.substring(colonIndex + 1));
        }
      }

      // Extract bilingual gloss
      if (line.includes("Bilingual gloss")) {
        const colonIndex = line.lastIndexOf(":");
        if (colonIndex !== -1) {
          bilingualGloss = cleanText(line.substring(colonIndex + 1));
        }
      }

      // Extract example sentences
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

    return { easyDefinition, bilingualGloss, examples };
  };

  const handleImproveDefinition = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip
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
        console.log("Raw API response:", data.content); // Debug log
        const parsed = parseEnhancedContent(data.content);
        console.log("Parsed content:", parsed); // Debug log
        setEnhancedContent(parsed);
      }
    } catch (error) {
      console.error("Failed to fetch enhanced definition:", error);
    } finally {
      setIsLoadingEnhanced(false);
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
              <h2 className="text-4xl md:text-4xl font-bold text-purple-900">
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
          <div className="w-full h-full bg-blue-100 rounded-3xl shadow-xl p-2 md:p-8 flex flex-col items-center justify-between border-4 border-blue-300 overflow-y-auto">
            <div className="text-center space-y-4 max-w-xl flex-1 flex flex-col items-center justify-center w-full">
              {enhancedContent ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <span className="text-base text-blue-600 font-semibold">
                      Enhanced Definition
                    </span>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 text-center space-y-4">
                    {/* Easy Definition */}
                    {enhancedContent.easyDefinition && (
                      <div>
                        <h4 className="text-sm font-bold text-blue-700 mb-1">
                          Simple Definition:
                        </h4>
                        <p className="text-blue-900 text-lg italic md:text-base">
                          {enhancedContent.easyDefinition}
                        </p>
                      </div>
                    )}

                    {/* Bilingual Gloss */}
                    {enhancedContent.bilingualGloss && (
                      <div>
                        <p className="text-blue-900 text-xl md:text-base border-b border-blue-300 pb-7">
                          {enhancedContent.bilingualGloss}
                        </p>
                      </div>
                    )}

                    {enhancedContent.examples[0] && (
                      <div className="pt-3">
                        <h4 className="text-sm font-bold text-blue-700 mb-2">
                          Example:
                        </h4>
                        <ul className="space-y-2 text-base">
                          {enhancedContent.examples[0]}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>

            <div className="flex flex-col items-center gap-2 w-full mt-4">
              {!enhancedContent && (
                <button
                  onClick={handleImproveDefinition}
                  disabled={isLoadingEnhanced}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-200 hover:bg-blue-300 text-blue-700 rounded-lg text-xs md:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
