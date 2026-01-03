from rest_framework import serializers


class LexicalPerformanceEventSerializer(serializers.Serializer):
    """
    One performance event for a lexical item.
    This is sent from the frontend after a question is answered.
    """

    module = serializers.ChoiceField(
        choices=["vocabulary", "grammar", "sentence-construction"]
    )
    exercise_type = serializers.ChoiceField(
        choices=["flashcards", "quiz", "fill-blanks"]
    )

    lemma_id = serializers.CharField(max_length=50)

    # Whether the learner got this particular item correct
    correct = serializers.BooleanField()

    # Additional pattern info (computed on frontend)
    is_near_miss = serializers.BooleanField(default=False)
    is_confusable_error = serializers.BooleanField(default=False)

    # Optional: numeric score on this interaction (0–100)
    score = serializers.IntegerField(
        min_value=0, max_value=100, required=False)

    # Optional: item-level difficulty shown ("easy"/"medium"/"hard")
    difficulty_shown = serializers.ChoiceField(
        choices=["easy", "medium", "hard"],
        required=False,
        allow_null=True,
    )
