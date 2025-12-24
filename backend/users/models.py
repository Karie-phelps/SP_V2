from django.contrib.auth. models import AbstractUser
from django. db import models

class User(AbstractUser):
    """Custom user model supporting email/password and Google OAuth"""
    
    # Make email unique and required
    email = models.EmailField(unique=True, db_index=True)
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)
    
    # OAuth fields
    provider = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        choices=[
            ('email', 'Email'),
            ('google', 'Google'),
        ],
        help_text="Authentication provider"
    )
    provider_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Unique ID from OAuth provider"
    )
    
    # Profile fields
    avatar = models.URLField(blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models. DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Use email as primary login field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    class Meta: 
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['provider', 'provider_id']),
        ]
    
    def save(self, *args, **kwargs):
        # Auto-generate username from email if not provided
        if not self. username:
            self.username = self.email.split('@')[0]
            # Ensure uniqueness
            base_username = self.username
            counter = 1
            while User.objects.filter(username=self.username).exists():
                self.username = f"{base_username}{counter}"
                counter += 1
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.email