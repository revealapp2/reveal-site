// script.js - Main script for Reveal App website

document.addEventListener("DOMContentLoaded", function() {
    // Set current year in footer
    document.getElementById("current-year").textContent = new Date().getFullYear();
    
    // Initialize language based on stored preference or browser default
    initializeLanguage();
    
    // Load testimonials
    loadTestimonials();
    
    // Initialize chatbot
    initializeChatbot();
    
    // Check for stored unique ID
    checkStoredUniqueId();
    
    // Add event listeners for payment confirmation page
    setupPaymentConfirmationPage();
});

// --- Language Handling ---
function initializeLanguage() {
    // Get stored language or default to English
    const storedLang = localStorage.getItem("language") || "en";
    setLanguage(storedLang);
    
    // Set language selector to match stored language
    const langSelector = document.querySelector("#language-selector select");
    if (langSelector) {
        langSelector.value = storedLang;
    }
}

function setLanguage(lang) {
    // Store language preference
    localStorage.setItem("language", lang);
    
    // Update all translatable elements
    document.querySelectorAll("[data-translate]").forEach(element => {
        const key = element.getAttribute("data-translate");
        if (!key) return;
        
        const translation = getTranslatedString(key);
        if (!translation) return;
        
        // Check if the translation contains HTML (like icons)
        if (translation.includes("<") && translation.includes(">")) {
            element.innerHTML = translation;
        } else {
            element.textContent = translation;
        }
    });
    
    // Update all translatable placeholders
    document.querySelectorAll("[data-translate-placeholder]").forEach(element => {
        const key = element.getAttribute("data-translate-placeholder");
        if (!key) return;
        
        const translation = getTranslatedString(key);
        if (translation) {
            element.placeholder = translation;
        }
    });
    
    // Update page title if it has a translation
    const titleElement = document.querySelector("title[data-translate]");
    if (titleElement) {
        const key = titleElement.getAttribute("data-translate");
        const translation = getTranslatedString(key);
        if (translation) {
            document.title = translation;
        }
    }
    
    // Update chatbot language if function exists
    if (typeof updateChatbotLanguage === "function") {
        updateChatbotLanguage(lang);
    }
}

function getTranslatedString(key, replacements = {}) {
    if (!key) return "";
    
    const lang = localStorage.getItem("language") || "en";
    
    // Check if translations exist
    if (!window.translations || !window.translations[lang]) {
        console.error(`Translations not found for language: ${lang}`);
        return key;
    }
    
    // Get translation or fallback to key
    let translation = window.translations[lang][key];
    
    // If not found in current language, try English
    if (!translation && lang !== "en" && window.translations["en"]) {
        translation = window.translations["en"][key];
    }
    
    // If still not found, return key
    if (!translation) {
        console.warn(`Translation not found for key: ${key}`);
        return key;
    }
    
    // Replace placeholders if any
    if (Object.keys(replacements).length > 0) {
        for (const [placeholder, value] of Object.entries(replacements)) {
            translation = translation.replace(`{${placeholder}}`, value);
        }
    }
    
    return translation;
}

// --- Testimonials Handling ---
function loadTestimonials() {
    const container = document.getElementById("testimonials-container");
    if (!container) return;
    
    // Clear container
    container.innerHTML = "";
    
    // Create 5 testimonials
    for (let i = 1; i <= 5; i++) {
        const testimonial = createTestimonial(i);
        container.appendChild(testimonial);
    }
}

function createTestimonial(index) {
    const testimonialItem = document.createElement("div");
    testimonialItem.className = "testimonial-item card-style";
    
    const testimonialContent = document.createElement("div");
    testimonialContent.className = "testimonial-content";
    
    const quoteIcon = document.createElement("div");
    quoteIcon.className = "testimonial-quote-icon";
    quoteIcon.innerHTML = '<i class="fas fa-quote-left"></i>';
    
    const testimonialText = document.createElement("p");
    testimonialText.className = "testimonial-text";
    testimonialText.setAttribute("data-translate", `testimonial${index}Quote`);
    testimonialText.textContent = getTranslatedString(`testimonial${index}Quote`);
    
    const testimonialAuthor = document.createElement("div");
    testimonialAuthor.className = "testimonial-author";
    
    const avatar = document.createElement("div");
    avatar.className = "testimonial-avatar";
    avatar.innerHTML = '<i class="fas fa-user"></i>';
    
    const authorName = document.createElement("p");
    authorName.className = "testimonial-name";
    authorName.setAttribute("data-translate", `testimonial${index}Author`);
    authorName.textContent = getTranslatedString(`testimonial${index}Author`);
    
    testimonialAuthor.appendChild(avatar);
    testimonialAuthor.appendChild(authorName);
    
    testimonialContent.appendChild(quoteIcon);
    testimonialContent.appendChild(testimonialText);
    testimonialContent.appendChild(testimonialAuthor);
    
    testimonialItem.appendChild(testimonialContent);
    
    return testimonialItem;
}

