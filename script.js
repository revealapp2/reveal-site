// script.js - Main script for Reveal App website

// Ensure translations is loaded before this script, or handle its absence gracefully.
if (typeof window.translations !== 'undefined') {
    console.log("SUCCESS: 'translations' object IS defined globally when script.js starts.");
} else {
    console.error("ERROR: 'translations' object is NOT defined globally when script.js starts. Ensure translations.js is loaded before script.js.");
}

let selectedPlatformGlobal = null;
let selectedPokerAppGlobal = null;
let userUniqueIdGlobal = null;
let userEmailGlobal = null;
let userUsernameGlobal = null;
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
    if (typeof window.translations === 'undefined') {
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

    // Setup email and username validation events
    setupEmailRegistrationValidation();
});

function getTranslatedString(key, replacements = {}) {
    if (typeof window.translations === 'undefined') {
        console.error("Translations object not loaded in getTranslatedString.");
        return key; // Return the key itself instead of an error message
    }
    let langTranslations = window.translations[currentLangGlobal];
    if (!langTranslations) {
        console.warn(`No translations for language: ${currentLangGlobal}. Falling back to English.`);
        langTranslations = window.translations['en'] || {}; // Fallback to English or empty object
    }
    let text = langTranslations[key];
    if (text === undefined) {
        // Fallback to English if key not found in current language
        text = window.translations['en'] ? window.translations['en'][key] : undefined;
        if (text === undefined) {
             console.warn(`Translation key "${key}" not found for lang "${currentLangGlobal}" or English.`);
             return key; // Return the key itself instead of an error message
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
    if (typeof window.translations === 'undefined') {
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
        // Re-render payment dialog text if open and payment method is selected
        if (currentPaymentMethodGlobal) {
            updatePaymentDialogContent();
        }
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
    ['email-registration-dialog', 'platform-dialog', 'unique-id-dialog', 'poker-app-dialog', 'payment-method-dialog', 'payment-dialog'].forEach(closeDialog);
}

// --- Email Registration --- Start ---
function setupEmailRegistrationValidation() {
    const emailInput = document.getElementById('email-input');
    const usernameInput = document.getElementById('username-input');
    
    if (emailInput) {
        emailInput.addEventListener('input', validateEmail);
        emailInput.addEventListener('blur', validateEmail);
    }
    
    if (usernameInput) {
        usernameInput.addEventListener('input', validateUsername);
        usernameInput.addEventListener('blur', validateUsername);
    }
    
    // Check for stored user data
    checkStoredUserData();
}

function checkStoredUserData() {
    try {
        userEmailGlobal = localStorage.getItem("user_reveal_app_email");
        userUsernameGlobal = localStorage.getItem("user_reveal_app_username");
        userUniqueIdGlobal = localStorage.getItem("user_reveal_app_unique_id");
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

function validateUsername() {
    const usernameInput = document.getElementById('username-input');
    const validationMessage = document.getElementById('username-validation-message');
    const validIcon = usernameInput.parentElement.querySelector('.valid-icon');
    const invalidIcon = usernameInput.parentElement.querySelector('.invalid-icon');
    
    if (!usernameInput || !validationMessage || !validIcon || !invalidIcon) return;
    
    const username = usernameInput.value.trim();
    
    // Reset validation state
    usernameInput.classList.remove('input-valid', 'input-invalid');
    validationMessage.classList.remove('message-valid', 'message-invalid');
    validIcon.style.display = 'none';
    invalidIcon.style.display = 'none';
    validationMessage.textContent = '';
    
    if (username === '') return; // Skip validation if empty
    
    if (username.length >= 3) {
        // Valid username
        usernameInput.classList.add('input-valid');
        validationMessage.classList.add('message-valid');
        validationMessage.textContent = getTranslatedString('usernameValidationSuccess');
        validIcon.style.display = 'block';
        validIcon.parentElement.style.display = 'block';
        return true;
    } else {
        // Invalid username
        usernameInput.classList.add('input-invalid');
        validationMessage.classList.add('message-invalid');
        validationMessage.textContent = getTranslatedString('usernameValidationError');
        invalidIcon.style.display = 'block';
        invalidIcon.parentElement.style.display = 'block';
        return false;
    }
}

function submitRegistration() {
    const emailValid = validateEmail();
    const usernameValid = validateUsername();
    
    if (!emailValid || !usernameValid) {
        // Validation failed, focus on the first invalid field
        if (!emailValid) {
            document.getElementById('email-input').focus();
        } else {
            document.getElementById('username-input').focus();
        }
        return;
    }
    
    // Save user data
    userEmailGlobal = document.getElementById('email-input').value.trim();
    userUsernameGlobal = document.getElementById('username-input').value.trim();
    
    try {
        localStorage.setItem("user_reveal_app_email", userEmailGlobal);
        localStorage.setItem("user_reveal_app_username", userUsernameGlobal);
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
    if (userEmailGlobal && userUsernameGlobal) {
        // User already registered, show welcome back message and proceed to platform selection
        alert(getTranslatedString('welcomeBackMessage', { USERNAME: userUsernameGlobal }));
        showDialog('platform-dialog');
    } else {
        // New user, show registration dialog
        showDialog('email-registration-dialog');
    }
}

function selectPlatform(platform) {
    selectedPlatformGlobal = platform;
    closeDialog('platform-dialog');
    
    // Generate or retrieve unique ID
    let uniqueId = getUniqueIdFromLocalStorage();
    if (!uniqueId) {
        uniqueId = generateUniqueId();
        saveUniqueIdToLocalStorage(uniqueId);
    }
    userUniqueIdGlobal = uniqueId;
    
    // Display the unique ID
    const uniqueIdDisplay = document.getElementById('unique-id-display');
    if (uniqueIdDisplay) {
        uniqueIdDisplay.textContent = uniqueId;
    }
    
    showDialog('unique-id-dialog');
}

function copyUniqueId() {
    const uniqueIdDisplay = document.getElementById('unique-id-display');
    const copyButton = document.getElementById('copy-id-button');
    
    if (uniqueIdDisplay && copyButton) {
        const uniqueId = uniqueIdDisplay.textContent;
        
        copyToClipboard(uniqueId).then(success => {
            if (success) {
                // Visual feedback for successful copy
                copyButton.classList.add('copy-feedback');
                const originalText = copyButton.innerHTML;
                copyButton.innerHTML = '<i class="fas fa-check"></i> <span>' + getTranslatedString('copiedText') + '</span>';
                
                setTimeout(() => {
                    copyButton.classList.remove('copy-feedback');
                    copyButton.innerHTML = originalText;
                }, 1500);
                
                alert(getTranslatedString('alertCopied'));
            } else {
                alert(getTranslatedString('alertCopyFailed'));
            }
        });
    }
}

function continueWithUniqueId() {
    closeDialog('unique-id-dialog');
    showDialog('poker-app-dialog');
}

function selectPokerApp(app) {
    selectedPokerAppGlobal = app.toLowerCase(); // Ensure lowercase for consistency
    originalPriceGlobal = 가격정책[selectedPokerAppGlobal] || 1500; // Default to 1500 if not found
    closeDialog('poker-app-dialog');
    showDialog('payment-method-dialog');
}

function selectPaymentMethod(method) {
    currentPaymentMethodGlobal = method;
    closeDialog('payment-method-dialog');
    
    // Reset coupon state
    appliedCouponCodeGlobal = null;
    currentDiscountPercentGlobal = 0;
    
    showPaymentDialog();
}

function showPaymentDialog() {
    const paymentDialog = document.getElementById('payment-dialog');
    if (!paymentDialog) {
        console.error("Payment dialog not found.");
        return;
    }
    
    // Reset dialog stages
    const priceCouponStage = document.getElementById('price-coupon-stage');
    const qrLoadingMessage = document.getElementById('qr-loading-message');
    const qrCodeDisplayStage = document.getElementById('qr-code-display-stage');
    
    if (priceCouponStage) priceCouponStage.style.display = 'block';
    if (qrLoadingMessage) qrLoadingMessage.style.display = 'none';
    if (qrCodeDisplayStage) qrCodeDisplayStage.style.display = 'none';
    
    // Clear coupon input and message
    const couponInput = document.getElementById('coupon-code');
    const couponMessage = document.getElementById('coupon-message');
    if (couponInput) couponInput.value = '';
    if (couponMessage) couponMessage.textContent = '';
    
    // Update the content based on the selected method
    updatePaymentDialogContent();
    
    paymentDialog.style.display = 'flex';
}

function updatePaymentDialogContent() {
    const platformTitleElement = document.getElementById('platform-title');
    const amountElement = document.getElementById('amount');
    const originalAmountElement = document.getElementById('original-amount');
    
    if (!platformTitleElement || !amountElement || !originalAmountElement) {
        console.error("One or more elements for initial payment stage not found.");
        return;
    }
    
    // Set title based on payment method and platform
    const methodName = currentPaymentMethodGlobal ? currentPaymentMethodGlobal.toUpperCase() : '';
    const platformName = selectedPokerAppGlobal ? selectedPokerAppGlobal.toUpperCase() : '';
    platformTitleElement.textContent = getTranslatedString('paymentDialogTitleBase', {
        METHOD: methodName,
        PLATFORM: platformName
    });
    
    // Calculate final price considering discount
    let finalPrice = originalPriceGlobal;
    if (currentDiscountPercentGlobal > 0) {
        finalPrice = originalPriceGlobal * (1 - currentDiscountPercentGlobal / 100);
    }
    
    // Set amount text
    amountElement.textContent = getTranslatedString('paymentAmountValue', { PRICE: `$${finalPrice.toFixed(2)}` });
    
    // Show/hide original amount based on discount
    if (currentDiscountPercentGlobal > 0) {
        originalAmountElement.textContent = getTranslatedString('originalAmountTextBase', { PRICE: `$${originalPriceGlobal.toFixed(2)}` });
        originalAmountElement.style.display = 'block';
    } else {
        originalAmountElement.style.display = 'none';
    }
}

function applyCoupon() {
    const couponInput = document.getElementById('coupon-code');
    const couponMessage = document.getElementById('coupon-message');
    if (!couponInput || !couponMessage) return;
    
    const couponCode = couponInput.value.trim().toUpperCase(); // Use uppercase for consistency
    couponMessage.textContent = ''; // Clear previous message
    
    if (!couponCode) {
        // Clear coupon if input is empty
        appliedCouponCodeGlobal = null;
        currentDiscountPercentGlobal = 0;
        updatePaymentDialogContent(); // Update price display
        couponMessage.textContent = getTranslatedString('couponCleared');
        couponMessage.style.color = 'green';
        return;
    }
    
    const coupon = coupons[couponCode];
    if (coupon) {
        appliedCouponCodeGlobal = couponCode;
        currentDiscountPercentGlobal = coupon.discount;
        updatePaymentDialogContent(); // Update price display
        couponMessage.textContent = getTranslatedString('couponAppliedSuccess', {
            COUPON_CODE: couponCode,
            DISCOUNT: coupon.discount
        });
        couponMessage.style.color = 'green';
    } else {
        // Reset discount if coupon is invalid
        appliedCouponCodeGlobal = null;
        currentDiscountPercentGlobal = 0;
        updatePaymentDialogContent(); // Update price display
        couponMessage.textContent = getTranslatedString('couponErrorInvalid', { COUPON_CODE: couponCode });
        couponMessage.style.color = 'red';
    }
}

function proceedToFinalPaymentDetails() {
    // Hide the price-coupon stage
    const priceCouponStage = document.getElementById('price-coupon-stage');
    if (priceCouponStage) {
        priceCouponStage.style.display = 'none';
    }
    
    // Show loading message
    const loadingMessage = document.getElementById('qr-loading-message');
    if (loadingMessage) {
        loadingMessage.style.display = 'block';
    }
    
    // Simulate loading delay while fetching crypto price and generating QR
    setTimeout(() => {
        // Hide loading message
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
        
        // Show QR code stage
        const qrCodeDisplayStage = document.getElementById('qr-code-display-stage');
        if (qrCodeDisplayStage) {
            qrCodeDisplayStage.style.display = 'block';
        }
        
        // Update final payment details (this now includes async crypto calculation)
        updateFinalPaymentDetails();
        
        // Generate QR code image (replace with actual generation if needed)
        generateQRCodeImage(currentPaymentMethodGlobal);
        
    }, 1000);
}

async function updateFinalPaymentDetails() {
    const finalTitleElement = document.getElementById('payment-title-final-display');
    const finalAmountElement = document.getElementById('payment-final-amount');
    const cryptoAmountContainer = document.getElementById('payment-crypto-amount-container');
    const cryptoAmountElement = document.getElementById('payment-crypto-amount');
    const networkNameElement = document.getElementById('payment-network-name');
    const walletAddressInput = document.getElementById('payment-wallet-address');
    
    if (!finalTitleElement || !finalAmountElement || !networkNameElement || !walletAddressInput || !cryptoAmountContainer || !cryptoAmountElement) {
        console.error("One or more final payment elements not found.");
        return;
    }
    
    // Set title
    finalTitleElement.textContent = getTranslatedString('paymentDialogTitleFinal');
    
    // Calculate final price
    let finalPrice = originalPriceGlobal;
    if (currentDiscountPercentGlobal > 0) {
        finalPrice = originalPriceGlobal * (1 - currentDiscountPercentGlobal / 100);
    }
    finalAmountElement.textContent = `$${finalPrice.toFixed(2)}`;
    
    // Set crypto amount using real-time API data
    // Show loading indicator
    cryptoAmountElement.textContent = getTranslatedString('calculatingText', { DEFAULT: "Calculando..." });
    cryptoAmountContainer.style.display = 'block'; // Show container while calculating
        
    try {
        // Get real-time crypto amount using the API
        const cryptoResult = await calculateCryptoAmount(finalPrice, currentPaymentMethodGlobal);
        
        // Update the display with the calculated amount
        cryptoAmountElement.textContent = `${cryptoResult.formatted} ${currentPaymentMethodGlobal.toUpperCase()}`;
        
    } catch (error) {
        console.error("Error calculating crypto amount:", error);
        
        // Fallback to static calculation if API fails
        const fallbackPrices = {
            'btc': 50000,
            'eth': 3000,
            'usdt': 1
        };
        const price = fallbackPrices[currentPaymentMethodGlobal.toLowerCase()] || 1;
        const amount = finalPrice / price;
        let formatted = '';
        switch (currentPaymentMethodGlobal.toLowerCase()) {
            case 'btc': formatted = amount.toFixed(8); break;
            case 'eth': formatted = amount.toFixed(6); break;
            case 'usdt': formatted = amount.toFixed(2); break;
            default: formatted = amount.toFixed(4);
        }
        
        cryptoAmountElement.textContent = `${formatted} ${currentPaymentMethodGlobal.toUpperCase()} (${getTranslatedString('estimatedText', { DEFAULT: "estimado" })})`;
    }
    
    // Set network name
    const networkName = cryptoNetworkInfo[currentPaymentMethodGlobal] || '';
    networkNameElement.textContent = networkName;
    
    // Set wallet address
    const walletAddress = cryptoWalletAddresses[currentPaymentMethodGlobal] || '';
    walletAddressInput.value = walletAddress;
}

function copyWalletAddress() {
    const walletAddressInput = document.getElementById('payment-wallet-address');
    if (!walletAddressInput) return;
    
    const walletAddress = walletAddressInput.value;
    if (!walletAddress) {
        alert(getTranslatedString('qrErrorWalletUnavailable'));
        return;
    }
    
    copyToClipboard(walletAddress).then(success => {
        if (success) {
            alert(getTranslatedString('alertCopied'));
        } else {
            alert(getTranslatedString('alertCopyFailed'));
        }
    });
}

// Function to generate QR code image (replace with actual generation library if needed)
function generateQRCodeImage(method) {
    const qrImageElement = document.getElementById('payment-qr-code-image');
    if (!qrImageElement) return;
    
    const walletAddress = cryptoWalletAddresses[method];
    if (!walletAddress) {
        qrImageElement.alt = getTranslatedString('qrErrorWalletUnavailable');
        qrImageElement.src = ''; // Clear image source
        return;
    }
    
    // Use a simple QR code generation API (like goqr.me) or a local library
    // Example using goqr.me API:
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(walletAddress)}`;
    qrImageElement.src = qrApiUrl;
    qrImageElement.alt = `${method.toUpperCase()} QR Code`;
}

// --- Purchase Flow --- End ---

// --- Testimonials --- Start ---
function loadTestimonials() {
    const container = document.getElementById('testimonials-container');
    if (!container) return;
    
    container.innerHTML = ''; // Clear existing testimonials
    
    // Create 5 testimonials
    for (let i = 1; i <= 5; i++) {
        const testimonial = document.createElement('div');
        testimonial.className = 'testimonial-item card-style';
        
        const quoteKey = `testimonial${i}Quote`;
        const authorKey = `testimonial${i}Author`;
        
        testimonial.innerHTML = `
            <div class="testimonial-content">
                <i class="fas fa-quote-left testimonial-quote-icon"></i>
                <p class="testimonial-text">${getTranslatedString(quoteKey)}</p>
                <i class="fas fa-quote-right testimonial-quote-icon"></i>
            </div>
            <div class="testimonial-author">
                <div class="testimonial-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <p class="testimonial-name">${getTranslatedString(authorKey)}</p>
            </div>
        `;
        
        container.appendChild(testimonial);
    }
}
// --- Testimonials --- End ---
