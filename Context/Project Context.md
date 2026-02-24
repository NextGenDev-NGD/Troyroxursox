# Project Context — Mis Finanzas Venezuela

**Document Version:** 1.0
**Last Updated:** February 2026
**Status:** Active Development — Python Rebuild Phase
**Branch:** experiment

---

## 1. Project Summary

**App Name:** Mis Finanzas Venezuela (working title)
**Type:** Python/Django web application
**Purpose:** Dual-currency personal finance tracker built specifically for Venezuelans operating in a Bs/USD economy.

### The Core Problem
Venezuelan users live in a dual-currency economy. International finance apps (Mint, YNAB, PocketGuard) fail them because they:
- Don't handle dual currency natively
- Convert at today's rates (useless for inflation tracking — you need the rate at time of purchase)
- Don't understand Venezuelan payment reality (Pago Móvil, remittances, crypto)
- Often require constant internet

### Our Non-Negotiable Differentiator
**Store the exchange rate with every single transaction.** This is what no competitor does. It allows users to see their true spending power over time and track the real impact of inflation.

---

## 2. Current Prototype Analysis (React — finance-app-mvp.tsx)

The existing prototype in this repo is a React/localStorage single-page app. Here is its full audit:

### What Worked
- Clean, simple UI design
- Dual currency display concept
- Receipt photo concept (Base64)
- Category breakdown with emojis
- Live BCV rate fetch from `ve.dolarapi.com` (added in last commit)

### Critical Problems (Being Fixed in Rebuild)

| Problem | Evidence in Code | Fix |
|---|---|---|
| Plain text passwords | `password: 'admin'` in localStorage (line 66) | Django Argon2 password hashing |
| No backend | All data in `localStorage` — lost on device change | Django + PostgreSQL |
| No income tracking | Expenses only | Full EXPENSE + INCOME transaction types |
| No search | Zero search/filter functionality | Full search by text, category, date |
| 6 hardcoded categories | Lines 30–37, not customizable | Custom categories per user + defaults |
| Receipts as Base64 | Bloats localStorage, not scalable | Server-side file storage |
| No data export | Users can't get their data out | CSV export module (MVP) |
| Client-side auth only | No real sessions | Django server-side sessions |

---

## 3. Technology Decision

### Framework: Django (chosen over Flask)

| Reason | Detail |
|---|---|
| Built-in admin | Zero setup — needed for managing exchange rates manually |
| Built-in auth | Secure password hashing, sessions, password reset included |
| ORM + Migrations | PostgreSQL with proper migration history |
| Django Apps | Natural fit for the modular architecture vision |
| Solo developer | Batteries-included reduces boilerplate and decisions |
| Future REST API | Django REST Framework available when needed for mobile |

