from decimal import Decimal, ROUND_HALF_UP


def convert_currency(amount: Decimal, from_currency: str, rate: Decimal) -> tuple:
    """
    Convert an amount between Bs and USD.

    Args:
        amount: The amount entered by the user
        from_currency: 'BS' or 'USD'
        rate: Exchange rate (Bs per 1 USD)

    Returns:
        (amount_bs, amount_usd) as Decimal tuple
    """
    amount = Decimal(str(amount))
    rate = Decimal(str(rate))
    two_places = Decimal('0.01')

    if from_currency == 'BS':
        amount_bs = amount.quantize(two_places, rounding=ROUND_HALF_UP)
        amount_usd = (amount / rate).quantize(two_places, rounding=ROUND_HALF_UP)
    else:  # USD
        amount_usd = amount.quantize(two_places, rounding=ROUND_HALF_UP)
        amount_bs = (amount * rate).quantize(two_places, rounding=ROUND_HALF_UP)

    return amount_bs, amount_usd
