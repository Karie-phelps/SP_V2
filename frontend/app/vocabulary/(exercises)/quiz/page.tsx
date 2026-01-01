"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight, Lightbulb } from "lucide-react";
import Link from "next/link";
import QuizQuestion from "@/components/vocabulary/mcquiz-exercise/QuizQuestion";
import QuizProgress from "@/components/vocabulary/mcquiz-exercise/QuizProgress";
import QuizCompletionModal from "@/components/vocabulary/mcquiz-exercise/QuizCompletionModal";
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

interface QuizItem {
  id: string;
  lemma_id: string;
  sentence: string;
  underlinedWord: string;
  correctAnswer: string;
  options: string[];
  difficulty: string;
}

interface QuizAnswer {
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
  // Create a regex that matches the word (case-insensitive, whole word)
  const regex = new RegExp(`\\b(${wordToUnderline})\\b`, "gi");
  return sentence.replace(regex, "<u>$1</u>");
}

// Generate quiz questions from AI service data
async function generateQuizQuestionsFromService(): Promise<QuizItem[]> {
  const [vocabExercises, lexiconData] = await Promise.all([
    getVocabularyExercises(),
    getLexiconData(),
  ]);

  // Create a lookup map
  const lexiconMap = new Map(
    lexiconData.map((item: LexiconItem) => [item.lemma_id, item])
  );

  console.log("📚 Vocab Exercises:", vocabExercises.length);
  console.log("📖 Lexicon Data:", lexiconData.length);

  // Combine and prepare quiz items
  const quizItems: QuizItem[] = vocabExercises
    .map((vocabItem: VocabularyExerciseItem) => {
      const lexiconEntry = lexiconMap.get(vocabItem.lemma_id);

      if (!lexiconEntry) {
        console.warn(`⚠️ No lexicon entry for: ${vocabItem.lemma_id}`);
        return null;
      }

      // Choose an example sentence
      const sentence =
        vocabItem.sentence_example_1 || vocabItem.sentence_example_2;
      if (!sentence) {
        console.warn(`⚠️ No sentence for: ${vocabItem.lemma_id}`);
        return null;
      }

      // Randomly choose to underline either the lemma or a surface form
      const wordsToConsider = [
        lexiconEntry.lemma,
        ...(lexiconEntry.surface_forms || []),
      ];

      // Find which word actually appears in the sentence
      let underlinedWord = lexiconEntry.lemma;
      for (const word of wordsToConsider) {
        if (sentence.toLowerCase().includes(word.toLowerCase())) {
          underlinedWord = word;
          break;
        }
      }

      // Generate options with variation (50% meaning-based, 50% synonym-based)
      const useDefinitions = Math.random() > 0.5;

      let correctAnswer: string;
      let distractors: string[] = [];

      if (useDefinitions) {
        // Use base definitions as options
        correctAnswer = lexiconEntry.base_definition;

        // Get other definitions as distractors
        const otherLexicons = lexiconData.filter(
          (lex: LexiconItem) => lex.lemma_id !== vocabItem.lemma_id
        );
        const shuffled = otherLexicons.sort(() => Math.random() - 0.5);
        distractors = shuffled
          .slice(0, 3)
          .map((lex: LexiconItem) => lex.base_definition);
      } else {
        // Use synonyms as options (if available)
        const synonyms = lexiconEntry.relations?.synonyms || [];

        if (synonyms.length > 0) {
          correctAnswer = synonyms[0]; // Use first synonym as correct answer

          // Get synonyms from other words as distractors
          const otherSynonyms: string[] = [];
          lexiconData.forEach((lex: LexiconItem) => {
            if (
              lex.lemma_id !== vocabItem.lemma_id &&
              lex.relations?.synonyms
            ) {
              otherSynonyms.push(...lex.relations.synonyms);
            }
          });

          const shuffledSynonyms = otherSynonyms.sort(
            () => Math.random() - 0.5
          );
          distractors = shuffledSynonyms.slice(0, 3);
        } else {
          // Fallback to definitions if no synonyms
          correctAnswer = lexiconEntry.base_definition;
          const otherLexicons = lexiconData.filter(
            (lex: LexiconItem) => lex.lemma_id !== vocabItem.lemma_id
          );
          const shuffled = otherLexicons.sort(() => Math.random() - 0.5);
          distractors = shuffled
            .slice(0, 3)
            .map((lex: LexiconItem) => lex.base_definition);
        }
      }

      // Ensure we have exactly 3 unique distractors
      distractors = Array.from(new Set(distractors)).slice(0, 3);
      while (distractors.length < 3) {
        const randomLex =
          lexiconData[Math.floor(Math.random() * lexiconData.length)];
        if (
          randomLex.lemma_id !== vocabItem.lemma_id &&
          !distractors.includes(randomLex.base_definition)
        ) {
          distractors.push(randomLex.base_definition);
        }
      }

      // Shuffle all options
      const allOptions = [correctAnswer, ...distractors];
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
        difficulty: "medium", // You can add logic to determine difficulty
      };
    })
    .filter((item): item is QuizItem => item !== null);

  console.log("✅ Generated Quiz Items:", quizItems.length);

  // Shuffle and select 10 questions
  const shuffled = quizItems.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(10, shuffled.length));
}

