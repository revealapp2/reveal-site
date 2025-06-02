// crypto_api.js - API integration for cryptocurrency price fetching

/**
 * Fetch current cryptocurrency prices from CoinGecko API
 * @param {Array} coins - Array of coin IDs to fetch (e.g., ['bitcoin', 'ethereum'])
 * @param {String} currency - Currency to convert to (e.g., 'usd')
 * @returns {Promise} - Promise resolving to price data
 */
async function fetchCryptoPrices(coins = ['bitcoin', 'ethereum'], currency = 'usd') {
    try {
        const coinIds = coins.join(',');
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=${currency}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching crypto prices:', error);
        // Return fallback values in case of API failure
        const fallback = {};
        coins.forEach(coin => {
            fallback[coin] = { [currency]: getFallbackPrice(coin) };
        });
        return fallback;
    }
}

/**
 * Get fallback price for a cryptocurrency in case API fails
 * @param {String} coin - Coin ID
 * @returns {Number} - Fallback price
 */
function getFallbackPrice(coin) {
    // Conservative fallback prices (slightly lower than market to ensure sufficient payment)
    const fallbacks = {
        'bitcoin': 60000,
        'ethereum': 3000,
        'tether': 1
    };
    
    return fallbacks[coin] || 1;
}

/**
 * Calculate cryptocurrency amount based on USD price
 * @param {Number} usdAmount - Amount in USD
 * @param {Number} cryptoPrice - Current price of cryptocurrency in USD
 * @returns {Number} - Amount in cryptocurrency
 */
function calculateCryptoAmount(usdAmount, cryptoPrice) {
    if (!cryptoPrice || cryptoPrice <= 0) {
        return 0;
    }
    
    // Calculate with 8 decimal precision for BTC and 6 for others
    return parseFloat((usdAmount / cryptoPrice).toFixed(8));
}

/**
 * Format cryptocurrency amount with appropriate precision
 * @param {Number} amount - Amount to format
 * @param {String} coin - Coin type
 * @returns {String} - Formatted amount
 */
function formatCryptoAmount(amount, coin) {
    if (coin === 'bitcoin') {
        return amount.toFixed(8); // BTC uses 8 decimals
    } else if (coin === 'ethereum') {
        return amount.toFixed(6); // ETH uses 6 decimals
    } else {
        return amount.toFixed(2); // Default for other currencies
    }
}

/**
 * Update payment details with current cryptocurrency prices
 * @param {String} method - Payment method (btc, eth, usdt)
 * @param {Number} usdAmount - Amount in USD
 */
async function updateCryptoPaymentDetails(method, usdAmount) {
    // Only fetch prices for crypto methods
    if (method !== 'btc' && method !== 'eth') {
        return;
    }
    
    // Map payment methods to CoinGecko IDs
    const coinMap = {
        'btc': 'bitcoin',
        'eth': 'ethereum'
    };
    
    const coinId = coinMap[method];
    
    try {
        // Fetch current prices
        const priceData = await fetchCryptoPrices([coinId], 'usd');
        
        // Calculate crypto amount
        const cryptoPrice = priceData[coinId]?.usd || getFallbackPrice(coinId);
        const cryptoAmount = calculateCryptoAmount(usdAmount, cryptoPrice);
        
        // Update UI with crypto amount
        const cryptoAmountElement = document.getElementById('crypto-amount-value');
        
        if (cryptoAmountElement) {
            cryptoAmountElement.textContent = `${formatCryptoAmount(cryptoAmount, coinId)} ${method.toUpperCase()}`;
            
            // Store for later use
            localStorage.setItem('cryptoAmount', cryptoAmount);
            localStorage.setItem('cryptoPrice', cryptoPrice);
        }
        
        // Also update for payment-crypto-amount if it exists (for backward compatibility)
        const legacyCryptoAmountElement = document.getElementById('payment-crypto-amount');
        const legacyCryptoAmountContainer = document.getElementById('payment-crypto-amount-container');
        
        if (legacyCryptoAmountElement && legacyCryptoAmountContainer) {
            legacyCryptoAmountElement.textContent = `${formatCryptoAmount(cryptoAmount, coinId)} ${method.toUpperCase()}`;
            legacyCryptoAmountContainer.style.display = 'block';
        }
        
        console.log(`Updated crypto amount: ${formatCryptoAmount(cryptoAmount, coinId)} ${method.toUpperCase()} for $${usdAmount}`);
    } catch (error) {
        console.error('Error updating crypto payment details:', error);
    }
}

// Initialize crypto amount display with a default value for $1350
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a payment page with crypto amount display
    const cryptoAmountElement = document.getElementById('crypto-amount-value');
    
    if (cryptoAmountElement) {
        // Default to BTC for initial display
        const method = 'btc';
        const usdAmount = 1350;
        
        // Update crypto amount display
        updateCryptoPaymentDetails(method, usdAmount);
        
        // Also update for ETH after a short delay
        setTimeout(() => {
            updateCryptoPaymentDetails('eth', usdAmount);
        }, 1000);
    }
});

// Export functions for use in other scripts
window.fetchCryptoPrices = fetchCryptoPrices;
window.calculateCryptoAmount = calculateCryptoAmount;
window.formatCryptoAmount = formatCryptoAmount;
window.updateCryptoPaymentDetails = updateCryptoPaymentDetails;
