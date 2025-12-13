"use client";

import { motion } from "framer-motion";
import {
  Lightbulb,
  Eye,
  EyeOff,
  BookmarkCheck,
  BookmarkPlus,
} from "lucide-react";
import { useState } from "react";
import { useReviewDeck } from "@/contexts/ReviewDeckProvider";
import { vocabularyData } from "@/data/vocabulary-dataset";

interface FillBlanksQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  sentence: string;
  blankWord: string;
  correctAnswer: string;
  hint: string;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  showResult: boolean;
  isCorrect: boolean | null;
  onAnswerRevealed?: (revealed: boolean) => void;
}

export default function FillBlanksQuestion({
  questionNumber,
  totalQuestions,
  sentence,
  blankWord,
  correctAnswer,
  hint,
  userAnswer,
  onAnswerChange,
  onSubmit,
  showResult,
  isCorrect,
  onAnswerRevealed,
}: FillBlanksQuestionProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const { addToReviewDeck, removeFromReviewDeck, isInReviewDeck } =
    useReviewDeck();

  // Find word ID
  const wordData = vocabularyData.find((w) => w.word === blankWord);
  const wordId = wordData?.id || 0;
  const inReviewDeck = isInReviewDeck(wordId);

  const handleToggleAnswer = () => {
    const newState = !showAnswer;
    setShowAnswer(newState);
    if (onAnswerRevealed) {
      onAnswerRevealed(newState);
    }
  };

  const handleToggleReviewDeck = () => {
    if (inReviewDeck) {
      removeFromReviewDeck(wordId);
    } else {
      addToReviewDeck(wordId);
    }
  };

  // Generate letter hints based on word length
  const [letterHints] = useState(() => {
    const word = correctAnswer.toLowerCase();
    const wordLength = word.length;

    let numHints: number;
    if (wordLength <= 5) {
      numHints = 1;
    } else if (wordLength <= 9) {
      numHints = 3;
    } else {
      numHints = 4;
    }

    const positions: number[] = [];

    while (positions.length < numHints) {
      const randomPos = Math.floor(Math.random() * word.length);
      if (!positions.includes(randomPos)) {
        positions.push(randomPos);
      }
    }

    return word
      .split("")
      .map((char, idx) => (positions.includes(idx) ? char : "_"))
      .join(" ");
  });

  const sentenceWithBlank = sentence.replace(
    new RegExp(`\\b${blankWord}\\b`, "i"),
    `[ ${letterHints} ]`
  );

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 md:p-8 border-3 border-blue-200 shadow-lg">
        <p className="text-lg md:text-xl text-gray-800 leading-relaxed text-center font-mono">
          {sentenceWithBlank}
        </p>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => onAnswerChange(e.target.value)}
          disabled={showResult}
          placeholder="Ilagay ang sagot dito..."
          onKeyPress={(e) => {
            if (e.key === "Enter" && userAnswer.trim() && !showResult) {
              onSubmit();
            }
          }}
          className={`w-full px-6 py-4 text-lg text-center rounded-xl border-3 focus:outline-none focus:ring-4 transition-all ${
            showResult
              ? isCorrect
                ? "border-green-500 bg-green-50 text-green-900"
                : "border-red-500 bg-red-50 text-red-900"
              : "border-blue-300 focus:border-blue-500 focus:ring-blue-200"
          }`}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4"
      >
        <div className="flex items-start gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800 mb-1">
              Hint (Kahulugan):
            </p>
            <p className="text-sm text-yellow-700">{hint}</p>
          </div>
        </div>
      </motion.div>

      {showAnswer && !showResult && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4"
        >
          <div className="flex items-start gap-2">
            <Eye className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-800 mb-1">
                Tamang Sagot:
              </p>
              <p className="text-lg font-bold text-orange-700">
                {correctAnswer}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {!showResult && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleAnswer}
            className="flex items-center justify-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold py-3 px-6 rounded-xl transition-colors border-2 border-orange-300"
          >
            {showAnswer ? <EyeOff size={18} /> : <Eye size={18} />}
            {showAnswer ? "Itago ang Sagot" : "Ipakita ang Sagot"}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSubmit}
            disabled={!userAnswer.trim()}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-colors"
          >
            Suriin ang Sagot
          </motion.button>
        </div>
      )}
    </div>
  );
}
