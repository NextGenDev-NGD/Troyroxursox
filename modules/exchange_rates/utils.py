from decimal import Decimal
from django.core.cache import cache

CACHE_KEY = 'bcv_rate_current'
CACHE_TIMEOUT = 900  # 15 minutes
FALLBACK_RATE = Decimal('36.50')


def get_current_rate() -> Decimal:
    """
    Returns the current BCV exchange rate.
    Uses a 15-minute cache to avoid hitting the API on every page load.
    Falls back to the last stored rate, then to a hardcoded default.
    """
    cached = cache.get(CACHE_KEY)
    if cached:
        return Decimal(str(cached))

    rate = get_last_stored_rate()
    if rate:
        cache.set(CACHE_KEY, str(rate), timeout=CACHE_TIMEOUT)
    return rate


def get_last_stored_rate() -> Decimal:
    """Returns the most recently stored rate from the database."""
    from .models import ExchangeRate
    try:
        latest = ExchangeRate.objects.latest()
        return latest.rate_bs_per_usd
    except ExchangeRate.DoesNotExist:
        return FALLBACK_RATE


def invalidate_rate_cache():
    """Call this after storing a new rate to force a fresh fetch."""
    cache.delete(CACHE_KEY)
