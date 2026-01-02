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
  VocabularyExerciseItem,
  LexiconItem,
} from "@/lib/api/exercises";
import {
  isLowFrequencyWord,
  areSimilarWords,
} from "@/utils/PerformanceTracker";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";

interface AntonymItem {
  id: string;
  lemma_id: string;
  sentence: string;
  underlinedWord: string;
  correctAnswer: string;
  options: string[];
  difficulty: string;
}

interface AntonymAnswer {
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  word: string;
}

// Helper function to underline a word in a sentence (FIXED VERSION)
function underlineWordInSentence(
  sentence: string,
  wordToUnderline: string
): string {
  // Escape special regex characters in the word
  const escapedWord = wordToUnderline.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Create a case-insensitive regex that matches whole words
  // Uses positive lookbehind (?<=\s|^) for start of string or space
  // and positive lookahead (?=\s|$|[.,!?;:]) for end or punctuation
  const regex = new RegExp(
    `(?<=\\s|^)(${escapedWord})(?=\\s|$|[.,!?;:])`,
    "gi"
  );

  // Replace all occurrences while preserving the original case
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

  // Filter items that have antonyms
  const itemsWithAntonyms = vocabExercises.filter((vocabItem) => {
    const lexiconEntry = lexiconMap.get(vocabItem.lemma_id);
    return (
      lexiconEntry &&
      lexiconEntry.relations?.antonyms &&
      lexiconEntry.relations.antonyms.length > 0
    );
  });

  console.log("🔄 Items with antonyms:", itemsWithAntonyms.length);

  // Generate antonym questions
  const antonymItems: AntonymItem[] = itemsWithAntonyms
    .map((vocabItem: VocabularyExerciseItem) => {
      const lexiconEntry = lexiconMap.get(vocabItem.lemma_id);

      if (!lexiconEntry) return null;

      const sentence =
        vocabItem.sentence_example_1 || vocabItem.sentence_example_2;
      if (!sentence) return null;

      // Get the antonyms for this word
      const antonyms = lexiconEntry.relations?.antonyms || [];
      if (antonyms.length === 0) return null;

      // Choose the first antonym as the correct answer
      const correctAnswer = antonyms[0];

      // Find which word form appears in the sentence (case-insensitive)
      const wordsToConsider = [
        lexiconEntry.lemma,
        ...(lexiconEntry.surface_forms || []),
      ];

      let underlinedWord = lexiconEntry.lemma;
      for (const word of wordsToConsider) {
        const lowerSentence = sentence.toLowerCase();
        const lowerWord = word.toLowerCase();

        // Check if the word appears as a whole word in the sentence
        const wordRegex = new RegExp(`\\b${lowerWord}\\b`, "i");
        if (wordRegex.test(lowerSentence)) {
          underlinedWord = word;
          break;
        }
      }

      // Generate distractors: mix of lemmas and synonyms
      const distractors: string[] = [];

      // Add some random lemmas as distractors
      const otherLexicons = lexiconData.filter(
        (lex: LexiconItem) =>
          lex.lemma_id !== vocabItem.lemma_id &&
          lex.lemma !== correctAnswer &&
          !antonyms.includes(lex.lemma)
      );

      const shuffledLexicons = otherLexicons.sort(() => Math.random() - 0.5);

      // Add 2 random lemmas
      for (let i = 0; i < 2 && i < shuffledLexicons.length; i++) {
        distractors.push(shuffledLexicons[i].lemma);
      }

      // Add synonyms from other words as distractors
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

      // Add 1 synonym if available
      if (shuffledSynonyms.length > 0 && distractors.length < 3) {
        distractors.push(shuffledSynonyms[0]);
      }

      // Ensure we have exactly 3 unique distractors
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

      // Shuffle all options
      const allOptions = [correctAnswer, ...uniqueDistractors];
      const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);

      // Underline the word in the sentence
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
        options: shuffledOptions,
        difficulty: "medium",
      };
    })
    .filter((item): item is AntonymItem => item !== null);

  console.log("✅ Generated Antonym Items:", antonymItems.length);

  // Shuffle and select 10 questions
  const shuffled = antonymItems.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(10, shuffled.length));
}

