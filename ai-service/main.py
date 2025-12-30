from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import sys
from dotenv import load_dotenv
# from data import lexicon, vocabulary_core, grammar_core, sentence_construction_core
try:
    from data.vocabulary_core import vocabulary_data
    from data.lexicon import lexicon_data
    from data.grammar_core import grammar_data
    from data.sentence_construction_core import sentence_construction_data
    print(f"✅ Loaded {len(vocabulary_data)} vocabulary items")
    print(f"✅ Loaded {len(lexicon_data)} lexicon items")
except ImportError as e:
    print(f"⚠️ Error loading data modules: {e}")
    vocabulary_data = []
    lexicon_data = []
    grammar_data = []
    sentence_construction_data = []


# Load environment variables FIRST
load_dotenv()

# Verify OpenAI API key exists
api_key = os.getenv("OPENAI_API_KEY")
if not api_key or api_key == "your_openai_api_key_here":
    print("❌ ERROR: OPENAI_API_KEY not set in .env file")
    print("Please edit ai-service/.env and add your OpenAI API key")
    sys.exit(1)

# Import OpenAI after env check
try:
    from openai import OpenAI
    openai_client = OpenAI(api_key=api_key)
    print("✅ OpenAI client initialized successfully")
except Exception as e:
    print(f"❌ ERROR initializing OpenAI client: {e}")
    print("\nTry running: pip install --upgrade openai httpx")
    sys.exit(1)

# Initialize FastAPI
app = FastAPI(
    title="UPCAT Filipino Reviewer AI Service",
    description="AI-powered Filipino language learning service for UPCAT preparation",
    version="1.0.0"
)

# CORS Configuration
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


class TipsRequest(BaseModel):
    score: int
    missedLowFreq: int
    similarChoiceErrors: int
    lastDifficulty: str
    module: str


class TipsResponse(BaseModel):
    tips: str


class RedefineRequest(BaseModel):
    word: str
    baseMeaning: str
    example: str


class RedefineResponse(BaseModel):
    content: str


class ConfusablesRequest(BaseModel):
    word: str
    topK: Optional[int] = 3


class ConfusableWord(BaseModel):
    word: str
    meaning: str
    example: str


class ConfusablesResponse(BaseModel):
    results: List[ConfusableWord]


class HealthResponse(BaseModel):
    status: str
    message: str
    openai_configured: bool


class DetailedHealthResponse(BaseModel):
    service: str
    openai_key_configured: bool
    vocabulary_data_loaded: bool
    vocabulary_count: Optional[int] = None

# ============================================================
# HELPER FUNCTIONS
# ============================================================


def get_vocabulary_entry(word: str):
    """Load vocabulary data and find entry"""
    try:
        # from data.vocabulary_core import vocabulary_data
        return next((v for v in vocabulary_data if v["word"] == word), None)
    except ImportError:
        print("⚠️  Warning: vocabulary_core.py not found")
        return None


def explanation_prompt(data: dict) -> str:
    """Generate explanation prompt"""
    mode = data["mode"]
    word = data["word"]
    correct = data["correct"]
    selected = data.get("selected")
    definition = data["definition"]
    example = data["example"]

    if mode == "quiz":
        return f"""You are a helpful Filipino language coach for UPCAT prep.

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
4) A time-pressure tip (one sentence)."""

    return f"""You are a helpful Filipino language coach for UPCAT prep.

Facts you MUST use:
- Correct word: {correct}
- Official definition: {definition}
- Example sentence: {example}
- Student submitted: "{selected}"

Task:
The student filled in the blank incorrectly. Analyze their answer step-by-step.

Output 4 bullets:
1) Why "{correct}" is the correct answer.
2) Is the submitted answer a valid word? If yes, what does it mean? If no, say it's invalid/gibberish.
3) A quick vocabulary/grammar note.
4) A time-pressure tip."""


def tips_prompt(data: dict) -> str:
    """Generate tips prompt"""
    return f"""You are a coach for UPCAT Filipino.

Student summary:
- Score: {data["score"]}%
- Missed low-frequency words: {data["missedLowFreq"]}
- Similar-choice errors: {data["similarChoiceErrors"]}
- Last difficulty: {data["lastDifficulty"]}

Give:
- 3 short, actionable tips (bullets)
- A 15–20 minute plan with concrete steps (bullets)"""


def redefine_prompt(data: dict) -> str:
    """Generate redefine prompt"""
    return f"""Rewrite the definition and examples for Filipino word "{data["word"]}".

Base meaning: {data["baseMeaning"]}
Base example: {data["example"]}

Return:
- Easy definition (casual, must be in English)
- Brief formal definition (academic, must be in Filipino)
- 2 new example sentences (Filipino)
- 1 short bilingual gloss (Filipino)"""

# ============================================================
# ENDPOINTS
# ============================================================


@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    return HealthResponse(
        status="running",
        message="UPCAT Filipino AI Service",
        openai_configured=bool(api_key)
    )


@app.get("/health", response_model=DetailedHealthResponse)
async def health_check():
    """Detailed health check"""
    checks = {
        "service": "online",
        "openai_key_configured": bool(api_key),
        "vocabulary_data_loaded": False,
    }

    try:
        # from data.vocabulary_core import vocabulary_data
        checks["vocabulary_data_loaded"] = len(vocabulary_data) > 0
        checks["vocabulary_count"] = len(vocabulary_data)
    except ImportError:
        pass

    return checks


