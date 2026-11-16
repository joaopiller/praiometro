import * as Location from 'expo-location';
import { LocalizacaoError, obterLocalizacao } from '../useLocalizacao';

const ultima = Location.getLastKnownPositionAsync as jest.Mock;
const atual = Location.getCurrentPositionAsync as jest.Mock;

describe('obterLocalizacao', () => {
    beforeEach(() => jest.clearAllMocks());
    afterEach(() => jest.useRealTimers());

    it('não pede de novo uma permissão já concedida', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({ granted: true, status: 'granted', canAskAgain: true });
        await obterLocalizacao();
        expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    });

    it('usa a última posição conhecida quando existe', async () => {
        await expect(obterLocalizacao()).resolves.toEqual({ latitude: -22.905, longitude: -43.11 });
    });

    it('busca a posição atual se não houver uma recente', async () => {
        ultima.mockResolvedValueOnce(null);
        atual.mockResolvedValueOnce({ coords: { latitude: -22.97, longitude: -43.03 } });
        await expect(obterLocalizacao()).resolves.toEqual({ latitude: -22.97, longitude: -43.03 });
    });

    it('desiste com mensagem clara se o aparelho não responder', async () => {
        jest.useFakeTimers();
        ultima.mockReturnValueOnce(new Promise(() => {}));
        const resultado = obterLocalizacao();
        const esperado = expect(resultado).rejects.toBeInstanceOf(LocalizacaoError);
        await jest.advanceTimersByTimeAsync(15_000);
        await esperado;
    });
});
