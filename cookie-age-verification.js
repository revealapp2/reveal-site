// cookie-age-verification.js - Implementação de aviso de cookies e verificação de idade

/**
 * Verifica se o usuário já aceitou os cookies
 * @returns {boolean} - true se já aceitou, false caso contrário
 */
function hasAcceptedCookies() {
    return localStorage.getItem('cookies_accepted') === 'true';
}

/**
 * Verifica se o usuário já confirmou ser maior de idade
 * @returns {boolean} - true se já confirmou, false caso contrário
 */
function hasVerifiedAge() {
    return localStorage.getItem('age_verified') === 'true';
}

/**
 * Salva a aceitação de cookies
 */
function acceptCookies() {
    localStorage.setItem('cookies_accepted', 'true');
    hideCookieBanner();
}

/**
 * Salva a verificação de idade
 */
function verifyAge() {
    localStorage.setItem('age_verified', 'true');
    hideAgeVerification();
    showContent();
}

/**
 * Esconde o banner de cookies
 */
function hideCookieBanner() {
    const cookieBanner = document.getElementById('cookie-banner');
    if (cookieBanner) {
        cookieBanner.style.display = 'none';
    }
}

/**
 * Esconde a verificação de idade
 */
function hideAgeVerification() {
    const ageVerification = document.getElementById('age-verification');
    if (ageVerification) {
        ageVerification.style.display = 'none';
    }
}

/**
 * Mostra o conteúdo do site
 */
function showContent() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'block';
    }
}

/**
 * Redireciona para uma página de acesso negado
 */
function denyAccess() {
    // Exibe mensagem de acesso negado
    const ageVerification = document.getElementById('age-verification');
    if (ageVerification) {
        ageVerification.innerHTML = `
            <div class="age-verification-content">
                <h2 data-translate="ageVerificationDeniedTitle">Acesso Negado</h2>
                <p data-translate="ageVerificationDeniedText">Este site é destinado apenas para maiores de 18 anos.</p>
            </div>
        `;
    }
}

/**
 * Inicializa o sistema de verificação de cookies e idade
 */
function initCookieAgeVerification() {
    // Criar banner de cookies se não existir
    if (!document.getElementById('cookie-banner')) {
        const cookieBanner = document.createElement('div');
        cookieBanner.id = 'cookie-banner';
        cookieBanner.className = 'cookie-banner';
        cookieBanner.innerHTML = `
            <div class="cookie-content">
                <p data-translate="cookieBannerText">Este site utiliza cookies para melhorar sua experiência. Ao continuar navegando, você concorda com o uso de cookies.</p>
                <div class="cookie-buttons">
                    <button onclick="acceptCookies()" class="cookie-accept-button" data-translate="cookieAcceptButton">Aceitar</button>
                    <a href="#" class="cookie-policy-link" data-translate="cookiePolicyLink">Política de Cookies</a>
                </div>
            </div>
        `;
        document.body.appendChild(cookieBanner);
    }

    // Criar verificação de idade se não existir
    if (!document.getElementById('age-verification')) {
        const ageVerification = document.createElement('div');
        ageVerification.id = 'age-verification';
        ageVerification.className = 'age-verification';
        ageVerification.innerHTML = `
            <div class="age-verification-content">
                <h2 data-translate="ageVerificationTitle">Verificação de Idade</h2>
                <p data-translate="ageVerificationText">Este site contém conteúdo destinado apenas para maiores de 18 anos.</p>
                <p data-translate="ageVerificationQuestion">Você tem 18 anos ou mais?</p>
                <div class="age-buttons">
                    <button onclick="verifyAge()" class="age-yes-button" data-translate="ageYesButton">Sim, tenho 18 anos ou mais</button>
                    <button onclick="denyAccess()" class="age-no-button" data-translate="ageNoButton">Não</button>
                </div>
            </div>
        `;
        document.body.appendChild(ageVerification);
    }

    // Esconder o conteúdo principal inicialmente
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.id = 'main-content';
        mainContent.style.display = 'none';
    }

    // Verificar se o usuário já aceitou cookies e verificou idade
    if (hasAcceptedCookies()) {
        hideCookieBanner();
    }

    if (hasVerifiedAge()) {
        hideAgeVerification();
        showContent();
    } else {
        // Se não verificou idade, esconder o conteúdo
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'none';
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initCookieAgeVerification);
