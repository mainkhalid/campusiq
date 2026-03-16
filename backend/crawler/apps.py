"""
crawler/apps.py

AppConfig that starts the auto-crawl scheduler when Django boots.

The scheduler is a lightweight daemon thread — it only wakes up
every 60 seconds to check SystemSettings, so there is zero overhead
when auto-crawl is disabled.
"""
from django.apps import AppConfig


class CrawlerConfig(AppConfig):
    name               = 'crawler'
    verbose_name       = 'Crawler'
    default_auto_field = 'django.db.models.BigAutoField'

    def ready(self):
        """
        Called once by Django when the app registry is fully loaded.

        Guard logic:
        - Dev server:   Django spawns a parent (file watcher) and a child (RUN_MAIN=true).
                        We only start the scheduler in the child so it doesn't run twice.
        - Gunicorn/uvicorn: RUN_MAIN is never set, but we DO want the scheduler.
        - Management commands (migrate, shell, etc.): skip entirely.
        """
        import os

        # Skip commands that should never start background threads
        if _is_skip_command():
            return

        # In the dev server, only start in the reloader child process
        is_dev_server = bool(os.environ.get('RUN_MAIN'))
        is_wsgi       = not is_dev_server and not _is_dev_server_parent()

        if not is_dev_server and not is_wsgi:
            return

        from . import scheduler
        scheduler.start()


def _is_skip_command():
    """Returns True if the current manage.py command should not start the scheduler."""
    import sys
    skip = {
        'migrate', 'makemigrations', 'collectstatic', 'shell',
        'createsuperuser', 'test', 'check', 'inspectdb',
        'dbshell', 'showmigrations', 'sqlmigrate', 'dumpdata',
        'loaddata', 'flush',
    }
    return len(sys.argv) >= 2 and sys.argv[1] in skip


def _is_dev_server_parent():
    """
    Django's dev server parent process has 'runserver' in argv but
    RUN_MAIN is not set. We skip the scheduler there to avoid double-start.
    """
    import sys
    return len(sys.argv) >= 2 and sys.argv[1] == 'runserver'