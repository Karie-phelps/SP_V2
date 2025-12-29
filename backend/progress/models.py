from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ModuleProgress(models.Model):
    """Track overall module progress for a user"""
    
    MODULE_CHOICES = [
        ('vocabulary', 'Vocabulary'),
        ('grammar', 'Grammar'),
        ('sentence-construction', 'Sentence Construction'),
        ('reading-comprehension', 'Reading Comprehension'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='module_progress')
    module = models.CharField(max_length=50, choices=MODULE_CHOICES)
    
    # Progress tracking
    completion_percentage = models.IntegerField(default=0)
    last_accessed_at = models.DateTimeField(null=True, blank=True)
    
    # Mastery tracking
    mastery_level = models.CharField(
        max_length=20,
        choices=[
            ('beginner', 'Beginner'),
            ('developing', 'Developing'),
            ('proficient', 'Proficient'),
            ('advanced', 'Advanced'),
            ('master', 'Master'),
        ],
        default='beginner'
    )
    
    current_difficulty = models.CharField(
        max_length=10,
        choices=[
            ('easy', 'Easy'),
            ('medium', 'Medium'),
            ('hard', 'Hard'),
        ],
        default='easy'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'module_progress'
        unique_together = ('user', 'module')
        indexes = [
            models.Index(fields=['user', 'module']),
            models.Index(fields=['updated_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.module} ({self.completion_percentage}%)"


class ExerciseProgress(models.Model):
    """Track individual exercise progress"""
    
    EXERCISE_TYPES = [
        ('flashcards', 'Flashcards'),
        ('quiz', 'Quiz'),
        ('fill-blanks', 'Fill in the Blanks'),
    ]
    
    STATUS_CHOICES = [
        ('locked', 'Locked'),
        ('available', 'Available'),
        ('in-progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    module_progress = models.ForeignKey(
        ModuleProgress,
        on_delete=models.CASCADE,
        related_name='exercises'
    )
    exercise_type = models.CharField(max_length=20, choices=EXERCISE_TYPES)
    
    # Progress
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='locked')
    attempts = models.IntegerField(default=0)
    best_score = models.IntegerField(null=True, blank=True)
    last_score = models.IntegerField(null=True, blank=True)
    
    # Difficulty tracking
    last_difficulty = models.CharField(
        max_length=10,
        choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')],
        default='easy'
    )
    
    # Metadata
    first_attempt_at = models.DateTimeField(null=True, blank=True)
    last_completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'exercise_progress'
        unique_together = ('module_progress', 'exercise_type')
        indexes = [
            models.Index(fields=['module_progress', 'exercise_type']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.module_progress.module} - {self.exercise_type} ({self.status})"


class PerformanceMetrics(models.Model):
    """Store detailed performance metrics for each exercise attempt"""
    
    exercise_progress = models.ForeignKey(
        ExerciseProgress,
        on_delete=models.CASCADE,
        related_name='performance_history'
    )
    
    # Metrics
    difficulty = models.CharField(max_length=10)
    score = models.IntegerField()
    missed_low_freq = models.IntegerField(default=0)
    similar_choice_errors = models.IntegerField(default=0)
    
    # Error tags for adaptive learning
    error_tags = models.JSONField(default=list)
    
    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'performance_metrics'
        indexes = [
            models.Index(fields=['exercise_progress', 'timestamp']),
            models.Index(fields=['difficulty']),
        ]
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.exercise_progress} - Score: {self.score}% ({self.timestamp})"


class SRSCard(models.Model):
    """Spaced Repetition System tracking for vocabulary"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='srs_cards')
    word_id = models.IntegerField()  # References vocabulary dataset
    
    # SRS State
    repetitions = models.IntegerField(default=0)
    easiness_factor = models.FloatField(default=2.5)
    interval = models.IntegerField(default=0)  # days
    next_review = models.DateTimeField()
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    last_reviewed = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'srs_cards'
        unique_together = ('user', 'word_id')
        indexes = [
            models.Index(fields=['user', 'next_review']),
            models.Index(fields=['word_id']),
        ]
    
    def __str__(self):
        return f"User {self.user.user_id} - Word {self.word_id}"


class ReviewDeck(models.Model):
    """User's personal review deck of saved words"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='review_deck')
    word_id = models.IntegerField()
    
    # Metadata
    added_at = models.DateTimeField(auto_now_add=True)
    last_reviewed = models.DateTimeField(null=True, blank=True)
    times_reviewed = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'review_deck'
        unique_together = ('user', 'word_id')
        indexes = [
            models.Index(fields=['user', 'added_at']),
        ]
    
    def __str__(self):
        return f"User {self.user_id} - Word {self.word_id}"