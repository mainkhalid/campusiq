from rest_framework import serializers
from django.contrib.auth import get_user_model


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Used to return user info after login."""
    class Meta:
        model = User
        # Never expose password — even hashed — in API responses
        fields = ['id', 'email', 'username', 'is_superuser', 'last_login']
        read_only_fields = ['id', 'is_superuser', 'last_login']


class LoginSerializer(serializers.Serializer):
    """
    Validates the login payload from your Login.jsx.
    
    We use a plain Serializer (not ModelSerializer) here
    because we're not creating/updating a model instance —
    we're just validating two input fields.
    """
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        # style hint for browsable API to render a password input
        style={'input_type': 'password'}
    )