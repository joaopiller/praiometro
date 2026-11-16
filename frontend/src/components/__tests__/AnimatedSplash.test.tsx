import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Image } from 'react-native';
import AnimatedSplash from '../AnimatedSplash';

describe('AnimatedSplash', () => {
    beforeEach(() => jest.clearAllMocks());

    it('só esconde a abertura nativa quando a logo carrega', () => {
        render(<AnimatedSplash pronto={false} onFim={jest.fn()} />);
        expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
        fireEvent(screen.UNSAFE_getByType(Image), 'load');
        expect(SplashScreen.hideAsync).toHaveBeenCalled();
    });

    it('esconde a abertura nativa mesmo se a logo demorar', async () => {
        render(<AnimatedSplash pronto={false} onFim={jest.fn()} />);
        await waitFor(() => expect(SplashScreen.hideAsync).toHaveBeenCalled(), { timeout: 2000 });
    });

    it('termina depois do tempo mínimo quando os dados estão prontos', async () => {
        const onFim = jest.fn();
        render(<AnimatedSplash pronto onFim={onFim} />);
        expect(onFim).not.toHaveBeenCalled();
        await waitFor(() => expect(onFim).toHaveBeenCalledTimes(1), { timeout: 4000 });
    });

    it('espera os dados ficarem prontos', async () => {
        const onFim = jest.fn();
        const { rerender } = render(<AnimatedSplash pronto={false} onFim={onFim} />);
        await new Promise((r) => setTimeout(r, 1600));
        expect(onFim).not.toHaveBeenCalled();
        rerender(<AnimatedSplash pronto onFim={onFim} />);
        await waitFor(() => expect(onFim).toHaveBeenCalledTimes(1), { timeout: 2000 });
    });

    it('sai sozinha depois do tempo máximo, mesmo sem dados', async () => {
        const onFim = jest.fn();
        render(<AnimatedSplash pronto={false} onFim={onFim} />);
        await waitFor(() => expect(onFim).toHaveBeenCalledTimes(1), { timeout: 5500 });
    }, 8000);
});
