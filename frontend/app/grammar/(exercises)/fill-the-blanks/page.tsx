"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";
import Link from "next/link";
import FillBlanksQuestion from "@/components/grammar/fill-the-blanks/FillBlanksQuestion";
import FillBlanksProgress from "@/components/grammar/fill-the-blanks/FillBlanksProgress";
import FillBlanksCompletionModal from "@/components/grammar/fill-the-blanks/FillBlanksCompletionModal";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import {
  getGrammarExercises,
  getLexiconData,
  GrammarExerciseItem,
  LexiconItem,
} from "@/lib/api/exercises";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";

interface FillBlanksAnswer {
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  sentence: string;
}

interface ProcessedFillBlanksItem {
  item_id: string;
  sentence: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
}

// Generate distractors from surface forms
function generateDistractorsFromSurfaceForms(
  lemmaId: string,
  correctAnswer: string,
  lexiconMap: Map<string, LexiconItem>
): string[] | null {
  const lexiconEntry = lexiconMap.get(lemmaId);

  if (!lexiconEntry) {
    console.warn(`No lexicon entry found for lemma_id: ${lemmaId}`);
    return null;
  }

  // Collect all possible words: lemma + surface forms
  const allWords = [lexiconEntry.lemma, ...(lexiconEntry.surface_forms || [])];

  // Remove duplicates and correct answer (case-insensitive comparison)
  const uniqueWords = Array.from(
    new Set(
      allWords
        .map((word) => word.toLowerCase())
        .filter((word) => word !== correctAnswer.toLowerCase())
    )
  ).map((lowerWord) => {
    // Find the original casing
    return allWords.find((w) => w.toLowerCase() === lowerWord) || lowerWord;
  });

  console.log(`Lemma ID: ${lemmaId}`);
  console.log(`Correct Answer: ${correctAnswer}`);
  console.log(`Available unique words:`, uniqueWords);
  console.log(`Count: ${uniqueWords.length}`);

  // We need at least 2 distractors (minimum 3 total choices including correct answer)
  if (uniqueWords.length < 2) {
    console.warn(
      `Insufficient surface forms for lemma_id ${lemmaId}. Need at least 2, got ${uniqueWords.length}. Skipping.`
    );
    return null;
  }

  // Shuffle all unique words
  const shuffled = uniqueWords.sort(() => Math.random() - 0.5);

  // Take 2-3 distractors depending on availability
  // Prefer 3 distractors (4 total choices), but accept 2 distractors (3 total choices)
  const distractorCount = Math.min(3, uniqueWords.length);
  const distractors = shuffled.slice(0, distractorCount);

  console.log(`Selected ${distractors.length} distractors:`, distractors);

  return distractors;
}

// Convert grammar items to fill-in-the-blanks format
function convertToFillBlanksFormat(
  items: GrammarExerciseItem[],
  lexiconMap: Map<string, LexiconItem>
): ProcessedFillBlanksItem[] {
  const processedItems: ProcessedFillBlanksItem[] = [];

  for (const item of items) {
    const correctAnswer = item.fillCorrectAnswer;

    // Generate distractors from surface forms
    const distractors = generateDistractorsFromSurfaceForms(
      item.lemma_id,
      correctAnswer,
      lexiconMap
    );

    // Skip if we couldn't generate enough distractors (need at least 2)
    if (!distractors || distractors.length < 2) {
      continue;
    }

    // Combine correct answer with distractors and shuffle
    const choices = [correctAnswer, ...distractors].sort(
      () => Math.random() - 0.5
    );

    console.log(
      `Item ${item.item_id}: Generated ${choices.length} total choices (1 correct + ${distractors.length} distractors)`
    );

    processedItems.push({
      item_id: item.item_id,
      sentence: item.fill_sentence,
      choices,
      correct_answer: correctAnswer,
      explanation: item.fill_explanation,
    });
  }

  return processedItems;
}

