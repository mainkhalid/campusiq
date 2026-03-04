from django.urls import path, include

urlpatterns = [
    path('auth/', include('accounts.urls')),
    path('history/', include('history.urls')),
    path('faq/', include('faq.urls')),
    path('programmes/', include('programmes.urls')),
    path('timetable/', include('timetable.urls')),
    path('research/', include('research.urls')),
    path('scholarships/', include('scholarships.urls')),
    path('aibot/', include('aibot.urls')), 
    path('news/', include('news.urls')),
    path('aiconfig/', include('aiconfig.urls')),
    path('crawler/', include('crawler.urls')),
]