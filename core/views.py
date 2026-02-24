from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.db.models import Sum, Q
from django.utils import timezone
from django import forms as django_forms

from .models import User
from modules.transactions.models import Transaction
from modules.exchange_rates.utils import get_current_rate


class RegisterForm(django_forms.ModelForm):
    password1 = django_forms.CharField(label='Password', widget=django_forms.PasswordInput)
    password2 = django_forms.CharField(label='Confirm Password', widget=django_forms.PasswordInput)

    class Meta:
        model = User
        fields = ['username', 'email', 'preferred_currency']

    def clean_password2(self):
        p1 = self.cleaned_data.get('password1')
        p2 = self.cleaned_data.get('password2')
        if p1 and p2 and p1 != p2:
            raise django_forms.ValidationError('Passwords do not match.')
        return p2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password1'])  # hashes automatically
        if commit:
            user.save()
        return user


def register(request):
    if request.user.is_authenticated:
        return redirect('core:dashboard')
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('core:dashboard')
    else:
        form = RegisterForm()
    return render(request, 'core/register.html', {'form': form})


@login_required
def dashboard(request):
    today = timezone.now().date()
    month_start = today.replace(day=1)

    transactions = Transaction.objects.filter(user=request.user)

    monthly = transactions.filter(date__gte=month_start)
    monthly_income = monthly.filter(transaction_type='INCOME').aggregate(
        total=Sum('amount_usd'))['total'] or 0
    monthly_expenses = monthly.filter(transaction_type='EXPENSE').aggregate(
        total=Sum('amount_usd'))['total'] or 0

    recent = transactions.select_related('category')[:5]

    context = {
        'monthly_income': monthly_income,
        'monthly_expenses': monthly_expenses,
        'balance': monthly_income - monthly_expenses,
        'recent_transactions': recent,
        'current_rate': get_current_rate(),
        'today': today,
    }
    return render(request, 'core/dashboard.html', context)
