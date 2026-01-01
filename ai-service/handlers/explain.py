from fastapi import HTTPException
from typing import Optional
from pydantic import BaseModel

# Import data
try:
    from data.vocabulary_core import vocabulary_data
    from data.lexicon import lexicon_data
except ImportError as e:
    print(f"⚠️ Error importing data in explain handler: {e}")
    vocabulary_data = []
    lexicon_data = []

# Import OpenAI client
try:
    from openai import OpenAI
    import os
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except Exception as e:
    print(f"⚠️ Error initializing OpenAI in explain handler: {e}")
    openai_client = None


# ============================================================
# REQUEST/RESPONSE MODELS
# ============================================================

class ExplainRequest(BaseModel):
    mode: str  # "quiz" or "fill-blanks"
    word: str
    correct: str
    selected: Optional[str] = None


class ExplainResponse(BaseModel):
    explanation: str


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_word_data(word: str):
    """Find word data from lexicon"""
    try:
        # Search in lexicon_data for the word (lemma or surface form)
        for entry in lexicon_data:
            # Check if word matches lemma
            if entry.get("lemma", "").lower() == word.lower():
                return {
                    "word": entry.get("lemma"),
                    "meaning": entry.get("base_definition"),
                    "synonyms": entry.get("relations", {}).get("synonyms", []),
                    "antonyms": entry.get("relations", {}).get("antonyms", [])
                }
            # Check if word matches any surface form
            if word.lower() in [sf.lower() for sf in entry.get("surface_forms", [])]:
                return {
                    "word": word,
                    "meaning": entry.get("base_definition"),
                    "synonyms": entry.get("relations", {}).get("synonyms", []),
                    "antonyms": entry.get("relations", {}).get("antonyms", [])
                }
        return None
    except Exception as e:
        print(f"⚠️ Error in get_word_data: {e}")
        return None


def get_example_sentence(word: str):
    """Find example sentence from vocabulary_data"""
    try:
        # Search in vocabulary_data for sentences containing the word
        for entry in vocabulary_data:
            # Get the lexicon entry to find the lemma
            lexicon_entry = next(
                (lex for lex in lexicon_data if lex.get(
                    "lemma_id") == entry.get("lemma_id")),
                None
            )
            if lexicon_entry:
                lemma = lexicon_entry.get("lemma", "")
                surface_forms = lexicon_entry.get("surface_forms", [])

                # Check if word appears in lemma or surface forms
                if word.lower() in [lemma.lower()] + [sf.lower() for sf in surface_forms]:
                    # Return first available example
                    return entry.get("sentence_example_1") or entry.get("sentence_example_2") or ""
        return ""
    except Exception as e:
        print(f"⚠️ Error in get_example_sentence: {e}")
        return ""


def build_explanation_prompt(data: dict) -> str:
    """Generate explanation prompt"""
    mode = data["mode"]
    word = data["word"]
    correct = data["correct"]
    selected = data.get("selected")
    definition = data.get("definition", correct)
    example = data.get("example", "")

    if mode == "quiz":
        base_prompt = f"""You are a helpful Filipino language tutor for UPCAT preparation.

Context:
- Salitang tinatalakay: {word}
- Tamang kahulugan: {correct}
- Official na kahulugan: {definition}"""

        if example:
            base_prompt += f"\n- Halimbawang pangungusap: {example}"

        if selected:
            base_prompt += f"\n- Napili ng estudyante: {selected}"

        base_prompt += """

Gawain:
Ipaliwanag kung bakit tama ang tamang sagot at kung bakit mali ang napili ng estudyante. Gumamit ng simpleng Filipino.

Magbigay ng 4 na punto:
1) Bakit tama ang tamang sagot (gamitin ang kahulugan)
2) Bakit mali ang napiling sagot (ipaliwanag ang pagkakaiba)
3) Maikling talang pangbokabularyo o gramatika (isang pangungusap)
4) Tip para sa mabilis na pagsagot sa pagsusulit (isang pangungusap)

Gumamit ng mga bullet points at panatilihing maikli at malinaw."""

        return base_prompt

    # Fill-in-the-blanks mode
    return f"""You are a helpful Filipino language tutor for UPCAT preparation.

Context:
- Tamang salita: {correct}
- Official na kahulugan: {definition}
- Halimbawang pangungusap: {example}
- Isinulat ng estudyante: "{selected}"

Gawain:
Ang estudyante ay mali ang sagot sa pag-fill in the blank. I-analyze ang kanilang sagot.

Magbigay ng 4 na punto:
1) Bakit "{correct}" ang tamang sagot
2) Ang isinulat ba ay wastong salita? Kung oo, ano ang kahulugan? Kung hindi, sabihin na invalid/mali.
3) Maikling talang pangbokabularyo o gramatika
4) Tip para sa mabilis na pagsagot

Gumamit ng mga bullet points at Filipino language."""


# ============================================================
# MAIN HANDLER FUNCTION
# ============================================================

async def handle_explain(request: ExplainRequest) -> ExplainResponse:
    """
    Main handler function for AI explanation generation.
    This is called from main.py
    """
    try:
        print(
            f"📝 Explain request - Word: {request.word}, Mode: {request.mode}")

        # Check if OpenAI client is available
        if not openai_client:
            raise HTTPException(
                status_code=503,
                detail="OpenAI service not available"
            )

        # Get word data from lexicon
        word_data = get_word_data(request.word)

        if word_data:
            definition = word_data["meaning"]
            print(f"✅ Found word data: {definition[:50]}...")
        else:
            definition = request.correct
            print(f"⚠️ Word not found in lexicon, using correct answer as definition")

        # Get example sentence
        example = get_example_sentence(request.word)
        if example:
            print(f"✅ Found example sentence")
        else:
            print(f"⚠️ No example sentence found")

        # Generate prompt
        prompt = build_explanation_prompt({
            "mode": request.mode,
            "word": request.word,
            "correct": request.correct,
            "selected": request.selected,
            "definition": definition,
            "example": example
        })

        print(f"🤖 Calling OpenAI API...")

        # Call OpenAI
        completion = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.2,
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful Filipino language tutor. Be concise, accurate, and friendly. Always respond in Filipino unless asked otherwise."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        explanation = completion.choices[0].message.content or ""
        print(f"✅ Generated explanation ({len(explanation)} chars)")

        return ExplainResponse(explanation=explanation)

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"❌ Error in handle_explain: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
