import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Image } from 'react-native';
import AnimatedSplash from '../AnimatedSplash';

// relógio simulado: os tempos da abertura (1,2 s, 1,6 s, 4 s) passam na hora
const avancar = (ms: number) => act(() => jest.advanceTimersByTime(ms));
// a animação de saída só é agendada depois que o tempo vence
const terminarSaida = () => avancar(500);

describe('AnimatedSplash', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });
    afterEach(() => {
        act(() => jest.runOnlyPendingTimers());
        jest.useRealTimers();
    });

    it('só esconde a abertura nativa quando a logo carrega', () => {
        render(<AnimatedSplash pronto={false} onFim={jest.fn()} />);
        expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
        fireEvent(screen.UNSAFE_getByType(Image), 'load');
        expect(SplashScreen.hideAsync).toHaveBeenCalled();
    });

    it('esconde a abertura nativa mesmo se a logo demorar', () => {
        render(<AnimatedSplash pronto={false} onFim={jest.fn()} />);
        avancar(1300);
        expect(SplashScreen.hideAsync).toHaveBeenCalled();
    });

    it('termina depois do tempo mínimo quando os dados estão prontos', () => {
        const onFim = jest.fn();
        render(<AnimatedSplash pronto onFim={onFim} />);
        fireEvent(screen.UNSAFE_getByType(Image), 'load');
        avancar(1000);
        expect(onFim).not.toHaveBeenCalled();
        avancar(700);
        terminarSaida();
        expect(onFim).toHaveBeenCalledTimes(1);
    });

    it('espera os dados ficarem prontos', () => {
        const onFim = jest.fn();
        const { rerender } = render(<AnimatedSplash pronto={false} onFim={onFim} />);
        fireEvent(screen.UNSAFE_getByType(Image), 'load');
        avancar(2500);
        expect(onFim).not.toHaveBeenCalled();
        rerender(<AnimatedSplash pronto onFim={onFim} />);
        terminarSaida();
        expect(onFim).toHaveBeenCalledTimes(1);
    });

    it('sai sozinha depois do tempo máximo, mesmo sem dados', () => {
        const onFim = jest.fn();
        render(<AnimatedSplash pronto={false} onFim={onFim} />);
        avancar(3900);
        expect(onFim).not.toHaveBeenCalled();
        avancar(200);
        terminarSaida();
        expect(onFim).toHaveBeenCalledTimes(1);
    });
});
