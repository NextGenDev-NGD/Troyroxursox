import requests
from decimal import Decimal
from django.utils import timezone

BCV_API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial'
PARALLEL_API_URL = 'https://ve.dolarapi.com/v1/dolares/paralelo'
REQUEST_TIMEOUT = 5  # seconds


def fetch_bcv_rate() -> Decimal | None:
    """
    Fetch the current BCV official rate from dolarapi.com.
    Returns the rate as Decimal or None if the request fails.
    """
    try:
        response = requests.get(BCV_API_URL, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()
        return Decimal(str(data['promedio']))
    except (requests.RequestException, KeyError, ValueError):
        return None


def fetch_and_store_rate() -> Decimal:
    """
    Fetch the live BCV rate and persist it to the database.
    Falls back to the last stored rate if the API is unavailable.
    """
    from .models import ExchangeRate
    from .utils import get_last_stored_rate

    rate = fetch_bcv_rate()

    if rate:
        ExchangeRate.objects.create(
            rate_bs_per_usd=rate,
            source=ExchangeRate.BCV,
            date=timezone.now().date()
        )
        return rate

    # API failed — return last known rate
    return get_last_stored_rate()
