// script.js - Main script for Reveal App website

// Ensure translations is loaded before this script, or handle its absence gracefully.
if (typeof translations !== 'undefined') {
    console.log("SUCCESS: 'translations' object IS defined globally when script.js starts.");
} else {
    console.error("ERROR: 'translations' object is NOT defined globally when script.js starts. Ensure translations.js is loaded before script.js.");
}

let selectedPlatformGlobal = null;
let selectedPokerAppGlobal = null;
let userImeiGlobal = null;
let currentLangGlobal = localStorage.getItem("language") || "en";
let originalPriceGlobal = 0;
let currentDiscountPercentGlobal = 0;
let appliedCouponCodeGlobal = null;
let currentPaymentMethodGlobal = null;

const 가격정책 = {
    'pppoker': 1500,
    'xpoker': 1500,
    'clubgg': 4000
};

const coupons = {
    "10OFF": { discount: 10 }
};

const cryptoWalletAddresses = {
    usdt: "TVwNs33BS7KrqvWAU7vkKRgvRZWPAPdtqC",
    btc: "bc1qd0l9j7llwxj875e43u8rycnjwvswk6lm4m3p5g",
    eth: "0x1f930a8BBB1A3F54EEc89cFb87f6789a21fB6484"
};

const cryptoNetworkInfo = {
    usdt: "Tron (TRC20)",
    btc: "Bitcoin",
    eth: "Ethereum (ERC20)"
};

document.addEventListener("DOMContentLoaded", () => {
    if (typeof translations === 'undefined') {
        console.error("ERROR: 'translations' object is NOT defined within DOMContentLoaded.");
    }
    const lang = localStorage.getItem("language") || "en";
    setLanguage(lang);

    const currentYearEl = document.getElementById("current-year");
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    loadTestimonials();
    // fetchCryptoPrices(); // Removed as per user request

    // Initialize chatbot if chatbot.js is loaded and initializeChatbot function exists
    if (typeof initializeChatbot === 'function') { // Changed from initChatbot
        initializeChatbot();
    } else {
        console.warn('initializeChatbot function not found. Chatbot may not initialize correctly.');
    }

    // Close dialogs when clicking outside
    document.querySelectorAll('.dialog').forEach(dialog => {
        dialog.addEventListener('click', function(event) {
            if (event.target === this) { // Clicked on the backdrop
                const closeButton = this.querySelector('.close');
                if (closeButton) {
                    closeButton.click(); // Simulate click on the actual close button
                }
            }
        });
    });
});

function getTranslatedString(key, replacements = {}) {
    if (typeof translations === 'undefined') {
        console.error("Translations object not loaded in getTranslatedString.");
        return `KEY_ERROR: ${key}`;
    }
    let langTranslations = translations[currentLangGlobal];
    if (!langTranslations) {
        console.warn(`No translations for language: ${currentLangGlobal}. Falling back to English.`);
        langTranslations = translations['en'] || {}; // Fallback to English or empty object
    }
    let text = langTranslations[key];
    if (text === undefined) {
        // Fallback to English if key not found in current language
        text = translations['en'] ? translations['en'][key] : undefined;
        if (text === undefined) {
             console.warn(`Translation key "${key}" not found for lang "${currentLangGlobal}" or English.`);
             return `MISSING_KEY: ${key}`; // Return a clear indicator if key is missing entirely
        }
    }
    if (typeof text === 'string') {
        for (const placeholder in replacements) {
            text = text.replace(new RegExp(`{${placeholder}}`, 'g'), replacements[placeholder]);
        }
    }
    return text;
}

function applyTranslations() {
    if (typeof translations === 'undefined') {
        console.error("ERROR: Cannot apply translations because 'translations' object is NOT defined.");
        return;
    }
    document.querySelectorAll("[data-translate]").forEach(element => {
        const key = element.getAttribute("data-translate");
        const translatedString = getTranslatedString(key);
        if (element.tagName === 'INPUT' && (element.type === 'button' || element.type === 'submit' || element.type === 'reset')) {
            element.value = translatedString;
        } else if (element.tagName === 'IMG' && element.hasAttribute('alt')) { // Translate alt text for images
            element.alt = translatedString;
        } else {
            element.innerHTML = translatedString; // Use innerHTML for FontAwesome icons and general text
        }
    });
    document.querySelectorAll("[data-translate-placeholder]").forEach(element => {
        const key = element.getAttribute("data-translate-placeholder");
        element.placeholder = getTranslatedString(key);
    });
}

