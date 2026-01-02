import json
import os
from typing import List, Dict, Optional
import numpy as np
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class VocabularyRAG:
    def __init__(self):
        self.references: List[Dict] = []
        self.embeddings: List[List[float]] = []
        self.load_references()

    def load_references(self) -> None:
        """Load vocabulary references from JSON (new schema)."""
        references_path = os.path.join(
            os.path.dirname(__file__),
            "references",
            "vocabulary.json",
        )

        with open(references_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for entry in data:
            lemma = entry.get("lemma", "")
            definition = entry.get("definition", "")
            usage = entry.get("usage", "")
            example = entry.get("example", "")
            example_gloss = entry.get("example_gloss", "")
            extra_examples = entry.get("extra_examples", []) or []
            synonyms = entry.get("synonyms", []) or []
            antonyms = entry.get("antonyms", []) or []
            tags = entry.get("tags", []) or []
            exam_tips = entry.get("exam_tips", "")
            difficulty = entry.get("difficulty", "")

            text_parts = [
                lemma,
                definition,
                usage,
                example,
                example_gloss,
                " ".join(extra_examples),
                " ".join(synonyms),
                " ".join(antonyms),
                " ".join(tags),
                exam_tips,
                difficulty,
            ]
            searchable_text = " ".join(p for p in text_parts if p)

            self.references.append(
                {
                    "lemma": lemma,
                    "part_of_speech": entry.get("part_of_speech"),
                    "definition": definition,
                    "usage": usage,
                    "example": example,
                    "example_gloss": example_gloss,
                    "extra_examples": extra_examples,
                    "synonyms": synonyms,
                    "antonyms": antonyms,
                    "tags": tags,
                    "exam_tips": exam_tips,
                    "difficulty": difficulty,
                    "text": searchable_text,
                }
            )

        print(f"✓ Loaded {len(self.references)} vocabulary reference chunks")

    def embed_references(self) -> None:
        if self.embeddings:
            print("Embeddings already exist for vocabulary")
            return

        texts = [ref["text"] for ref in self.references]
        if not texts:
            print("⚠️ No vocabulary texts to embed")
            return

        print(f"Creating embeddings for {len(texts)} vocabulary chunks...")
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=texts,
        )
        self.embeddings = [item.embedding for item in response.data]
        print("✓ Vocabulary embeddings created")

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        a_arr = np.array(a)
        b_arr = np.array(b)
        return float(np.dot(a_arr, b_arr) / (np.linalg.norm(a_arr) * np.linalg.norm(b_arr) + 1e-9))

    def search(self, query: str, top_k: int = 3) -> List[Dict]:
        if not self.embeddings:
            self.embed_references()
        if not self.references or not self.embeddings:
            return []

        query_response = client.embeddings.create(
            model="text-embedding-3-small",
            input=query,
        )
        query_embedding = query_response.data[0].embedding

        sims = []
        for i, ref_emb in enumerate(self.embeddings):
            sims.append((i, self._cosine_similarity(query_embedding, ref_emb)))

        sims.sort(key=lambda x: x[1], reverse=True)
        top_indices = [i for i, _ in sims[:top_k]]

        results = []
        for idx in top_indices:
            ref = self.references[idx].copy()
            ref["similarity_score"] = sims[idx][1]
            results.append(ref)
        return results

    def get_context_for_word(self, word: str, error_reason: Optional[str] = None) -> str:
        parts = [f"Filipino vocabulary word: {word}"]
        if error_reason:
            parts.append(f"Context: {error_reason}")
        query = ". ".join(parts)

        results = self.search(query, top_k=3)
        if not results:
            return f"Walang natagpuang vocabulary reference para sa salitang '{word}'.\n"

        context = "Relevant Vocabulary Entries:\n\n"
        for i, result in enumerate(results, 1):
            context += f"{i}. {result.get('lemma')} ({result.get('part_of_speech')})\n"
            context += f"   Kahulugan: {result.get('definition')}\n"
            if result.get("usage"):
                context += f"   Paggamit: {result['usage']}\n"
            if result.get("example"):
                gloss = f" ({result['example_gloss']})" if result.get(
                    "example_gloss") else ""
                context += f"   Halimbawa: \"{result['example']}\"{gloss}\n"
            extras = result.get("extra_examples") or []
            if extras:
                context += f"   Iba pang halimbawa: {extras[0]}\n"
            syns = result.get("synonyms") or []
            ants = result.get("antonyms") or []
            if syns:
                context += f"   Kasingkahulugan: {', '.join(syns)}\n"
            if ants:
                context += f"   Kasalungat: {', '.join(ants)}\n"
            if result.get("exam_tips"):
                context += f"   Exam tip: {result['exam_tips']}\n"
            context += "\n"

        return context


_vocabulary_rag: Optional[VocabularyRAG] = None


def get_vocabulary_rag() -> VocabularyRAG:
    global _vocabulary_rag
    if _vocabulary_rag is None:
        _vocabulary_rag = VocabularyRAG()
        _vocabulary_rag.embed_references()
    return _vocabulary_rag
