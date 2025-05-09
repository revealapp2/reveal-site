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
                // If payment dialog is open, re-evaluate its dynamic texts
                const paymentMethod = document.getElementById('qr-code').src.split('/').pop().split('-')[0]; // Infer payment method
                if (paymentMethod && (paymentMethod === 'btc' || paymentMethod === 'eth' || paymentMethod === 'usdt')) {
                     updatePaymentDialogText(paymentMethod); // Update title and network
                }
                updatePriceDisplay(); // Update price and original price language
                const couponMessageEl = document.getElementById('coupon-message');
                if (couponMessageEl.dataset.key) { // If a message key was stored
                    const messageKey = couponMessageEl.dataset.key;
                    const messageParams = JSON.parse(couponMessageEl.dataset.params || '{}');
                    displayCouponMessage(getTranslatedString(messageKey, messageParams), couponMessageEl.classList.contains('success'));
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

            // If a different coupon is already applied, don't allow another one.
            if (appliedCouponCode && appliedCouponCode !== couponCode) {
                displayCouponMessage('couponErrorAlreadyApplied', {}, false);
                return;
            }
            // If the same coupon is re-applied, just re-validate and show message (or do nothing if already valid)
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
                    if (selectedPokerApp === 'xpoker' || selectedPokerApp === 'pppoke') {
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
                // If a coupon was previously applied and this one is invalid, revert to no coupon
                if(appliedCouponCode && appliedCouponCode !== couponCode) {
                    // This case should be handled by the 'already applied' check earlier
                    // but as a fallback, if an invalid one is entered after a valid one, clear the old one.
                } else if (!appliedCouponCode) { // Only reset if no coupon was previously validly applied
                    currentDiscountPercent = 0;
                    // appliedCouponCode = null; // Keep this null if invalid
                }
                displayCouponMessage(messageKey, messageParams, false);
            }
            updatePriceDisplay();
        }

        function updatePaymentDialogText(paymentMethod) {
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

            setTimeout(() => {
                const qrCode = document.getElementById('qr-code');
                const walletAddressEl = document.getElementById("wallet-address");

                qrCode.src = `${paymentMethod}-qr.png`;
                
                const basePriceNumber = selectedPokerApp === "clubgg" ? 4000 : 1500;
                originalPrice = basePriceNumber;
                updatePriceDisplay(); // Display initial price
                updatePaymentDialogText(paymentMethod); // Update title and network info

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
            }, 2000); // Reduced delay for faster testing, was 5000
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
        }

        function showTelegramOptions() {
            alert(getTranslatedString('alertTelegram'));
        }

        document.addEventListener('DOMContentLoaded', () => {
            setLanguage(currentLang);
            document.getElementById('current-year').textContent = new Date().getFullYear();
            loadCryptoTicker();
            // Ensure chatbot.js is loaded after this script or DOM is ready for it
            if (typeof initializeChatbot === 'function') {
                initializeChatbot(); 
            }
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

