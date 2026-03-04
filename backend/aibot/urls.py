from django.urls import path
from .views import ChatView, QuickActionsView, GreetingView

urlpatterns = [
    path('chat/',          ChatView.as_view()),
    path('quick-actions/', QuickActionsView.as_view()),
    path('greeting/',      GreetingView.as_view()), 
]