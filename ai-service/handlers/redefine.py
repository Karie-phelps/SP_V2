# from fastapi import APIRouter, HTTPException
# from openai_client import client
# from prompts import redefine_prompt

# router = APIRouter()

# @router.post("/redefine")
# async def redefine(payload: dict):
#     try:
#         prompt = redefine_prompt(payload)

#         res = client.chat.completions.create(
#             model="gpt-4o-mini",
#             temperature=0.2,
#             messages=[
#                 {"role": "system", "content": "Return concise teaching content."},
#                 {"role": "user", "content": prompt}
#             ]
#         )

#         return {"content": res.choices[0].message.content}

#     except Exception:
#         raise HTTPException(500, "Failed to rewrite definition")
