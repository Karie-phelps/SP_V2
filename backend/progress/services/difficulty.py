from __future__ import annotations

from typing import Optional

from progress.models import LexicalDifficulty, GlobalLexicalStats


def compute_user_difficulty(ld: LexicalDifficulty) -> Optional[float]:
    """
    Compute learner-dependent difficulty score in [0,1].

    Inputs:
      - error rate (wrong / attempts)
      - near-miss ratio
      - confusable error ratio

    Intuition:
      - base on how often they are wrong
      - increase difficulty more if mistakes are confusable or near-miss
    """
    if ld.attempts == 0:
        return None

    p_error = ld.wrong / ld.attempts

    if ld.wrong == 0:
        near_miss_ratio = 0.0
        confusable_ratio = 0.0
    else:
        near_miss_ratio = ld.near_miss_count / ld.wrong
        confusable_ratio = ld.confusable_errors / ld.wrong

    # Weights – you can tweak these:
    w_error = 0.7
    w_near_miss = 0.15
    w_confusable = 0.15

    score = (
        w_error * p_error
        + w_near_miss * near_miss_ratio
        + w_confusable * confusable_ratio
    )

    # Clamp into [0,1]
    score = max(0.0, min(1.0, score))
    return score


def compute_global_difficulty(gs: GlobalLexicalStats) -> Optional[float]:
    """
    Compute global difficulty based only on error rate for now.
    You can later incorporate other stats or item-response models.
    """
    if gs.attempts < 5:
        # Not enough data globally to trust this value
        return None

    p_error = gs.wrong / gs.attempts
    score = max(0.0, min(1.0, p_error))
    return score


def update_lexical_difficulty_for_event(
    *,
    user,
    lemma_id: str,
    correct: bool,
    is_near_miss: bool,
    is_confusable_error: bool,
):
    """
    Update per-user and global difficulty based on one exercise event.
    """

    # --- Per-user ---
    ld, _created = LexicalDifficulty.objects.get_or_create(
        user=user,
        lemma_id=lemma_id,
    )

    ld.attempts += 1
    if correct:
        ld.correct += 1
    else:
        ld.wrong += 1
        if is_near_miss:
            ld.near_miss_count += 1
        if is_confusable_error:
            ld.confusable_errors += 1

    ld.difficulty_score = compute_user_difficulty(ld)
    ld.save()

    # --- Global ---
    gs, _ = GlobalLexicalStats.objects.get_or_create(lemma_id=lemma_id)
    gs.attempts += 1
    if correct:
        gs.correct += 1
    else:
        gs.wrong += 1

    gs.difficulty_score = compute_global_difficulty(gs)
    gs.save()
