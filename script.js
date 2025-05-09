        let selectedPlatform = '';
        let selectedPokerApp = '';
        let userImei = '';
        let currentLang = localStorage.getItem('language') || 'en';
        let originalPrice = 0; // Stores the price before any discount
        let currentDiscountPercent = 0; // Stores the current discount percentage (e.g., 0.10 for 10%)
        let appliedCouponCode = null; // Stores the code of the applied coupon

        function setLanguage(lang) {
            currentLang = lang;
            localStorage.setItem('language', lang);
            document.documentElement.lang = lang;
            const selector = document.querySelector('#language-selector select');
            if (selector) {
                selector.value = lang;
            }
            document.querySelectorAll('[data-translate]').forEach(element => {
                const key = element.getAttribute('data-translate');
                if (translations[lang] && translations[lang][key]) {
                    element.innerHTML = translations[lang][key];
                }
            });
            document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
                const key = element.getAttribute('data-translate-placeholder');
                if (translations[lang] && translations[lang][key]) {
                    element.placeholder = translations[lang][key];
                }
            });
            // Re-translate dynamic texts like payment dialog title and coupon messages
            if (document.getElementById('payment-dialog').style.display === 'flex') {
                const paymentDialog = document.getElementById('payment-dialog');
                if (paymentDialog.dataset.currentMethod) { // Check if payment dialog is open and has method context
                     updatePaymentDialogText(paymentDialog.dataset.currentMethod); // Update title and network
                }
                updatePriceDisplay(); // Update price and original price language
                const couponMessageEl = document.getElementById('coupon-message');
                if (couponMessageEl.dataset.key) { // If a message key was stored
                    const messageKey = couponMessageEl.dataset.key;
                    const messageParams = JSON.parse(couponMessageEl.dataset.params || '{}');
                    displayCouponMessage(messageKey, messageParams, couponMessageEl.classList.contains('success'));
                }
            }
        }

        function getTranslatedString(key, replacements = {}) {
            let text = (translations[currentLang] && translations[currentLang][key]) || key;
            for (const placeholder in replacements) {
                text = text.replace(`{${placeholder}}`, replacements[placeholder]);
            }
            return text;
        }

        function showPlatformOptions() {
            document.getElementById('platform-dialog').style.display = 'flex';
        }

        function selectPlatform(platform) {
            selectedPlatform = platform;
            closePlatformDialog();
            document.getElementById('imei-dialog').style.display = 'flex';
        }

        function closePlatformDialog() {
            document.getElementById('platform-dialog').style.display = 'none';
        }

        function closeImeiDialog() {
            document.getElementById('imei-dialog').style.display = 'none';
        }

        function submitImei() {
            const imeiInput = document.getElementById('imei-input');
            const imei = imeiInput.value.trim();
            if (imei === '') {
                alert(getTranslatedString('alertEnterIMEI'));
                return;
            }
            userImei = imei;
            closeImeiDialog();
            document.getElementById('poker-app-dialog').style.display = 'flex';
        }
        
        function closePokerAppDialog() {
            document.getElementById('poker-app-dialog').style.display = 'none';
        }

        function selectPokerApp(pokerApp) {
            selectedPokerApp = pokerApp.toLowerCase(); // Ensure consistent casing
            closePokerAppDialog();
            document.getElementById('payment-method-dialog').style.display = 'flex';
        }

        function closePaymentMethodDialog() {
            document.getElementById('payment-method-dialog').style.display = 'none';
        }

        function resetCouponState() {
            currentDiscountPercent = 0;
            appliedCouponCode = null;
            const couponInput = document.getElementById('coupon-code');
            if(couponInput) couponInput.value = '';
            const originalAmountEl = document.getElementById('original-amount');
            if(originalAmountEl) {
                originalAmountEl.style.display = 'none';
                originalAmountEl.textContent = '';
            }
            const couponMessageEl = document.getElementById('coupon-message');
            if(couponMessageEl) {
                couponMessageEl.textContent = '';
                couponMessageEl.className = 'coupon-message';
                delete couponMessageEl.dataset.key;
                delete couponMessageEl.dataset.params;
            }
        }

        function updatePriceDisplay() {
            const amountEl = document.getElementById("amount");
            const originalAmountEl = document.getElementById("original-amount");
            
            if (!amountEl || !originalAmountEl || originalPrice === 0) return; // Ensure elements exist and price is set

            const finalPrice = originalPrice * (1 - currentDiscountPercent);
            amountEl.textContent = getTranslatedString("amountTextBase", { PRICE: `$${finalPrice.toFixed(2)} USD` });

            if (currentDiscountPercent > 0 && appliedCouponCode) {
                originalAmountEl.textContent = getTranslatedString("originalAmountTextBase", { PRICE: `$${originalPrice.toFixed(2)} USD` });
                originalAmountEl.style.display = 'inline';
            } else {
                originalAmountEl.style.display = 'none';
            }
        }
        
        function displayCouponMessage(messageKey, params, isSuccess) {
            const couponMessageEl = document.getElementById('coupon-message');
            if (!couponMessageEl) return;
            const messageText = getTranslatedString(messageKey, params);
            couponMessageEl.textContent = messageText;
            couponMessageEl.className = isSuccess ? 'coupon-message success' : 'coupon-message error';
            couponMessageEl.dataset.key = messageKey; // Store key for re-translation
            couponMessageEl.dataset.params = JSON.stringify(params); // Store params for re-translation
        }

        function applyCoupon() {
            const couponInput = document.getElementById('coupon-code');
            const couponCode = couponInput.value.trim().toUpperCase();

            if (!couponCode) return; // No coupon entered

            if (appliedCouponCode && appliedCouponCode !== couponCode) {
                displayCouponMessage('couponErrorAlreadyApplied', {}, false);
                return;
            }
            if (appliedCouponCode && appliedCouponCode === couponCode) {
                 displayCouponMessage('couponAppliedSuccess', { DISCOUNT: (currentDiscountPercent * 100).toFixed(0), COUPON_CODE: appliedCouponCode }, true);
                return;
            }

            let isValid = false;
            let discount = 0;
            let messageKey = '';
            let messageParams = {};

            if (couponCode === "10OFF") {
                isValid = true;
                discount = 0.10;
                messageKey = 'couponAppliedSuccess';
                messageParams = { DISCOUNT: '10', COUPON_CODE: couponCode };
            } else if (couponCode === "50OFF") {
                const today = new Date();
                const dayOfMonth = today.getDate();
                if (dayOfMonth >= 10 && dayOfMonth <= 12) {
                    if (selectedPokerApp === 'xpoker' || selectedPokerApp === 'pppoker') {
                        isValid = true;
                        discount = 0.50;
                        messageKey = 'couponAppliedSuccess';
                        messageParams = { DISCOUNT: '50', COUPON_CODE: couponCode };
                    } else {
                        messageKey = 'couponErrorPlatform';
                        messageParams = { COUPON_CODE: couponCode, PLATFORM: selectedPokerApp.toUpperCase() };
                    }
                } else {
                    messageKey = 'couponErrorExpired';
                    messageParams = { COUPON_CODE: couponCode };
                }
            } else {
                messageKey = 'couponErrorInvalid';
                messageParams = { COUPON_CODE: couponCode };
            }

            if (isValid) {
                currentDiscountPercent = discount;
                appliedCouponCode = couponCode;
                displayCouponMessage(messageKey, messageParams, true);
            } else {
                // Only reset discount if no coupon was previously validly applied or if a new invalid one is entered
                currentDiscountPercent = 0; 
                appliedCouponCode = null; // Clear applied coupon if current one is invalid
                displayCouponMessage(messageKey, messageParams, false);
            }
            updatePriceDisplay();
        }

        function updatePaymentDialogText(paymentMethod) {
            const paymentDialog = document.getElementById('payment-dialog');
            paymentDialog.dataset.currentMethod = paymentMethod; // Store current method for language change
            const platformTitle = document.getElementById("platform-title");
            const paymentNetworkEl = document.getElementById("payment-network");
            let networkName = "";
            if (paymentMethod === "btc") {
                networkName = getTranslatedString("networkBTC");
            } else if (paymentMethod === "eth") {
                networkName = getTranslatedString("networkETH");
            } else if (paymentMethod === "usdt") {
                networkName = getTranslatedString("networkUSDT");
            }
            paymentNetworkEl.textContent = getTranslatedString("networkInfo", { NETWORK: networkName });
            const platformDisplay = selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1);
            const pokerAppDisplay = selectedPokerApp.toUpperCase();
            platformTitle.textContent = getTranslatedString('paymentDialogTitleBase', { METHOD: paymentMethod.toUpperCase(), PLATFORM: `${platformDisplay} for ${pokerAppDisplay}` });
        }

        function generateQRCode(paymentMethod) {
            closePaymentMethodDialog();
            resetCouponState(); 
            const paymentDialog = document.getElementById('payment-dialog');
            paymentDialog.style.display = 'flex';
            document.getElementById('loading').style.display = 'block';
            document.getElementById('qr-code').style.display = 'none';
            document.getElementById('payment-details').style.display = 'none';
            document.getElementById('loading').innerText = getTranslatedString('loadingText');

            updatePaymentDialogText(paymentMethod); // Call this early to set context for language changes

            setTimeout(() => {
                const qrCode = document.getElementById('qr-code');
                const walletAddressEl = document.getElementById("wallet-address");

                qrCode.src = `${paymentMethod}-qr.png`;
                
                const basePriceNumber = selectedPokerApp === "clubgg" ? 4000 : 1500;
                originalPrice = basePriceNumber;
                updatePriceDisplay(); // Display initial price
                // updatePaymentDialogText(paymentMethod); // Already called above

                let address = "";
                if (paymentMethod === "btc") {
                    address = "bc1qd0l9j7llwxj875e43u8rycnjwvswk6lm4m3p5g";
                } else if (paymentMethod === "eth") {
                    address = "0x1f930a8BBB1A3F54EEc89cFb87f6789a21fB6484";
                } else if (paymentMethod === "usdt") {
                    address = "TVwNs33BS7KrqvWAU7vkKRgvRZWPAPdtqC";
                }
                walletAddressEl.value = address;

                document.getElementById('loading').style.display = 'none';
                qrCode.style.display = 'block';
                document.getElementById('payment-details').style.display = 'block';
            }, 2000);
        }

        function copyWalletAddress() {
            const walletAddress = document.getElementById('wallet-address');
            walletAddress.select();
            walletAddress.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(walletAddress.value).then(() => {
                alert(getTranslatedString('alertCopied'));
            }).catch(err => {
                alert(getTranslatedString('alertCopyFailed'));
                console.error('Copy error:', err);
            });
        }

        function closePaymentDialog() {
            document.getElementById('payment-dialog').style.display = 'none';
            delete document.getElementById('payment-dialog').dataset.currentMethod; // Clear context
        }

        function showTelegramOptions() {
            alert(getTranslatedString('alertTelegram'));
        }

        function loadTestimonials() {
            const container = document.getElementById('testimonials-container');
            if (!container) return;
            container.innerHTML = ''; // Clear existing testimonials if any

            for (let i = 1; i <= 5; i++) { // Assuming 5 testimonials
                const quoteKey = `testimonial${i}Quote`;
                const authorKey = `testimonial${i}Author`;

                const quote = getTranslatedString(quoteKey);
                const author = getTranslatedString(authorKey);

                // Only add if translation exists (handles cases where not all 5 are defined for a lang)
                if (quote !== quoteKey && author !== authorKey) { 
                    const card = document.createElement('div');
                    card.className = 'testimonial-card';
                    
                    const avatar = document.createElement('div');
                    avatar.className = 'testimonial-avatar-placeholder';
                    // avatar.textContent = author.substring(0, 1); // Example: Initial from author

                    const quoteEl = document.createElement('p');
                    quoteEl.className = 'testimonial-quote';
                    quoteEl.innerHTML = quote; // Use innerHTML for potential <strong> tags in future

                    const authorEl = document.createElement('p');
                    authorEl.className = 'testimonial-author';
                    authorEl.textContent = author;

                    card.appendChild(avatar);
                    card.appendChild(quoteEl);
                    card.appendChild(authorEl);
                    container.appendChild(card);
                }
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            setLanguage(currentLang);
            document.getElementById('current-year').textContent = new Date().getFullYear();
            loadCryptoTicker();
            if (typeof initializeChatbot === 'function') {
                initializeChatbot(); 
            }
            loadTestimonials(); // Load testimonials on DOM ready and after translations are set up by setLanguage
        });

        async function loadCryptoTicker() {
            try {
                const response = await fetch("crypto_prices.json"); 
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const prices = await response.json();
                const tickerElement = document.getElementById("crypto-ticker");
                let tickerHTML = "";
                const tickerOrder = [
                    "BTC-USD", "XRP-USD", "ETH-USD", "USDT-USD", "BNB-USD", 
                    "USDC-USD", "SOL-USD", "ADA-USD", "DOGE-USD", "TRX-USD"
                ];
                tickerOrder.forEach(symbol => {
                    const price = prices[symbol];
                    const formattedPrice = (typeof price === 'number') ? price.toFixed(2) : 'N/A';
                    const shortSymbol = symbol.replace("-USD", "");
                    tickerHTML += `<span><span class="symbol">${shortSymbol}:</span> <span class="price">$${formattedPrice}</span></span>`;
                });
                tickerElement.innerHTML = tickerHTML + tickerHTML;
            } catch (error) {
                console.error("Failed to load crypto prices:", error);
                const tickerElement = document.getElementById("crypto-ticker");
                tickerElement.innerHTML = "<span>Crypto price data currently unavailable.</span>";
            }
        }

