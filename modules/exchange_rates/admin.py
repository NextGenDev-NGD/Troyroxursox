from django.contrib import admin
from .models import ExchangeRate
from .utils import invalidate_rate_cache


@admin.register(ExchangeRate)
class ExchangeRateAdmin(admin.ModelAdmin):
    list_display = ['date', 'rate_bs_per_usd', 'source', 'fetched_at']
    list_filter = ['source', 'date']
    readonly_fields = ['fetched_at']

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        invalidate_rate_cache()  # clear cache when admin sets a new rate