export default function GrammarFillBlanksPage() {
  const { updateProgress } = useGrammarProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();

  const [fillBlanksQuestions, setFillBlanksQuestions] = useState<
    ProcessedFillBlanksItem[]
  >([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<FillBlanksAnswer[]>(
    []
  );
  const [showCompletion, setShowCompletion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load questions from AI service
  useEffect(() => {
    async function loadQuestions() {
      try {
        setIsLoading(true);

        // Fetch both grammar exercises and lexicon data
        const [grammarExercises, lexiconData] = await Promise.all([
          getGrammarExercises(),
          getLexiconData(),
        ]);

        if (grammarExercises.length === 0) {
          throw new Error("No grammar exercises available");
        }

        console.log("📚 Loaded grammar exercises:", grammarExercises.length);
        console.log("📖 Loaded lexicon entries:", lexiconData.length);

        // Create lexicon map for quick lookup
        const lexiconMap = new Map(
          lexiconData.map((item: LexiconItem) => [item.lemma_id, item])
        );

        // Convert to fill-in-the-blanks format with generated distractors
        const processedItems = convertToFillBlanksFormat(
          grammarExercises,
          lexiconMap
        );

        console.log("✅ Processed fill-blanks items:", processedItems.length);

        if (processedItems.length === 0) {
          throw new Error(
            "No fill-in-the-blanks exercises could be generated. Please check that lexicon entries have sufficient surface forms (at least 2 unique forms)."
          );
        }

        console.log("📝 Sample question:", processedItems[0]);
        console.log(
          "📊 Choice counts:",
          processedItems.map((item) => ({
            id: item.item_id,
            choiceCount: item.choices.length,
          }))
        );

        // Shuffle and select 10 questions
        const shuffled = [...processedItems].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(10, shuffled.length));

        setFillBlanksQuestions(selected);
        setAnswers(Array(selected.length).fill(null));
        setError(null);
      } catch (err) {
        console.error("Failed to load exercises:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load exercises. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadQuestions();
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen bg-green-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-green-200">
          <Link
            href="/grammar"
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-green-900">
              Fill-in-the-Blanks
            </h1>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-green-600 font-semibold">Loading exercises...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || fillBlanksQuestions.length === 0) {
    return (
      <div className="h-screen bg-green-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-green-200">
          <Link
            href="/grammar"
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-green-900">
              Fill-in-the-Blanks
            </h1>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <p className="text-green-600 font-semibold mb-4">
              {error || "No exercises available"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentFillBlanks = fillBlanksQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === fillBlanksQuestions.length - 1;

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentFillBlanks.correct_answer;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = isCorrect;
    setAnswers(newAnswers);

    setDetailedAnswers([
      ...detailedAnswers,
      {
        isCorrect,
        selectedAnswer: answer,
        correctAnswer: currentFillBlanks.correct_answer,
        sentence: currentFillBlanks.sentence,
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
    const score = Math.round((correctCount / fillBlanksQuestions.length) * 100);

    let missedLowFreq = 0;
    let similarChoiceErrors = 0;

    detailedAnswers.forEach((answer) => {
      if (!answer.isCorrect) {
        similarChoiceErrors++;
      }
    });

    const history = getPerformanceHistory("grammar", "fill-blanks");
    const currentDifficulty =
      history.length > 0 ? history[history.length - 1].difficulty : "easy";

    const metrics = {
      difficulty: currentDifficulty,
      score,
      missedLowFreq,
      similarChoiceErrors,
      timestamp: new Date().toISOString(),
    };

    addPerformanceMetrics("grammar", "fill-blanks", metrics);

    const allHistory = [...history, metrics];
    const evaluation = evaluateUserPerformance(allHistory);

    updateProgress("fill-blanks", {
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
      const [grammarExercises, lexiconData] = await Promise.all([
        getGrammarExercises(),
        getLexiconData(),
      ]);

      const lexiconMap = new Map(
        lexiconData.map((item: LexiconItem) => [item.lemma_id, item])
      );

      const processedItems = convertToFillBlanksFormat(
        grammarExercises,
        lexiconMap
      );
      const shuffled = [...processedItems].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(10, shuffled.length));

      setFillBlanksQuestions(selected);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setAnswers(Array(selected.length).fill(null));
      setDetailedAnswers([]);
      setShowCompletion(false);
    } catch (err) {
      console.error("Failed to reload exercises:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-green-50 overflow-auto flex flex-col scrollbar-green">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-green-200">
        <Link
          href="/grammar"
          className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-green-900">
            Fill-in-the-Blanks
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
        <FillBlanksProgress
          currentQuestion={currentQuestion}
          totalQuestions={fillBlanksQuestions.length}
          answers={answers}
        />

        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <FillBlanksQuestion
            questionNumber={currentQuestion + 1}
            totalQuestions={fillBlanksQuestions.length}
            sentence={currentFillBlanks.sentence}
            choices={currentFillBlanks.choices}
            correctAnswer={currentFillBlanks.correct_answer}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={handleSelectAnswer}
            showResult={showResult}
            explanation={currentFillBlanks.explanation}
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
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors"
            >
              {isLastQuestion ? "Finish Exercise" : "Next Question"}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        ) : (
          <div className="text-center text-xs text-green-600">
            📝 Fill in the blank with the correct word
          </div>
        )}
      </div>

      <FillBlanksCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (answers.filter((a) => a === true).length /
            fillBlanksQuestions.length) *
            100
        )}
        correctCount={answers.filter((a) => a === true).length}
        totalQuestions={fillBlanksQuestions.length}
        onClose={() => setShowCompletion(false)}
        onRetake={resetExercise}
      />
    </div>
  );
}
