from django.db import models
from django.conf import settings


class Category(models.Model):
    EXPENSE = 'EXPENSE'
    INCOME = 'INCOME'
    TYPE_CHOICES = [(EXPENSE, 'Gasto'), (INCOME, 'Ingreso')]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True, blank=True  # null = global default available to all users
    )
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=10, default='📦')
    color = models.CharField(max_length=7, default='#6B7280')
    category_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.icon} {self.name}"

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['category_type', 'name']


class Transaction(models.Model):
    EXPENSE = 'EXPENSE'
    INCOME = 'INCOME'
    TYPE_CHOICES = [(EXPENSE, 'Gasto'), (INCOME, 'Ingreso')]

    BS = 'BS'
    USD = 'USD'
    CURRENCY_CHOICES = [(BS, 'Bolívares'), (USD, 'Dólares')]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='transactions'
    )
    transaction_type = models.CharField(max_length=10, choices=TYPE_CHOICES)

    # Always store both currencies — this is the core differentiator
    amount_bs = models.DecimalField(max_digits=18, decimal_places=2)
    amount_usd = models.DecimalField(max_digits=18, decimal_places=2)
    original_currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES)
    rate_at_transaction = models.DecimalField(max_digits=18, decimal_places=4)

    description = models.CharField(max_length=500, blank=True)
    date = models.DateField()
    receipt_photo = models.ImageField(
        upload_to='receipts/%Y/%m/',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['user', 'category']),
        ]

    def __str__(self):
        symbol = '+' if self.transaction_type == 'INCOME' else '-'
        return f"{symbol}${self.amount_usd} | {self.category} | {self.date}"
