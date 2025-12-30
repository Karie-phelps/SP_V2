const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001';

export async function getVocabularyExercises() {
  const response = await fetch(`${AI_SERVICE_URL}/exercises/vocabulary`);
  return response.json();
}

export async function getGrammarExercises() {
  const response = await fetch(`${AI_SERVICE_URL}/exercises/grammar`);
  return response.json();
}