### Full Stack
| Layer | Technology |
|---|---|
| Backend | Django 4.2 |
| Database (dev) | SQLite |
| Database (prod) | PostgreSQL |
| Frontend | Django Templates + Tailwind CSS CDN |
| Interactivity | Alpine.js (lightweight, <15KB) |
| File Storage | Local filesystem → S3/Cloudinary (production) |
| Password Hashing | Argon2 (upgrade from Django default PBKDF2) |
| Exchange Rate API | `ve.dolarapi.com` (same as prototype) |
| Deployment | Render.com (recommended) |

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                        │
│         Django Templates + Tailwind CSS                  │
│         Alpine.js (lightweight interactivity)            │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP Requests
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  DJANGO APPLICATION                      │
│                                                          │
│  ┌──────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │   core/  │  │  modules/   │  │  exchange_rates/  │   │
│  │  (auth,  │  │transactions │  │  (BCV API fetch,  │   │
│  │settings) │  │  accounts   │  │   caching, store) │   │
│  └──────────┘  │  recurring  │  └──────────────────┘   │
│                │   goals     │                           │
│                │   export    │  ┌──────────────────┐    │
│                │   reports   │  │   FILE STORAGE   │    │
│                └─────────────┘  │  media/receipts/ │    │
│                                 │  → S3 (prod)     │    │
└─────────────────────────────────┴──────────────────┴────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│               DATABASE (PostgreSQL/SQLite)               │
│  users │ transactions │ categories │ exchange_rates      │
│  receipts │ accounts │ recurring_rules │ goals           │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              EXTERNAL: ve.dolarapi.com                   │
│         (BCV official rate + parallel market)            │
└─────────────────────────────────────────────────────────┘
```

### Data Flow (Adding a Transaction)
1. User submits form → Django view receives POST
2. View calls `get_current_rate()` → returns cached rate (15 min cache) or fetches fresh
3. `convert_currency()` calculates both `amount_bs` and `amount_usd`
4. Transaction saved with `rate_at_transaction` field permanently set
5. If receipt photo attached → saved to `media/receipts/YYYY/MM/`
6. User redirected to transaction list with success message

---

## 5. Project File Structure

```
venezuela-finance-app/
│
├── manage.py
├── requirements.txt
├── .env.example                  ← Template — copy to .env (never commit .env)
├── .gitignore
│
├── config/
│   ├── settings/
│   │   ├── base.py               ← Shared settings (all environments)
│   │   ├── development.py        ← SQLite, DEBUG=True
│   │   └── production.py         ← PostgreSQL, DEBUG=False, security headers
│   ├── urls.py                   ← Root URL dispatcher
│   └── wsgi.py
│
├── core/                         ← Django app: authentication + dashboard
│   ├── models.py                 ← Custom User model (extends AbstractUser)
│   ├── views.py                  ← Dashboard, register
│   ├── urls.py                   ← Auth routes (login, logout, register, password reset)
│   ├── admin.py
│   └── templates/core/
│       ├── login.html
│       ├── register.html
│       └── dashboard.html
│
├── modules/
│   ├── transactions/             ← MVP CORE MODULE
│   │   ├── models.py             ← Transaction, Category
│   │   ├── views.py              ← CRUD + search/filter
│   │   ├── forms.py              ← TransactionForm with validation
│   │   ├── utils.py              ← convert_currency()
│   │   ├── urls.py
│   │   ├── admin.py
│   │   ├── fixtures/
│   │   │   └── default_categories.json   ← 13 default categories (8 expense, 5 income)
│   │   └── templates/transactions/
│   │       ├── list.html
│   │       ├── add.html          ← also used for edit
│   │       └── confirm_delete.html
│   │
│   ├── exchange_rates/           ← Rate fetching, storage, caching
│   │   ├── models.py             ← ExchangeRate (historical log)
│   │   ├── services.py           ← fetch_bcv_rate(), fetch_and_store_rate()
│   │   ├── utils.py              ← get_current_rate() with 15min cache
│   │   └── admin.py              ← Admin can set manual rates
│   │
│   ├── export/                   ← MVP: CSV export
│   │   ├── views.py              ← export_csv()
│   │   └── urls.py
│   │
│   ├── accounts/                 ← Phase 1.5 (not built yet)
│   ├── recurring/                ← Phase 1.5 (not built yet)
│   ├── goals/                    ← Phase 1.5 (not built yet)
│   └── reports/                  ← Phase 2 (not built yet)
│
├── templates/
│   └── base.html                 ← All pages extend this (navbar, messages, Tailwind)
│
├── static/
│   ├── css/
│   └── js/
│
├── media/                        ← User uploads (gitignored)
│   └── receipts/
│
└── Context/                      ← This folder
    ├── Project Context.md        ← This file
    ├── New considerations.md     ← Full requirements & vision document
    ├── Complete Backup Package - All Files.pdf
    └── Competitive Analysis - Venezuelan Finance Tracker vs Market Leaders.pdf
```

---

## 6. Database Schema

### core_user
```sql
id                  SERIAL PRIMARY KEY
email               VARCHAR(254) UNIQUE NOT NULL
username            VARCHAR(150) NOT NULL
password            VARCHAR(128) NOT NULL        -- Argon2 hash, NEVER plain text
preferred_currency  VARCHAR(3) DEFAULT 'USD'     -- 'USD' or 'BS'
is_active           BOOLEAN DEFAULT TRUE
date_joined         TIMESTAMP DEFAULT NOW()
```

### exchange_rates_exchangerate
```sql
id                  SERIAL PRIMARY KEY
rate_bs_per_usd     DECIMAL(18,4) NOT NULL       -- e.g. 36.5000
source              VARCHAR(20) NOT NULL          -- 'BCV', 'PARALLEL', 'MANUAL'
date                DATE NOT NULL
fetched_at          TIMESTAMP DEFAULT NOW()
INDEX(date)
```

### transactions_category
```sql
id                  SERIAL PRIMARY KEY
user_id             INTEGER REFERENCES core_user(id) NULL  -- NULL = global default
name                VARCHAR(100) NOT NULL
icon                VARCHAR(10)                  -- emoji
color               VARCHAR(7)                   -- hex color
category_type       VARCHAR(10) NOT NULL         -- 'EXPENSE' or 'INCOME'
is_active           BOOLEAN DEFAULT TRUE
```

### transactions_transaction ← THE CORE TABLE
```sql
id                      SERIAL PRIMARY KEY
user_id                 INTEGER REFERENCES core_user(id) NOT NULL
category_id             INTEGER REFERENCES transactions_category(id) NOT NULL
transaction_type        VARCHAR(10) NOT NULL     -- 'EXPENSE' or 'INCOME'

