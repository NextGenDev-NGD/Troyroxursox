from decimal import Decimal
from django.core.cache import cache

CACHE_KEY = 'bcv_rate_current'
CACHE_TIMEOUT = 900  # 15 minutes
FALLBACK_RATE = Decimal('414.00')


def get_current_rate() -> Decimal:
    """
    Returns the current BCV exchange rate.
    1. Checks 15-minute cache first.
    2. On cache miss, fetches live rate from API and stores it.
    3. Falls back to last stored DB rate, then hardcoded default.
    """
    cached = cache.get(CACHE_KEY)
    if cached:
        return Decimal(str(cached))

    from .services import fetch_and_store_rate
    rate = fetch_and_store_rate()
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
