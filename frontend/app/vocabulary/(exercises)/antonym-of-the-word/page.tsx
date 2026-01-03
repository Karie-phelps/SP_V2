"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";
import Link from "next/link";
import AntonymQuestion from "@/components/vocabulary/antonym-exercise/AntonymQuestion";
import AntonymProgress from "@/components/vocabulary/antonym-exercise/AntonymProgress";
import AntonymCompletionModal from "@/components/vocabulary/antonym-exercise/AntonymCompletionModal";
import { useVocabularyProgress } from "@/hooks/useVocabularyProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import {
  getVocabularyExercises,
  getLexiconData,
  type VocabularyExerciseItem,
  type LexiconItem,
} from "@/lib/api/exercises";
import {
  isLowFrequencyWord,
  areSimilarWords,
} from "@/utils/PerformanceTracker";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";
import { reportLexicalItemPerformance } from "@/utils/reportPerformance";

interface AntonymItem {
  id: string;
  lemma_id: string;
  sentence: string;
  underlinedWord: string;
  correctAnswer: string;
  options: string[];
}

interface AntonymAnswer {
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  word: string;
}

// Helper function to underline a word in a sentence
function underlineWordInSentence(
  sentence: string,
  wordToUnderline: string
): string {
  const escapedWord = wordToUnderline.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `(?<=\\s|^)(${escapedWord})(?=\\s|$|[.,!?;:])`,
    "gi"
  );
  return sentence.replace(regex, "<u>$1</u>");
}

// Generate antonym questions from AI service data
async function generateAntonymQuestionsFromService(): Promise<AntonymItem[]> {
  const [vocabExercises, lexiconData] = await Promise.all([
    getVocabularyExercises(),
    getLexiconData(),
  ]);

  const lexiconMap = new Map(
    lexiconData.map((item: LexiconItem) => [item.lemma_id, item])
  );

  console.log("📚 Vocab Exercises:", vocabExercises.length);
  console.log("📖 Lexicon Data:", lexiconData.length);

  const itemsWithAntonyms = vocabExercises.filter((vocabItem) => {
    const lexiconEntry = lexiconMap.get(vocabItem.lemma_id);
    return (
      lexiconEntry &&
      lexiconEntry.relations?.antonyms &&
      lexiconEntry.relations.antonyms.length > 0
    );
  });

  console.log("🔄 Items with antonyms:", itemsWithAntonyms.length);

  const antonymItems: AntonymItem[] = itemsWithAntonyms
    .map((vocabItem: VocabularyExerciseItem) => {
      const lexiconEntry = lexiconMap.get(vocabItem.lemma_id);
      if (!lexiconEntry) return null;

      const sentence =
        vocabItem.sentence_example_1 || vocabItem.sentence_example_2;
      if (!sentence) return null;

      const antonyms = lexiconEntry.relations?.antonyms || [];
      if (antonyms.length === 0) return null;

      const correctAnswer = antonyms[0];

      const wordsToConsider = [
        lexiconEntry.lemma,
        ...(lexiconEntry.surface_forms || []),
      ];

      let underlinedWord = lexiconEntry.lemma;
      for (const word of wordsToConsider) {
        const lowerSentence = sentence.toLowerCase();
        const lowerWord = word.toLowerCase();
        const wordRegex = new RegExp(`\\b${lowerWord}\\b`, "i");
        if (wordRegex.test(lowerSentence)) {
          underlinedWord = word;
          break;
        }
      }

      // Distractors: other lemmas and synonyms that are NOT antonyms
      const distractors: string[] = [];

      const otherLexicons = lexiconData.filter(
        (lex: LexiconItem) =>
          lex.lemma_id !== vocabItem.lemma_id &&
          lex.lemma !== correctAnswer &&
          !antonyms.includes(lex.lemma)
      );
      const shuffledLexicons = otherLexicons.sort(() => Math.random() - 0.5);

      // Add up to 2 random lemmas
      for (let i = 0; i < 2 && i < shuffledLexicons.length; i++) {
        distractors.push(shuffledLexicons[i].lemma);
      }

      // Add 1 synonym from other words if available
      const otherSynonyms: string[] = [];
      lexiconData.forEach((lex: LexiconItem) => {
        if (lex.lemma_id !== vocabItem.lemma_id && lex.relations?.synonyms) {
          otherSynonyms.push(
            ...lex.relations.synonyms.filter(
              (syn) => syn !== correctAnswer && !antonyms.includes(syn)
            )
          );
        }
      });

      const shuffledSynonyms = otherSynonyms.sort(() => Math.random() - 0.5);
      if (shuffledSynonyms.length > 0 && distractors.length < 3) {
        distractors.push(shuffledSynonyms[0]);
      }

      const uniqueDistractors = Array.from(new Set(distractors)).slice(0, 3);
      while (uniqueDistractors.length < 3 && shuffledLexicons.length > 0) {
        const randomLex =
          shuffledLexicons[Math.floor(Math.random() * shuffledLexicons.length)];
        if (
          !uniqueDistractors.includes(randomLex.lemma) &&
          randomLex.lemma !== correctAnswer
        ) {
          uniqueDistractors.push(randomLex.lemma);
        }
      }

      const allOptions = [correctAnswer, ...uniqueDistractors].sort(
        () => Math.random() - 0.5
      );

      const sentenceWithUnderline = underlineWordInSentence(
        sentence,
        underlinedWord
      );

      return {
        id: vocabItem.item_id,
        lemma_id: vocabItem.lemma_id,
        sentence: sentenceWithUnderline,
        underlinedWord,
        correctAnswer,
        options: allOptions,
      };
    })
    .filter((item): item is AntonymItem => item !== null);

  const shuffled = antonymItems.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(15, shuffled.length));
}