function setLanguage(lang) {
    currentLangGlobal = lang;
    localStorage.setItem("language", lang);
    document.documentElement.lang = lang;
    const selector = document.querySelector("#language-selector select");
    if (selector) selector.value = lang;
    applyTranslations();
    if (document.getElementById('payment-dialog')?.style.display === 'flex') {
        updatePaymentDialogText(); // Re-render payment dialog text if open
    }
    loadTestimonials(); // Reload testimonials in the new language
    if (typeof updateChatbotLanguage === 'function') {
        updateChatbotLanguage(lang);
    }
}

function showDialog(dialogId) {
    const dialog = document.getElementById(dialogId);
    if (dialog) {
        dialog.style.display = 'flex';
    } else {
        console.error(`Dialog with ID '${dialogId}' not found.`);
    }
}

function closeDialog(dialogId) {
    const dialog = document.getElementById(dialogId);
    if (dialog) {
        dialog.style.display = 'none';
    } else {
        console.error(`Dialog with ID '${dialogId}' not found for closing.`);
    }
}

function closeAllDialogs() {
    ['platform-dialog', 'imei-dialog', 'poker-app-dialog', 'payment-method-dialog', 'payment-dialog'].forEach(closeDialog);
}

// --- Purchase Flow --- Start ---
function startPurchaseFlow() {
    closeAllDialogs();
    showDialog('platform-dialog');
}

function selectPlatform(platform) {
    selectedPlatformGlobal = platform;
    closeDialog('platform-dialog');
    showDialog('imei-dialog');
    const storedImei = getImeiFromLocalStorage();
    const imeiInput = document.getElementById('imei-input');
    const storedImeiDisplay = document.getElementById('stored-imei-display');
    const changeImeiButton = document.getElementById('change-imei-button');
    const clearImeiButton = document.getElementById('clear-imei-button');

    if (imeiInput && storedImeiDisplay && changeImeiButton && clearImeiButton) {
        if (storedImei) {
            imeiInput.style.display = 'none';
            imeiInput.value = storedImei;
            storedImeiDisplay.innerHTML = getTranslatedString("imeiStoredText", { IMEI: storedImei });
            storedImeiDisplay.style.display = 'block';
            changeImeiButton.innerHTML = getTranslatedString("imeiConfirmButton");
            clearImeiButton.innerHTML = getTranslatedString("imeiClearChangeButton"); // This key should exist
            clearImeiButton.style.display = 'inline-block';
            clearImeiButton.onclick = function() { openImeiDialogForChange(); };
        } else {
            imeiInput.style.display = 'block';
            imeiInput.value = '';
            storedImeiDisplay.style.display = 'none';
            changeImeiButton.innerHTML = getTranslatedString("imeiSubmitButton");
            clearImeiButton.style.display = 'none';
        }
    } else {
        console.error("One or more IMEI dialog elements not found.");
    }
}

function openImeiDialogForChange() {
    const imeiInput = document.getElementById('imei-input');
    const storedImeiDisplay = document.getElementById('stored-imei-display');
    const changeImeiButton = document.getElementById('change-imei-button');
    const clearImeiButton = document.getElementById('clear-imei-button');

    if (imeiInput && storedImeiDisplay && changeImeiButton && clearImeiButton) {
        imeiInput.style.display = 'block';
        storedImeiDisplay.style.display = 'none';
        imeiInput.value = '';
        imeiInput.focus();
        changeImeiButton.innerHTML = getTranslatedString("imeiSubmitButton");
        clearImeiButton.style.display = 'none';
    } else {
         console.error("One or more IMEI dialog elements not found in openImeiDialogForChange.");
    }
}

