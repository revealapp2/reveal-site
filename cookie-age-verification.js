// cookie-verification.js - Implementação de aviso de cookies

/**
 * Verifica se o usuário já aceitou os cookies
 * @returns {boolean} - true se já aceitou, false caso contrário
 */
function hasAcceptedCookies() {
    return localStorage.getItem('cookies_accepted') === 'true';
}

/**
 * Salva a aceitação de cookies
 */
function acceptCookies() {
    localStorage.setItem('cookies_accepted', 'true');
    hideCookieBanner();
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
 * Inicializa o sistema de verificação de cookies
 */
function initCookieVerification() {
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

    // Verificar se o usuário já aceitou cookies
    if (hasAcceptedCookies()) {
        hideCookieBanner();
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initCookieVerification);
