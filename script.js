const amountInput = document.getElementById('amount');
const fromCurrency = document.getElementById('from-currency');
const toCurrency = document.getElementById('to-currency');
const fromFlag = document.getElementById('from-flag');
const toFlag = document.getElementById('to-flag');
const resultText = document.getElementById('result-text');
const amountText = document.getElementById('amount-text');
const rateInfo = document.getElementById('rate-info');
const lastUpdatedTime = document.getElementById('last-updated-time');
const swapBtn = document.getElementById('swap-btn');
const form = document.getElementById('currency-form');

let rates = {};

// Default Currencies
const defaultFrom = 'USD';
const defaultTo = 'TRY';

// Load Currencies on Start
document.addEventListener('DOMContentLoaded', () => {
    fetchRates();
});

async function fetchRates() {
    try {
        rateInfo.innerText = "Kurlar güncelleniyor...";

        // Fetching latest rates from open API endpoint
        const response = await fetch(`https://open.er-api.com/v6/latest/USD`);
        const data = await response.json();

        if (data.result === 'success') {
            rates = data.rates;
            populateSelects(rates);

            // Format and display the last update time
            const date = new Date(data.time_last_update_utc);
            lastUpdatedTime.innerText = date.toLocaleString('tr-TR');

            // Perform initial conversion
            convertCurrency();
        } else {
            console.error('API Error:', data);
            alert('Döviz kurları alınamadı. Lütfen internet bağlantınızı kontrol edin.');
        }
    } catch (error) {
        console.error('Fetch operation failed:', error);
        rateInfo.innerText = "Bağlantı Hatası!";
        alert('Sunucuya erişilemedi. Lütfen daha sonra tekrar deneyiniz.');
    }
}

function populateSelects(ratesList) {
    const currencies = Object.keys(ratesList);

    // Clear existing options logic if needed, but here we just append
    // Check if empty to avoid double population if connected to a re-run logic
    if (fromCurrency.options.length > 0) return;

    currencies.forEach(currency => {
        const option1 = document.createElement('option');
        const option2 = document.createElement('option');

        option1.value = currency;
        option1.text = currency;
        option2.value = currency;
        option2.text = currency;

        fromCurrency.appendChild(option1);
        toCurrency.appendChild(option2);
    });

    // Set Defaults
    fromCurrency.value = defaultFrom;
    toCurrency.value = defaultTo;

    updateFlags();
}

function updateFlags() {
    // Country code logic: Currency Code (e.g. USD) -> Country Code (us)
    // Simple slice for most, but some are different. 
    // FlagCDN supports currency codes indirectly or we assume first 2 letters mostly work (EUR -> eu - works for Europe flag).
    // Better approch: Use slice(0,2).toLowerCase().

    // START Custom Mappings for edge cases if needed, but generic slice works for 90%
    const getCountryCode = (currencyCode) => {
        return currencyCode.slice(0, 2).toLowerCase();
    };

    fromFlag.src = `https://flagcdn.com/w40/${getCountryCode(fromCurrency.value)}.png`;
    toFlag.src = `https://flagcdn.com/w40/${getCountryCode(toCurrency.value)}.png`;
}

function convertCurrency() {
    const amount = parseFloat(amountInput.value);
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (isNaN(amount) || amount < 0) {
        // Validate input
        resultText.innerText = "0.00";
        return;
    }

    if (!rates[from] || !rates[to]) {
        return;
    }

    // Calculation: (Amount / RateFrom) * RateTo
    // Because base is USD. 
    // 1 USD = rates[from] FROM
    // 1 USD = rates[to] TO
    const rateFrom = rates[from];
    const rateTo = rates[to];

    const convertedAmount = (amount / rateFrom) * rateTo;
    const singleUnitRate = (1 / rateFrom) * rateTo;

    // formatting
    const formatter = new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: to,
        maximumFractionDigits: 2
    });

    amountText.innerText = `${amount} ${from} =`;
    resultText.innerText = formatter.format(convertedAmount);

    // Update Rate Info (1 Unit)
    rateInfo.innerText = `1 ${from} = ${singleUnitRate.toFixed(4)} ${to}`;
}

// Event Listeners
form.addEventListener('submit', (e) => {
    e.preventDefault();
    convertCurrency();
});

amountInput.addEventListener('input', convertCurrency);
fromCurrency.addEventListener('change', () => {
    updateFlags();
    convertCurrency();
});
toCurrency.addEventListener('change', () => {
    updateFlags();
    convertCurrency();
});

swapBtn.addEventListener('click', () => {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    updateFlags();
    convertCurrency();
});
