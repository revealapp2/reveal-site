// chatbot.js

document.addEventListener('DOMContentLoaded', () => {
    // Ensure this runs after the main script initializes `currentLang` and `getTranslatedString`
    // Delay initialization slightly to ensure main script functions are available
    setTimeout(initializeChatbot, 100); 
});

let chatbotState = {
    step: 'start',
    platform: '',
    price: ''
};

const chatbotIcon = document.getElementById('chatbot-icon');
const chatbotWindow = document.getElementById('chatbot-window');
const chatbotClose = document.getElementById('chatbot-close');
const messagesContainer = document.getElementById('chatbot-messages');
const buttonsContainer = document.getElementById('chatbot-buttons');

function initializeChatbot() {
    if (!chatbotIcon || !chatbotWindow || !chatbotClose || !messagesContainer || !buttonsContainer) {
        console.error("Chatbot elements not found!");
        return;
    }

    chatbotIcon.addEventListener('click', toggleChatbot);
    chatbotClose.addEventListener('click', closeChatbot);

    // Start conversation if window is opened for the first time or reset
    if (chatbotState.step === 'start') {
        displayStep('start');
    }
    // Apply initial language
    updateChatbotLanguage(currentLang);
}

function toggleChatbot() {
    chatbotWindow.classList.toggle('open');
    chatbotIcon.style.display = chatbotWindow.classList.contains('open') ? 'none' : 'flex';
    // If opening and conversation hasn't started or was reset, start it
    if (chatbotWindow.classList.contains('open') && messagesContainer.children.length === 0) {
         chatbotState = { step: 'start', platform: '', price: '' }; // Reset state
         messagesContainer.innerHTML = ''; // Clear previous messages
         displayStep('start');
    }
}

function closeChatbot() {
    chatbotWindow.classList.remove('open');
    chatbotIcon.style.display = 'flex';
}

function addMessage(text, sender = 'bot') {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chatbot-message', sender);
    messageDiv.innerHTML = text; // Use innerHTML to render potential HTML tags in translations
    messagesContainer.appendChild(messageDiv);
    // Scroll to the bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function displayButtons(buttons) {
    buttonsContainer.innerHTML = ''; // Clear existing buttons
    buttons.forEach(buttonInfo => {
        const button = document.createElement('button');
        button.classList.add('chatbot-button');
        // Use a data attribute for the translation key
        button.dataset.translate = buttonInfo.key;
        button.textContent = getTranslatedString(buttonInfo.key) || buttonInfo.text; // Set initial text
        button.onclick = () => handleButtonClick(buttonInfo);
        buttonsContainer.appendChild(button);
    });
}

function handleButtonClick(buttonInfo) {
    // Add user message representing the button click
    addMessage(getTranslatedString(buttonInfo.key) || buttonInfo.text, 'user');

    // Perform action based on button click
    if (buttonInfo.action) {
        buttonInfo.action();
    }

    // Go to the next step
    if (buttonInfo.nextStep) {
        displayStep(buttonInfo.nextStep);
    }
}

function displayStep(step) {
    chatbotState.step = step;
    let messageKey = '';
    let buttons = [];

    switch (step) {
        case 'start':
            messageKey = 'chatbotWelcome';
            buttons = [
                { key: 'chatbotBtnYesAdvantage', text: 'Yes, I want an advantage!', nextStep: 'selectPlatform' },
                { key: 'chatbotBtnWhatIs', text: 'What is the Reveal App?', nextStep: 'explainApp' }
            ];
            break;

        case 'explainApp':
            messageKey = 'chatbotExplain';
            buttons = [
                { key: 'chatbotBtnTellMeMore', text: 'Yes, tell me more', nextStep: 'selectPlatform' },
                // { key: 'chatbotBtnSeeDemos', text: 'See Demos', action: () => scrollToSection('demo-videos') }, // Optional demo button
                { key: 'chatbotBtnNoThanks', text: 'No, thanks', action: closeChatbot }
            ];
            break;

        case 'selectPlatform':
            messageKey = 'chatbotSelectPlatform';
            buttons = [
                { key: 'chatbotBtnPPXP', text: 'PPPOKER / XPoker ($1500)', nextStep: 'valueProp', action: () => { chatbotState.platform = 'PPPOKER/XPoker'; chatbotState.price = '$1500 USD'; } },
                { key: 'chatbotBtnClubGG', text: 'ClubGG ($4000)', nextStep: 'valueProp', action: () => { chatbotState.platform = 'ClubGG'; chatbotState.price = '$4000 USD'; } }
            ];
            break;

        case 'valueProp':
            messageKey = 'chatbotValueProp';
            buttons = [
                { key: 'chatbotBtnWhyNoTrial', text: 'Why no free trial?', nextStep: 'explainNoTrial' },
                { key: 'chatbotBtnIsSafe', text: 'Is it safe to use/pay?', nextStep: 'explainSafety' },
                { key: 'chatbotBtnHowBuy', text: 'How do I buy?', nextStep: 'directToPurchase' }
            ];
            break;

        case 'explainNoTrial':
            messageKey = 'chatbotExplainNoTrial';
            buttons = [
                { key: 'chatbotBtnUnderstoodSafe', text: 'Understood. Is it safe?', nextStep: 'explainSafety' },
                { key: 'chatbotBtnOKHowBuy', text: 'Ok. How do I buy?', nextStep: 'directToPurchase' }
            ];
            break;

        case 'explainSafety':
            messageKey = 'chatbotExplainSafety';
            buttons = [
                { key: 'chatbotBtnAboutTrial', text: 'What about the trial?', nextStep: 'explainNoTrial' },
                { key: 'chatbotBtnOKHowBuy', text: 'Ok. How do I buy?', nextStep: 'directToPurchase' }
            ];
            break;

        case 'directToPurchase':
            messageKey = 'chatbotDirectToPurchase';
            buttons = [
                { key: 'chatbotBtnGoToPurchase', text: 'Go to Purchase Section', action: () => scrollToSection('purchase') },
                { key: 'chatbotBtnStillQuestions', text: 'I still have questions', nextStep: 'offerTelegram' }
            ];
            break;
            
        case 'offerTelegram':
            messageKey = 'chatbotOfferTelegram';
            buttons = [
                { key: 'chatbotBtnTelegramAdmin', text: 'Talk to Admin on Telegram', action: () => window.open('https://t.me/bedmalcon_temp', '_blank') }
            ];
            break;

        default:
            console.error('Unknown chatbot step:', step);
            return;
    }

    // Add bot message for the current step
    const messageText = getTranslatedString(messageKey, { plataforma: chatbotState.platform, preco: chatbotState.price }) || `Missing translation for ${messageKey}`;
    addMessage(messageText);

    // Display buttons for the current step
    displayButtons(buttons);
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
    closeChatbot(); // Close chat after redirecting
}

// Function to be called by the main script's setLanguage
function updateChatbotLanguage(lang) {
    // Update header
    const header = chatbotWindow.querySelector('.chatbot-header span[data-translate="chatbotHeader"]');
    if (header) {
        header.textContent = getTranslatedString('chatbotHeader') || 'Chat Assistant';
    }
    // Update existing messages (optional, could be complex)
    // messagesContainer.querySelectorAll('.chatbot-message.bot').forEach(msg => { ... });

    // Update current buttons
    buttonsContainer.querySelectorAll('.chatbot-button').forEach(button => {
        const key = button.dataset.translate;
        if (key) {
            button.textContent = getTranslatedString(key) || button.textContent; // Fallback to existing text
        }
    });
}

