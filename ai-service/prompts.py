def explanation_prompt(input: dict) -> str:
    mode = input["mode"]
    word = input["word"]
    correct = input["correct"]
    selected = input.get("selected")
    definition = input["definition"]
    example = input["example"]

    if mode == "quiz":
        return f"""
You are a helpful Filipino language coach for UPCAT prep.

Facts you MUST use:
- Word: {word}
- Correct meaning: {correct}
- Official definition: {definition}
- Example sentence: {example}
- Student selected: {selected}

Task:
Explain why the correct meaning is correct and why the selected choice is wrong.

Output 4 bullets:
1) Why the correct answer is correct (use the definition).
2) Why the selected choice is wrong (explain the difference or trap).
3) A quick vocabulary/grammar note (one sentence).
4) A time-pressure tip (one sentence).
""".strip()

    return f"""
You are a helpful Filipino language coach for UPCAT prep.

Facts you MUST use:
- Correct word: {correct}
- Official definition: {definition}
- Example sentence: {example}
- Student submitted: "{selected}"

Task:
The student filled in the blank incorrectly. Analyze their answer step-by-step:

1) First, determine if "{selected}" is a valid Filipino word or gibberish/typo.
2) If it's gibberish or a typo:
   - Say it's not a valid Filipino word.
   - Point out the correct word is "{correct}" which means "{definition}".
   - If it's a near-miss spelling, mention the spelling error.
3) If it's a real Filipino word but wrong:
   - Briefly state what "{selected}" means.
   - Explain why it doesn't fit the sentence context.
   - Clarify why "{correct}" is the right fit.

Output 4 bullets:
1) Why "{correct}" is the correct answer.
2) Is the submitted answer valid?
3) A quick vocabulary/grammar note.
4) A time-pressure tip.
""".strip()


def tips_prompt(input: dict) -> str:
    return f"""
You are a coach for UPCAT Filipino.

Student summary:
- Score: {input["score"]}%
- Missed low-frequency words: {input["missedLowFreq"]}
- Similar-choice errors: {input["similarChoiceErrors"]}
- Last difficulty: {input["lastDifficulty"]}

Give:
- 3 short, actionable tips (bullets)
- A 15–20 minute plan with concrete steps (bullets)
""".strip()


def redefine_prompt(input: dict) -> str:
    return f"""
Rewrite the definition and examples for Filipino word "{input["word"]}".

Base meaning: {input["baseMeaning"]}
Base example: {input["example"]}

Return:
- Easy definition (casual, English)
- Brief formal definition (academic, Filipino)
- 2 new example sentences (Filipino)
- 1 short bilingual gloss
""".strip()
