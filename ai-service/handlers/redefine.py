from fastapi import HTTPException
from pydantic import BaseModel
from typing import Optional
import os

# Import OpenAI client
try:
    from openai import OpenAI
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except Exception as e:
    print(f"⚠️ Error initializing OpenAI in redefine handler: {e}")
    openai_client = None


# ============================================================
# REQUEST/RESPONSE MODELS
# ============================================================

class RedefineRequest(BaseModel):
    word: str
    baseMeaning: str
    example: str


class RedefineResponse(BaseModel):
    content: str


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def build_redefine_prompt(data: dict) -> str:
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
# MAIN HANDLER FUNCTION
# ============================================================

async def handle_redefine(request: RedefineRequest) -> RedefineResponse:
    """
    Main handler function for word redefinition.
    This is called from main.py
    """
    try:
        print(f"📝 Redefine request - Word: {request.word}")

        # Check if OpenAI client is available
        if not openai_client:
            raise HTTPException(
                status_code=503,
                detail="OpenAI service not available"
            )

        # Generate prompt
        prompt = build_redefine_prompt({
            "word": request.word,
            "baseMeaning": request.baseMeaning,
            "example": request.example
        })

        print(f"🤖 Calling OpenAI API for redefinition...")

        # Call OpenAI
        completion = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.2,
            messages=[
                {
                    "role": "system",
                    "content": "Return concise teaching content. Be clear and educational."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        content = completion.choices[0].message.content or ""
        print(f"✅ Generated redefinition ({len(content)} chars)")

        return RedefineResponse(content=content)

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"❌ Error in handle_redefine: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
