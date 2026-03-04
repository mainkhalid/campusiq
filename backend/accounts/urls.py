from django.urls import path
from .views import LoginView, LogoutView, MeView, RefreshView

urlpatterns = [
    path('login/', LoginView.as_view()),       # POST — get tokens
    path('logout/', LogoutView.as_view()),     # POST — invalidate refresh token
    path('me/', MeView.as_view()),             # GET  — current user info
    path('refresh/', RefreshView.as_view()),   # POST — get new access token
]