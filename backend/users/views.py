from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib. auth import authenticate, get_user_model
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from . serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    GoogleAuthSerializer,
    SocialAuthSerializer
)

User = get_user_model()


def get_tokens_for_user(user):
    """Generate JWT tokens"""
    refresh = RefreshToken. for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


# === Email/Password Authentication ===

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register with email and password"""
    serializer = RegisterSerializer(data=request.data)
    
    if serializer. is_valid():
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        
        return Response({
            'message': 'User registered successfully',
            'user': UserSerializer(user).data,
            'tokens': tokens,
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login with email and password"""
    serializer = LoginSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    password = serializer.validated_data['password']
    
    # Check if user exists
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Check if user registered with Google
    if user.provider == 'google':
        return Response(
            {'error': 'This account uses Google Sign-In.  Please sign in with Google.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Authenticate
    user = authenticate(username=email, password=password)
    
    if user: 
        tokens = get_tokens_for_user(user)
        return Response({
            'message':  'Login successful',
            'user': UserSerializer(user).data,
            'tokens': tokens,
        })
    
    return Response(
        {'error': 'Invalid email or password'},
        status=status.HTTP_401_UNAUTHORIZED
    )


# === Google OAuth ===

@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """Authenticate with Google ID token"""
    serializer = GoogleAuthSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    id_token_str = serializer.validated_data['id_token']
    
    try:
        # Verify token with Google
        idinfo = id_token.verify_oauth2_token(
            id_token_str,
            requests.Request(),
            settings. GOOGLE_CLIENT_ID
        )
        
        # Extract user info
        email = idinfo['email']
        provider_id = idinfo['sub']
        name = idinfo.get('name', '')
        avatar = idinfo. get('picture', '')
        email_verified = idinfo.get('email_verified', False)
        
        # Check if user exists with email/password
        existing_user = User.objects.filter(email=email, provider='email').first()
        if existing_user:
            return Response({
                'error': 'An account with this email already exists. Please login with email and password.',
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'provider': 'google',
                'provider_id': provider_id,
                'first_name': name. split()[0] if name else '',
                'last_name': ' '.join(name.split()[1:]) if len(name.split()) > 1 else '',
                'avatar':  avatar,
                'is_email_verified': email_verified,
            }
        )
        
        # Update avatar if changed
        if not created and user.provider == 'google':
            if avatar and user.avatar != avatar:
                user.avatar = avatar
                user. save(update_fields=['avatar'])
        
        tokens = get_tokens_for_user(user)
        
        return Response({
            'message': 'Google authentication successful',
            'user': UserSerializer(user).data,
            'tokens':  tokens,
            'is_new_user': created,
        })
        
    except ValueError as e:
        return Response(
            {'error': 'Invalid Google token', 'detail': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e: 
        return Response(
            {'error': 'Authentication failed', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def social_auth(request):
    """Alternative: Accept pre-validated social auth data from NextAuth"""
    serializer = SocialAuthSerializer(data=request. data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    email = data['email']
    provider = data['provider']
    provider_id = data['provider_id']
    name = data.get('name', '')
    avatar = data.get('avatar', '')
    
    # Check for existing email/password account
    existing_user = User. objects.filter(email=email, provider='email').first()
    if existing_user:
        return Response({
            'error': 'An account with this email already exists. Please login with email and password.',
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get or create user
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'provider': provider,
            'provider_id': provider_id,
            'first_name': name. split()[0] if name else '',
            'last_name': ' '.join(name.split()[1:]) if len(name.split()) > 1 else '',
            'avatar': avatar,
            'is_email_verified': True,
        }
    )
    
    tokens = get_tokens_for_user(user)
    
    return Response({
        'message': 'Social authentication successful',
        'user': UserSerializer(user).data,
        'tokens': tokens,
        'is_new_user': created,
    })


# === Protected Routes ===

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get current user profile"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update user profile"""
    user = request.user
    serializer = UserSerializer(user, data=request.data, partial=True)
    
    if serializer. is_valid():
        serializer.save()
        return Response({
            'message': 'Profile updated successfully',
            'user':  serializer.data
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout (blacklist refresh token)"""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token: 
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Logged out successfully'})
    except Exception: 
        return Response(
            {'error': 'Invalid token'},
            status=status.HTTP_400_BAD_REQUEST
        )