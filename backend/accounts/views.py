# accounts/views.py
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import LoginSerializer, UserSerializer

User = get_user_model()


class LoginView(APIView):
    """
    POST /api/auth/login/
    
    Accepts { email, password }
    Returns { access, refresh, user }
    
    APIView is the base class for custom views.
    Unlike ModelViewSet (which handles CRUD automatically),
    APIView lets you define exactly what each HTTP method does.
    Use APIView when the logic doesn't map to simple CRUD.
    """
    
    # This endpoint must be public — no token required to log in
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        
        # .is_valid() runs all field validations defined in the serializer.
        # raise_exception=True means it automatically returns a 400
        # response with error details if validation fails —
        # no need for manual if/else checking.
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        # Fetch the user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # check_password() compares the raw password against
        # the stored hash — never store or compare plain text passwords
        if not user.check_password(password):
            return Response(
                {'detail': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'detail': 'Account is disabled'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Generate JWT token pair for this user.
        # RefreshToken.for_user() creates both tokens and
        # embeds the user's id into the token payload automatically.
        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    
    Blacklists the refresh token so it can't be used again.
    The access token will naturally expire (after 8 hours per our settings).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'detail': 'Refresh token required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            # blacklist() invalidates this specific refresh token.
            # Requires 'rest_framework_simplejwt.token_blacklist'
            # in INSTALLED_APPS (we'll add it below).
            token.blacklist()
            
            return Response(
                {'detail': 'Logged out successfully'},
                status=status.HTTP_200_OK
            )
        except TokenError:
            return Response(
                {'detail': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST
            )


class MeView(APIView):
    """
    GET /api/auth/me/
    
    Returns the currently authenticated user's info.
    Your React AuthContext can call this on app load
    to verify the token is still valid and get user data.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # request.user is automatically populated by DRF
        # when a valid JWT token is present in the Authorization header
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class RefreshView(APIView):
    """
    POST /api/auth/refresh/
    
    Accepts { refresh } token, returns new { access } token.
    Your axios interceptor will call this automatically
    when it gets a 401 response.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            return Response({
                'access': str(token.access_token)
            })
        except TokenError:
            return Response(
                {'detail': 'Invalid or expired refresh token'},
                status=status.HTTP_401_UNAUTHORIZED
            )