// --- Purchase Flow Handling ---
function startPurchaseFlow() {
    // Check for stored email/username first
    const storedEmail = localStorage.getItem("userEmail");
    const storedUsername = localStorage.getItem("username");
    
    if (storedEmail && storedUsername) {
        // User already registered, show welcome back message
        const welcomeMessage = getTranslatedString("welcomeBackMessage", { USERNAME: storedUsername });
        alert(welcomeMessage);
        showPlatformDialog();
    } else {
        // Show email registration dialog
        showDialog("email-registration-dialog");
    }
}

function submitRegistration() {
    const email = document.getElementById("email-input").value;
    const username = document.getElementById("username-input").value;
    
    // Validate email
    if (!validateEmail(email)) {
        document.getElementById("email-validation-message").textContent = getTranslatedString("emailValidationError");
        document.getElementById("email-validation-message").style.color = "var(--error-color)";
        document.getElementById("email-input").parentElement.classList.add("invalid");
        document.getElementById("email-input").parentElement.classList.remove("valid");
        return;
    }
    
    // Validate username
    if (username.length < 3) {
        document.getElementById("username-validation-message").textContent = getTranslatedString("usernameValidationError");
        document.getElementById("username-validation-message").style.color = "var(--error-color)";
        document.getElementById("username-input").parentElement.classList.add("invalid");
        document.getElementById("username-input").parentElement.classList.remove("valid");
        return;
    }
    
    // Store user info
    localStorage.setItem("userEmail", email);
    localStorage.setItem("username", username);
    
    // Show success message
    alert(getTranslatedString("registrationSuccess"));
    
    // Close dialog and proceed to platform selection
    closeDialog("email-registration-dialog");
    showPlatformDialog();
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// --- Dialog Handling ---
function showDialog(dialogId) {
    const dialog = document.getElementById(dialogId);
    if (dialog) {
        dialog.style.display = "flex";
        
        // If this is the unique ID dialog, generate and display ID
        if (dialogId === "unique-id-dialog") {
            displayUniqueId();
        }
        
        // If this is the payment dialog, pre-fill coupon code
        if (dialogId === "payment-dialog") {
            const couponInput = document.getElementById("coupon-code");
            if (couponInput) {
                couponInput.value = "10OFF";
            }
        }
    }
}

function closeDialog(dialogId) {
    const dialog = document.getElementById(dialogId);
    if (dialog) {
        dialog.style.display = "none";
    }
}

// --- Platform Selection ---
function showPlatformDialog() {
    showDialog("platform-dialog");
}

function selectPlatform(platform) {
    // Store selected platform
    localStorage.setItem("selectedPlatform", platform);
    
    // Close platform dialog
    closeDialog("platform-dialog");
    
    // Show unique ID dialog
    showDialog("unique-id-dialog");
}

// --- Unique ID Handling ---
function displayUniqueId() {
    // Check for stored ID first
    let uniqueId = localStorage.getItem("uniqueId");
    
    // Generate new ID if none exists
    if (!uniqueId) {
        uniqueId = generateUniqueId();
        localStorage.setItem("uniqueId", uniqueId);
    }
    
    // Display ID in dialog
    const uniqueIdElement = document.getElementById("unique-id-value");
    if (uniqueIdElement) {
        uniqueIdElement.textContent = uniqueId;
    }
}

function checkStoredUniqueId() {
    // For payment confirmation page
    const uniqueIdDisplay = document.getElementById("unique-id-display");
    if (uniqueIdDisplay) {
        const uniqueId = localStorage.getItem("uniqueId") || generateUniqueId();
        uniqueIdDisplay.textContent = uniqueId;
    }
}

function copyUniqueId() {
    // Get unique ID
    const uniqueIdElement = document.getElementById("unique-id-value") || document.getElementById("unique-id-display");
    if (!uniqueIdElement) return;
    
    const uniqueId = uniqueIdElement.textContent;
    
    // Copy to clipboard
    navigator.clipboard.writeText(uniqueId).then(() => {
        // Show copied message
        const copyButton = document.getElementById("copy-id-button");
        if (!copyButton) return;
        
        const originalText = copyButton.innerHTML;
        
        copyButton.innerHTML = `<i class="fas fa-check"></i> <span data-translate="copiedText">${getTranslatedString("copiedText")}</span>`;
        
        setTimeout(() => {
            copyButton.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function continueWithUniqueId() {
    // Close unique ID dialog
    closeDialog("unique-id-dialog");
    
    // Show poker app selection dialog
    showDialog("poker-app-dialog");
}

// --- Poker App Selection ---
function selectPokerApp(app) {
    // Store selected app
    localStorage.setItem("selectedPokerApp", app);
    
    // Close poker app dialog
    closeDialog("poker-app-dialog");
    
    // Show payment method dialog
    showDialog("payment-method-dialog");
}

// --- Payment Method Selection ---
function selectPaymentMethod(method) {
    // Store selected payment method
    localStorage.setItem("selectedPaymentMethod", method);
    
    // Close payment method dialog
    closeDialog("payment-method-dialog");
    
    // Show payment dialog
    showDialog("payment-dialog");
    
    // Load payment details
    loadPaymentDetails(method);
}

// --- Payment Processing ---
function loadPaymentDetails(method) {
    const platform = localStorage.getItem("selectedPlatform") || "android";
    const app = localStorage.getItem("selectedPokerApp") || "pppoker";
    
    // Set payment dialog title
    const titleBase = getTranslatedString("paymentDialogTitleBase");
    const title = titleBase.replace("{METHOD}", method.toUpperCase()).replace("{PLATFORM}", platform.toUpperCase());
    
    const titleElement = document.querySelector("#payment-dialog h3");
    if (titleElement) {
        titleElement.textContent = title;
    }
    
    // Set payment amount based on app (updated values per user feedback)
    let basePrice = 0;
    if (app === "pppoker") {
        basePrice = 1500;
    } else if (app === "xpoker") {
        basePrice = 1500;
    } else if (app === "clubgg") {
        basePrice = 4000;
    }
    
    // Store base price for coupon calculations
    localStorage.setItem("basePrice", basePrice);
    
    // Display price
    updatePaymentAmount(basePrice);
    
    // Pre-fill coupon code
    const couponInput = document.getElementById("coupon-code");
    if (couponInput) {
        couponInput.value = "10OFF";
    }
}

function updatePaymentAmount(amount, originalAmount = null) {
    const amountElement = document.getElementById("amount");
    if (amountElement) {
        const amountText = getTranslatedString("amountTextBase").replace("{PRICE}", `$${amount}`);
        amountElement.textContent = amountText;
    }
    
    // Show original amount if discounted
    const originalAmountElement = document.getElementById("original-amount");
    if (originalAmountElement) {
        if (originalAmount) {
            const originalAmountText = getTranslatedString("originalAmountTextBase").replace("{PRICE}", `$${originalAmount}`);
            originalAmountElement.textContent = originalAmountText;
            originalAmountElement.style.display = "block";
        } else {
            originalAmountElement.style.display = "none";
        }
    }
}

// Add the missing function that was causing errors
function proceedToFinalPaymentDetails() {
    const couponCode = document.getElementById("coupon-code")?.value.trim().toUpperCase() || "";
    
    // Apply coupon if entered but not yet applied
    if (couponCode && !localStorage.getItem("appliedCoupon")) {
        applyCoupon();
    }
    
    // Hide price/coupon stage
    const priceCouponStage = document.getElementById("price-coupon-stage");
    if (priceCouponStage) {
        priceCouponStage.style.display = "none";
    }
    
    // Show loading message
    const loadingMessage = document.getElementById("qr-loading-message");
    if (loadingMessage) {
        loadingMessage.style.display = "block";
    }
    
    // Get payment method
    const method = localStorage.getItem("selectedPaymentMethod") || "usdt";
    
    // Simulate loading delay
    setTimeout(() => {
        // Hide loading message
        if (loadingMessage) {
            loadingMessage.style.display = "none";
        }
        
        // Show QR code stage
        const qrCodeStage = document.getElementById("qr-code-display-stage");
        if (qrCodeStage) {
            qrCodeStage.style.display = "block";
        }
        
        // Set final payment title
        const finalTitle = document.getElementById("payment-title-final-display");
        if (finalTitle) {
            finalTitle.textContent = getTranslatedString("paymentDialogTitleFinal");
        }
        
        // Set final amount
        const finalAmount = document.getElementById("payment-final-amount");
        if (finalAmount) {
            const basePrice = parseFloat(localStorage.getItem("basePrice") || 0);
            const discountPercentage = parseFloat(localStorage.getItem("discountPercentage") || 0);
            const finalPrice = discountPercentage > 0 ? basePrice * (1 - discountPercentage / 100) : basePrice;
            finalAmount.textContent = `$${finalPrice.toFixed(2)}`;
            
            // Update crypto amount if applicable
            if (method === 'btc' || method === 'eth') {
                updateCryptoPaymentDetails(method, finalPrice);
            }
        }
        
        // Set network name
        const networkName = document.getElementById("payment-network-name");
        if (networkName) {
            let network = "";
            if (method === "usdt") {
                network = "TRC20";
            } else if (method === "btc") {
                network = "Bitcoin";
            } else if (method === "eth") {
                network = "Ethereum";
            }
            networkName.textContent = network;
        }
        
        // Set wallet address
        const walletAddress = document.getElementById("payment-wallet-address");
        if (walletAddress) {
            if (method === "usdt") {
                walletAddress.value = "TXxRAVZP8fUJVm2yMTS8uei2AsgKtLviuK";
            } else if (method === "btc") {
                walletAddress.value = "bc1q983fl9ehgw88wqgs2k78vurrk2l2z6t6afphz3";
            } else if (method === "eth") {
                walletAddress.value = "0x9b5877A847BE203FCbA421194C83E0af6f686cC7";
            }
        }
        
        // Set QR code image
        const qrImage = document.getElementById("payment-qr-code-image");
        if (qrImage) {
            if (method === "usdt") {
                qrImage.src = "usdt-qr.png";
            } else if (method === "btc") {
                qrImage.src = "btc-qr.png";
            } else if (method === "eth") {
                qrImage.src = "eth-qr.png";
            }
            qrImage.alt = `${method.toUpperCase()} QR Code`;
        }
        
        // Add payment done button to QR code stage if not already present
        addPaymentDoneButton();
        
    }, 1500);
}

function applyCoupon() {
    const couponInput = document.getElementById("coupon-code");
    if (!couponInput) return;
    
    const couponCode = couponInput.value.trim().toUpperCase();
    
    // Clear previous coupon
    localStorage.removeItem("appliedCoupon");
    localStorage.removeItem("discountPercentage");
    
    // If empty, reset to base price
    if (!couponCode) {
        const basePrice = parseFloat(localStorage.getItem("basePrice") || 0);
        updatePaymentAmount(basePrice);
        
        // Show message
        const couponMessage = document.getElementById("coupon-message");
        if (couponMessage) {
            couponMessage.textContent = getTranslatedString("couponCleared");
            couponMessage.style.color = "var(--text-light)";
        }
        return;
    }
    
    // Check valid coupons
    let discountPercentage = 0;
    if (couponCode === "10OFF") {
        discountPercentage = 10;
    } else if (couponCode === "SECRET40") {
        discountPercentage = 40;
    } else {
        // Invalid coupon
        const errorMessage = getTranslatedString("couponErrorInvalid").replace("{COUPON_CODE}", couponCode);
        
        // Show error message
        const couponMessage = document.getElementById("coupon-message");
        if (couponMessage) {
            couponMessage.textContent = errorMessage;
            couponMessage.style.color = "var(--error-color)";
        }
        return;
    }
    
    // Store applied coupon
    localStorage.setItem("appliedCoupon", couponCode);
    localStorage.setItem("discountPercentage", discountPercentage);
    
    // Calculate discounted price
    const basePrice = parseFloat(localStorage.getItem("basePrice") || 0);
    const discountedPrice = basePrice * (1 - discountPercentage / 100);
    
    // Update displayed amount
    updatePaymentAmount(discountedPrice.toFixed(2), basePrice);
    
    // Show success message
    const successMessage = getTranslatedString("couponAppliedSuccess")
        .replace("{COUPON_CODE}", couponCode)
        .replace("{DISCOUNT}", discountPercentage);
    
    const couponMessage = document.getElementById("coupon-message");
    if (couponMessage) {
        couponMessage.textContent = successMessage;
        couponMessage.style.color = "var(--success-color)";
    }
}

function copyWalletAddress() {
    const walletAddressInput = document.getElementById("payment-wallet-address");
    if (!walletAddressInput) return;
    
    // Copy to clipboard
    navigator.clipboard.writeText(walletAddressInput.value).then(() => {
        // Show copied message
        const copyButton = document.getElementById("copy-address-button");
        if (!copyButton) return;
        
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = `<i class="fas fa-check"></i> ${getTranslatedString("copiedText")}`;
        copyButton.classList.add("copy-feedback");
        
        setTimeout(() => {
            copyButton.innerHTML = originalText;
            copyButton.classList.remove("copy-feedback");
        }, 2000);
        
        // Show alert message
        const alertMessage = document.getElementById("copy-alert-message");
        if (alertMessage) {
            alertMessage.textContent = getTranslatedString("alertCopied");
            alertMessage.style.display = "block";
            
            setTimeout(() => {
                alertMessage.style.display = "none";
            }, 3000);
        }
    }).catch(err => {
        console.error('Failed to copy: ', err);
        
        // Show error message
        const alertMessage = document.getElementById("copy-alert-message");
        if (alertMessage) {
            alertMessage.textContent = getTranslatedString("alertCopyFailed");
            alertMessage.style.display = "block";
            alertMessage.style.color = "var(--error-color)";
            
            setTimeout(() => {
                alertMessage.style.display = "none";
            }, 3000);
        }
    });
}

function proceedToPayment() {
    // Show payment processing overlay
    const overlay = document.createElement("div");
    overlay.className = "payment-processing-overlay";
    overlay.innerHTML = `
        <div class="processing-content">
            <i class="fas fa-spinner fa-spin"></i>
            <p data-translate="processingPaymentMessage">${getTranslatedString("processingPaymentMessage")}</p>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Simulate processing delay
    setTimeout(() => {
        // Remove overlay
        document.body.removeChild(overlay);
        
        // Close payment dialog
        closeDialog("payment-dialog");
        
        // Redirect to payment confirmation page
        window.location.href = "payment_confirmation.html";
    }, 3000);
}

// Add payment done button to QR code screen
function addPaymentDoneButton() {
    const qrCodeStage = document.getElementById("qr-code-display-stage");
    if (!qrCodeStage) return;
    
    // Check if button already exists
    if (document.getElementById("payment-done-qr-button")) return;
    
    // Create payment instructions
    const instructionsContainer = document.createElement("div");
    instructionsContainer.className = "payment-instructions";
    instructionsContainer.innerHTML = `
        <h4 data-translate="paymentInstructionsTitle">${getTranslatedString("paymentInstructionsTitle")}</h4>
        <p data-translate="paymentInstructionsText">${getTranslatedString("paymentInstructionsText")}</p>
    `;
    
    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.style.marginTop = "25px";
    buttonContainer.style.textAlign = "center";
    
    // Create button
    const paymentDoneButton = document.createElement("button");
    paymentDoneButton.id = "payment-done-qr-button";
    paymentDoneButton.className = "payment-done-qr-button";
    paymentDoneButton.innerHTML = `<i class="fas fa-check-circle"></i> <span data-translate="paymentDoneButton">${getTranslatedString("paymentDoneButton")}</span>`;
    paymentDoneButton.onclick = proceedToPayment;
    
    // Add button to container
    buttonContainer.appendChild(paymentDoneButton);
    
    // Add instructions and button to QR code stage
    qrCodeStage.appendChild(instructionsContainer);
    qrCodeStage.appendChild(buttonContainer);
}

// --- Payment Confirmation Page ---
function setupPaymentConfirmationPage() {
    const paymentDoneButton = document.getElementById("payment-done-button");
    const paymentConfirmationSection = document.getElementById("payment-confirmation-section");
    const paymentDetails = document.getElementById("payment-details");
    
    if (paymentDoneButton && paymentConfirmationSection && paymentDetails) {
        paymentDoneButton.addEventListener("click", function() {
            paymentDetails.style.display = "none";
            paymentConfirmationSection.style.display = "block";
        });
    }
}

// --- Chatbot Initialization ---
function initializeChatbot() {
    // Check if chatbot container already exists
    if (document.querySelector(".chatbot-container")) return;
    
    // Create chatbot container
    const chatbotContainer = document.createElement("div");
    chatbotContainer.className = "chatbot-container";
    
    // Create chatbot icon
    const chatbotIcon = document.createElement("div");
    chatbotIcon.className = "chatbot-icon";
    chatbotIcon.id = "chatbot-icon";
    chatbotIcon.innerHTML = '<i class="fas fa-comment-dots"></i>';
    
    // Create chatbot window
    const chatbotWindow = document.createElement("div");
    chatbotWindow.className = "chatbot-window";
    chatbotWindow.id = "chatbot-window";
    
    // Create chatbot header
    const chatbotHeader = document.createElement("div");
    chatbotHeader.className = "chatbot-header";
    chatbotHeader.innerHTML = `
        <span data-translate="chatbotHeader">${getTranslatedString("chatbotHeader")}</span>
        <div id="chatbot-close" class="chatbot-close"><i class="fas fa-times"></i></div>
    `;
    
    // Create chatbot messages container
    const chatbotMessages = document.createElement("div");
    chatbotMessages.className = "chatbot-messages";
    chatbotMessages.id = "chatbot-messages";
    
    // Create chatbot buttons container
    const chatbotButtons = document.createElement("div");
    chatbotButtons.className = "chatbot-buttons";
    chatbotButtons.id = "chatbot-buttons";
    
    // Assemble chatbot
    chatbotWindow.appendChild(chatbotHeader);
    chatbotWindow.appendChild(chatbotMessages);
    chatbotWindow.appendChild(chatbotButtons);
    
    chatbotContainer.appendChild(chatbotIcon);
    chatbotContainer.appendChild(chatbotWindow);
    
    // Add chatbot to body
    document.body.appendChild(chatbotContainer);
    
    // Initialize chatbot functionality
    initializeChatbotFunctionality();
}

// Initialize chatbot functionality
function initializeChatbotFunctionality() {
    const chatbotIcon = document.getElementById("chatbot-icon");
    const chatbotWindow = document.getElementById("chatbot-window");
    const chatbotClose = document.getElementById("chatbot-close");
    const chatbotMessages = document.getElementById("chatbot-messages");
    const chatbotButtons = document.getElementById("chatbot-buttons");
    
    if (!chatbotIcon || !chatbotWindow || !chatbotClose || !chatbotMessages || !chatbotButtons) return;
    
    // Toggle chatbot window
    chatbotIcon.addEventListener("click", function() {
        chatbotWindow.style.display = chatbotWindow.style.display === "flex" ? "none" : "flex";
        
        // If opening, show welcome message
        if (chatbotWindow.style.display === "flex" && chatbotMessages.children.length === 0) {
            showChatbotWelcome();
        }
    });
    
    // Close chatbot window
    chatbotClose.addEventListener("click", function() {
        chatbotWindow.style.display = "none";
    });
    
    // Show welcome message
    function showChatbotWelcome() {
        // Add bot message
        addChatbotMessage("bot", getTranslatedString("chatbotWelcome"));
        
        // Add buttons
        addChatbotButton(getTranslatedString("chatbotBtnYesAdvantage"), function() {
            chatbotShowAdvantage();
        });
        
        addChatbotButton(getTranslatedString("chatbotBtnWhatIs"), function() {
            chatbotExplainApp();
        });
    }
    
    // Add chatbot message
    function addChatbotMessage(type, text) {
        const messageElement = document.createElement("div");
        messageElement.className = `chatbot-message ${type}-message`;
        messageElement.innerHTML = text;
        chatbotMessages.appendChild(messageElement);
        
        // Scroll to bottom
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
    
    // Add chatbot button
    function addChatbotButton(text, callback) {
        const button = document.createElement("button");
        button.className = "chatbot-button";
        button.textContent = text;
        button.addEventListener("click", function() {
            // Add user message
            addChatbotMessage("user", text);
            
            // Clear buttons
            chatbotButtons.innerHTML = "";
            
            // Call callback
            callback();
        });
        
        chatbotButtons.appendChild(button);
    }
    
    // Chatbot flow functions
    function chatbotShowAdvantage() {
        addChatbotMessage("bot", getTranslatedString("chatbotAskGoal"));
        
        addChatbotButton(getTranslatedString("chatbotBtnPlayProfit"), function() {
            chatbotValueProposition();
        });
        
        addChatbotButton(getTranslatedString("chatbotBtnPlayFun"), function() {
            chatbotValueProposition();
        });
        
        addChatbotButton(getTranslatedString("chatbotBtnWhatItDoes"), function() {
            chatbotExplainApp();
        });
    }
    
    function chatbotExplainApp() {
        addChatbotMessage("bot", getTranslatedString("chatbotExplain"));
        
        addChatbotButton(getTranslatedString("chatbotBtnHowItWorks"), function() {
            chatbotHowItWorks();
        });
        
        addChatbotButton(getTranslatedString("chatbotBtnShowMeMore"), function() {
            chatbotShowProof();
        });
        
        addChatbotButton(getTranslatedString("chatbotBtnCompat"), function() {
            chatbotDeviceCompat();
        });
    }
    
    function chatbotHowItWorks() {
        addChatbotMessage("bot", getTranslatedString("chatbotHowItWorks"));
        
        addChatbotButton(getTranslatedString("chatbotBtnShowMeMore"), function() {
            chatbotShowProof();
        });
        
        addChatbotButton(getTranslatedString("chatbotBtnHowBuy"), function() {
            chatbotPurchase();
        });
        
        addChatbotButton(getTranslatedString("chatbotBtnStillQuestions"), function() {
            chatbotFAQ();
        });
    }
    
    function chatbotShowProof() {
        addChatbotMessage("bot", getTranslatedString("chatbotProofResults"));
        
        addChatbotButton(getTranslatedString("chatbotBtnGoToPurchase"), function() {
            chatbotPurchase();
        });
        
        addChatbotButton(getTranslatedString("chatbotBtnExplainUpdates"), function() {
            chatbotExplainUpdates();
        });
        
        addChatbotButton(getTranslatedString("chatbotBtnStillQuestions"), function() {
            chatbotFAQ();
        });
    }
    
    function chatbotDeviceCompat() {
        addChatbotMessage("bot", getTranslatedString("chatbotDeviceCompat"));
        
        addChatbotButton(getTranslatedString("chatbotBtnHowBuy"), function() {
            chatbotPurchase();
        });
        
        addChatbotButton(getTranslatedString("chatbotBtnStillQuestions"), function() {
            chatbotFAQ();
        });
    }
    
    function chatbotValueProposition() {
        addChatbotMessage("bot", getTranslatedString("chatbotValueProp"));
        
        addChatbotButton(getTranslatedString("chatbotBtnGoToPurchase"), function() {
            chatbotPurchase();
        });
        
        addChatbotButton(getTranslatedString("chatbotBtnStillQuestions"), function() {
            chatbotFAQ();
        });
    }
    
    function chatbotExplainUpdates() {
        addChatbotMessage("bot", getTranslatedString("chatbotExplainUpdates"));
        
        addChatbotButton(getTranslatedString("chatbotBtnGoToPurchase"), function() {
            chatbotPurchase();
        });
        
        addChatbotButton(getTranslatedString("chatbotBtnStillQuestions"), function() {
            chatbotFAQ();
        });
    }
    
    function chatbotFAQ() {
        addChatbotMessage("bot", getTranslatedString("chatbotFAQ"));
        
        addChatbotButton(getTranslatedString("chatbotBtnIsSafe"), function() {
            chatbotExplainSafety();
        });
        
        addChatbotButton(getTranslatedString("chatbotBtnTelegramAdmin"), function() {
            chatbotOfferTelegram();
        });
        
        addChatbotButton(getTranslatedString("chatbotBtnGoToPurchase"), function() {
            chatbotPurchase();
        });
    }
    
    function chatbotExplainSafety() {
        addChatbotMessage("bot", getTranslatedString("chatbotExplainSafety"));
        
        addChatbotButton(getTranslatedString("chatbotBtnOKHowBuy"), function() {
            chatbotPurchase();
        });
        
        addChatbotButton(getTranslatedString("chatbotBtnBackFAQ"), function() {
            chatbotFAQ();
        });
    }
    
    function chatbotOfferTelegram() {
        addChatbotMessage("bot", getTranslatedString("chatbotOfferTelegram"));
        
        // Add Telegram link button
        const telegramButton = document.createElement("a");
        telegramButton.className = "chatbot-button telegram-button";
        telegramButton.href = "https://t.me/bedmalcon_temp";
        telegramButton.target = "_blank";
        telegramButton.textContent = getTranslatedString("chatbotBtnTelegramAdmin");
        chatbotButtons.appendChild(telegramButton);
        
        addChatbotButton(getTranslatedString("chatbotBtnBackToBuy"), function() {
            chatbotPurchase();
        });
    }
    
    function chatbotPurchase() {
        addChatbotMessage("bot", getTranslatedString("chatbotValueProp"));
        
        // Add purchase button
        const purchaseButton = document.createElement("button");
        purchaseButton.className = "chatbot-button purchase-button";
        purchaseButton.textContent = getTranslatedString("chatbotBtnGoToPurchase");
        purchaseButton.addEventListener("click", function() {
            // Close chatbot
            chatbotWindow.style.display = "none";
            
            // Start purchase flow
            startPurchaseFlow();
        });
        chatbotButtons.appendChild(purchaseButton);
        
        addChatbotButton(getTranslatedString("chatbotBtnTelegramAdmin"), function() {
            chatbotOfferTelegram();
        });
        
        addChatbotButton(getTranslatedString("chatbotBtnRestart"), function() {
            // Clear messages
            chatbotMessages.innerHTML = "";
            
            // Show welcome message
            showChatbotWelcome();
        });
    }
}

// Update chatbot language
function updateChatbotLanguage(lang) {
    // Update chatbot header
    const chatbotHeader = document.querySelector(".chatbot-header span");
    if (chatbotHeader) {
        chatbotHeader.textContent = getTranslatedString("chatbotHeader");
    }
    
    // Clear chatbot messages and buttons
    const chatbotMessages = document.getElementById("chatbot-messages");
    const chatbotButtons = document.getElementById("chatbot-buttons");
    
    if (chatbotMessages && chatbotButtons) {
        chatbotMessages.innerHTML = "";
        chatbotButtons.innerHTML = "";
        
        // Show welcome message if chatbot is open
        const chatbotWindow = document.getElementById("chatbot-window");
        if (chatbotWindow && chatbotWindow.style.display === "flex") {
            // Re-initialize chatbot functionality
            initializeChatbotFunctionality();
        }
    }
}

// Force re-render all translations on page load
document.addEventListener("DOMContentLoaded", function() {
    // Wait a bit to ensure all elements are loaded
    setTimeout(function() {
        // Get current language
        const currentLang = localStorage.getItem("language") || "en";
        
        // Re-apply language to force update all translations
        setLanguage(currentLang);
        
        // Restore videos in demo section
        restoreVideos();
    }, 500);
});

// Restore videos in demo section
function restoreVideos() {
    const videoContainers = document.querySelectorAll(".video-container");
    
    if (videoContainers.length === 0) return;
    
    // Check if videos are missing
    let videosMissing = false;
    videoContainers.forEach(container => {
        if (!container.querySelector("iframe")) {
            videosMissing = true;
        }
    });
    
    if (!videosMissing) return;
    
    // Restore videos with correct URLs from revealpoker.top
    const demoVideos = [
        {
            title: "PPPOKER Demo",
            src: "https://www.youtube.com/embed/wgzzXJx_TAI"
        },
        {
            title: "XPoker Demo",
            src: "https://www.youtube.com/embed/JejQNbgaSSo"
        },
        {
            title: "ClubGG Demo",
            src: "https://www.youtube.com/embed/ptQIe4OyJrE"
        }
    ];
    
    videoContainers.forEach((container, index) => {
        if (index < demoVideos.length) {
            const iframe = document.createElement("iframe");
            iframe.src = demoVideos[index].src;
            iframe.title = demoVideos[index].title;
            iframe.setAttribute("frameborder", "0");
            iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
            iframe.setAttribute("allowfullscreen", "");
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.style.borderRadius = "8px";
            
            // Clear container and add iframe
            container.innerHTML = "";
            container.appendChild(iframe);
        }
    });
}
