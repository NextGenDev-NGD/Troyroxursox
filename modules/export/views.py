import csv
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from modules.transactions.models import Transaction


@login_required
def export_csv(request):
    response = HttpResponse(content_type='text/csv')
    filename = f"finanzas_{timezone.now().strftime('%Y%m%d')}.csv"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)
    writer.writerow([
        'Fecha', 'Tipo', 'Categoría', 'Descripción',
        'Monto USD', 'Monto Bs', 'Tasa al momento'
    ])

    transactions = Transaction.objects.filter(
        user=request.user
    ).select_related('category').order_by('-date')

    for tx in transactions:
        writer.writerow([
            tx.date,
            tx.get_transaction_type_display(),
            tx.category.name,
            tx.description,
            tx.amount_usd,
            tx.amount_bs,
            tx.rate_at_transaction,
        ])

    return response