export default function AntonymPage() {
  const { updateProgress } = useVocabularyProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();

  const [antonymQuestions, setAntonymQuestions] = useState<AntonymItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<AntonymAnswer[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAntonyms() {
      try {
        setIsLoading(true);
        const questions = await generateAntonymQuestionsFromService();

        if (questions.length === 0) {
          throw new Error("No antonym questions available");
        }

        setAntonymQuestions(questions);
        setAnswers(Array(questions.length).fill(null));
        setError(null);
      } catch (err) {
        console.error("Failed to load antonym exercise:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load antonym exercise. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadAntonyms();
  }, []);

  // ... rest of the component remains the same

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen bg-red-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-red-200">
          <Link
            href="/vocabulary"
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-red-900">
              Antonym Exercise
            </h1>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-red-600 font-semibold">Loading exercise...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || antonymQuestions.length === 0) {
    return (
      <div className="h-screen bg-red-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-red-200">
          <Link
            href="/vocabulary"
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-red-900">
              Antonym Exercise
            </h1>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <p className="text-red-600 font-semibold mb-4">
              {error || "No antonym questions available"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentAntonym = antonymQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === antonymQuestions.length - 1;
  const showExplanation =
    showResult &&
    selectedAnswer &&
    selectedAnswer !== currentAntonym.correctAnswer;

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentAntonym.correctAnswer;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = isCorrect;
    setAnswers(newAnswers);

    setDetailedAnswers([
      ...detailedAnswers,
      {
        isCorrect,
        selectedAnswer: answer,
        correctAnswer: currentAntonym.correctAnswer,
        word: currentAntonym.underlinedWord,
      },
    ]);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      completeExercise();
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const completeExercise = () => {
    const correctCount = answers.filter((a) => a === true).length;
    const score = Math.round((correctCount / antonymQuestions.length) * 100);

    // Calculate performance metrics
    let missedLowFreq = 0;
    let similarChoiceErrors = 0;

    detailedAnswers.forEach((answer) => {
      if (!answer.isCorrect && isLowFrequencyWord(answer.word)) {
        missedLowFreq++;
      }
      if (!answer.isCorrect) {
        similarChoiceErrors++;
      }
    });

    const history = getPerformanceHistory("vocabulary", "antonym");
    const currentDifficulty =
      history.length > 0 ? history[history.length - 1].difficulty : "easy";

    const metrics = {
      difficulty: currentDifficulty,
      score,
      missedLowFreq,
      similarChoiceErrors,
      timestamp: new Date().toISOString(),
    };

    addPerformanceMetrics("vocabulary", "antonym", metrics);

    const allHistory = [...history, metrics];
    const evaluation = evaluateUserPerformance(allHistory);

    updateProgress("antonym", {
      status: "completed",
      score,
      completedAt: new Date().toISOString(),
      attempts: (history.length || 0) + 1,
      lastDifficulty: evaluation.nextDifficulty,
      errorTags: evaluation.tags,
    });

    setShowCompletion(true);
  };

  const resetExercise = async () => {
    try {
      setIsLoading(true);
      const questions = await generateAntonymQuestionsFromService();
      setAntonymQuestions(questions);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setAnswers(Array(questions.length).fill(null));
      setDetailedAnswers([]);
      setShowCompletion(false);
    } catch (err) {
      console.error("Failed to reload exercise:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-red-50 overflow-auto flex flex-col scrollbar-red">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-red-200">
        <Link
          href="/vocabulary"
          className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-red-900">
            Antonym Exercise
          </h1>
        </div>

        <button
          onClick={resetExercise}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-700 font-semibold text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-start px-4 md:px-8 py-6 space-y-8 max-w-7xl mx-auto w-full">
        <AntonymProgress
          currentQuestion={currentQuestion}
          totalQuestions={antonymQuestions.length}
          answers={answers}
          id={currentAntonym.lemma_id}
        />

        {/* Question Component with Animation */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <AntonymQuestion
            questionNumber={currentQuestion + 1}
            totalQuestions={antonymQuestions.length}
            sentence={currentAntonym.sentence}
            wordId={currentAntonym.lemma_id}
            options={currentAntonym.options}
            correctAnswer={currentAntonym.correctAnswer}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={handleSelectAnswer}
            showResult={showResult}
          />
        </motion.div>

        {showResult ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors"
            >
              {isLastQuestion ? "Finish Exercise" : "Next Question"}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        ) : (
          <div className="text-center text-xs text-red-600">
            💡 Select the antonym of the underlined word
          </div>
        )}
      </div>

      <AntonymCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (answers.filter((a) => a === true).length / antonymQuestions.length) *
            100
        )}
        correctCount={answers.filter((a) => a === true).length}
        totalQuestions={antonymQuestions.length}
        onClose={() => setShowCompletion(false)}
      />
    </div>
  );
}
