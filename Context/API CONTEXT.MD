# BCV Exchange Rate API Context

Since the Banco Central de Venezuela (BCV) does not provide an official public REST API, the following community-maintained solutions are identified for obtaining up-to-date exchange rates.

## 1. REST API (Third-party)
**Provider:** [rafnixg/bcv-api](https://github.com/rafnixg/bcv-api)
- **Base URL:** `https://bcv-api.rafnixg.dev/`
- **Latest Rates Endpoint:** `GET /rates/`
- **Format:** JSON
- **Usage:** Ideal for quick integration via standard HTTP requests without adding heavy dependencies.

## 2. Python Library (Scraper)
**Library:** `pyDolarVenezuela`
- **GitHub:** [fcoagz/pyDolarVenezuela](https://github.com/fcoagz/pyDolarVenezuela)
- **Installation:** `pip install pyDolarVenezuela`
- **Example Usage:**
  ```python
  from pyDolarVenezuela.pages import BCV
  from pyDolarVenezuela import Monitor

  monitor = Monitor(BCV)
  usd_rate = monitor.get_value_monitor(monitor_code='USD')
  ```
- **Pros:** Scrapes the official BCV website directly; more resilient to third-party API downtime.
- **Cons:** Adds a dependency to the project and relies on the BCV website structure remaining stable.

## 3. Official Source (Reference)
- **Website:** [http://www.bcv.org.ve/](http://www.bcv.org.ve/)
- **Note:** Rates are typically updated daily around 4:00 PM - 5:00 PM VET for the next business day.
