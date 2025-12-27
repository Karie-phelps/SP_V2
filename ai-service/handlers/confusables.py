# from fastapi import APIRouter, HTTPException
# from openai_client import client
# from data.vocabulary_dataset import vocabulary_data
# import math

# router = APIRouter()

# def cosine(a, b):
#     dot = sum(x*y for x, y in zip(a, b))
#     na = math.sqrt(sum(x*x for x in a))
#     nb = math.sqrt(sum(x*x for x in b))
#     return dot / (na * nb + 1e-9)

# @router.post("/confusables")
# async def confusables(payload: dict):
#     try:
#         word = payload["word"]
#         top_k = payload.get("topK", 3)

#         candidates = [v["word"] for v in vocabulary_data]

#         target_emb = client.embeddings.create(
#             model="text-embedding-3-small",
#             input=word
#         ).data[0].embedding

#         cand_embs = client.embeddings.create(
#             model="text-embedding-3-small",
#             input=candidates
#         ).data

#         scored = []
#         for i, emb in enumerate(cand_embs):
#             if candidates[i] != word:
#                 scored.append({
#                     "word": candidates[i],
#                     "score": cosine(target_emb, emb.embedding)
#                 })

#         ranked = sorted(scored, key=lambda x: x["score"], reverse=True)[:top_k]

#         results = []
#         for r in ranked:
#             entry = next(v for v in vocabulary_data if v["word"] == r["word"])
#             results.append({
#                 "word": r["word"],
#                 "meaning": entry["meaning"],
#                 "example": entry["example"]
#             })

#         return {"results": results}

#     except Exception:
#         raise HTTPException(500, "Failed to find confusables")
