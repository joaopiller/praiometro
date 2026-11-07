import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Avaliacao, PrevisaoHora } from '../../api/types';
import DataNotice from '../DataNotice';
import ErrorBoundary from '../ErrorBoundary';
import FeedbackSection from '../FeedbackSection';
import ForecastStrip from '../ForecastStrip';
import StarRating from '../StarRating';
import StateView from '../StateView';
import UVCard from '../UVCard';

describe('StarRating', () => {
    it('toque na metade esquerda dá meia estrela', () => {
        const onChange = jest.fn();
        render(<StarRating value={0} size={30} onChange={onChange} />);
        fireEvent.press(screen.getByTestId('estrela-4'), { nativeEvent: { locationX: 5 } });
        expect(onChange).toHaveBeenLastCalledWith(3.5);
        fireEvent.press(screen.getByTestId('estrela-4'), { nativeEvent: { locationX: 25 } });
        expect(onChange).toHaveBeenLastCalledWith(4);
    });

    it('accessibilityValue usa só inteiros (exigência do Android)', () => {
        render(<StarRating value={3.5} label="Limpeza" />);
        const { accessibilityValue } = screen.getByLabelText('Limpeza: 3,5 de 5 estrelas').props;
        expect(Number.isInteger(accessibilityValue.now)).toBe(true);
        expect(accessibilityValue.now).toBe(7);
    });

    it('é ajustável por leitor de tela em passos de 0,5', () => {
        const onChange = jest.fn();
        render(<StarRating value={3} onChange={onChange} label="Limpeza" />);
        const el = screen.getByLabelText('Limpeza: 3,0 de 5 estrelas');
        fireEvent(el, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
        expect(onChange).toHaveBeenCalledWith(3.5);
    });
});

describe('StateView', () => {
    it('mostra erro com botão de tentar novamente', () => {
        const onRetry = jest.fn();
        render(<StateView error="Sem conexão" onRetry={onRetry} />);
        expect(screen.getByText('Sem conexão')).toBeTruthy();
        fireEvent.press(screen.getByText('Tentar novamente'));
        expect(onRetry).toHaveBeenCalled();
    });

    it('mostra carregamento visível', () => {
        render(<StateView loading />);
        expect(screen.getByText('Carregando...')).toBeTruthy();
    });
});

describe('ForecastStrip', () => {
    const previsao: PrevisaoHora[] = Array.from({ length: 30 }, (_, i) => ({
        hora: `2026-11-16T${String(i % 24).padStart(2, '0')}:00`,
        temperature_2m: 25 + (i % 5),
        precipitation_probability: i,
        weather_code: 1,
        uv_index: 3,
        wave_height: 0.5,
    }));

    it('mostra no máximo 24 horas', () => {
        render(<ForecastStrip previsao={previsao} />);
        expect(screen.getAllByText(/^\d+%$/)).toHaveLength(24);
        expect(screen.getByText('PREVISÃO PRÓXIMAS 24H')).toBeTruthy();
    });

    it('não renderiza sem dados e tolera temperaturas nulas', () => {
        const { toJSON } = render(<ForecastStrip previsao={[]} />);
        expect(toJSON()).toBeNull();
        render(<ForecastStrip previsao={[{ ...previsao[0], temperature_2m: null }]} />);
        expect(screen.getByText('–')).toBeTruthy();
    });
});

describe('FeedbackSection', () => {
    it('mostra nota geral, contagem e médias com meia estrela', () => {
        const avaliacao: Avaliacao = {
            praia_id: 'GR000',
            avaliacao_media: { limpeza: 4.5, acessibilidade: 3, infraestrutura: 3.5, seguranca: 2, tranquilidade: 5 },
            medias_exatas: { limpeza: 4.33, acessibilidade: 3, infraestrutura: 3.5, seguranca: 2, tranquilidade: 5 },
            nota_geral: 3.57,
            total_avaliacoes: 12,
        };
        render(<FeedbackSection avaliacao={avaliacao} onPress={jest.fn()} />);
        expect(screen.getByText('3,6')).toBeTruthy();
        expect(screen.getByText('12 avaliações')).toBeTruthy();
        expect(screen.getByLabelText('Limpeza: 4,3 de 5')).toBeTruthy();
    });

    it('estado vazio convida a avaliar', () => {
        const onPress = jest.fn();
        render(<FeedbackSection avaliacao={{ praia_id: 'X', avaliacao_media: null, total_avaliacoes: 0 }} onPress={onPress} />);
        expect(screen.getByText(/Seja o primeiro/)).toBeTruthy();
        fireEvent.press(screen.getByText('Avaliar esta praia'));
        expect(onPress).toHaveBeenCalled();
    });

    it('erro ao carregar avaliações permite tentar de novo', () => {
        const onRetry = jest.fn();
        render(<FeedbackSection error onRetry={onRetry} onPress={jest.fn()} />);
        fireEvent.press(screen.getByText(/Toque para tentar de novo/));
        expect(onRetry).toHaveBeenCalled();
    });
});

describe('UVCard e DataNotice', () => {
    it('UV sem dados não quebra', () => {
        render(<UVCard uv={null} />);
        expect(screen.getByText('SEM DADOS')).toBeTruthy();
    });

    it('avisa quando está offline', () => {
        render(<DataNotice timestamp="2026-11-16T10:00" refreshError />);
        expect(screen.getByText(/Sem conexão com o servidor/)).toBeTruthy();
    });
});

describe('ErrorBoundary', () => {
    it('mostra tela amigável em vez de quebrar o app', () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const Quebra = () => {
            throw new Error('bug');
        };
        render(
            <ErrorBoundary>
                <Quebra />
            </ErrorBoundary>,
        );
        expect(screen.getByText(/Algo deu errado nesta tela/)).toBeTruthy();
    });
});
