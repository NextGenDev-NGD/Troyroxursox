import requests
from decimal import Decimal
from django.utils import timezone

BCV_FALLBACK_API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial'
REQUEST_TIMEOUT = 5  # seconds


def fetch_bcv_rate() -> Decimal | None:
    """
    Fetch the current BCV official USD rate.
    Primary: pyDolarVenezuela (scrapes BCV directly).
    Fallback: ve.dolarapi.com REST API.
    Returns the rate as Decimal or None if both sources fail.
    """
    # Primary: pyDolarVenezuela
    try:
        from pyDolarVenezuela.pages import BCV
        from pyDolarVenezuela import Monitor
        monitor = Monitor(BCV)
        monitors = monitor.get_all_monitors()
        usd = next((m for m in monitors if 'estadounidense' in m.title.lower()), None)
        if usd and usd.price:
            return Decimal(str(usd.price))
    except Exception:
        pass

    # Fallback: ve.dolarapi.com
    try:
        response = requests.get(BCV_FALLBACK_API_URL, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()
        return Decimal(str(data['promedio']))
    except (requests.RequestException, KeyError, ValueError):
        return None


def fetch_and_store_rate() -> Decimal:
    """
    Fetch the live BCV rate and persist it to the database.
    Falls back to the last stored rate if all sources are unavailable.
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

    # All sources failed — return last known rate
    return get_last_stored_rate()
