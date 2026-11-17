// Ponte em São Paulo para a coleta do backend.
//
// O site do INEA só responde a endereços do Brasil, e o Open-Meteo conta o limite de
// acessos por endereço (o do Render gratuito é dividido com outros usuários). Esta função
// roda na região de São Paulo da Vercel e busca a página em nome do backend:
//
//   GET /api/buscar?url=https://www.inea.rj.gov.br/niteroi/    (header x-ponte-chave)
//
// Só atende os sites da lista abaixo e só com a chave certa, para não virar um atalho
// aberto para qualquer endereço.
const { timingSafeEqual } = require('node:crypto');

const PERMITIDOS = new Set(['www.inea.rj.gov.br', 'inea.rj.gov.br', 'api.open-meteo.com', 'marine-api.open-meteo.com']);
const ESPERA_MS = 20_000;
const SALTOS = 4;

function chaveConfere(recebida) {
    const esperada = Buffer.from(process.env.PONTE_CHAVE || '');
    const dada = Buffer.from(String(recebida || ''));
    return esperada.length > 0 && dada.length === esperada.length && timingSafeEqual(dada, esperada);
}

function destino(texto) {
    let url;
    try {
        url = new URL(String(texto));
    } catch {
        return null;
    }
    const permitido = url.protocol === 'https:' && url.port === '' && !url.username && PERMITIDOS.has(url.hostname);
    return permitido ? url : null;
}

module.exports = async (req, res) => {
    res.setHeader('cache-control', 'no-store');
    if (req.method !== 'GET') return res.status(405).json({ erro: 'use GET' });
    if (!chaveConfere(req.headers['x-ponte-chave'])) return res.status(401).json({ erro: 'chave inválida' });

    let url = destino(req.query.url);
    if (!url) return res.status(400).json({ erro: 'endereço não permitido' });

    try {
        let resposta;
        // redirecionamentos seguidos à mão: cada destino passa pela mesma lista
        for (let salto = 0; salto <= SALTOS; salto++) {
            resposta = await fetch(url, {
                redirect: 'manual',
                signal: AbortSignal.timeout(ESPERA_MS),
                headers: { 'user-agent': 'Praiometro/2.0 (coleta)' },
            });
            const para = resposta.headers.get('location');
            if (resposta.status < 300 || resposta.status >= 400 || !para) break;
            url = destino(new URL(para, url).href);
            if (!url) return res.status(502).json({ erro: 'redirecionamento para fora dos sites permitidos' });
        }
        const corpo = Buffer.from(await resposta.arrayBuffer());
        res.setHeader('content-type', resposta.headers.get('content-type') || 'application/octet-stream');
        res.setHeader('x-ponte-regiao', process.env.VERCEL_REGION || 'local');
        return res.status(resposta.status).send(corpo);
    } catch (erro) {
        return res.status(504).json({ erro: `o site não respondeu (${erro.name})` });
    }
};
