from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer for responses"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'avatar', 'provider', 'is_email_verified', 'created_at'
        ]
        read_only_fields = ['id', 'provider', 'created_at']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email


class RegisterSerializer(serializers.ModelSerializer):
    """Email/password registration"""
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type':  'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password2', 'first_name', 'last_name']
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name':  {'required': False}
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']: 
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects. create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data. get('last_name', ''),
            provider='email',
        )
        return user


class LoginSerializer(serializers. Serializer):
    """Email/password login"""
    email = serializers. EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )


class GoogleAuthSerializer(serializers.Serializer):
    """Google OAuth with ID token"""
    id_token = serializers.CharField(required=True)


class SocialAuthSerializer(serializers.Serializer):
    """Alternative:  Pre-validated social auth data from NextAuth"""
    provider = serializers.CharField(required=True)
    provider_id = serializers. CharField(required=True)
    email = serializers.EmailField(required=True)
    name = serializers.CharField(required=False, allow_blank=True)
    avatar = serializers.URLField(required=False, allow_blank=True)