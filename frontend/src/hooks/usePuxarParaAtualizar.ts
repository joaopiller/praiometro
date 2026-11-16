import { useState } from 'react';

/**
 * Roleta do "puxar para atualizar" só enquanto a atualização pedida pela pessoa roda.
 * Ligada às atualizações em segundo plano (ao trocar de aba ou voltar ao app), no iOS ela
 * podia terminar com a tela fora de vista e ficar presa, com a lista deslocada para baixo.
 */
export function usePuxarParaAtualizar(atualizar: () => Promise<unknown>) {
    const [puxando, setPuxando] = useState(false);
    const puxar = async () => {
        setPuxando(true);
        try {
            await atualizar();
        } finally {
            setPuxando(false);
        }
    };
    return [puxando, puxar] as const;
}