-- Dual currency fields (ALWAYS store both)
amount_bs               DECIMAL(18,2) NOT NULL
amount_usd              DECIMAL(18,2) NOT NULL
original_currency       VARCHAR(3) NOT NULL      -- 'BS' or 'USD' (what user typed)
rate_at_transaction     DECIMAL(18,4) NOT NULL   -- THE DIFFERENTIATOR — locked at save time

description             VARCHAR(500)
date                    DATE NOT NULL
receipt_photo           VARCHAR(255)             -- file path, nullable
created_at              TIMESTAMP DEFAULT NOW()
updated_at              TIMESTAMP DEFAULT NOW()

INDEX(user_id, date)
INDEX(user_id, category_id)
```

### Future Tables (Phase 1.5+)
- `accounts_account` — Cash, Bank, Credit Card, Savings accounts
- `recurring_recurringrule` — Monthly bills, subscriptions
- `goals_goal` — Savings goals with progress tracking

---

## 7. Module Dependency Map

```
                    ┌─────────────────┐
                    │     CORE        │
                    │ (Auth, User)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ EXCHANGE RATES  │
                    │ (BCV API, cache)│
                    └────────┬────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│                     TRANSACTIONS                         │
│         (Foundation Module — MVP Complete)               │
│   Expenses · Income · Categories · Receipts · Search     │
└──────┬─────────────────────────────────┬────────────────┘
       │                                 │
┌──────▼──────┐                  ┌───────▼──────┐
│   ACCOUNTS  │                  │  RECURRING   │
│ (Phase 1.5) │                  │ (Phase 1.5)  │
└──────┬──────┘                  └───────┬──────┘
       └──────────────┬──────────────────┘
                      │
              ┌───────▼──────┐
              │    GOALS     │
              │ (Phase 1.5)  │
              └───────┬──────┘
                      │
              ┌───────▼──────┐
              │   REPORTS    │
              │  (Phase 2)   │
              └──────────────┘

EXPORT module ──── reads from TRANSACTIONS (independent, no upward deps)
```

**Rule:** Modules only import from `core/` and `exchange_rates/`. No module imports from another module. Communication is through the database only.

---

## 8. Key Code Patterns

### Currency Conversion (modules/transactions/utils.py)
```python
def convert_currency(amount, from_currency, rate) -> tuple:
    # Returns (amount_bs, amount_usd)
    if from_currency == 'BS':
        return amount, (amount / rate).quantize(Decimal('0.01'))
    else:  # USD
        return (amount * rate).quantize(Decimal('0.01')), amount
```

### Get Current Rate with Cache (modules/exchange_rates/utils.py)
```python
def get_current_rate() -> Decimal:
    cached = cache.get('bcv_rate_current')
    if cached:
        return Decimal(str(cached))
    # Falls back to DB, then hardcoded 36.50
```

### Saving a Transaction (modules/transactions/views.py)
```python
rate = get_current_rate()
tx.rate_at_transaction = rate           # locked forever
tx.amount_bs, tx.amount_usd = convert_currency(amount, currency, rate)
tx.save()
```

---

## 9. Security Implementation

| Threat | Protection |
|---|---|
| Plain text passwords | Argon2 hashing via `PASSWORD_HASHERS` setting |
| CSRF attacks | Django CSRF middleware (automatic on all forms) |
| XSS | Django auto-escapes all template variables |
| SQL injection | Django ORM uses parameterized queries |
| Malicious file uploads | Content-type + size validation in `TransactionForm.clean_receipt_photo()` |
| Session hijacking | `SESSION_COOKIE_SECURE=True` (HTTPS only in production) |
| Clickjacking | `X_FRAME_OPTIONS = 'DENY'` |
| Sensitive data in code | All secrets in `.env` file, never committed |

---

## 10. Development Roadmap

### Phase 0: Foundation (Week 1–2) — IN PROGRESS
- [x] Project structure created
- [x] Custom User model
- [x] Settings split (dev/prod)
- [x] Authentication system (register, login, logout, password reset)
- [x] Base template with Tailwind
- [ ] Run first migration
- [ ] Load default categories fixture
- [ ] Create superuser

### Phase 1: Core MVP (Week 3–6)
- [ ] Transaction add/edit/delete (expense + income)
- [ ] Category management (create custom categories)
- [ ] Exchange rate storage and caching
- [ ] Dashboard with monthly summary
- [ ] Transaction list with search and filters
- [ ] Receipt photo upload
- [ ] CSV export

### Phase 1.5: Critical Gaps (Week 7–10)
- [ ] Multiple accounts (Cash, Bank, Credit, Savings)
- [ ] Recurring transactions (monthly bills)
- [ ] Savings goals
- [ ] Bill reminders
- [ ] Split transactions (one purchase, multiple categories)

### Phase 2: Competitive Parity (Week 11–16)
- [ ] Real-time exchange rate API (parallel market)
- [ ] Enhanced reports and charts
- [ ] Pago Móvil integration (research)
- [ ] Cryptocurrency tracking (USDT, BTC)
- [ ] Net worth tracking
- [ ] Offline mode (service worker)

### Phase 3: Differentiation (Week 17–24)
- [ ] OCR receipt scanning
- [ ] AI spending insights
- [ ] Family/shared budgets
- [ ] Mobile app prep (solidify REST API)

---

## 11. Getting Started (First Run)

```bash
# 1. Clone and setup
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env and set SECRET_KEY (generate with: python -c "import secrets; print(secrets.token_urlsafe(50))")

