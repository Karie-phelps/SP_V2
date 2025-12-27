const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface PerformanceMetrics {
  difficulty: 'easy' | 'medium' | 'hard';
  score: number;
  missed_low_freq: number;
  similar_choice_errors: number;
  error_tags: string[];
  timestamp: string;
}

export interface ExerciseProgress {
  id: number;
  exercise_type: string;
  status: string;
  attempts: number;
  best_score: number | null;
  last_score: number | null;
  last_difficulty: string;
  first_attempt_at: string | null;
  last_completed_at: string | null;
  performance_history: PerformanceMetrics[];
}

export interface ModuleProgress {
  id: number;
  module: string;
  completion_percentage: number;
  last_accessed_at: string | null;
  mastery_level: string;
  current_difficulty: string;
  exercises: ExerciseProgress[];
}

// Get authentication token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const tokens = localStorage.getItem('tokens');
  if (!tokens) return null;
  try {
    const parsed = JSON.parse(tokens);
    return parsed.access;
  } catch {
    return null;
  }
}

// Fetch with auth
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || response.statusText);
  }

  return response.json();
}

// API Functions
export async function getAllProgress(): Promise<ModuleProgress[]> {
  return fetchWithAuth(`${API_URL}/progress/all/`);
}

export async function getModuleProgress(module: string): Promise<ModuleProgress> {
  return fetchWithAuth(`${API_URL}/progress/${module}/`);
}

export async function updateExerciseProgress(
  module: string,
  exercise: string,
  data: {
    status?: string;
    score?: number;
    attempts?: number;
    completedAt?: string;
    lastDifficulty?: string;
    performanceMetrics?: {
      difficulty: string;
      score: number;
      missedLowFreq: number;
      similarChoiceErrors: number;
      errorTags: string[];
    };
  }
): Promise<ExerciseProgress> {
  return fetchWithAuth(`${API_URL}/progress/${module}/${exercise}/update/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getPerformanceHistory(
  module: string,
  exercise: string
): Promise<PerformanceMetrics[]> {
  return fetchWithAuth(`${API_URL}/progress/${module}/${exercise}/history/`);
}

export async function resetProgress(module?: string): Promise<{ message: string }> {
  const url = module 
    ? `${API_URL}/progress/${module}/reset/`
    : `${API_URL}/progress/reset/all/`;
  
  return fetchWithAuth(url, { method: 'DELETE' });
}

// ============================================================
// SRS API Functions
// ============================================================

export interface SRSCard {
  id: number;
  word_id: number;
  repetitions: number;
  easiness_factor: number;
  interval: number;
  next_review: string;
  created_at: string;
  last_reviewed: string;
}

export async function getAllSRSCards(): Promise<{
  all_cards: SRSCard[];
  due_cards: SRSCard[];
  due_count: number;
  total_count: number;
}> {
  return fetchWithAuth(`${API_URL}/progress/srs/all/`);
}

export async function getDueSRSCards(): Promise<{
  cards: SRSCard[];
  count: number;
}> {
  return fetchWithAuth(`${API_URL}/progress/srs/due/`);
}

export async function updateSRSCard(
  wordId: number,
  grade: number
): Promise<SRSCard> {
  return fetchWithAuth(`${API_URL}/progress/srs/${wordId}/update/`, {
    method: 'POST',
    body: JSON.stringify({ grade }),
  });
}

export async function resetSRSCard(wordId: number): Promise<{ message: string }> {
  return fetchWithAuth(`${API_URL}/progress/srs/${wordId}/reset/`, {
    method: 'DELETE',
  });
}

// ============================================================
// Review Deck API Functions
// ============================================================

export interface ReviewDeckCard {
  id: number;
  word_id: number;
  added_at: string;
  last_reviewed: string | null;
  times_reviewed: number;
}

export async function getReviewDeck(): Promise<{
  cards: ReviewDeckCard[];
  count: number;
}> {
  return fetchWithAuth(`${API_URL}/progress/review-deck/`);
}

export async function addToReviewDeck(wordId: number): Promise<{
  card: ReviewDeckCard;
  created: boolean;
}> {
  return fetchWithAuth(`${API_URL}/progress/review-deck/${wordId}/add/`, {
    method: 'POST',
  });
}

export async function removeFromReviewDeck(wordId: number): Promise<{
  message: string;
  deleted: boolean;
}> {
  return fetchWithAuth(`${API_URL}/progress/review-deck/${wordId}/remove/`, {
    method: 'DELETE',
  });
}

export async function updateReviewDeckItem(
  wordId: number
): Promise<ReviewDeckCard> {
  return fetchWithAuth(`${API_URL}/progress/review-deck/${wordId}/update/`, {
    method: 'POST',
  });
}

export async function clearReviewDeck(): Promise<{
  message: string;
  deleted_count: number;
}> {
  return fetchWithAuth(`${API_URL}/progress/review-deck/clear/`, {
    method: 'DELETE',
  });
}