function submitImei() {
    const imeiInput = document.getElementById('imei-input');
    if (!imeiInput) {
        console.error("IMEI input field not found.");
        alert(getTranslatedString("alertEnterIMEI")); // Generic alert if input field is missing
        return;
    }
    let imei = imeiInput.value.trim();
    const storedImei = getImeiFromLocalStorage();

    if (imeiInput.style.display === 'none' && storedImei) {
        imei = storedImei; // Use stored IMEI if input is hidden
    }

    if (imei === "") {
        alert(getTranslatedString("alertEnterIMEI"));
        return;
    }
    userImeiGlobal = imei;
    saveImeiToLocalStorage(imei);
    closeDialog('imei-dialog');
    showDialog('poker-app-dialog');
}

function saveImeiToLocalStorage(imei) {
    try {
        localStorage.setItem("user_reveal_app_imei", imei);
    } catch (e) {
        console.error("Failed to save IMEI to localStorage:", e);
    }
}

function getImeiFromLocalStorage() {
    try {
        return localStorage.getItem("user_reveal_app_imei");
    } catch (e) {
        console.error("Failed to get IMEI from localStorage:", e);
        return null;
    }
}

function clearImeiFromLocalStorage() {
    try {
        localStorage.removeItem("user_reveal_app_imei");
    } catch (e) {
        console.error("Failed to clear IMEI from localStorage:", e);
    }
    userImeiGlobal = null;
    const imeiInput = document.getElementById("imei-input");
    if (imeiInput) imeiInput.value = "";
    alert(getTranslatedString("alertImeiCleared"));
    openImeiDialogForChange();
}

function selectPokerApp(pokerApp) {
    selectedPokerAppGlobal = pokerApp.toLowerCase();
    closeDialog('poker-app-dialog');
    showDialog('payment-method-dialog');
}

function openPaymentDialog(method) {
    currentPaymentMethodGlobal = method;
    closeDialog('payment-method-dialog');
    setupPaymentDialogWithCoupon();
}

function setupPaymentDialogWithCoupon() {
    originalPriceGlobal = 가격정책[selectedPokerAppGlobal] || 0;
    currentDiscountPercentGlobal = 0;
    appliedCouponCodeGlobal = null;

    const priceCouponStage = document.getElementById('price-coupon-stage');
    const paymentDetailsStage = document.getElementById('payment-details-stage');
    const couponCodeInput = document.getElementById('coupon-code');
    const couponMessageEl = document.getElementById('coupon-message');

    if (!priceCouponStage || !paymentDetailsStage || !couponCodeInput || !couponMessageEl) {
        console.error("Critical payment dialog elements not found (price-coupon-stage, payment-details-stage, coupon-code, or coupon-message).");
        // Optionally, display an error to the user or prevent dialog from showing
        // For now, we'll log and let it proceed, which might lead to further errors if not handled by subsequent checks.
        // return; // Or, stop execution here if these are absolutely critical for the dialog's base function.
    }

    if (priceCouponStage) priceCouponStage.style.display = 'block';
    if (paymentDetailsStage) paymentDetailsStage.style.display = 'none';
    if (couponCodeInput) couponCodeInput.value = '';
    if (couponMessageEl) {
        couponMessageEl.textContent = '';
        couponMessageEl.className = 'coupon-message';
    }

    updatePaymentDialogText();
    updatePriceDisplay();
    showDialog('payment-dialog'); // This should be called after elements are potentially made visible
}

function updatePaymentDialogText() {
    const platformTitle = document.getElementById('platform-title');
    if (platformTitle) {
        platformTitle.innerHTML = getTranslatedString('paymentDialogTitleBase', {
            METHOD: currentPaymentMethodGlobal ? currentPaymentMethodGlobal.toUpperCase() : "N/A",
            PLATFORM: selectedPokerAppGlobal ? selectedPokerAppGlobal.toUpperCase() : "N/A"
        });
    }

    const couponCodeInput = document.getElementById('coupon-code');
    if (couponCodeInput) couponCodeInput.placeholder = getTranslatedString('couponPlaceholder');
    
    const applyCouponBtn = document.querySelector('#price-coupon-stage .coupon-button');
    if (applyCouponBtn) applyCouponBtn.innerHTML = getTranslatedString('applyCouponButton');
    
    const proceedBtn = document.querySelector('#price-coupon-stage .proceed-button');
    if (proceedBtn) proceedBtn.innerHTML = getTranslatedString('proceedToPaymentButton');
    
    const paymentTitleFinal = document.getElementById('payment-title-final-display');
    if (paymentTitleFinal) paymentTitleFinal.innerHTML = getTranslatedString('paymentDialogTitleFinal');
    
    const closePaymentBtn = document.querySelector('#payment-details-stage .primary-dialog-button'); // Assuming this is the close button in the final stage
    if (closePaymentBtn) closePaymentBtn.innerHTML = getTranslatedString('closeButtonText');
    
    const copyWalletBtn = document.getElementById('copy-wallet-button');
    if (copyWalletBtn) copyWalletBtn.innerHTML = getTranslatedString('copyButton');
}

