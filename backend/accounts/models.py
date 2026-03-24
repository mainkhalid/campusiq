from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Custom user model extending Django's built-in AbstractUser.
    
    Why extend AbstractUser even for one superadmin?
    AbstractUser already gives you: email, password (hashed),
    is_staff, is_active, is_superuser, last_login, date_joined.
    
    We're just making email the login field instead of username,
    which matches your Login.jsx that sends email + password.
    Adding any new fields later just requires a new migration —
    no restructuring needed.
    """
    
    # Override email to make it unique
    # By default Django's email field is NOT unique
    email = models.EmailField(unique=True)
    
    # Tell Django: use email as the login identifier
    # instead of the default 'username' field
    USERNAME_FIELD = 'email'
    
    # REQUIRED_FIELDS = fields prompted when running
    # createsuperuser (besides USERNAME_FIELD and password)
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email