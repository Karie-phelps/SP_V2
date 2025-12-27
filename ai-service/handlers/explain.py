# from fastapi import APIRouter, HTTPException
# from openai_client import client
# from prompts import explanation_prompt
# from data.vocabulary_dataset import vocabulary_data

# router = APIRouter()

# @router.post("/explain")
# async def explain(payload: dict):
#     try:
#         word = payload["word"]
#         mode = payload["mode"]
#         correct = payload["correct"]
#         selected = payload.get("selected")

#         entry = next((v for v in vocabulary_data if v["word"] == word), None)

#         prompt = explanation_prompt({
#             "mode": mode,
#             "word": word,
#             "correct": correct,
#             "selected": selected,
#             "definition": entry["meaning"] if entry else correct,
#             "example": entry["example"] if entry else ""
#         })

#         res = client.chat.completions.create(
#             model="gpt-4o-mini",
#             temperature=0.2,
#             messages=[
#                 {"role": "system", "content": "Be concise, accurate, and friendly."},
#                 {"role": "user", "content": prompt}
#             ]
#         )

#         return {"explanation": res.choices[0].message.content}

#     except Exception as e:
#         raise HTTPException(500, str(e))