# 3. Run migrations
python manage.py migrate

# 4. Load default categories
python manage.py loaddata modules/transactions/fixtures/default_categories.json

# 5. Create admin user
python manage.py createsuperuser

# 6. Start server
python manage.py runserver

# Visit: http://127.0.0.1:8000
# Admin: http://127.0.0.1:8000/admin
```

---

## 12. Deployment (Render.com)

1. Push `experiment` branch to GitHub
2. Create new Web Service on Render → connect repo
3. Set environment variables in Render dashboard (from `.env.example`)
4. Set `DJANGO_SETTINGS_MODULE=config.settings.production`
5. Add PostgreSQL database add-on
6. Build command: `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
7. Start command: `gunicorn config.wsgi:application`

### Venezuelan User Considerations
- All UI text in Spanish (`LANGUAGE_CODE = 'es-ve'`)
- Timezone set to `America/Caracas`
- Mobile-first design (most users on phones)
- Image compression before storage (Phase 1)
- Service worker for offline capability (Phase 2)

---

## 13. Feature Comparison vs Competitors

| Feature | Mint | YNAB | PocketGuard | Mis Finanzas VE |
|---|---|---|---|---|
| Expense Tracking | ✅ | ✅ | ✅ | ✅ MVP |
| Income Tracking | ✅ | ✅ | ✅ | ✅ MVP |
| Dual Currency | ❌ | ❌ | ❌ | ✅ UNIQUE |
| Historical Rates | ❌ | ❌ | ❌ | ✅ UNIQUE |
| Custom Categories | ✅ | ✅ | ✅ | ✅ MVP |
| Receipt Storage | ⚠️ | ❌ | ❌ | ✅ Phase 1 |
| Data Export | ✅ | ✅ | ✅ | ✅ MVP |
| Recurring Bills | ✅ | ✅ | ✅ | ✅ Phase 1.5 |
| Savings Goals | ✅ | ✅ | ✅ | ✅ Phase 1.5 |
| Multiple Accounts | ✅ | ✅ | ✅ | ✅ Phase 1.5 |
| Venezuelan Context | ❌ | ❌ | ❌ | ✅ UNIQUE |
| Bank Sync | ✅ | ✅ | ✅ | ⏳ Phase 3 |
| Mobile App | ✅ | ✅ | ✅ | ⏳ Phase 3 |
| Offline Mode | ⚠️ | ❌ | ❌ | ✅ Phase 2 |

---

## 14. MVP Success Criteria

- 50 beta users can track expenses for 30 days without data loss
- Users can find any past transaction in under 10 seconds
- Users can create custom categories
- Income vs expenses clearly visible on dashboard
- CSV export works correctly
- Zero security incidents (no plain text passwords anywhere)
- Page load < 2 seconds on mobile
- Receipt upload < 3 seconds

---

## 15. Context Files in This Folder

| File | Purpose |
|---|---|
| `Project Context.md` | This file — complete technical reference for the rebuild |
| `New considerations.md` | Full product requirements, vision, and market research (v2.0) |
| `Complete Backup Package - All Files.pdf` | Original React prototype code and documentation |
| `Competitive Analysis - Venezuelan Finance Tracker vs Market Leaders.pdf` | Analysis of 25+ competitor apps |
| `master promt.txt` | Master AI prompt used to generate this architecture plan |

---

*Generated in session: February 2026 — Architecture planning session with Claude*
*Next action: Run migrations and load default categories to validate the starter setup*
