const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001';

export interface VocabularyExerciseItem {
  item_id: string;
  lemma_id: string;
  sentence_example_1: string;
  sentence_example_2: string;
}

export interface LexiconItem {
  lemma_id: string;
  lemma: string;
  base_definition: string;
  surface_forms: string[];
  relations: {
    synonyms: string[];
    antonyms: string[];
  };
}

export interface GrammarExerciseItem {
  item_id: string;
  lemma_id: string;
  error_sentence: string;
  errorCorrectAnswer: string;
  fill_sentence: string;
  fillCorrectAnswer: string;
  error_explanation: string;
  fill_explanation: string;
}

export async function getVocabularyExercises(): Promise<VocabularyExerciseItem[]> {
  const response = await fetch(`${AI_SERVICE_URL}/exercises/vocabulary`);
  if (!response.ok) {
    throw new Error(`Failed to fetch vocabulary exercises: ${response.statusText}`);
  }
  const data = await response.json();
  return data.exercises || [];
}

export async function getVocabularyExercisesAdaptive(
  params: { userId?: number; targetDifficulty?: "easy" | "medium" | "hard"; limit?: number } = {}
): Promise<VocabularyExerciseItem[]> {
  const body = {
    user_id: params.userId ?? null,
    target_difficulty: params.targetDifficulty ?? null,
    limit: params.limit ?? 15,
  };

  const response = await fetch(`${AI_SERVICE_URL}/exercises/vocabulary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Optional: include Authorization if you want ai-service to forward JWT
      // "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch vocabulary exercises: ${response.statusText}`);
  }

  const data = await response.json();
  return data.exercises || [];
}

export async function getLexiconData(): Promise<LexiconItem[]> {
  const response = await fetch(`${AI_SERVICE_URL}/exercises/lexicon`);
  if (!response.ok) {
    throw new Error(`Failed to fetch lexicon data: ${response.statusText}`);
  }
  const data = await response.json();
  return data.exercises || [];
}

export async function getGrammarExercises(): Promise<GrammarExerciseItem[]> {
  const response = await fetch(`${AI_SERVICE_URL}/exercises/grammar`);
  if (!response.ok) {
    throw new Error(`Failed to fetch grammar exercises: ${response.statusText}`);
  }
  const data = await response.json();
  return data.exercises || [];
}