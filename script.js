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
    if (fromCurrency.options.length > 0) return; // Already loaded

    const currencies = Object.keys(ratesObj);

    // Create options
    currencies.forEach(code => {
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
    const amount = parseFloat(amountInput.value);
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (isNaN(amount) || !rates[from] || !rates[to]) return;

    // Calc
    const baseRate = rates[from];
    const targetRate = rates[to];
    const result = (amount / baseRate) * targetRate;
    const oneUnit = (1 / baseRate) * targetRate;

    // Display
    const currencyFormatter = new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: to,
        maximumFractionDigits: 2
    });

    resultText.innerText = currencyFormatter.format(result);
    baseAmountDisplay.innerText = `${amount} ${from} =`;
    rateBadge.innerText = `1 ${from} ≈ ${oneUnit.toFixed(4)} ${to}`;

    // Styling reset if error happened previously
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

function loadPreferences() {
    // Just to have amount persistence optional? 
    // For now we persist in initSelects after options are built
}

// Flags
function updateFlags() {
    const getCode = (curr) => curr.slice(0, 2).toLowerCase();
    fromFlag.src = `https://flagcdn.com/w40/${getCode(fromCurrency.value)}.png`;
    toFlag.src = `https://flagcdn.com/w40/${getCode(toCurrency.value)}.png`;
}

// Events
amountInput.addEventListener('input', convert);
fromCurrency.addEventListener('change', () => { updateFlags(); convert(); });
toCurrency.addEventListener('change', () => { updateFlags(); convert(); });

swapBtn.addEventListener('click', () => {
    // UI Animation class trigger could go here
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;

    updateFlags();
    convert();
});
