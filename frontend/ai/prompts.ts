export  function explanationPrompt(input: {
  mode: "quiz" | "fill-blanks";
  word: string;
  stem?: string;
  correct: string;
  selected?: string;
  definition: string;
  example: string;
}) {
  const { mode, word, correct, selected, definition, example } = input;

  if (mode === "quiz") {
    return `You are a helpful Filipino language coach for UPCAT prep. 

Facts you MUST use:
- Word: ${word}
- Correct meaning: ${correct}
- Official definition: ${definition}
- Example sentence: ${example}
- Student selected: ${selected}

Task:
Explain why the correct meaning is correct and why the selected choice is wrong. 

Output 4 bullets:
1) Why the correct answer is correct (use the definition). 
2) Why the selected choice is wrong (explain the difference or trap).
3) A quick vocabulary/grammar note (one sentence).
4) A time-pressure tip (one sentence).`;
  }

  // mode === "fill-blanks"
  return `You are a helpful Filipino language coach for UPCAT prep.

Facts you MUST use:
- Correct word: ${correct}
- Official definition: ${definition}
- Example sentence: ${example}
- Student submitted: "${selected}"

Task:
The student filled in the blank incorrectly. Analyze their answer step-by-step:

1) First, determine if "${selected}" is a valid Filipino word or gibberish/typo.
2) If it's gibberish or a typo:
   - Say it's not a valid Filipino word. 
   - Point out the correct word is "${correct}" which means "${definition}".
   - If it's a near-miss spelling of "${correct}", mention the spelling error.
3) If it's a real Filipino word but wrong:
   - Briefly state what "${selected}" means. 
   - Explain why it doesn't fit the sentence context.
   - Clarify why "${correct}" (${definition}) is the right fit. 

Output 4 bullets:
1) Why "${correct}" is the correct answer (use the definition and sentence context).
2) Is the submitted answer a valid word? If yes, what does it mean?  If no, say it's invalid/gibberish.
3) A quick vocabulary/grammar note (one sentence).
4) A time-pressure tip (one sentence, e.g., use context clues or word roots).`;
}

export function tipsPrompt(input: {
  score: number;
  missedLowFreq: number;
  similarChoiceErrors: number;
  lastDifficulty: "easy" | "medium" | "hard";
  module: "vocabulary";
}) {
  const { score, missedLowFreq, similarChoiceErrors, lastDifficulty } = input;
  return `You are a coach for UPCAT Filipino. 

Student summary:
- Score: ${score}%
- Missed low-frequency words: ${missedLowFreq}
- Similar-choice errors: ${similarChoiceErrors}
- Last difficulty: ${lastDifficulty}

Give:
- 3 short, actionable tips (bullets)
- A 15–20 minute plan with concrete steps (bullets)`;
}

export function redefinePrompt(input: {
  word: string;
  baseMeaning: string;
  example: string;
}) {
  const { word, baseMeaning, example } = input;
  return `Rewrite the definition and examples for Filipino word "${word}".

Base meaning: ${baseMeaning}
Base example: ${example}

Return:
- Easy definition (casual, must be in English)
- Formal definition (academic)
- 2 new example sentences (Filipino)
- 1 short bilingual gloss (Filipino)`;
}