export default function AntonymExercisePage() {
  const { updateProgress } = useVocabularyProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();

  const [questions, setQuestions] = useState<AntonymItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<AntonymAnswer | null>(
    null
  );
  const [answers, setAnswers] = useState<AntonymAnswer[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuestions() {
      try {
        setIsLoading(true);
        const qs = await generateAntonymQuestionsFromService();
        if (qs.length === 0) {
          throw new Error("No antonym items available");
        }
        setQuestions(qs);
      } catch (err) {
        console.error("Failed to load antonym items:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load antonym items. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadQuestions();
  }, []);

  const currentQuestion = questions[currentIndex];

  const resetExercise = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setCurrentAnswer(null);
    setAnswers([]);
    setShowCompletion(false);
  };

  const handleSubmit = async () => {
    if (!currentQuestion || !selectedAnswer || submitting) return;
    setSubmitting(true);

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    const answer: AntonymAnswer = {
      isCorrect,
      selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      word: currentQuestion.underlinedWord,
    };

    setCurrentAnswer(answer);
    setAnswers((prev) => [...prev, answer]);

    // Error pattern features
    const lowFreq = isLowFrequencyWord(currentQuestion.underlinedWord);
    const similarChoiceError =
      !isCorrect &&
      currentQuestion.options.some((opt) =>
        areSimilarWords(opt, currentQuestion.correctAnswer)
      );

    const score = isCorrect ? 100 : 0;

    // --- NEW: send lexical performance event for difficulty modeling ---
    try {
      await reportLexicalItemPerformance({
        module: "vocabulary",
        exerciseType: "quiz", // treating antonym exercise as quiz-type
        lemmaId: currentQuestion.lemma_id,
        correctAnswer: currentQuestion.correctAnswer,
        userAnswer: selectedAnswer,
        difficultyShown: "medium", // UI-level difficulty; true difficulty from backend formula
        score,
      });
    } catch (e) {
      console.error("Failed to record antonym lexical performance", e);
    }

    // Update LearningProgressContext metrics
    addPerformanceMetrics("vocabulary", "antonym", {
      score,
      difficulty: "medium",
      missedLowFreq: !isCorrect && lowFreq ? 1 : 0,
      similarChoiceErrors: similarChoiceError ? 1 : 0,
    });

    const history = getPerformanceHistory("vocabulary", "antonym");
    const { nextDifficulty, tags } = evaluateUserPerformance(history);

    updateProgress("antonym", {
      lastScore: score,
      lastDifficulty: nextDifficulty,
      status: score >= 80 ? "completed" : "available",
    });

    console.log("Antonym adaptive tags:", tags);

    setSubmitting(false);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setCurrentAnswer(null);
    } else {
      setShowCompletion(true);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4" />
          <p className="text-pink-600 font-semibold">
            Loading antonym exercise...
          </p>
        </div>
      </div>
    );
  }

  if (error || !currentQuestion) {
    return (
      <div className="h-screen bg-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-red-600 font-semibold mb-4">
            {error || "No antonym items available."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-pink-50">
      {/* Top Bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-pink-200">
        <Link
          href="/vocabulary"
          className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vocabulary
        </Link>
        <button
          onClick={resetExercise}
          className="inline-flex items-center gap-2 text-pink-700 hover:text-pink-900 text-xs font-semibold border border-pink-200 rounded-full px-3 py-1 bg-pink-50"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Exercise
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row items-stretch max-w-5xl mx-auto w-full px-4 md:px-8 py-4 gap-4">
        {/* Question Area */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-2xl"
            >
              <AntonymQuestion
                sentence={currentQuestion.sentence}
                options={currentQuestion.options}
                selectedAnswer={selectedAnswer}
                onSelectAnswer={setSelectedAnswer}
                currentAnswer={currentAnswer}
              />
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer || submitting || !!currentAnswer}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-pink-600 text-white hover:bg-pink-700 text-sm font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check answer
            </button>
            <button
              onClick={handleNext}
              disabled={!currentAnswer}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-pink-700 border border-pink-200 hover:bg-pink-50 text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
              Next question
            </button>
          </div>
        </div>

        {/* Progress Sidebar */}
        <div className="w-full md:w-72 flex-shrink-0">
          <AntonymProgress
            total={questions.length}
            currentIndex={currentIndex}
            answers={answers}
          />
        </div>
      </div>

      {/* Completion Modal */}
      <AntonymCompletionModal
        isOpen={showCompletion}
        onClose={() => setShowCompletion(false)}
        onRestart={resetExercise}
        totalQuestions={questions.length}
        correctCount={answers.filter((a) => a.isCorrect).length}
      />
    </div>
  );
}
