// crypto_api.js - Funções para obter cotações de criptomoedas em tempo real

/**
 * Obtém a cotação atual de uma criptomoeda em USD
 * @param {string} crypto - Símbolo da criptomoeda (btc, eth, usdt)
 * @returns {Promise<number>} - Cotação atual em USD
 */
async function getCryptoPrice(crypto) {
    try {
        // Lista de criptomoedas suportadas
        const supportedCryptos = {
            'btc': 'bitcoin',
            'eth': 'ethereum',
            'usdt': 'tether'
        };
        
        // Verificar se a criptomoeda é suportada
        if (!supportedCryptos[crypto.toLowerCase()]) {
            console.error(`Criptomoeda não suportada: ${crypto}`);
            return null;
        }
        
        // ID da criptomoeda para a API CoinGecko
        const cryptoId = supportedCryptos[crypto.toLowerCase()];
        
        // Fazer requisição para a API CoinGecko
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd`);
        
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Verificar se a resposta contém os dados esperados
        if (!data[cryptoId] || !data[cryptoId].usd) {
            throw new Error('Dados de cotação não encontrados na resposta');
        }
        
        // Retornar o preço em USD
        return data[cryptoId].usd;
    } catch (error) {
        console.error(`Erro ao obter cotação de ${crypto}:`, error);
        
        // Valores de fallback caso a API falhe
        const fallbackPrices = {
            'btc': 50000,
            'eth': 3000,
            'usdt': 1
        };
        
        // Retornar valor de fallback
        return fallbackPrices[crypto.toLowerCase()] || 1;
    }
}

/**
 * Calcula o valor em criptomoeda com base no valor em USD
 * @param {number} usdAmount - Valor em USD
 * @param {string} crypto - Símbolo da criptomoeda (btc, eth, usdt)
 * @returns {Promise<{amount: number, formatted: string}>} - Valor em criptomoeda
 */
async function calculateCryptoAmount(usdAmount, crypto) {
    try {
        // Obter cotação atual
        const price = await getCryptoPrice(crypto);
        
        if (!price) {
            throw new Error('Não foi possível obter a cotação');
        }
        
        // Calcular valor em criptomoeda
        const amount = usdAmount / price;
        
        // Formatar valor com precisão adequada para cada criptomoeda
        let formatted = '';
        switch (crypto.toLowerCase()) {
            case 'btc':
                formatted = amount.toFixed(8); // 8 casas decimais para BTC
                break;
            case 'eth':
                formatted = amount.toFixed(6); // 6 casas decimais para ETH
                break;
            case 'usdt':
                formatted = amount.toFixed(2); // 2 casas decimais para USDT
                break;
            default:
                formatted = amount.toFixed(4);
        }
        
        return {
            amount: parseFloat(formatted),
            formatted: formatted
        };
    } catch (error) {
        console.error(`Erro ao calcular valor em ${crypto}:`, error);
        
        // Valores de fallback caso ocorra erro
        const fallbackPrices = {
            'btc': 50000,
            'eth': 3000,
            'usdt': 1
        };
        
        const price = fallbackPrices[crypto.toLowerCase()] || 1;
        const amount = usdAmount / price;
        
        // Formatar valor com precisão adequada
        let formatted = '';
        switch (crypto.toLowerCase()) {
            case 'btc':
                formatted = amount.toFixed(8);
                break;
            case 'eth':
                formatted = amount.toFixed(6);
                break;
            case 'usdt':
                formatted = amount.toFixed(2);
                break;
            default:
                formatted = amount.toFixed(4);
        }
        
        return {
            amount: parseFloat(formatted),
            formatted: formatted
        };
    }
}
