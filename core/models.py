from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    USD = 'USD'
    BS = 'BS'
    CURRENCY_CHOICES = [(USD, 'US Dollars'), (BS, 'Bolívares')]

    preferred_currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default=USD
    )

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email
