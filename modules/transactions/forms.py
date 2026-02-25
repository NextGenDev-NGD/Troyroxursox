from django import forms
from django.db.models import Q
from .models import Transaction, Category


class TransactionForm(forms.ModelForm):
    amount = forms.DecimalField(
        max_digits=18,
        decimal_places=2,
        min_value=0.01,
        label='Monto'
    )
    currency = forms.ChoiceField(
        choices=[('USD', 'USD $'), ('BS', 'Bolívares Bs')],
        label='Moneda'
    )

    class Meta:
        model = Transaction
        fields = ['transaction_type', 'category', 'amount', 'currency',
                  'date', 'receipt_photo']
        labels = {
            'transaction_type': 'Tipo',
            'category': 'Categoría',
            'date': 'Fecha',
            'receipt_photo': 'Foto del recibo (opcional)',
        }
        widgets = {
            'date': forms.DateInput(attrs={'type': 'date'}),
        }

    def __init__(self, user, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['category'].queryset = Category.objects.filter(
            Q(user=user) | Q(user__isnull=True),
            is_active=True
        )
        # Style all fields with Tailwind
        for field_name, field in self.fields.items():
            if not isinstance(field.widget, forms.FileInput):
                field.widget.attrs.update({
                    'class': 'w-full border border-gray-300 rounded-lg px-3 py-2 '
                             'focus:outline-none focus:ring-2 focus:ring-blue-500'
                })

    def clean_receipt_photo(self):
        photo = self.cleaned_data.get('receipt_photo')
        if photo:
            if photo.size > 5 * 1024 * 1024:
                raise forms.ValidationError('El archivo es muy grande. Máximo 5MB.')
            allowed = ['image/jpeg', 'image/png', 'image/webp']
            if photo.content_type not in allowed:
                raise forms.ValidationError('Solo se permiten imágenes JPEG, PNG o WebP.')
        return photo
