import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { fetchAvaliacao, fetchHistorico, fetchPonto, fetchPontos, fetchRegiao, fetchRelatos } from '../../api/praiometro';
import type { PontoDetalhe, PontoResumo } from '../../api/types';
import { axiosError, renderWithClient } from '../../test/render';
import Clima from '../Clima';
import Praia from '../Praia';
import Praias from '../Praias';

jest.mock('../../api/praiometro');

const mockPontos = fetchPontos as jest.Mock;
const mockPonto = fetchPonto as jest.Mock;
const mockAvaliacao = fetchAvaliacao as jest.Mock;
const mockHistorico = fetchHistorico as jest.Mock;
const mockRegiao = fetchRegiao as jest.Mock;

const resumo = (codigo: string, nome: string, balneabilidade: boolean | null, local = ''): PontoResumo => ({
    codigo,
    nome: [nome],
    specific_location: [local],
    coordenadas: null,
    coordenadas_terra: [-22.9, -43.1],
    ultima_leitura: '2026-11-16T14:00',
    balneabilidade,
});

const navigation = { navigate: jest.fn(), goBack: jest.fn() } as any;

beforeEach(() => {
    jest.clearAllMocks();
    mockHistorico.mockResolvedValue({ codigo: 'X', registros: [], total: 0, proprias: 0, percentual_proprio: null });
    mockRegiao.mockResolvedValue({ mare: null, sol: [] });
    (fetchRelatos as jest.Mock).mockResolvedValue({ disponivel: true, relatos: [] });
});

describe('Praias', () => {
    beforeEach(() => {
        mockPontos.mockResolvedValue([
            resumo('IC001', 'Praia de Icaraí', false, 'Rua Mariz e Barros'),
            resumo('GR000', 'Praia de Gragoatá', true),
            resumo('IC00', 'Praia de Icaraí', null, 'Praça Getúlio Vargas'),
        ]);
    });

    it('lista em ordem alfabética com status de balneabilidade', async () => {
        renderWithClient(<Praias navigation={navigation} route={{} as any} />);
        expect(await screen.findByText('3 pontos de coleta')).toBeTruthy();
        expect(screen.getByText('PRÓPRIA')).toBeTruthy();
        expect(screen.getByText('IMPRÓPRIA')).toBeTruthy();
        expect(screen.getByText('SEM DADOS')).toBeTruthy();
        const nomes = screen.getAllByText(/^Praia de/).map((n) => n.props.children);
        expect(nomes).toEqual(['Praia de Gragoatá', 'Praia de Icaraí', 'Praia de Icaraí']);
    });

    it('ordena ignorando o prefixo "Praia de/das"', async () => {
        mockPontos.mockResolvedValue([resumo('FC000', 'Praia das Flechas', true), resumo('AD000', 'Praia de Adão', true)]);
        renderWithClient(<Praias navigation={navigation} route={{} as any} />);
        await screen.findByText('2 pontos de coleta');
        expect(screen.getAllByText(/^Praia d/).map((n) => n.props.children)).toEqual(['Praia de Adão', 'Praia das Flechas']);
    });

    it('busca sem acentos e por localização', async () => {
        renderWithClient(<Praias navigation={navigation} route={{} as any} />);
        fireEvent.changeText(await screen.findByLabelText('Buscar praia'), 'getulio');
        expect(screen.getByText('1 ponto de coleta')).toBeTruthy();
        fireEvent.changeText(screen.getByLabelText('Buscar praia'), 'xyz');
        expect(screen.getByText('Nenhuma praia encontrada.')).toBeTruthy();
    });

    it('filtra somente próprias e navega ao tocar', async () => {
        renderWithClient(<Praias navigation={navigation} route={{} as any} />);
        fireEvent.press(await screen.findByText('Próprias'));
        expect(screen.getByText('1 ponto de coleta')).toBeTruthy();
        fireEvent.press(screen.getByText('Praia de Gragoatá'));
        expect(navigation.navigate).toHaveBeenCalledWith('Praia', { id: 'GR000' });
    });

    it('perto de mim ordena pela distância', async () => {
        mockPontos.mockResolvedValue([
            { ...resumo('IA000', 'Praia de Itacoatiara', true), coordenadas_terra: [-22.976, -43.031] },
            { ...resumo('IC001', 'Praia de Icaraí', true), coordenadas_terra: [-22.906, -43.112] },
        ]);
        renderWithClient(<Praias navigation={navigation} route={{} as any} />);
        fireEvent.press(await screen.findByText('Perto de mim'));
        expect((await screen.findAllByText(/^\d+ m · |^[\d,]+ km · /)).length).toBe(2);
        const nomes = screen.getAllByText(/^Praia de/).map((n) => n.props.children);
        expect(nomes).toEqual(['Praia de Icaraí', 'Praia de Itacoatiara']);
    });

    it('perto de mim sem permissão mostra aviso', async () => {
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied', canAskAgain: true });
        renderWithClient(<Praias navigation={navigation} route={{} as any} />);
        fireEvent.press(await screen.findByText('Perto de mim'));
        expect(await screen.findByText(/Permita o acesso à localização/)).toBeTruthy();
    });

    it('servidor fora do ar: mostra erro e tenta de novo', async () => {
        mockPontos.mockRejectedValueOnce(axiosError()).mockResolvedValueOnce([resumo('GR000', 'Praia de Gragoatá', true)]);
        renderWithClient(<Praias navigation={navigation} route={{} as any} />);
        expect(await screen.findByText(/Sem conexão/)).toBeTruthy();
        fireEvent.press(screen.getByText('Tentar novamente'));
        expect(await screen.findByText('1 ponto de coleta')).toBeTruthy();
    });
});

