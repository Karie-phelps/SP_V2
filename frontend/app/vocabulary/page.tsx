// "use client";

// import VocabularyCard from "@/components/VocabularyCard";
// import ProgressStepper from "./_progress/ProgressStepper";
// import { useVocabularyProgress } from "@/hooks/useVocabularyProgress";

// export default function VocabularyPage() {
//   const { getOverallProgress } = useVocabularyProgress();

//   return (
//     <div className="w-full min-h-screen flex items-center justify-center p-4 md:p-10 bg-gray-50">
//       <div className="w-full max-w-6xl">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl md:text-4xl font-bold text-purple-900 mb-2 text-center">
//             Vocabulary Activities
//           </h1>
//           <p className="text-center text-gray-600 mb-6">
//             Complete all exercises to master Filipino vocabulary
//           </p>

//           {/* Progress Stepper */}
//           <ProgressStepper />

//           {/* Overall Progress */}
//           <div className="text-center mt-4">
//             <span className="text-sm text-gray-600">Overall Progress: </span>
//             <span className="text-lg font-bold text-purple-600">
//               {getOverallProgress()}%
//             </span>
//           </div>
//         </div>

//         {/* Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
//           <VocabularyCard
//             name="Flashcards"
//             description="Practice with interactive flashcards"
//             imagePath="/art/card1.png"
//             color="bg-yellow-50"
//             url="/vocabulary/flashcards"
//             exerciseType="flashcards"
//           />
//           <VocabularyCard
//             name="Multiple Choice Quiz"
//             description="Test your knowledge with quizzes"
//             imagePath="/art/card2.png"
//             color="bg-blue-50"
//             url="/vocabulary/quiz"
//             exerciseType="quiz"
//           />
//           <VocabularyCard
//             name="Fill-in-the-Blanks"
//             description="Complete sentences with correct words"
//             imagePath="/art/flashcards-icon.png"
//             color="bg-green-50"
//             url="/vocabulary/fill-blanks"
//             exerciseType="fill-blanks"
//           />
//         </div>
//       </div>
//     </div>
//   );
// }
