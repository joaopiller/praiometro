import { getErrorMessage } from '../api/client';
import type { TipoRelato } from '../api/types';
import { LoginError, obterIdToken } from '../auth/google';
import { useDenunciarRelato, useEnviarRelato } from './queries';
import { LocalizacaoError, obterLocalizacao } from './useLocalizacao';

/** ok: false sem `erro` significa que o usuário cancelou o login. */
export type Resultado = { ok: true } | { ok: false; erro?: string };

function mensagemDe(error: unknown): string {
    return error instanceof LoginError || error instanceof LocalizacaoError ? error.message : getErrorMessage(error);
}

export function useAcoesRelato(codigo: string) {
    const enviar = useEnviarRelato(codigo);
    const denunciar = useDenunciarRelato(codigo);

    async function relatar(tipo: TipoRelato): Promise<Resultado> {
        try {
            const local = await obterLocalizacao();
            const idToken = await obterIdToken();
            if (!idToken) return { ok: false };
            await enviar.mutateAsync({ tipo, local, idToken });
            return { ok: true };
        } catch (error) {
            return { ok: false, erro: mensagemDe(error) };
        }
    }

    async function contestar(tipo: TipoRelato): Promise<Resultado> {
        try {
            const idToken = await obterIdToken();
            if (!idToken) return { ok: false };
            await denunciar.mutateAsync({ tipo, idToken });
            return { ok: true };
        } catch (error) {
            return { ok: false, erro: mensagemDe(error) };
        }
    }

    return { relatar, contestar, enviando: enviar.isPending || denunciar.isPending };
}
