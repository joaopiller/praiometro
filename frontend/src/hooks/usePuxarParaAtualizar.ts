import { useState } from 'react';

// rede de segurança: o pedido já desiste sozinho antes disso (api/client.ts), e aí a roleta
// para junto com o aviso de "sem conexão"; isto só garante que ela nunca fique rodando para sempre
const ESPERA_MAXIMA = 12_000;

/**
 * Roleta do "puxar para atualizar" só enquanto a atualização pedida pela pessoa roda.
 * Ligada às atualizações em segundo plano (ao trocar de aba ou voltar ao app), no iOS ela
 * podia terminar com a tela fora de vista e ficar presa, com a lista deslocada para baixo.
 */
export function usePuxarParaAtualizar(atualizar: () => Promise<unknown>) {
    const [puxando, setPuxando] = useState(false);
    const puxar = async () => {
        setPuxando(true);
        let limite: ReturnType<typeof setTimeout> | undefined;
        try {
            await Promise.race([atualizar(), new Promise((soltar) => (limite = setTimeout(soltar, ESPERA_MAXIMA)))]);
        } finally {
            clearTimeout(limite);
            setPuxando(false);
        }
    };
    return [puxando, puxar] as const;
}
