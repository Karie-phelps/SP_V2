# from fastapi import APIRouter, HTTPException
# from openai_client import client
# from prompts import tips_prompt

# router = APIRouter()

# @router.post("/tips")
# async def tips(payload: dict):
#     try:
#         prompt = tips_prompt(payload)

#         res = client.chat.completions.create(
#             model="gpt-4o-mini",
#             temperature=0.3,
#             messages=[
#                 {"role": "system", "content": "Be practical and concise."},
#                 {"role": "user", "content": prompt}
#             ]
#         )

#         return {"tips": res.choices[0].message.content}

#     except Exception:
#         raise HTTPException(500, "Failed to generate tips")
