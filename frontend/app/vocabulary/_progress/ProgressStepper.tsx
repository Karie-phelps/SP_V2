// "use client";

// import { useVocabularyProgress } from "@/hooks/useVocabularyProgress";
// import { Check, Lock, Circle } from "lucide-react";

// const steps = [
//   { id: "flashcards", label: "Flashcards", number: 1 },
//   { id: "quiz", label: "Quiz", number: 2 },
//   { id: "fill-blanks", label: "Fill-in-the-Blanks", number: 3 },
// ];

// export default function ProgressStepper() {
//   const { progress } = useVocabularyProgress();

//   return (
//     <div className="w-full max-w-3xl mx-auto mb-8">
//       <div className="flex items-center justify-between relative">
//         {/* Progress Line */}
//         <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
//           <div
//             className="h-full bg-purple-600 transition-all duration-500"
//             style={{
//               width: `${
//                 (Object.values(progress).filter((p) => p.status === "completed")
//                   .length /
//                   3) *
//                 100
//               }%`,
//             }}
//           />
//         </div>

//         {steps.map((step, index) => {
//           const exerciseProgress = progress[step.id as keyof typeof progress];
//           const isCompleted = exerciseProgress.status === "completed";
//           const isAvailable =
//             exerciseProgress.status === "available" ||
//             exerciseProgress.status === "in-progress";
//           const isLocked = exerciseProgress.status === "locked";

//           return (
//             <div key={step.id} className="flex flex-col items-center relative">
//               {/* Circle */}
//               <div
//                 className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
//                   isCompleted
//                     ? "bg-purple-600 text-white"
//                     : isAvailable
//                     ? "bg-purple-100 text-purple-600 border-2 border-purple-600"
//                     : "bg-gray-200 text-gray-400"
//                 }`}
//               >
//                 {isCompleted ? (
//                   <Check size={20} />
//                 ) : isLocked ? (
//                   <Lock size={16} />
//                 ) : (
//                   <Circle size={16} />
//                 )}
//               </div>

//               {/* Label */}
//               <span
//                 className={`mt-2 text-xs md:text-sm font-medium text-center max-w-[80px] ${
//                   isCompleted || isAvailable
//                     ? "text-purple-900"
//                     : "text-gray-400"
//                 }`}
//               >
//                 {step.label}
//               </span>

//               {/* Score badge */}
//               {isCompleted && exerciseProgress.score !== null && (
//                 <span className="mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
//                   {exerciseProgress.score}%
//                 </span>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }
