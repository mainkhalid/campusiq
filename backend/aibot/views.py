from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .service import ai_service


class ChatView(APIView):
    """
    POST /api/aibot/chat/
    Body: { message: string, history: [{role, content}] }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        message = request.data.get('message', '').strip()
        history = request.data.get('history', [])

        if not message:
            return Response(
                {'success': False, 'message': 'Message is required'},
                status=400
            )

        result = ai_service.chat(message, history)

        return Response({
            'success': not result.get('error', False),
            'data':    result,
        })


class QuickActionsView(APIView):
    """
    GET /api/aibot/quick-actions/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'success': True,
            'data':    ai_service.get_quick_actions(),
        })


class GreetingView(APIView):
    """
    GET /api/aibot/greeting/

    Called by the chat widget on first load to get the
    admin-configured greeting message.
    If admin changes the greeting in AIAdmin, the next
    student who opens the widget sees it immediately.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            from aiconfig.models import AISettings
            settings = AISettings.get_settings()
            greeting = settings.greeting_message
        except Exception:
            greeting = "Hello! 👋 I'm your Zetech University assistant. How can I help you today?"

        return Response({'success': True, 'data': {'greeting': greeting}})