const detalhe = (leitura: PontoDetalhe['leitura_atual']): PontoDetalhe => ({
    nome: ['Praia de Icaraí'],
    specific_location: ['Praça Getúlio Vargas'],
    coordenadas_terra_decimais: [-22.9, -43.1],
    leitura_atual: leitura,
    previsao: [],
});

describe('Praia', () => {
    const rota = { params: { id: 'IC00' } } as any;

    it('balneabilidade desconhecida não aparece como imprópria', async () => {
        mockPonto.mockResolvedValue(detalhe({ timestamp: '2026-11-16T14:00', balneabilidade: null, wave_height: 0.5 }));
        mockAvaliacao.mockResolvedValue({ praia_id: 'IC00', avaliacao_media: null, total_avaliacoes: 0 });
        renderWithClient(<Praia route={rota} navigation={navigation} />);
        expect(await screen.findByText('Balneabilidade sem informação')).toBeTruthy();
        expect(screen.queryByText('Imprópria para banho')).toBeNull();
        expect(screen.getByText('MODERADO')).toBeTruthy();
    });

    it('alerta de chuva recente e dados ausentes não quebram a tela', async () => {
        mockPonto.mockResolvedValue(detalhe({ choveu_8_horas: true, balneabilidade: true }));
        mockAvaliacao.mockRejectedValue(axiosError(503, 'fora'));
        renderWithClient(<Praia route={rota} navigation={navigation} />);
        expect(await screen.findByText(/Choveu nas últimas horas/)).toBeTruthy();
        expect(screen.getByText('Própria para banho')).toBeTruthy();
        expect(await screen.findByText(/Não foi possível carregar as avaliações/)).toBeTruthy();
    });

    it('praia inexistente (404) mostra a mensagem do servidor', async () => {
        mockPonto.mockRejectedValue(axiosError(404, 'Praia não encontrada'));
        mockAvaliacao.mockRejectedValue(axiosError(404, 'Praia não encontrada'));
        renderWithClient(<Praia route={rota} navigation={navigation} />);
        expect(await screen.findByText('Praia não encontrada')).toBeTruthy();
    });

    it('praia da baía não mostra altura de onda do modelo', async () => {
        mockPonto.mockResolvedValue({
            ...detalhe({ balneabilidade: true, balneabilidade_data: '2026-11-12', wave_height: 1.02, wave_period: 9.3 }),
            mar: 'baia',
        });
        mockAvaliacao.mockResolvedValue({ praia_id: 'IC00', avaliacao_media: null });
        renderWithClient(<Praia route={rota} navigation={navigation} />);
        expect(await screen.findByText('Águas abrigadas')).toBeTruthy();
        expect(screen.getByText('MAR DE BAÍA')).toBeTruthy();
        expect(screen.queryByText('1,0')).toBeNull();
        expect(screen.getByText(/Boletim do INEA de 12\/11/)).toBeTruthy();
    });

    it('praia oceânica mostra a altura de onda', async () => {
        mockPonto.mockResolvedValue({ ...detalhe({ balneabilidade: true, wave_height: 1.2 }), mar: 'oceanico' });
        mockAvaliacao.mockResolvedValue({ praia_id: 'IA000', avaliacao_media: null });
        renderWithClient(<Praia route={rota} navigation={navigation} />);
        expect(await screen.findByText('1,2')).toBeTruthy();
        expect(screen.queryByText('Águas abrigadas')).toBeNull();
    });

    it('mostra temperatura da água e histórico', async () => {
        mockPonto.mockResolvedValue({ ...detalhe({ balneabilidade: true, sea_surface_temperature: 24.9, uv_index: 7 }), mar: 'oceanico' });
        mockAvaliacao.mockResolvedValue({ praia_id: 'IC00', avaliacao_media: null });
        mockHistorico.mockResolvedValue({
            codigo: 'IC00',
            registros: [
                { data: '2026-11-05', propria: true },
                { data: '2026-11-09', propria: false },
                { data: '2026-11-12', propria: true },
            ],
            total: 3,
            proprias: 2,
            percentual_proprio: 66.7,
        });
        renderWithClient(<Praia route={rota} navigation={navigation} />);
        expect(await screen.findByText('25°')).toBeTruthy();
        expect(await screen.findByText('67% própria')).toBeTruthy();
        expect(screen.getByText('TEMPERATURA DA ÁGUA')).toBeTruthy();
        // UV é regional: fica só na aba Clima
        expect(screen.queryByText('ÍNDICE UV')).toBeNull();
    });

    it('botão voltar', async () => {
        mockPonto.mockResolvedValue(detalhe({ balneabilidade: true }));
        mockAvaliacao.mockResolvedValue({ praia_id: 'IC00', avaliacao_media: null });
        renderWithClient(<Praia route={rota} navigation={navigation} />);
        fireEvent.press(await screen.findByLabelText('Voltar'));
        expect(navigation.goBack).toHaveBeenCalled();
    });
});

