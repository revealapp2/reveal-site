// chatbot.js

document.addEventListener("DOMContentLoaded", () => {
    // Delay initialization slightly to ensure main script functions (like getTranslatedString) are available
    setTimeout(initializeChatbot, 150);
});

let chatbotState = {
    step: "start",
};

// --- DOM Element References ---
let chatbotIcon = null;
let chatbotWindow = null;
let chatbotClose = null;
let messagesContainer = null;
let buttonsContainer = null;

function initializeChatbot() {
    // Assign elements after DOM is ready
    chatbotIcon = document.getElementById("chatbot-icon");
    chatbotWindow = document.getElementById("chatbot-window");
    chatbotClose = document.getElementById("chatbot-close");
    messagesContainer = document.getElementById("chatbot-messages");
    buttonsContainer = document.getElementById("chatbot-buttons");

    if (!chatbotIcon || !chatbotWindow || !chatbotClose || !messagesContainer || !buttonsContainer) {
        console.error("Chatbot elements not found! Ensure HTML structure is correct.");
        return;
    }

    // --- Event Listeners ---
    chatbotIcon.addEventListener("click", toggleChatbot);
    chatbotClose.addEventListener("click", closeChatbot);

    // Start conversation logic moved to toggleChatbot
}

function toggleChatbot() {
    if (!chatbotWindow || !chatbotIcon || !messagesContainer) return; // Ensure elements exist

    const isOpen = chatbotWindow.classList.toggle("open");
    chatbotIcon.style.display = isOpen ? "none" : "flex";

    // If opening and conversation hasn't started or was reset, start it
    if (isOpen && messagesContainer.children.length === 0) {
         chatbotState = { step: "start" }; // Reset state
         messagesContainer.innerHTML = ""; // Clear previous messages
         buttonsContainer.innerHTML = ""; // Clear previous buttons
         displayStep("start");
         updateChatbotLanguage(currentLang); // Apply initial language
    }
}

function closeChatbot() {
    if (!chatbotWindow || !chatbotIcon) return; // Ensure elements exist
    chatbotWindow.classList.remove("open");
    chatbotIcon.style.display = "flex";
}

// --- Message and Button Handling ---