function updatePriceDisplay() {
    const amountEl = document.getElementById("amount");
    const originalAmountEl = document.getElementById("original-amount");

    if (!amountEl || !originalAmountEl) {
        console.error("Price display elements ('amount' or 'original-amount') not found.");
        return;
    }

    const basePrice = 가격정책[selectedPokerAppGlobal] || 0;
    originalPriceGlobal = basePrice;

    const finalPrice = originalPriceGlobal * (1 - currentDiscountPercentGlobal / 100);
    amountEl.innerHTML = getTranslatedString("amountTextBase", { PRICE: `$${finalPrice.toFixed(2)} USD` });

    if (currentDiscountPercentGlobal > 0) {
        originalAmountEl.innerHTML = getTranslatedString("originalAmountTextBase", { PRICE: `$${originalPriceGlobal.toFixed(2)} USD` });
        originalAmountEl.style.display = "inline";
        amountEl.classList.add("discounted");
    } else {
        originalAmountEl.style.display = "none";
        amountEl.classList.remove("discounted");
    }
}

function applyCoupon() {
    const couponCodeInput = document.getElementById('coupon-code');
    const couponMessageEl = document.getElementById('coupon-message');

    if (!couponCodeInput || !couponMessageEl) {
        console.error("Coupon input or message element not found.");
        return;
    }

    const couponCode = couponCodeInput.value.trim().toUpperCase();
    couponMessageEl.textContent = '';
    couponMessageEl.className = 'coupon-message';

    if (couponCode === "") {
        currentDiscountPercentGlobal = 0;
        appliedCouponCodeGlobal = null;
        couponMessageEl.textContent = getTranslatedString("couponCleared");
        couponMessageEl.className = 'coupon-message notice';
        updatePriceDisplay();
        return;
    }

    if (coupons[couponCode]) {
        const coupon = coupons[couponCode];
        currentDiscountPercentGlobal = coupon.discount;
        appliedCouponCodeGlobal = couponCode;
        couponMessageEl.textContent = getTranslatedString('couponAppliedSuccess', { COUPON_CODE: couponCode, DISCOUNT: coupon.discount });
        couponMessageEl.className = 'coupon-message success';
    } else {
        currentDiscountPercentGlobal = 0;
        appliedCouponCodeGlobal = null;
        couponMessageEl.textContent = getTranslatedString('couponErrorInvalid', { COUPON_CODE: couponCode });
        couponMessageEl.className = 'coupon-message error';
    }
    updatePriceDisplay();
}

function proceedToFinalPaymentDetails() {
    const priceCouponStage = document.getElementById('price-coupon-stage');
    const qrLoadingMessage = document.getElementById('qr-loading-message'); // Show loading first
    const qrCodeDisplayStage = document.getElementById('qr-code-display-stage'); // This is the target

    if (priceCouponStage) priceCouponStage.style.display = 'none';
    else console.error("'price-coupon-stage' not found in proceedToFinalPaymentDetails");

    if (qrLoadingMessage) qrLoadingMessage.style.display = 'block'; // Show loading
    else console.error("'qr-loading-message' not found");
    
    if (qrCodeDisplayStage) qrCodeDisplayStage.style.display = 'none'; // Ensure it's hidden initially if loading is shown

    // generateAndDisplayQRCode will handle showing qrCodeDisplayStage after timeout
    generateAndDisplayQRCode();
}

