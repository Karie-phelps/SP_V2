from rest_framework import serializers
from .models import ModuleProgress, ExerciseProgress, PerformanceMetrics, SRSCard, ReviewDeck


class PerformanceMetricsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceMetrics
        fields = [
            'id', 'difficulty', 'score', 'missed_low_freq',
            'similar_choice_errors', 'error_tags', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class ExerciseProgressSerializer(serializers.ModelSerializer):
    performance_history = PerformanceMetricsSerializer(many=True, read_only=True)
    
    class Meta:
        model = ExerciseProgress
        fields = [
            'id', 'exercise_type', 'status', 'attempts',
            'best_score', 'last_score', 'last_difficulty',
            'first_attempt_at', 'last_completed_at',
            'performance_history', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ModuleProgressSerializer(serializers.ModelSerializer):
    exercises = ExerciseProgressSerializer(many=True, read_only=True)
    
    class Meta:
        model = ModuleProgress
        fields = [
            'id', 'module', 'completion_percentage',
            'last_accessed_at', 'mastery_level', 'current_difficulty',
            'exercises', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SRSCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = SRSCard
        fields = [
            'id', 'word_id', 'repetitions', 'easiness_factor',
            'interval', 'next_review', 'created_at', 'last_reviewed'
        ]
        read_only_fields = ['id', 'created_at', 'last_reviewed']


class ReviewDeckSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewDeck
        fields = [
            'id', 'word_id', 'added_at', 'last_reviewed',
            'times_reviewed'
        ]
        read_only_fields = ['id', 'added_at']