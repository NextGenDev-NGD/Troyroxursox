from django.db import models


class ExchangeRate(models.Model):
    BCV = 'BCV'
    PARALLEL = 'PARALLEL'
    MANUAL = 'MANUAL'
    SOURCE_CHOICES = [
        (BCV, 'BCV Oficial'),
        (PARALLEL, 'Mercado Paralelo'),
        (MANUAL, 'Manual'),
    ]

    rate_bs_per_usd = models.DecimalField(max_digits=18, decimal_places=4)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default=BCV)
    date = models.DateField()
    fetched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fetched_at']
        get_latest_by = 'fetched_at'
        verbose_name = 'Exchange Rate'
        verbose_name_plural = 'Exchange Rates'

    def __str__(self):
        return f"{self.rate_bs_per_usd} Bs/USD — {self.source} — {self.date}"