// Adds USER messages instantly
function addMessage(textKey, sender = "user", replacements = {}) {
    if (!messagesContainer) return;
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("chatbot-message", sender);
    // Get translated text using the main script's function
    const text = getTranslatedString(textKey, replacements) || `Missing: ${textKey}`;
    messageDiv.innerHTML = text; // Use innerHTML to render potential HTML tags
    messagesContainer.appendChild(messageDiv);
    // Scroll to the bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Adds BOT messages with typing indicator and delay, then displays buttons
function addBotMessageWithButtons(textKey, buttonsToShow, replacements = {}) {
    if (!messagesContainer) return;

    // Show typing indicator
    const typingIndicator = document.createElement("div");
    typingIndicator.classList.add("chatbot-message", "bot", "typing-indicator");
    typingIndicator.innerHTML = "<span>.</span><span>.</span><span>.</span>";
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Calculate random delay (1000ms to 3000ms)
    const delay = Math.random() * 2000 + 1000;

    setTimeout(() => {
        // Remove typing indicator if it still exists
        if (messagesContainer.contains(typingIndicator)) {
             messagesContainer.removeChild(typingIndicator);
        }

        // Add the actual bot message
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("chatbot-message", "bot"); // Always 'bot' sender
        const text = getTranslatedString(textKey, replacements) || `Missing: ${textKey}`;
        messageDiv.innerHTML = text;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Display buttons AFTER the message is shown
        if (buttonsToShow && buttonsToShow.length > 0) {
            displayButtons(buttonsToShow);
        }

    }, delay);
}


function displayButtons(buttons) {
    if (!buttonsContainer) return;
    buttonsContainer.innerHTML = ""; // Clear existing buttons
    buttons.forEach(buttonInfo => {
        const button = document.createElement("button");
        button.classList.add("chatbot-button");
        button.dataset.translate = buttonInfo.key; // Store key for language updates
        // Set initial text using the main script's function
        button.textContent = getTranslatedString(buttonInfo.key) || buttonInfo.text;
        button.onclick = () => handleButtonClick(buttonInfo);
        buttonsContainer.appendChild(button);
    });
}

function handleButtonClick(buttonInfo) {
    // Add user message representing the button click (instantly)
    addMessage(buttonInfo.key, "user"); // Use instant addMessage for user

    // Clear buttons immediately after user clicks
    if (buttonsContainer) {
        buttonsContainer.innerHTML = "";
    }

    // Perform action if defined
    if (buttonInfo.action) {
        buttonInfo.action();
    }

    // Go to the next step if defined
    if (buttonInfo.nextStep) {
        displayStep(buttonInfo.nextStep); // displayStep will now handle bot message delay
    }
}

// --- Conversation Flow Logic ---
function displayStep(step) {
    chatbotState.step = step;
    let messageKey = "";
    let buttons = [];

    switch (step) {
        case "start":
            messageKey = "chatbotWelcome";
            buttons = [
                { key: "chatbotBtnYesAdvantage", text: "Yes, I want an edge!", nextStep: "askGoal" },
                { key: "chatbotBtnWhatIs", text: "What is the Reveal App?", nextStep: "explainApp" }
            ];
            break;

        case "askGoal":
            messageKey = "chatbotAskGoal";
            buttons = [
                { key: "chatbotBtnHowGet", text: "Yes, how do I get it?", nextStep: "valueProp" },
                { key: "chatbotBtnWhyNoTrial", text: "Why no free trial?", nextStep: "explainNoTrial" },
                { key: "chatbotBtnIsSafe", text: "Is it safe?", nextStep: "explainSafety" }
            ];
            break;

        case "explainApp":
            messageKey = "chatbotExplain";
            buttons = [
                { key: "chatbotBtnHowGet", text: "Yes, how do I get it?", nextStep: "valueProp" },
                { key: "chatbotBtnWhyNoTrial", text: "Why no free trial?", nextStep: "explainNoTrial" },
                { key: "chatbotBtnIsSafe", text: "Is it safe?", nextStep: "explainSafety" }
            ];
            break;

        case "valueProp":
            messageKey = "chatbotValueProp";
            buttons = [
                { key: "chatbotBtnGoToPurchase", text: "Ok, take me to the button", action: () => scrollToSection("purchase") },
                { key: "chatbotBtnWhyNoTrial", text: "Wait, why no free trial?", nextStep: "explainNoTrial" },
                { key: "chatbotBtnIsSafe", text: "Is it safe first?", nextStep: "explainSafety" },
                { key: "chatbotBtnStillQuestions", text: "I still have questions", nextStep: "offerTelegram" }
            ];
            break;

        case "explainNoTrial":
            messageKey = "chatbotExplainNoTrial";
            buttons = [
                { key: "chatbotBtnUnderstoodSafe", text: "Understood. Is it safe?", nextStep: "explainSafety" },
                { key: "chatbotBtnOKHowBuy", text: "Ok. How do I buy?", nextStep: "valueProp" },
                { key: "chatbotBtnStillQuestions", text: "I still have questions", nextStep: "offerTelegram" }
            ];
            break;

        case "explainSafety":
            messageKey = "chatbotExplainSafety";
            buttons = [
                { key: "chatbotBtnOKHowBuy", text: "Ok. How do I buy?", nextStep: "valueProp" },
                { key: "chatbotBtnAboutTrial", text: "What about the trial again?", nextStep: "explainNoTrial" },
                { key: "chatbotBtnStillQuestions", text: "I still have questions", nextStep: "offerTelegram" }
            ];
            break;

        case "offerTelegram":
            messageKey = "chatbotOfferTelegram";
            buttons = [
                { key: "chatbotBtnTelegramAdmin", text: "Talk to Admin on Telegram", action: () => window.open("https://t.me/bedmalcon_temp", "_blank") },
                { key: "chatbotBtnBackToBuy", text: "Actually, how do I buy?", nextStep: "valueProp" }
            ];
            break;

        default:
            console.error("Unknown chatbot step:", step);
            messageKey = "chatbotError"; // Add an error message key if needed
            buttons = [
                 { key: "chatbotBtnRestart", text: "Restart Chat", nextStep: "start" } // Optional restart
            ];
            break;
    }

    // Add bot message and then display buttons
    addBotMessageWithButtons(messageKey, buttons);
}

// --- Utility Functions ---

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: "smooth" });
    }
    closeChatbot(); // Close chat after redirecting
}

// --- Language Integration ---

// Function to be called by the main script's setLanguage
function updateChatbotLanguage(lang) {
    if (!chatbotWindow || !buttonsContainer) {
        // Don't try to update if elements aren't ready or chat isn't open
        return;
    }

    // Update header
    const header = chatbotWindow.querySelector('.chatbot-header span[data-translate="chatbotHeader"]');
    if (header) {
        header.textContent = getTranslatedString("chatbotHeader") || "Chat Assistant";
    }

    // Update current buttons' text
    buttonsContainer.querySelectorAll(".chatbot-button").forEach(button => {
        const key = button.dataset.translate;
        if (key) {
            button.textContent = getTranslatedString(key) || button.textContent; // Fallback to existing text
        }
    });

    // Note: Updating past messages' language is complex and usually not done.
    // The conversation effectively restarts visually in the new language if reopened.
}

// Ensure the chatbot script is loaded after the main script in index.html
// Example:
// <script src="translations.js"></script>
// <script> /* Main site script with getTranslatedString, setLanguage etc. */ </script>
// <script src="chatbot.js"></script>

