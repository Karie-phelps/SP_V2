from rest_framework import serializers


class LexicalDifficultySerializer(serializers.Serializer):
    """
    Read-only view of learner-dependent difficulty for a lemma.
    """
    lemma_id = serializers.CharField()
    attempts = serializers.IntegerField()
    correct = serializers.IntegerField()
    wrong = serializers.IntegerField()
    difficulty_score = serializers.FloatField(allow_null=True)
