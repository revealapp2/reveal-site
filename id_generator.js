// id_generator.js - Função para gerar ID único de 9 dígitos baseado na data e hora

/**
 * Gera um ID único de 9 dígitos baseado na data e hora atual
 * O ID é composto por:
 * - 2 dígitos para o dia (01-31)
 * - 2 dígitos para a hora (00-23)
 * - 2 dígitos para o minuto (00-59)
 * - 3 dígitos para os milissegundos (000-999, truncado para 3 dígitos)
 * @returns {string} ID único de 9 dígitos
 */
function generateUniqueId() {
    const now = new Date();
    
    // Obter componentes da data e hora
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    
    // Combinar componentes para formar o ID de 9 dígitos
    const uniqueId = `${day}${hour}${minute}${milliseconds}`;
    
    return uniqueId;
}

/**
 * Salva o ID único gerado no armazenamento local
 * @param {string} id - ID único gerado
 */
function saveUniqueIdToLocalStorage(id) {
    try {
        localStorage.setItem("user_reveal_app_unique_id", id);
        return true;
    } catch (e) {
        console.error("Falha ao salvar ID único no localStorage:", e);
        return false;
    }
}

/**
 * Recupera o ID único do armazenamento local
 * @returns {string|null} ID único ou null se não existir
 */
function getUniqueIdFromLocalStorage() {
    try {
        return localStorage.getItem("user_reveal_app_unique_id");
    } catch (e) {
        console.error("Falha ao recuperar ID único do localStorage:", e);
        return null;
    }
}

/**
 * Copia o texto para a área de transferência
 * @param {string} text - Texto a ser copiado
 * @returns {Promise<boolean>} Sucesso ou falha da operação
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        console.error("Falha ao copiar para a área de transferência:", e);
        
        // Fallback para método alternativo se a API Clipboard não estiver disponível
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";  // Evita rolar para o elemento
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        } catch (e) {
            console.error("Falha no método alternativo de cópia:", e);
            return false;
        }
    }
}