@app.post("/explain", response_model=ExplainResponse)
async def explain(request: ExplainRequest):
    """Generate AI explanation for incorrect answers"""
    try:
        # Get vocabulary entry
        entry = get_vocabulary_entry(request.word)
        definition = entry["meaning"] if entry else request.correct
        example = entry["example"] if entry else ""

        # Generate prompt
        prompt = explanation_prompt({
            "mode": request.mode,
            "word": request.word,
            "correct": request.correct,
            "selected": request.selected,
            "definition": definition,
            "example": example
        })

        # Call OpenAI
        completion = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.2,
            messages=[
                {"role": "system", "content": "Be concise, accurate, and friendly."},
                {"role": "user", "content": prompt}
            ]
        )

        explanation = completion.choices[0].message.content or ""
        return ExplainResponse(explanation=explanation)

    except Exception as e:
        print(f"Error in /explain: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tips", response_model=TipsResponse)
async def generate_tips(request: TipsRequest):
    """Generate personalized study tips"""
    try:
        prompt = tips_prompt(request.dict())

        completion = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.3,
            messages=[
                {"role": "system", "content": "Be practical and concise."},
                {"role": "user", "content": prompt}
            ]
        )

        tips = completion.choices[0].message.content or ""
        return TipsResponse(tips=tips)

    except Exception as e:
        print(f"Error in /tips: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/redefine", response_model=RedefineResponse)
async def redefine_word(request: RedefineRequest):
    """Redefine word with multiple perspectives"""
    try:
        prompt = redefine_prompt(request.dict())

        completion = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.2,
            messages=[
                {"role": "system", "content": "Return concise teaching content."},
                {"role": "user", "content": prompt}
            ]
        )

        content = completion.choices[0].message.content or ""
        return RedefineResponse(content=content)

    except Exception as e:
        print(f"Error in /redefine: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/confusables", response_model=ConfusablesResponse)
async def find_confusables(request: ConfusablesRequest):
    """Find similar/confusing words using embeddings"""
    try:
        # from data.vocabulary_core import vocabulary_data
        import math

        def cosine_similarity(a, b):
            dot = sum(x * y for x, y in zip(a, b))
            na = math.sqrt(sum(x * x for x in a))
            nb = math.sqrt(sum(x * x for x in b))
            return dot / (na * nb + 1e-9)

        # Get all candidate words
        candidates = [v["word"] for v in vocabulary_data]

        # Get embeddings
        target_emb = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=request.word
        ).data[0].embedding

        cand_embs = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=candidates
        ).data

        # Calculate similarities
        scored = []
        for i, emb_data in enumerate(cand_embs):
            if candidates[i] != request.word:
                score = cosine_similarity(target_emb, emb_data.embedding)
                scored.append({"word": candidates[i], "score": score})

        # Get top K
        ranked = sorted(scored, key=lambda x: x["score"], reverse=True)[
            :request.topK]

        # Build results
        results = []
        for r in ranked:
            entry = next(v for v in vocabulary_data if v["word"] == r["word"])
            results.append(ConfusableWord(
                word=r["word"],
                meaning=entry["meaning"],
                example=entry["example"]
            ))

        return ConfusablesResponse(results=results)

    except Exception as e:
        print(f"Error in /confusables: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# STARTUP
# ============================================================


@app.on_event("startup")
async def startup_event():
    """Run on startup"""
    print("\n" + "="*60)
    print("🚀 UPCAT Filipino AI Service Starting...")
    print("="*60)
    print(f"✅ OpenAI API Key: {'Configured' if api_key else 'Missing'}")

    try:
        # from data.vocabulary_core import vocabulary_data
        print(f"✅ Vocabulary Data: {len(vocabulary_data)} words loaded")
    except ImportError:
        print("⚠️  Vocabulary Data: Not found (vocabulary_core.py missing)")

    print("="*60)
    print(f"🌐 Server running on http://localhost:8001")
    print(f"📚 API Docs: http://localhost:8001/docs")
    print("="*60 + "\n")


# ============================================================
# DATA EXERCISES
# ============================================================


@app.get("/exercises/vocabulary")
async def get_vocabulary_exercises():
    try:
        # from data.vocabulary_core import vocabulary_data
        return {
            "success": True,
            "exercises": vocabulary_data,
            "count": len(vocabulary_data)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error loading vocabulary data: {str(e)}"
        )


@app.get("/exercises/lexicon")
async def get_lexicon_exercises():
    if not lexicon_data:
        raise HTTPException(status_code=404, detail="Lexicon data not loaded")
    return {"exercises": lexicon_data, "count": len(lexicon_data)}


@app.get("/exercises/grammar")
async def get_grammar_exercises():
    if not grammar_data:
        raise HTTPException(status_code=404, detail="Grammar data not loaded")
    return {"exercises": grammar_data, "count": len(grammar_data)}


@app.get("/debug/data-status")
async def debug_data_status():
    status = {}

    try:
        # from data.vocabulary_core import vocabulary_data
        status["vocabulary"] = {"loaded": True, "count": len(vocabulary_data)}
    except Exception as e:
        status["vocabulary"] = {"loaded": False, "error": str(e)}

    try:
        from data.lexicon import lexicon_data
        status["lexicon"] = {"loaded": True, "count": len(lexicon_data)}
    except Exception as e:
        status["lexicon"] = {"loaded": False, "error": str(e)}

    return status


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8001))

    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )
