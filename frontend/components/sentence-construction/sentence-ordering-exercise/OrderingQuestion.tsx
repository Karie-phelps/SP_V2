"use client";

import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Check, X, Lightbulb, RotateCcw } from "lucide-react";
import { useState } from "react";

interface OrderingQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  words: string[];
  correctSentence: string;
  onSubmit: (userSentence: string, isCorrect: boolean) => void;
  showResult: boolean;
  isCorrect: boolean | null;
  explanation: string;
}

export default function OrderingQuestion({
  questionNumber,
  totalQuestions,
  words,
  correctSentence,
  onSubmit,
  showResult,
  isCorrect,
  explanation,
}: OrderingQuestionProps) {
  const [orderedWords, setOrderedWords] = useState<string[]>([...words]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = () => {
    const userSentence = orderedWords.join(" ");
    const correct = userSentence === correctSentence;
    setHasSubmitted(true);
    onSubmit(userSentence, correct);
  };

  const handleReset = () => {
    setOrderedWords([...words]);
    setHasSubmitted(false);
  };

  const showExplanation = showResult && !isCorrect;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Instruction */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-orange-900">
          I-ayos ang mga salita upang makabuo ng wastong pangungusap
        </h2>
        <p className="text-sm text-gray-600">
          Drag and drop the words to form a correct sentence
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Ordering Area */}
        <motion.div
          animate={{
            flex: showExplanation ? "0 0 42%" : "1 1 100%",
          }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <div className="space-y-6">
            {/* Drop Zone - Where user arranges words */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-200 min-h-[200px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-orange-900">
                  Your Sentence
                </h3>
                {!showResult && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                )}
              </div>

              {showResult ? (
                // Show final result
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-xl border-2 ${
                      isCorrect
                        ? "bg-green-50 border-green-300"
                        : "bg-red-50 border-red-300"
                    }`}
                  >
                    <p className="text-lg font-medium text-gray-900">
                      {orderedWords.join(" ")}
                    </p>
                  </div>

                  {!isCorrect && (
                    <div className="p-4 rounded-xl bg-green-50 border-2 border-green-300">
                      <p className="text-sm text-gray-600 mb-1">
                        Correct Answer:
                      </p>
                      <p className="text-lg font-medium text-green-900">
                        {correctSentence}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2">
                    {isCorrect ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <Check className="w-6 h-6" />
                        <span className="font-semibold">Tama!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-700">
                        <X className="w-6 h-6" />
                        <span className="font-semibold">Mali</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Draggable word list
                <Reorder.Group
                  axis="y"
                  values={orderedWords}
                  onReorder={setOrderedWords}
                  className="space-y-2"
                >
                  {orderedWords.map((word, index) => (
                    <Reorder.Item
                      key={`${word}-${index}`}
                      value={word}
                      className="bg-orange-100 border-2 border-orange-300 rounded-lg p-4 cursor-move hover:bg-orange-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <p className="text-lg font-medium text-gray-900">
                          {word}
                        </p>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
            </div>

            {/* Submit Button */}
            {!showResult && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={hasSubmitted}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Explanation Panel */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, x: 100, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: 100, width: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full lg:flex-[0_0_55%]"
            >
              <div className="bg-white rounded-2xl shadow-lg border-2 border-orange-200 p-6 h-full">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-orange-100">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-bold text-orange-900">
                    Explanation
                  </h3>
                </div>
                <div className="text-sm text-gray-800 leading-relaxed">
                  <p className="mb-3">
                    <span className="font-semibold text-green-700">
                      Correct Answer:
                    </span>{" "}
                    {correctSentence}
                  </p>
                  <p className="text-gray-700">{explanation}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
