import { useRef, useState } from 'react';
import { getErrorMessage } from '../api/client';
import type { TipoRelato } from '../api/types';
import { LoginError } from '../auth/google';
import { useLogin } from '../auth/LoginProvider';
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
    const { pedirLogin } = useLogin();
    // ocupado desde o pedido de localização e o login, não só durante o envio:
    // um segundo toque nesse meio tempo mandaria o relato duas vezes
    const [enviando, setEnviando] = useState(false);
    const ocupado = useRef(false);

    async function umPorVez(acao: () => Promise<Resultado>): Promise<Resultado> {
        if (ocupado.current) return { ok: false };
        ocupado.current = true;
        setEnviando(true);
        try {
            return await acao();
        } catch (error) {
            return { ok: false, erro: mensagemDe(error) };
        } finally {
            ocupado.current = false;
            setEnviando(false);
        }
    }

    const relatar = (tipos: TipoRelato[]) =>
        umPorVez(async () => {
            const local = await obterLocalizacao('para confirmar que você está na praia');
            const idToken = await pedirLogin({ sobreModal: true });
            if (!idToken) return { ok: false };
            await enviar.mutateAsync({ tipos, local, idToken });
            return { ok: true };
        });

    const contestar = (tipo: TipoRelato) =>
        umPorVez(async () => {
            const idToken = await pedirLogin({ sobreModal: true });
            if (!idToken) return { ok: false };
            await denunciar.mutateAsync({ tipo, idToken });
            return { ok: true };
        });

    return { relatar, contestar, enviando };
}