async function generateAndDisplayQRCode() { // Made async to use await for crypto price fetching
    const qrCodeContainer = document.getElementById("payment-qr-code-image");
    const walletAddressInput = document.getElementById("payment-wallet-address");
    const networkInfoEl = document.getElementById("payment-network-name");
    const finalAmountDisplay = document.getElementById("payment-final-amount");
    const cryptoAmountContainer = document.getElementById("payment-crypto-amount-container"); // Get the container
    const cryptoAmountDisplay = document.getElementById("payment-crypto-amount"); // Get the span for the value
    const qrLoadingMessage = document.getElementById("qr-loading-message");
    const qrCodeDisplayStage = document.getElementById("qr-code-display-stage");

    if (!qrCodeContainer || !walletAddressInput || !networkInfoEl || !finalAmountDisplay || !cryptoAmountContainer || !cryptoAmountDisplay || !qrLoadingMessage || !qrCodeDisplayStage) {
        console.error("One or more elements for QR code display are missing. Check IDs: payment-qr-code-image, payment-wallet-address, payment-network-name, payment-final-amount, payment-crypto-amount-container, payment-crypto-amount, qr-loading-message, qr-code-display-stage.");
        if(qrLoadingMessage) {
            qrLoadingMessage.innerHTML = getTranslatedString("qrErrorWalletUnavailable");
            qrLoadingMessage.style.display = "block";
        }
        if(qrCodeDisplayStage) qrCodeDisplayStage.style.display = "none";
        return;
    }

    const finalPriceUSD = (originalPriceGlobal * (1 - currentDiscountPercentGlobal / 100)).toFixed(2);
    const paymentMethod = currentPaymentMethodGlobal;
    const walletAddress = cryptoWalletAddresses[paymentMethod];
    const networkName = cryptoNetworkInfo[paymentMethod];

    if (!walletAddress) {
        qrLoadingMessage.innerHTML = getTranslatedString("qrErrorWalletUnavailable");
        console.error("Wallet address not found for method:", paymentMethod);
        if(qrCodeDisplayStage) qrCodeDisplayStage.style.display = "none"; // Hide stage if no wallet
        if(qrLoadingMessage) qrLoadingMessage.style.display = "block"; // Show error
        return;
    }

    walletAddressInput.value = walletAddress;
    networkInfoEl.innerHTML = networkName; // Corrected: Direct network name, label is translated via HTML data-translate
    finalAmountDisplay.innerHTML = `$${finalPriceUSD} USD`;
    cryptoAmountContainer.style.display = 'none'; // Hide by default, show only if crypto amount is available

    // Show loading message while fetching crypto price and preparing QR
    if (qrLoadingMessage) qrLoadingMessage.style.display = "block";
    if (qrCodeDisplayStage) qrCodeDisplayStage.style.display = "none";


    if (paymentMethod === "btc" || paymentMethod === "eth") {
        const cryptoId = paymentMethod === "btc" ? "bitcoin" : "ethereum";
        
        const cryptoPriceUSD = await fetchCryptoPricesForConversion(cryptoId);
        
        if (cryptoPriceUSD) {
            const cryptoAmount = (parseFloat(finalPriceUSD) / cryptoPriceUSD).toFixed(8);
            cryptoAmountDisplay.innerHTML = `${cryptoAmount} ${paymentMethod.toUpperCase()}`;
            cryptoAmountContainer.style.display = 'block'; // Show the crypto amount line
        } else {
            cryptoAmountDisplay.innerHTML = getTranslatedString("cryptoPriceErrorText");
            cryptoAmountContainer.style.display = 'block'; // Show error in the crypto amount line
        }
    } else if (paymentMethod === "usdt") {
        cryptoAmountDisplay.innerHTML = `${finalPriceUSD} USDT`;
        cryptoAmountContainer.style.display = 'block'; // Show USDT amount
    }

    setTimeout(() => {
        if (qrLoadingMessage) qrLoadingMessage.style.display = "none";
        if (qrCodeDisplayStage) qrCodeDisplayStage.style.display = "block";

        if (qrCodeContainer) {
            let qrImageSrc = "";
            if (paymentMethod === "btc") qrImageSrc = "btc-qr.png";
            else if (paymentMethod === "eth") qrImageSrc = "eth-qr.png";
            else if (paymentMethod === "usdt") qrImageSrc = "usdt-qr.png";

            if (qrImageSrc) {
                qrCodeContainer.src = qrImageSrc;
                qrCodeContainer.alt = `${paymentMethod.toUpperCase()} QR Code`;
            } else {
                qrCodeContainer.alt = getTranslatedString("qrErrorWalletUnavailable");
                qrCodeContainer.src = "";
            }
        }
        applyTranslations(); // Ensure translations are applied to the newly visible stage
    }, 500); 
}

function copyWalletAddress() {
    const walletAddressInput = document.getElementById('payment-wallet-address');
    if (walletAddressInput) {
        walletAddressInput.select();
        walletAddressInput.setSelectionRange(0, 99999); // For mobile devices
        try {
            document.execCommand('copy');
            alert(getTranslatedString('alertCopied'));
        } catch (err) {
            alert(getTranslatedString('alertCopyFailed'));
            console.error('Failed to copy text: ', err);
        }
    } else {
        console.error("'payment-wallet-address' input not found for copying.");
    }
}

// --- Crypto Ticker --- Start ---
// async function fetchCryptoPrices() { ... } // Removed as per user request
// --- Crypto Ticker --- End ---

// --- Crypto Price Fetching --- Start ---
async function fetchCryptoPricesForConversion(cryptoId) {
    // cryptoId should be 'bitcoin' or 'ethereum'
    const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`CoinGecko API request failed: ${response.status}`);
        }
        const data = await response.json();
        if (data[cryptoId] && data[cryptoId].usd) {
            return data[cryptoId].usd;
        }
        throw new Error(`Price data not found for ${cryptoId} in CoinGecko response`);
    } catch (error) {
        console.error("Error fetching crypto price:", error);
        return null; // Return null or a default/fallback if API fails
    }
}
// --- Crypto Price Fetching --- End ---

// --- Crypto Price Fetching --- Start ---
async function fetchCryptoPricesForConversion(cryptoId) {
    // cryptoId should be 'bitcoin' or 'ethereum'
    const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`CoinGecko API request failed: ${response.status}`);
        }
        const data = await response.json();
        if (data[cryptoId] && data[cryptoId].usd) {
            return data[cryptoId].usd;
        }
        throw new Error(`Price data not found for ${cryptoId} in CoinGecko response`);
    } catch (error) {
        console.error("Error fetching crypto price:", error);
        return null; // Return null or a default/fallback if API fails
    }
}
// --- Crypto Price Fetching --- End ---

// --- Testimonials --- Start ---
function loadTestimonials() {
    const container = document.getElementById("testimonials-container");
    if (!container) return;
    container.innerHTML = ""; // Clear existing testimonials

    const testimonials = [
        { quoteKey: "testimonial1Quote", authorKey: "testimonial1Author" },
        { quoteKey: "testimonial2Quote", authorKey: "testimonial2Author" },
        { quoteKey: "testimonial3Quote", authorKey: "testimonial3Author" },
        { quoteKey: "testimonial4Quote", authorKey: "testimonial4Author" },
        { quoteKey: "testimonial5Quote", authorKey: "testimonial5Author" }
    ];

    testimonials.forEach(testimonial => {
        const card = document.createElement("div");
        card.className = "testimonial-card card-style";
        card.innerHTML = 
            `<p class="quote">${getTranslatedString(testimonial.quoteKey)}</p>` +
            `<p class="author">${getTranslatedString(testimonial.authorKey)}</p>`;
        container.appendChild(card);
    });
}
// --- Testimonials --- End ---

// Make sure to define close functions for each dialog if they are called directly from HTML onclick
// These are now handled by the generic closeDialog(id) and the event listener on .dialog backdrop
// function closePlatformDialog() { closeDialog('platform-dialog'); }
// function closeImeiDialog() { closeDialog('imei-dialog'); }
// function closePokerAppDialog() { closeDialog('poker-app-dialog'); }
// function closePaymentMethodDialog() { closeDialog('payment-method-dialog'); }
// function closePaymentDialog() { closeDialog('payment-dialog'); }

