// Elements
const amountInput = document.getElementById('amount');
const fromCurrency = document.getElementById('from-currency');
const toCurrency = document.getElementById('to-currency');
const fromFlag = document.getElementById('from-flag');
const toFlag = document.getElementById('to-flag');
const resultText = document.getElementById('result-text');
const baseAmountDisplay = document.getElementById('base-amount-display');
const rateBadge = document.getElementById('rate-badge');
const lastUpdatedEl = document.getElementById('last-updated');
const swapBtn = document.getElementById('swap-btn');

// State
let rates = {};

// Config
const API_URL = 'https://open.er-api.com/v6/latest/USD';
const STORAGE_KEY = 'currency_app_settings_v1';

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadPreferences();
    fetchRates();
});

// Fetch Data
async function fetchRates() {
    try {
        rateBadge.innerText = "Güncelleniyor...";
        const res = await fetch(API_URL);
        const data = await res.json();

        if (data.result === 'success') {
            rates = data.rates;
            initSelects(rates);

            // Format time
            const date = new Date(data.time_last_update_utc);
            const timeStr = date.getHours().toString().padStart(2, '0') + ':' +
                date.getMinutes().toString().padStart(2, '0');
            lastUpdatedEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${timeStr}`;

            convert();
        } else {
            throw new Error('API Error');
        }
    } catch (err) {
        console.error(err);
        resultText.innerText = "Hata";
        rateBadge.innerText = "Bağlantı Sorunu";
        rateBadge.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
        rateBadge.style.color = "#f87171";
    }
}

// Initialize Dropdowns
function initSelects(ratesObj) {
    if (fromCurrency.options.length > 0) return;

    let currencies = Object.keys(ratesObj);

    // Priority Sorting: TRY, USD, EUR, GBP, JPY first
    const topCurrencies = ['TRY', 'USD', 'EUR', 'GBP', 'JPY'];
    // Filter out top currencies from the main list so we don't duplicate
    const others = currencies.filter(c => !topCurrencies.includes(c)).sort();
    // Combine
    const sortedCurrencies = [...topCurrencies, ...others];

    // Create options
    sortedCurrencies.forEach(code => {
        // From
        const opt1 = document.createElement('option');
        opt1.value = code;
        opt1.text = code;
        fromCurrency.appendChild(opt1);

        // To
        const opt2 = document.createElement('option');
        opt2.value = code;
        opt2.text = code;
        toCurrency.appendChild(opt2);
    });

    // Restore Selection (or default)
    const saved = getStoredSettings();
    fromCurrency.value = saved.from || 'USD';
    toCurrency.value = saved.to || 'TRY';

    updateFlags();
}

// Logic
function convert() {
    const val = amountInput.value.trim();

    // Empty State Handling
    if (val === '') {
        resultText.innerText = '0.00';
        baseAmountDisplay.innerText = `${fromCurrency.value}`;
        return;
    }

    const amount = parseFloat(val);
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (isNaN(amount) || !rates[from] || !rates[to]) return;

    // Calc
    const baseRate = rates[from];
    const targetRate = rates[to];
    const result = (amount / baseRate) * targetRate;
    const oneUnit = (1 / baseRate) * targetRate;

    // Smart Precision for Crypto/Low Value
    let fractionDigits = 2;
    if (result > 0 && result < 0.01) {
        fractionDigits = 6;
    }

    // Display
    const currencyFormatter = new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: to,
        maximumFractionDigits: fractionDigits
    });

    resultText.innerText = currencyFormatter.format(result);
    baseAmountDisplay.innerText = `${amount} ${from} =`;
    rateBadge.innerText = `1 ${from} ≈ ${oneUnit.toFixed(4)} ${to}`;

    // Styling reset
    rateBadge.style.backgroundColor = "";
    rateBadge.style.color = "";

    savePreferences();
}

// Storage Helpers
function savePreferences() {
    const settings = {
        from: fromCurrency.value,
        to: toCurrency.value
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function getStoredSettings() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
}

function loadPreferences() { }

// Flags
function updateFlags() {
    const getCode = (curr) => curr.slice(0, 2).toLowerCase();

    const setFlag = (img, fallbackIcon, currency) => {
        const code = getCode(currency);

        // Reset state
        img.style.display = 'block';
        fallbackIcon.style.display = 'none';

        // Try loading flag
        img.src = `https://flagcdn.com/w40/${code}.png`;

        // Error Handling: Hide image, show icon
        img.onerror = () => {
            img.style.display = 'none';
            fallbackIcon.style.display = 'block';
        };
    };

    setFlag(fromFlag, document.getElementById('from-fallback'), fromCurrency.value);
    setFlag(toFlag, document.getElementById('to-fallback'), toCurrency.value);
}

// Events
amountInput.addEventListener('input', convert);
fromCurrency.addEventListener('change', () => { updateFlags(); convert(); });
toCurrency.addEventListener('change', () => { updateFlags(); convert(); });

swapBtn.addEventListener('click', () => {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;

    updateFlags();
    convert();
});
