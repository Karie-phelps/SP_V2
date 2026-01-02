"""
RAG implementation for vocabulary explanations.
Uses OpenAI embeddings + simple vector search.
"""

import json
import os
from typing import List, Dict
import numpy as np
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class VocabularyRAG:
    def __init__(self):
        self.entries: List[Dict] = []
        self.embeddings: List[List[float]] = []
        self.load_references()

    def load_references(self):
        """Load vocabulary KB from JSON"""
        path = os.path.join(
            os.path.dirname(__file__),
            "references",
            "vocabulary.json"
        )
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for item in data:
            text_parts = [
                item.get("lemma", ""),
                item.get("definition", ""),
                item.get("usage", ""),
                item.get("example", ""),
                " ".join(item.get("synonyms", [])),
                " ".join(item.get("antonyms", [])),
            ]
            searchable = " ".join(p for p in text_parts if p)
            chunk = {**item, "text": searchable}
            self.entries.append(chunk)

        print(f"✓ Loaded {len(self.entries)} vocabulary reference entries")

    def embed_references(self):
        if self.embeddings:
            print("Embeddings already exist for vocabulary KB")
            return

        texts = [entry["text"] for entry in self.entries]
        print(f"Creating embeddings for {len(texts)} vocab entries...")

        res = client.embeddings.create(
            model="text-embedding-3-small",
            input=texts,
        )
        self.embeddings = [d.embedding for d in res.data]
        print("✓ Vocabulary embeddings created")

    def _cosine(self, a, b) -> float:
        a = np.array(a)
        b = np.array(b)
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))

    def search(self, query: str, top_k: int = 3) -> List[Dict]:
        if not self.embeddings:
            self.embed_references()

        q_emb = client.embeddings.create(
            model="text-embedding-3-small",
            input=query,
        ).data[0].embedding

        scored = [
            (i, self._cosine(q_emb, emb))
            for i, emb in enumerate(self.embeddings)
        ]
        scored.sort(key=lambda x: x[1], reverse=True)
        top = scored[:top_k]

        results: List[Dict] = []
        for idx, score in top:
            item = self.entries[idx].copy()
            item["similarity_score"] = score
            results.append(item)
        return results

    def get_context_for_word(self, lemma: str) -> str:
        """Get rich context for a lemma (definition, usage, examples)."""
        # Simple: use lemma as query
        results = self.search(f"Filipino word: {lemma}", top_k=2)

        context = "Vocabulary Reference:\n\n"
        for i, r in enumerate(results, 1):
            context += f"{i}. {r.get('lemma')}\n"
            if r.get("definition"):
                context += f"   Kahulugan: {r['definition']}\n"
            if r.get("usage"):
                context += f"   Paggamit: {r['usage']}\n"
            if r.get("example"):
                context += f"   Halimbawa: {r['example']}\n"
            if r.get("synonyms"):
                context += f"   Kasingkahulugan: {', '.join(r['synonyms'])}\n"
            if r.get("antonyms"):
                context += f"   Kabaligtaran: {', '.join(r['antonyms'])}\n"
            context += "\n"

        return context


_vocabulary_rag: VocabularyRAG | None = None


def get_vocabulary_rag() -> VocabularyRAG:
    global _vocabulary_rag
    if _vocabulary_rag is None:
        _vocabulary_rag = VocabularyRAG()
        _vocabulary_rag.embed_references()
    return _vocabulary_rag
