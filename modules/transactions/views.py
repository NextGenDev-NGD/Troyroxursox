from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q, Sum
from django.utils import timezone

from .models import Transaction, Category
from .forms import TransactionForm
from .utils import convert_currency
from modules.exchange_rates.utils import get_current_rate


@login_required
def transaction_list(request):
    transactions = Transaction.objects.filter(
        user=request.user
    ).select_related('category')

    query = request.GET.get('q', '').strip()
    if query:
        transactions = transactions.filter(
            Q(description__icontains=query) |
            Q(category__name__icontains=query)
        )

    tx_type = request.GET.get('type', '')
    if tx_type in ('EXPENSE', 'INCOME'):
        transactions = transactions.filter(transaction_type=tx_type)

    category_id = request.GET.get('category', '')
    if category_id:
        transactions = transactions.filter(category_id=category_id)

    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')
    if date_from:
        transactions = transactions.filter(date__gte=date_from)
    if date_to:
        transactions = transactions.filter(date__lte=date_to)

    totals = transactions.aggregate(
        income_usd=Sum('amount_usd', filter=Q(transaction_type='INCOME')),
        expense_usd=Sum('amount_usd', filter=Q(transaction_type='EXPENSE')),
    )
    totals['income_usd'] = totals['income_usd'] or 0
    totals['expense_usd'] = totals['expense_usd'] or 0
    totals['balance'] = totals['income_usd'] - totals['expense_usd']

    categories = Category.objects.filter(
        Q(user=request.user) | Q(user__isnull=True),
        is_active=True
    )

    return render(request, 'transactions/list.html', {
        'transactions': transactions,
        'categories': categories,
        'totals': totals,
        'query': query,
        'filters': {
            'type': tx_type,
            'category': category_id,
            'date_from': date_from,
            'date_to': date_to,
        }
    })


@login_required
def transaction_add(request):
    if request.method == 'POST':
        form = TransactionForm(request.user, request.POST, request.FILES)
        if form.is_valid():
            tx = form.save(commit=False)
            tx.user = request.user

            rate = get_current_rate()
            tx.rate_at_transaction = rate
            tx.original_currency = form.cleaned_data['currency']
            tx.amount_bs, tx.amount_usd = convert_currency(
                form.cleaned_data['amount'],
                form.cleaned_data['currency'],
                rate
            )
            tx.save()
            messages.success(request, 'Transacción guardada exitosamente.')
            return redirect('transactions:list')
    else:
        form = TransactionForm(
            request.user,
            initial={'date': timezone.now().date(), 'currency': request.user.preferred_currency}
        )

    return render(request, 'transactions/add.html', {
        'form': form,
        'current_rate': get_current_rate(),
        'title': 'Nueva Transacción',
    })


@login_required
def transaction_edit(request, pk):
    tx = get_object_or_404(Transaction, pk=pk, user=request.user)
    if request.method == 'POST':
        form = TransactionForm(request.user, request.POST, request.FILES, instance=tx)
        if form.is_valid():
            updated = form.save(commit=False)
            updated.original_currency = form.cleaned_data['currency']
            updated.amount_bs, updated.amount_usd = convert_currency(
                form.cleaned_data['amount'],
                form.cleaned_data['currency'],
                tx.rate_at_transaction  # keep original rate when editing
            )
            updated.save()
            messages.success(request, 'Transacción actualizada.')
            return redirect('transactions:list')
    else:
        initial_amount = tx.amount_bs if tx.original_currency == 'BS' else tx.amount_usd
        form = TransactionForm(
            request.user,
            instance=tx,
            initial={'amount': initial_amount, 'currency': tx.original_currency}
        )

    return render(request, 'transactions/add.html', {
        'form': form,
        'current_rate': tx.rate_at_transaction,
        'title': 'Editar Transacción',
        'editing': True,
    })


@login_required
def transaction_delete(request, pk):
    tx = get_object_or_404(Transaction, pk=pk, user=request.user)
    if request.method == 'POST':
        tx.delete()
        messages.success(request, 'Transacción eliminada.')
        return redirect('transactions:list')
    return render(request, 'transactions/confirm_delete.html', {'tx': tx})


@login_required
def transaction_detail(request, pk):
    tx = get_object_or_404(Transaction, pk=pk, user=request.user)
    return render(request, 'transactions/detail.html', {'tx': tx})
