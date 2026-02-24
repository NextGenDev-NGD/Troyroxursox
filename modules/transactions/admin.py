from django.contrib import admin
from .models import Category, Transaction


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['icon', 'name', 'category_type', 'user', 'is_active']
    list_filter = ['category_type', 'is_active']
    search_fields = ['name']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['date', 'user', 'transaction_type', 'category',
                    'amount_usd', 'amount_bs', 'rate_at_transaction']
    list_filter = ['transaction_type', 'category', 'date']
    search_fields = ['description', 'user__email']
    date_hierarchy = 'date'
    readonly_fields = ['created_at', 'updated_at']
