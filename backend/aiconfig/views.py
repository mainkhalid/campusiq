import re
from datetime import timedelta

from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ChatLog, AISettings
from .serializers import ChatLogSerializer, AISettingsSerializer


def detect_topic(message: str) -> str:
    """
    Detects which topic a student message belongs to.
    Called by the service after every chat to categorise the log.
    """
    msg = message.lower()
    if re.search(r'\b(class|timetable|schedule|room|venue|lecturer|unit|session|time)\b', msg):
        return 'timetable'
    if re.search(r'\b(scholarship|grant|funding|bursary|sponsor)\b', msg):
        return 'scholarships'
    if re.search(r'\b(programme|course|diploma|degree|certificate|study|enroll)\b', msg):
        return 'programmes'
    if re.search(r'\b(fee|cost|payment|how much|tuition|invoice)\b', msg):
        return 'fees'
    if re.search(r'\b(admit|admission|apply|application|intake|join|register)\b', msg):
        return 'admissions'
    if re.search(r'\b(research|project|innovation|milestone|publish)\b', msg):
        return 'research'
    return 'general'


class LogStatsView(APIView):
    """
    GET /api/aiconfig/logs/stats/
    Powers the 4 MiniStat cards at top of Analytics tab:
    Total chats, Today, This week, Helpful %
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today      = timezone.now().date()
        week_start = today - timedelta(days=7)
        total      = ChatLog.objects.count()
        helpful    = ChatLog.objects.filter(was_helpful=True).count()

        return Response({
            'success': True,
            'data': {
                'total':           total,
                'today':           ChatLog.objects.filter(created_at__date=today).count(),
                'this_week':       ChatLog.objects.filter(created_at__date__gte=week_start).count(),
                'helpful_percent': round(helpful / total * 100) if total > 0 else 0,
            }
        })


class LogTopicsView(APIView):
    """
    GET /api/aiconfig/logs/topics/
    Powers the horizontal bar chart — count per topic.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        topics = (
            ChatLog.objects
            .values('topic')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        return Response({'success': True, 'data': list(topics)})


class LogVolumeView(APIView):
    """
    GET /api/aiconfig/logs/volume/
    Powers the line chart — daily counts for last 30 days.
    Zero-fills missing days so the chart has no gaps.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        since = timezone.now() - timedelta(days=30)
        rows  = (
            ChatLog.objects
            .filter(created_at__gte=since)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        volume_map = {str(r['date']): r['count'] for r in rows}

        # Build a full 30-day series with zeros for quiet days
        result = []
        for i in range(30):
            day = (timezone.now() - timedelta(days=29 - i)).date()
            result.append({'date': str(day), 'count': volume_map.get(str(day), 0)})

        return Response({'success': True, 'data': result})


class TopQuestionsView(APIView):
    """
    GET /api/aiconfig/logs/top_questions/
    Returns the latest 20 logs for the Logs tab table.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logs = ChatLog.objects.order_by('-created_at')[:20]
        return Response({
            'success': True,
            'data': ChatLogSerializer(logs, many=True).data
        })


class DeleteLogView(APIView):
    """
    DELETE /api/aiconfig/logs/{id}/
    Admin deletes a single log entry.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            ChatLog.objects.get(pk=pk).delete()
            return Response({'success': True, 'message': 'Log deleted'})
        except ChatLog.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Log not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class AISettingsView(APIView):
    """
    GET /api/aiconfig/settings/  → load current settings into the form
    PUT /api/aiconfig/settings/  → save admin changes

    The service reads these settings on every student chat request
    so any change the admin saves takes effect on the very next message —
    no server restart needed.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings = AISettings.get_settings()
        return Response({
            'success': True,
            'data': AISettingsSerializer(settings).data
        })

    def put(self, request):
        settings   = AISettings.get_settings()
        serializer = AISettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'data': serializer.data})
        return Response(
            {'success': False, 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )