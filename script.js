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
let userEmailGlobal = null;
let userNicknameGlobal = null;
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
    usdt: "TXxRAVZP8fUJVm2yMTS8uei2AsgKtLviuK",
    btc: "bc1q983fl9ehgw88wqgs2k78vurrk2l2z6t6afphz3",
    eth: "0x9b5877A847BE203FCbA421194C83E0af6f686cC7"
};

const cryptoNetworkInfo = {
    usdt: "Tron (TRC20)",
    btc: "Bitcoin",
    eth: "Ethereum (ERC20)"
};

// CoinGecko IDs for API calls
const cryptoCoinGeckoIds = {
    btc: "bitcoin",
    eth: "ethereum"
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

    // Initialize chatbot if chatbot.js is loaded and initializeChatbot function exists
    if (typeof initializeChatbot === 'function') {
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

    // Setup email and nickname validation events
    setupEmailRegistrationValidation();
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
    ['email-registration-dialog', 'platform-dialog', 'imei-dialog', 'poker-app-dialog', 'payment-method-dialog', 'payment-dialog'].forEach(closeDialog);
}

// --- Email Registration --- Start ---
function setupEmailRegistrationValidation() {
    const emailInput = document.getElementById('email-input');
    const nicknameInput = document.getElementById('nickname-input');
    
    if (emailInput) {
        emailInput.addEventListener('input', validateEmail);
        emailInput.addEventListener('blur', validateEmail);
    }
    
    if (nicknameInput) {
        nicknameInput.addEventListener('input', validateNickname);
        nicknameInput.addEventListener('blur', validateNickname);
    }
    
    // Check for stored user data
    checkStoredUserData();
}

function checkStoredUserData() {
    try {
        userEmailGlobal = localStorage.getItem("user_reveal_app_email");
        userNicknameGlobal = localStorage.getItem("user_reveal_app_nickname");
    } catch (e) {
        console.error("Failed to get user data from localStorage:", e);
    }
}

function validateEmail() {
    const emailInput = document.getElementById('email-input');
    const validationMessage = document.getElementById('email-validation-message');
    const validIcon = emailInput.parentElement.querySelector('.valid-icon');
    const invalidIcon = emailInput.parentElement.querySelector('.invalid-icon');
    
    if (!emailInput || !validationMessage || !validIcon || !invalidIcon) return;
    
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Reset validation state
    emailInput.classList.remove('input-valid', 'input-invalid');
    validationMessage.classList.remove('message-valid', 'message-invalid');
    validIcon.style.display = 'none';
    invalidIcon.style.display = 'none';
    validationMessage.textContent = '';
    
    if (email === '') return; // Skip validation if empty
    
    if (emailRegex.test(email)) {
        // Valid email
        emailInput.classList.add('input-valid');
        validationMessage.classList.add('message-valid');
        validationMessage.textContent = getTranslatedString('emailValidationSuccess');
        validIcon.style.display = 'block';
        validIcon.parentElement.style.display = 'block';
        return true;
    } else {
        // Invalid email
        emailInput.classList.add('input-invalid');
        validationMessage.classList.add('message-invalid');
        validationMessage.textContent = getTranslatedString('emailValidationError');
        invalidIcon.style.display = 'block';
        invalidIcon.parentElement.style.display = 'block';
        return false;
    }
}

function validateNickname() {
    const nicknameInput = document.getElementById('nickname-input');
    const validationMessage = document.getElementById('nickname-validation-message');
    const validIcon = nicknameInput.parentElement.querySelector('.valid-icon');
    const invalidIcon = nicknameInput.parentElement.querySelector('.invalid-icon');
    
    if (!nicknameInput || !validationMessage || !validIcon || !invalidIcon) return;
    
    const nickname = nicknameInput.value.trim();
    
    // Reset validation state
    nicknameInput.classList.remove('input-valid', 'input-invalid');
    validationMessage.classList.remove('message-valid', 'message-invalid');
    validIcon.style.display = 'none';
    invalidIcon.style.display = 'none';
    validationMessage.textContent = '';
    
    if (nickname === '') return; // Skip validation if empty
    
    if (nickname.length >= 3) {
        // Valid nickname
        nicknameInput.classList.add('input-valid');
        validationMessage.classList.add('message-valid');
        validationMessage.textContent = getTranslatedString('nicknameValidationSuccess');
        validIcon.style.display = 'block';
        validIcon.parentElement.style.display = 'block';
        return true;
    } else {
        // Invalid nickname
        nicknameInput.classList.add('input-invalid');
        validationMessage.classList.add('message-invalid');
        validationMessage.textContent = getTranslatedString('nicknameValidationError');
        invalidIcon.style.display = 'block';
        invalidIcon.parentElement.style.display = 'block';
        return false;
    }
}

function submitRegistration() {
    const emailValid = validateEmail();
    const nicknameValid = validateNickname();
    
    if (!emailValid || !nicknameValid) {
        // Validation failed, focus on the first invalid field
        if (!emailValid) {
            document.getElementById('email-input').focus();
        } else {
            document.getElementById('nickname-input').focus();
        }
        return;
    }
    
    // Save user data
    userEmailGlobal = document.getElementById('email-input').value.trim();
    userNicknameGlobal = document.getElementById('nickname-input').value.trim();
    
    try {
        localStorage.setItem("user_reveal_app_email", userEmailGlobal);
        localStorage.setItem("user_reveal_app_nickname", userNicknameGlobal);
    } catch (e) {
        console.error("Failed to save user data to localStorage:", e);
    }
    
    // Show success message briefly before proceeding
    const continueButton = document.getElementById('continue-registration-button');
    const originalButtonText = continueButton.innerHTML;
    continueButton.innerHTML = getTranslatedString('registrationSuccess');
    continueButton.disabled = true;
    
    setTimeout(() => {
        closeDialog('email-registration-dialog');
        showDialog('platform-dialog');
        
        // Reset button state for next time
        setTimeout(() => {
            continueButton.innerHTML = originalButtonText;
            continueButton.disabled = false;
        }, 500);
    }, 1000);
}
// --- Email Registration --- End ---

// --- Purchase Flow --- Start ---
function startPurchaseFlow() {
    closeAllDialogs();
    
    // Check if user is already registered
    if (userEmailGlobal && userNicknameGlobal) {
        // User already registered, show welcome back message and proceed to platform selection
        alert(getTranslatedString('welcomeBackMessage', { NICKNAME: userNicknameGlobal }));
        showDialog('platform-dialog');
    } else {
        // New user, show registration dialog
        showDialog('email-registration-dialog');
    }
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

// Function to validate IMEI (15 digits, numeric)
function isValidImei(imei) {
    return /^\d{15}$/.test(imei);
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

    // --- IMEI Validation Added Here ---
    if (!isValidImei(imei)) {
        alert(getTranslatedString("alertInvalidIMEI")); // Use the specific invalid IMEI message
        imeiInput.focus(); // Keep focus on the input field
        return; // Stop the function if IMEI is invalid
    }
    // --- End of IMEI Validation ---

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
    const qrLoadingMessage = document.getElementById('qr-loading-message');
    const qrCodeDisplayStage = document.getElementById('qr-code-display-stage');
    const couponCodeInput = document.getElementById('coupon-code');
    const couponMessageEl = document.getElementById('coupon-message');
    const cryptoAmountContainer = document.getElementById('payment-crypto-amount-container');

    if (!priceCouponStage || !qrLoadingMessage || !qrCodeDisplayStage || !couponCodeInput || !couponMessageEl || !cryptoAmountContainer) {
        console.error("Critical payment dialog elements not found (price-coupon-stage, qr-loading-message, qr-code-display-stage, coupon-code, coupon-message, or crypto container).");
        return; // Stop execution if critical elements are missing
    }

    if (priceCouponStage) priceCouponStage.style.display = 'block';
    if (qrLoadingMessage) qrLoadingMessage.style.display = 'none'; // Explicitly hide
    if (qrCodeDisplayStage) qrCodeDisplayStage.style.display = 'none'; // Explicitly hide
    if (cryptoAmountContainer) cryptoAmountContainer.style.display = 'none'; // Hide crypto amount initially

    if (couponCodeInput) couponCodeInput.value = '';
    if (couponMessageEl) {
        couponMessageEl.textContent = '';
        couponMessageEl.className = 'coupon-message';
    }

    updatePaymentDialogText();
    updatePriceDisplay();
    showDialog('payment-dialog');
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

    const closePaymentBtn = document.querySelector('#qr-code-display-stage .primary-dialog-button'); // Target close button in final stage
    if (closePaymentBtn) closePaymentBtn.innerHTML = getTranslatedString('closeButtonText');

    const copyWalletBtn = document.getElementById('copy-wallet-button');
    if (copyWalletBtn) copyWalletBtn.innerHTML = getTranslatedString('copyAddressButton');
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

async function proceedToFinalPaymentDetails() { // Make function async
    const priceCouponStage = document.getElementById('price-coupon-stage');
    const qrLoadingMessage = document.getElementById('qr-loading-message');
    const qrCodeDisplayStage = document.getElementById('qr-code-display-stage');

    if (priceCouponStage) priceCouponStage.style.display = 'none';
    if (qrLoadingMessage) {
        qrLoadingMessage.style.display = 'block';
        qrLoadingMessage.innerHTML = getTranslatedString('loadingText'); // Use generatingQRCodeMessage key
    }
    if (qrCodeDisplayStage) qrCodeDisplayStage.style.display = 'none';

    // Call the async function to generate details
    await generatePaymentDetails();
}

async function generatePaymentDetails() { // Make function async
    const qrLoadingMessage = document.getElementById('qr-loading-message');
    const qrCodeDisplayStage = document.getElementById('qr-code-display-stage');
    const paymentTitleFinal = document.getElementById('payment-title-final-display');
    const qrCodeImg = document.getElementById('payment-qr-code-image');
    const walletAddressDisplay = document.getElementById('payment-wallet-address');
    const paymentAmountDisplay = document.getElementById('payment-final-amount');
    const networkInfoDisplay = document.getElementById('payment-network-name');
    const cryptoAmountContainer = document.getElementById('payment-crypto-amount-container');
    const cryptoAmountDisplay = document.getElementById('payment-crypto-amount');

    if (!qrLoadingMessage || !qrCodeDisplayStage || !paymentTitleFinal || !qrCodeImg || !walletAddressDisplay || !paymentAmountDisplay || !networkInfoDisplay || !cryptoAmountContainer || !cryptoAmountDisplay) {
        console.error("One or more final payment display elements not found.");
        if (qrLoadingMessage) qrLoadingMessage.innerHTML = getTranslatedString('qrErrorGeneric'); // Use a generic error key
        return;
    }

    const walletAddress = cryptoWalletAddresses[currentPaymentMethodGlobal];
    const network = cryptoNetworkInfo[currentPaymentMethodGlobal];
    const finalPriceUSD = originalPriceGlobal * (1 - currentDiscountPercentGlobal / 100);
    const coinGeckoId = cryptoCoinGeckoIds[currentPaymentMethodGlobal];

    if (!walletAddress) {
        console.error(`Wallet address for ${currentPaymentMethodGlobal} not found.`);
        qrLoadingMessage.innerHTML = getTranslatedString('qrErrorWalletUnavailable');
        qrCodeDisplayStage.style.display = 'none';
        return;
    }

    let cryptoAmount = null;
    let qrData = '';

    // Fetch price from CoinGecko only for BTC and ETH
    if (coinGeckoId) {
        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const pricePerCoin = data[coinGeckoId]?.usd;

            if (pricePerCoin && pricePerCoin > 0) {
                cryptoAmount = (finalPriceUSD / pricePerCoin).toFixed(8); // Calculate crypto amount with 8 decimals
                cryptoAmountDisplay.textContent = `${cryptoAmount} ${currentPaymentMethodGlobal.toUpperCase()}`;
                cryptoAmountContainer.style.display = 'block'; // Show the crypto amount
                // Update QR data for BTC and ETH to include amount (BIP-21 for BTC, EIP-681 for ETH)
                if (currentPaymentMethodGlobal === 'btc') {
                    qrData = `bitcoin:${walletAddress}?amount=${cryptoAmount}`;
                } else if (currentPaymentMethodGlobal === 'eth') {
                    // Note: EIP-681 amount is in Wei (1 ETH = 1e18 Wei), QRServer might not handle this conversion automatically.
                    // For simplicity, we'll stick to address only for ETH QR, or use a library that handles EIP-681.
                    // Let's keep it simple for now:
                    qrData = `ethereum:${walletAddress}`; // Basic ETH QR
                    // If QRServer supported value/amount in ETH directly:
                    // qrData = `ethereum:${walletAddress}?value=${(cryptoAmount * 1e18).toString()}`; // Requires BigInt handling
                }
            } else {
                console.error('Could not retrieve valid price from CoinGecko.');
                cryptoAmountContainer.style.display = 'none';
                qrData = `${network}:${walletAddress}`; // Fallback QR data
            }
        } catch (error) {
            console.error('Error fetching CoinGecko price:', error);
            qrLoadingMessage.innerHTML = getTranslatedString('qrErrorApiFail'); // Use API error key
            qrCodeDisplayStage.style.display = 'none';
            return; // Stop execution on API error
        }
    } else if (currentPaymentMethodGlobal === 'usdt') {
        // For USDT, amount is 1:1 with USD (assuming TRC20 USDT)
        cryptoAmount = finalPriceUSD.toFixed(2);
        cryptoAmountDisplay.textContent = `${cryptoAmount} ${currentPaymentMethodGlobal.toUpperCase()}`;
        cryptoAmountContainer.style.display = 'block';
        // Tron doesn't have a standard URI scheme like BIP-21/EIP-681 widely supported by wallets for amounts.
        // We'll generate QR with address only.
        qrData = `${network}:${walletAddress}`; // Basic USDT QR
    } else {
         console.error(`Unsupported payment method for crypto amount calculation: ${currentPaymentMethodGlobal}`);
         qrData = `${network}:${walletAddress}`; // Fallback QR data
    }

    // Hide loading message and show QR stage
    qrLoadingMessage.style.display = 'none';
    qrCodeDisplayStage.style.display = 'block';

    // Update common elements
    paymentTitleFinal.innerHTML = getTranslatedString('paymentDialogTitleFinal');
    paymentAmountDisplay.textContent = `$${finalPriceUSD.toFixed(2)} USD`;
    networkInfoDisplay.textContent = network;
    walletAddressDisplay.value = walletAddress;

    // Generate QR Code using QRServer API with potentially updated qrData
    if (qrData) { // Ensure qrData is set
        qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
        qrCodeImg.alt = `QR Code for ${currentPaymentMethodGlobal} payment to ${walletAddress}`;
    } else {
        console.error("QR Data could not be generated.");
        qrCodeImg.src = ''; // Clear image source on error
        qrCodeImg.alt = 'Error generating QR Code';
    }
}

function copyWalletAddress() {
    const walletAddressInput = document.getElementById('payment-wallet-address');
    if (!walletAddressInput) return;
    const walletAddress = walletAddressInput.value;
    navigator.clipboard.writeText(walletAddress).then(() => {
        alert(getTranslatedString('alertCopied'));
    }).catch(err => {
        console.error('Failed to copy wallet address: ', err);
        alert(getTranslatedString('alertCopyFailed'));
    });
}

// --- Purchase Flow --- End ---

// --- Testimonials --- Start ---
function loadTestimonials() {
    const container = document.getElementById("testimonials-container");
    if (!container) return;
    container.innerHTML = ''; // Clear existing testimonials

    const testimonialKeys = ["testimonial1", "testimonial2", "testimonial3", "testimonial4", "testimonial5"];

    testimonialKeys.forEach(keyBase => {
        const quote = getTranslatedString(`${keyBase}Quote`);
        const author = getTranslatedString(`${keyBase}Author`);

        // Check if translations are missing (important after fixing translations.js)
        if (quote.startsWith("MISSING_KEY") || quote.startsWith("KEY_ERROR") || author.startsWith("MISSING_KEY") || author.startsWith("KEY_ERROR")) {
            console.warn(`Skipping testimonial ${keyBase} due to missing translation.`);
            return; // Skip if translation is missing
        }

        const card = document.createElement("div");
        card.className = "testimonial-card card-style"; // Added card-style for consistency

        // Placeholder Avatar
        const avatar = document.createElement("div");
        avatar.className = "testimonial-avatar-placeholder";

        const quoteEl = document.createElement("p");
        quoteEl.className = "testimonial-quote";
        quoteEl.textContent = quote;

        const authorEl = document.createElement("p");
        authorEl.className = "testimonial-author";
        authorEl.textContent = author;

        card.appendChild(avatar);
        card.appendChild(quoteEl);
        card.appendChild(authorEl);
        container.appendChild(card);
    });
}
// --- Testimonials --- End ---

