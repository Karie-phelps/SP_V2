from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from .models import (
    ModuleProgress,
    ExerciseProgress,
    PerformanceMetrics,
    SRSCard,
    ReviewDeck
)
from .serializers import (
    ModuleProgressSerializer,
    ExerciseProgressSerializer,
    PerformanceMetricsSerializer,
    SRSCardSerializer,
    ReviewDeckSerializer
)
from .performance_serializers import LexicalPerformanceEventSerializer
from .services.difficulty import update_lexical_difficulty_for_event


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def record_lexical_performance(request):
    """
    Record a single lexical performance event and update difficulty estimates.

    Frontend should POST:
    {
      "module": "vocabulary",
      "exercise_type": "quiz",
      "lemma_id": "L001",
      "correct": true,
      "is_near_miss": false,
      "is_confusable_error": false,
      "score": 100,
      "difficulty_shown": "medium"
    }
    """

    serializer = LexicalPerformanceEventSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    user = request.user

    lemma_id = data["lemma_id"]
    correct = data["correct"]
    is_near_miss = data.get("is_near_miss", False)
    is_confusable_error = data.get("is_confusable_error", False)

    # 1) Update lexical difficulty models
    update_lexical_difficulty_for_event(
        user=user,
        lemma_id=lemma_id,
        correct=correct,
        is_near_miss=is_near_miss,
        is_confusable_error=is_confusable_error,
    )

    # 2) (Optional but recommended) also update ExerciseProgress + PerformanceMetrics
    #    so your existing progress screens continue to work.
    module = data["module"]
    exercise_type = data["exercise_type"]
    score = data.get("score")
    difficulty_shown = data.get("difficulty_shown")

    try:
        module_progress, _ = ModuleProgress.objects.get_or_create(
            user=user,
            module=module,
            defaults={"completion_percentage": 0, "mastery_level": "beginner"},
        )
    except ModuleProgress.DoesNotExist:
        module_progress = ModuleProgress.objects.create(
            user=user,
            module=module,
            completion_percentage=0,
            mastery_level="beginner",
        )

    exercise_progress, _ = ExerciseProgress.objects.get_or_create(
        module_progress=module_progress,
        exercise_type=exercise_type,
    )

    exercise_progress.attempts += 1
    if score is not None:
        exercise_progress.last_score = score
        if (
            exercise_progress.best_score is None
            or score > exercise_progress.best_score
        ):
            exercise_progress.best_score = score

    if difficulty_shown is not None:
        exercise_progress.last_difficulty = difficulty_shown

    # Simple heuristic: mark completed if score >= 80
    if score is not None and score >= 80:
        exercise_progress.status = "completed"

    exercise_progress.save()

    PerformanceMetrics.objects.create(
        exercise_progress=exercise_progress,
        difficulty=difficulty_shown or "easy",
        score=score or (100 if correct else 0),
        missed_low_freq=0,           # you can start using these later
        similar_choice_errors=1 if is_confusable_error else 0,
        error_tags=[],               # can be filled via your rule engine
    )

    return Response({"message": "Performance recorded"}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_progress(request):
    """Get all module progress for current user"""
    modules = ModuleProgress.objects.filter(user=request.user)

    # If no progress exists, create default structure
    if not modules.exists():
        default_modules = ['vocabulary', 'grammar',
                           'sentence-construction', 'reading-comprehension']
        for module in default_modules:
            ModuleProgress.objects.create(user=request.user, module=module)
        modules = ModuleProgress.objects.filter(user=request.user)

    serializer = ModuleProgressSerializer(modules, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_module_progress(request, module_name):
    """Get specific module progress"""
    module = get_object_or_404(
        ModuleProgress,
        user=request.user,
        module=module_name
    )
    serializer = ModuleProgressSerializer(module)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_exercise_progress(request, module_name, exercise_type):
    """Update exercise progress and add performance metrics"""
    try:
        # Get or create module progress
        module_progress, _ = ModuleProgress.objects.get_or_create(
            user=request.user,
            module=module_name
        )

        # Get or create exercise progress
        exercise_progress, _ = ExerciseProgress.objects.get_or_create(
            module_progress=module_progress,
            exercise_type=exercise_type
        )

        # Update exercise progress
        data = request.data
        exercise_progress.status = data.get('status', exercise_progress.status)
        exercise_progress.attempts = data.get(
            'attempts', exercise_progress.attempts)

        if data.get('score') is not None:
            exercise_progress.last_score = data['score']
            # Update best score
            if exercise_progress.best_score is None or data['score'] > exercise_progress.best_score:
                exercise_progress.best_score = data['score']

        exercise_progress.last_difficulty = data.get(
            'lastDifficulty', exercise_progress.last_difficulty)

        if data.get('completedAt'):
            exercise_progress.last_completed_at = data['completedAt']
        if not exercise_progress.first_attempt_at:
            exercise_progress.first_attempt_at = timezone.now()

        exercise_progress.save()

        # Add performance metrics if provided
        if 'performanceMetrics' in data:
            metrics = data['performanceMetrics']
            PerformanceMetrics.objects.create(
                exercise_progress=exercise_progress,
                difficulty=metrics.get('difficulty', 'easy'),
                score=metrics.get('score', 0),
                missed_low_freq=metrics.get('missedLowFreq', 0),
                similar_choice_errors=metrics.get('similarChoiceErrors', 0),
                error_tags=metrics.get('errorTags', [])
            )

        # Update module progress
        module_progress.last_accessed_at = timezone.now()

        # Calculate completion percentage
        exercises = ExerciseProgress.objects.filter(
            module_progress=module_progress)
        completed = exercises.filter(status='completed').count()
        total = exercises.count()
        module_progress.completion_percentage = int(
            (completed / total * 100)) if total > 0 else 0

        module_progress.save()

        serializer = ExerciseProgressSerializer(exercise_progress)
        return Response(serializer.data)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_performance_history(request, module_name, exercise_type):
    """Get performance history for an exercise"""
    try:
        module_progress = get_object_or_404(
            ModuleProgress,
            user=request.user,
            module=module_name
        )
        exercise_progress = get_object_or_404(
            ExerciseProgress,
            module_progress=module_progress,
            exercise_type=exercise_type
        )

        metrics = PerformanceMetrics.objects.filter(
            exercise_progress=exercise_progress
        ).order_by('-timestamp')

        serializer = PerformanceMetricsSerializer(metrics, many=True)
        return Response(serializer.data)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def reset_progress(request, module_name=None):
    """Reset progress for a module or all modules"""
    if module_name:
        ModuleProgress.objects.filter(
            user=request.user,
            module=module_name
        ).delete()
        return Response({'message': f'Progress reset for {module_name}'})
    else:
        ModuleProgress.objects.filter(user=request.user).delete()
        return Response({'message': 'All progress reset'})


# ============================================================
# SRS ENDPOINTS
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_srs_cards(request):
    """Get all SRS cards for current user"""
    cards = SRSCard.objects.filter(user=request.user)

    # Separate due and all cards
    now = timezone.now()
    due_cards = cards.filter(next_review__lte=now)

    return Response({
        'all_cards': SRSCardSerializer(cards, many=True).data,
        'due_cards': SRSCardSerializer(due_cards, many=True).data,
        'due_count': due_cards.count(),
        'total_count': cards.count()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_due_srs_cards(request):
    """Get only cards due for review"""
    due_cards = SRSCard.objects.filter(
        user=request.user,
        next_review__lte=timezone.now()
    )

    return Response({
        'cards': SRSCardSerializer(due_cards, many=True).data,
        'count': due_cards.count()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_srs_card(request, word_id):
    """Update SRS card after review (SM-2 algorithm)"""
    grade = request.data.get('grade', 3)  # 0-5 scale

    # Get or create SRS card
    card, created = SRSCard.objects.get_or_create(
        user=request.user,
        word_id=word_id,
        defaults={
            'next_review': timezone.now()
        }
    )

    # SM-2 Algorithm Implementation
    if grade >= 3:  # Correct response
        if card.repetitions == 0:
            card.interval = 1
        elif card.repetitions == 1:
            card.interval = 6
        else:
            card.interval = int(card.interval * card.easiness_factor)

        card.repetitions += 1
    else:  # Incorrect response
        card.repetitions = 0
        card.interval = 1

    # Update easiness factor
    card.easiness_factor = max(
        1.3,
        card.easiness_factor + (0.1 - (5 - grade) *
                                (0.08 + (5 - grade) * 0.02))
    )

    # Set next review date
    card.next_review = timezone.now() + timedelta(days=card.interval)
    card.save()

    return Response(SRSCardSerializer(card).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def reset_srs_card(request, word_id):
    """Reset a specific SRS card"""
    SRSCard.objects.filter(user=request.user, word_id=word_id).delete()
    return Response({'message': 'SRS card reset'})


# ============================================================
# REVIEW DECK ENDPOINTS
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_review_deck(request):
    """Get all words in user's review deck"""
    deck = ReviewDeck.objects.filter(user=request.user).order_by('-added_at')

    return Response({
        'cards': ReviewDeckSerializer(deck, many=True).data,
        'count': deck.count()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_review_deck(request, word_id):
    """Add a word to review deck"""
    deck_item, created = ReviewDeck.objects.get_or_create(
        user=request.user,
        word_id=word_id
    )

    return Response({
        'card': ReviewDeckSerializer(deck_item).data,
        'created': created
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_review_deck(request, word_id):
    """Remove a word from review deck"""
    deleted_count, _ = ReviewDeck.objects.filter(
        user=request.user,
        word_id=word_id
    ).delete()

    return Response({
        'message': 'Removed from review deck',
        'deleted': deleted_count > 0
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_review_deck_item(request, word_id):
    """Update review deck item (mark as reviewed)"""
    try:
        deck_item = ReviewDeck.objects.get(
            user=request.user,
            word_id=word_id
        )

        deck_item.last_reviewed = timezone.now()
        deck_item.times_reviewed += 1
        deck_item.save()

        return Response(ReviewDeckSerializer(deck_item).data)

    except ReviewDeck.DoesNotExist:
        return Response(
            {'error': 'Card not in review deck'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_review_deck(request):
    """Clear entire review deck"""
    deleted_count, _ = ReviewDeck.objects.filter(user=request.user).delete()

    return Response({
        'message': 'Review deck cleared',
        'deleted_count': deleted_count
    })