describe('Clima', () => {
    it('renderiza temperatura, condição e UV', async () => {
        mockPonto.mockResolvedValue(
            detalhe({ timestamp: '2026-11-16T14:00', temperature_2m: 30.6, apparent_temperature: 33, relative_humidity_2m: 51, uv_index: 1.15, weather_code: 3 }),
        );
        renderWithClient(<Clima />);
        expect(await screen.findByText('31°')).toBeTruthy();
        expect(screen.getByText('Nublado')).toBeTruthy();
        expect(screen.getByText(/Umidade 51%/)).toBeTruthy();
        expect(screen.getByText('BAIXO')).toBeTruthy();
    });

    it('mostra sol e maré', async () => {
        jest.useFakeTimers({ now: new Date(Date.UTC(2026, 10, 16, 18, 30)), doNotFake: ['setTimeout', 'setInterval', 'setImmediate', 'nextTick', 'queueMicrotask'] });
        mockPonto.mockResolvedValue(detalhe({ temperature_2m: 25, weather_code: 0 }));
        mockRegiao.mockResolvedValue({
            mare: { serie: [], extremos: [{ hora: '2026-11-16T17:40', nivel: 0.17, tipo: 'alta' }] },
            sol: [{ data: '2026-11-16', nascer: '2026-11-16T05:00', por: '2026-11-16T18:14' }],
        });
        renderWithClient(<Clima />);
        expect(await screen.findByText('Enchendo')).toBeTruthy();
        expect(screen.getByText('Alta às 17:40')).toBeTruthy();
        expect(screen.getByText('18:14')).toBeTruthy();
        jest.useRealTimers();
    });

    it('timeout mostra mensagem específica', async () => {
        mockPonto.mockRejectedValue(axiosError(undefined, undefined, 'ECONNABORTED'));
        renderWithClient(<Clima />);
        await waitFor(() => expect(screen.getByText(/demorou para responder/)).toBeTruthy());
    });
});