export default function QuizPage() {
  const { updateProgress } = useVocabularyProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();

  const [quizQuestions, setQuizQuestions] = useState<QuizItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<QuizAnswer[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load quiz questions from AI service
  useEffect(() => {
    async function loadQuiz() {
      try {
        setIsLoading(true);
        const questions = await generateQuizQuestionsFromService();

        if (questions.length === 0) {
          throw new Error("No quiz questions available");
        }

        setQuizQuestions(questions);
        setAnswers(Array(questions.length).fill(null));
        setError(null);
      } catch (err) {
        console.error("Failed to load quiz:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load quiz. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadQuiz();
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen bg-purple-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-purple-200">
          <Link
            href="/vocabulary"
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-purple-900">
              Multiple Choice Quiz
            </h1>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-purple-600 font-semibold">Loading quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || quizQuestions.length === 0) {
    return (
      <div className="h-screen bg-purple-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-purple-200">
          <Link
            href="/vocabulary"
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-purple-900">
              Multiple Choice Quiz
            </h1>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <p className="text-red-600 font-semibold mb-4">
              {error || "No quiz questions available"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuiz = quizQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === quizQuestions.length - 1;
  const showExplanation =
    showResult &&
    selectedAnswer &&
    selectedAnswer !== currentQuiz.correctAnswer;

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentQuiz.correctAnswer;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = isCorrect;
    setAnswers(newAnswers);

    setDetailedAnswers([
      ...detailedAnswers,
      {
        isCorrect,
        selectedAnswer: answer,
        correctAnswer: currentQuiz.correctAnswer,
        word: currentQuiz.underlinedWord,
      },
    ]);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      completeQuiz();
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const completeQuiz = () => {
    const correctCount = answers.filter((a) => a === true).length;
    const score = Math.round((correctCount / quizQuestions.length) * 100);

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

    const history = getPerformanceHistory("vocabulary", "quiz");
    const currentDifficulty =
      history.length > 0 ? history[history.length - 1].difficulty : "easy";

    const metrics = {
      difficulty: currentDifficulty,
      score,
      missedLowFreq,
      similarChoiceErrors,
      timestamp: new Date().toISOString(),
    };

    addPerformanceMetrics("vocabulary", "quiz", metrics);

    const allHistory = [...history, metrics];
    const evaluation = evaluateUserPerformance(allHistory);

    updateProgress("quiz", {
      status: "completed",
      score,
      completedAt: new Date().toISOString(),
      attempts: (history.length || 0) + 1,
      lastDifficulty: evaluation.nextDifficulty,
      errorTags: evaluation.tags,
    });

    setShowCompletion(true);
  };

  const resetQuiz = async () => {
    try {
      setIsLoading(true);
      const questions = await generateQuizQuestionsFromService();
      setQuizQuestions(questions);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setAnswers(Array(questions.length).fill(null));
      setDetailedAnswers([]);
      setShowCompletion(false);
    } catch (err) {
      console.error("Failed to reload quiz:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-blue-50 overflow-auto flex flex-col scrollbar-blue">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-blue-200">
        <Link
          href="/vocabulary"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-blue-900">
            Multiple Choice Quiz
          </h1>
        </div>

        <button
          onClick={resetQuiz}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-700 font-semibold text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-start px-4 md:px-8 py-6 space-y-8 max-w-7xl mx-auto w-full">
        <QuizProgress
          currentQuestion={currentQuestion}
          totalQuestions={quizQuestions.length}
          answers={answers}
          wordId={currentQuiz.lemma_id}
        />

        {/* Question Component with Animation */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <QuizQuestion
            questionNumber={currentQuestion + 1}
            totalQuestions={quizQuestions.length}
            sentence={currentQuiz.sentence}
            wordId={currentQuiz.lemma_id}
            options={currentQuiz.options}
            correctAnswer={currentQuiz.correctAnswer}
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
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors"
            >
              {isLastQuestion ? "Finish Quiz" : "Next Question"}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        ) : (
          <div className="text-center text-xs text-blue-600">
            💡 Select the correct meaning for the underlined word
          </div>
        )}
      </div>

      <QuizCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (answers.filter((a) => a === true).length / quizQuestions.length) *
            100
        )}
        correctCount={answers.filter((a) => a === true).length}
        totalQuestions={quizQuestions.length}
        onClose={() => setShowCompletion(false)}
        onRetake={resetQuiz}
      />
    </div>
  );
}
