import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { fetchAvaliacao, fetchHistorico, fetchPonto, fetchPraia, fetchPraias, fetchRegiao, fetchRelatos } from '../../api/praiometro';
import type { PontoDaPraia, PontoDetalhe, PraiaDetalhe, PraiaResumo } from '../../api/types';
import { axiosError, renderWithClient } from '../../test/render';
import Clima from '../Clima';
import Praia from '../Praia';
import Praias from '../Praias';

jest.mock('../../api/praiometro');

const mockPraias = fetchPraias as jest.Mock;
const mockPraia = fetchPraia as jest.Mock;
const mockPonto = fetchPonto as jest.Mock;
const mockAvaliacao = fetchAvaliacao as jest.Mock;
const mockHistorico = fetchHistorico as jest.Mock;
const mockRegiao = fetchRegiao as jest.Mock;

const navigation = { navigate: jest.fn(), goBack: jest.fn() } as any;

beforeEach(() => {
    jest.clearAllMocks();
    mockHistorico.mockResolvedValue({ codigo: 'X', registros: [], total: 0, proprias: 0, percentual_proprio: null });
    mockRegiao.mockResolvedValue({ mare: null, sol: [] });
    (fetchRelatos as jest.Mock).mockResolvedValue({ disponivel: true, relatos: [] });
});

const trecho = (codigo: string, balneabilidade: boolean | null, local = '', coords: [number, number] = [-22.9, -43.1]): PontoDaPraia => ({
    codigo,
    local,
    coordenadas: null,
    coordenadas_terra: coords,
    balneabilidade,
    balneabilidade_data: '2026-11-12',
});

const praia = (
    id: string,
    nome: string,
    pontos: PontoDaPraia[],
    centro: [number, number] = [-22.9, -43.1],
    cidade: PraiaResumo['cidade'] = 'niteroi',
    bairro = '',
): PraiaResumo => {
    const valores = pontos.map((p) => p.balneabilidade).filter((v) => v !== null);
    const proprios = valores.filter(Boolean).length;
    return {
        id,
        ordem: 0,
        nome,
        cidade,
        bairro,
        principal: pontos[0].codigo,
        centro,
        mar: 'baia',
        situacao: !valores.length ? 'sem_dados' : proprios === valores.length ? 'propria' : proprios ? 'parcial' : 'impropria',
        pontos_proprios: proprios,
        pontos_com_dados: valores.length,
        balneabilidade_data: '2026-11-12',
        ultima_leitura: '2026-11-16T14:00',
        pontos,
    };
};

const ICARAI = praia(
    'IC',
    'Praia de Icaraí',
    [trecho('IC00', true, 'Praça Getúlio Vargas'), trecho('IC001', false, 'Rua Mariz e Barros')],
    undefined,
    'niteroi',
    'Icaraí',
);
const GRAGOATA = praia('GR', 'Praia de Gragoatá', [trecho('GR000', true)], undefined, 'niteroi', 'Gragoatá');
const ADAO = praia('AD', 'Praia de Adão', [trecho('AD000', null)], undefined, 'niteroi', 'Jurujuba');
const COPACABANA = praia('copacabana', 'Praia de Copacabana', [trecho('CP004', true, 'Rua Sousa Lima')], [-22.97, -43.18], 'rio', 'Copacabana');

describe('Praias', () => {
    beforeEach(() => {
        mockPraias.mockResolvedValue([ICARAI, COPACABANA, GRAGOATA, ADAO]);
    });

    it('separa por cidade, em ordem alfabética, dizendo se dá para tomar banho', async () => {
        renderWithClient(<Praias navigation={navigation} route={{} as any} />);
        expect(await screen.findByText('Niterói')).toBeTruthy();
        expect(screen.getByText('3 praias')).toBeTruthy();
        expect(screen.getByText('Rio de Janeiro')).toBeTruthy();
        expect(screen.getByText('1 praia')).toBeTruthy();
        expect(screen.getByText('Parcialmente própria')).toBeTruthy();
        // dois selos e o filtro
        expect(screen.getAllByText('Própria para banho')).toHaveLength(3);
        expect(screen.getByText('Sem boletim recente')).toBeTruthy();
        expect(screen.getByText('Icaraí, Niterói')).toBeTruthy();
        expect(screen.getByText('Copacabana, Rio de Janeiro')).toBeTruthy();
        const nomes = screen.getAllByText(/^Praia d/).map((n) => n.props.children);
        expect(nomes).toEqual(['Praia de Adão', 'Praia de Gragoatá', 'Praia de Icaraí', 'Praia de Copacabana']);
    });

    it('busca sem acentos, também pelo nome de um trecho', async () => {
        renderWithClient(<Praias navigation={navigation} route={{} as any} />);
        fireEvent.changeText(await screen.findByLabelText('Buscar praia'), 'getulio');
        expect(screen.getByText('1 praia')).toBeTruthy();
        expect(screen.getByText('Praia de Icaraí')).toBeTruthy();
        expect(screen.queryByText('Rio de Janeiro')).toBeNull();
        fireEvent.changeText(screen.getByLabelText('Buscar praia'), 'xyz');
        expect(screen.getByText('Nenhuma praia encontrada.')).toBeTruthy();
    });

    it('"Própria para banho" inclui as que estão boas só em parte e navega ao tocar', async () => {
        renderWithClient(<Praias navigation={navigation} route={{} as any} />);
        fireEvent.press((await screen.findAllByText('Própria para banho'))[0]);
        expect(screen.getByText('2 praias')).toBeTruthy();
        expect(screen.queryByText('Praia de Adão')).toBeNull();
        fireEvent.press(screen.getByText('Praia de Gragoatá'));
        expect(navigation.navigate).toHaveBeenCalledWith('Praia', { id: 'GR' });
    });

    it('perto de mim ordena pela parte mais próxima da praia', async () => {
        mockPraias.mockResolvedValue([
            praia('IA', 'Praia de Itacoatiara', [trecho('IA000', true, '', [-22.976, -43.031])], [-22.976, -43.031]),
            praia('IC', 'Praia de Icaraí', [trecho('IC00', true, '', [-22.906, -43.112])], [-22.906, -43.112]),
        ]);
        renderWithClient(<Praias navigation={navigation} route={{} as any} />);
        fireEvent.press(await screen.findByText('Perto de mim'));
        expect((await screen.findAllByText(/^\d+ m · |^[\d,]+ km · /)).length).toBe(2);
        // em ordem de distância as cidades se misturam: sem títulos de seção
        expect(screen.queryByText('Niterói')).toBeNull();
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
        mockPraias.mockRejectedValueOnce(axiosError()).mockResolvedValueOnce([GRAGOATA]);
        renderWithClient(<Praias navigation={navigation} route={{} as any} />);
        expect(await screen.findByText(/Sem conexão/)).toBeTruthy();
        fireEvent.press(screen.getByText('Tentar novamente'));
        expect(await screen.findByText('1 praia')).toBeTruthy();
    });
});

const detalhe = (leitura: PraiaDetalhe['leitura_atual'], base: PraiaResumo = GRAGOATA): PraiaDetalhe => {
    const b = leitura?.balneabilidade;
    const pontos = base.pontos.length === 1 ? [{ ...base.pontos[0], balneabilidade: b ?? null }] : base.pontos;
    return { ...praia(base.id, base.nome, pontos), leitura_atual: leitura, previsao: [] };
};

describe('Praia', () => {
    const rota = { params: { id: 'GR' } } as any;

    beforeEach(() => mockAvaliacao.mockResolvedValue({ praia_id: 'GR', avaliacao_media: null, total_avaliacoes: 0 }));

    it('balneabilidade desconhecida não aparece como imprópria', async () => {
        mockPraia.mockResolvedValue(detalhe({ timestamp: '2026-11-16T14:00', balneabilidade: null, wave_height: 0.5 }));
        renderWithClient(<Praia route={rota} navigation={navigation} />);
        expect(await screen.findByText('Sem informação sobre o banho')).toBeTruthy();
        expect(screen.queryByText('Imprópria para banho')).toBeNull();
        // praia de um trecho só não mostra a lista de trechos
        expect(screen.queryByText('BANHO POR TRECHO')).toBeNull();
    });

    it('praia boa só em parte lista os trechos e troca o histórico ao tocar', async () => {
        mockPraia.mockResolvedValue(detalhe({ balneabilidade: true }, ICARAI));
        renderWithClient(<Praia route={{ params: { id: 'IC' } } as any} navigation={navigation} />);
        expect(await screen.findByText('Parcialmente própria')).toBeTruthy();
        expect(screen.getByText(/Própria para banho em \d de \d trechos/)).toBeTruthy();
        expect(screen.getByText('BANHO POR TRECHO')).toBeTruthy();
        expect(screen.getByLabelText('Rua Mariz e Barros: Imprópria para banho')).toBeTruthy();
        await waitFor(() => expect(mockHistorico).toHaveBeenCalledWith('IC00'));
        fireEvent.press(screen.getByText('Rua Mariz e Barros'));
        await waitFor(() => expect(mockHistorico).toHaveBeenCalledWith('IC001'));
    });

    it('ao trocar de trecho o cartão do histórico continua na tela', async () => {
        const comColetas = {
            codigo: 'IC00',
            registros: [{ data: '2026-11-12', propria: true }],
            total: 1,
            proprias: 1,
            percentual_proprio: 100,
        };
        mockPraia.mockResolvedValue(detalhe({ balneabilidade: true }, ICARAI));
        mockHistorico.mockImplementation(async (codigo: string) =>
            codigo === 'IC00' ? comColetas : { codigo, registros: [], total: 0, proprias: 0, percentual_proprio: null },
        );
        renderWithClient(<Praia route={{ params: { id: 'IC' } } as any} navigation={navigation} />);
        expect(await screen.findByText('100% própria')).toBeTruthy();
        fireEvent.press(screen.getByText('Rua Mariz e Barros'));
        expect(await screen.findByText(/Sem coletas registradas · Rua Mariz e Barros/)).toBeTruthy();
        expect(screen.getByText('BANHO NAS ÚLTIMAS COLETAS')).toBeTruthy();
    });

    it('enquanto os detalhes não chegam, abre com o que a lista já sabe', async () => {
        mockPraias.mockResolvedValue([ICARAI]);
        mockPraia.mockReturnValue(new Promise(() => {}));
        renderWithClient(<Praia route={{ params: { id: 'IC' } } as any} navigation={navigation} />);
        expect(await screen.findByText('Praia de Icaraí')).toBeTruthy();
        expect(screen.getByText('Parcialmente própria')).toBeTruthy();
        expect(screen.getByText('BANHO POR TRECHO')).toBeTruthy();
        expect(screen.getByText(/Carregando ondas, vento/)).toBeTruthy();
        expect(screen.queryByText('ONDAS')).toBeNull();
    });

    it('se os detalhes falham, fica o resumo com o aviso de que não atualizou', async () => {
        mockPraias.mockResolvedValue([ICARAI]);
        mockPraia.mockRejectedValue(axiosError(undefined, undefined, 'ECONNABORTED'));
        renderWithClient(<Praia route={{ params: { id: 'IC' } } as any} navigation={navigation} />);
        expect(await screen.findByText(/Não foi possível atualizar agora/)).toBeTruthy();
        expect(screen.getByText('Praia de Icaraí')).toBeTruthy();
        expect(screen.queryByText(/Carregando ondas, vento/)).toBeNull();
    });

    it('vindo do mapa, abre já no trecho escolhido', async () => {
        mockPraia.mockResolvedValue(detalhe({ balneabilidade: true }, ICARAI));
        renderWithClient(<Praia route={{ params: { id: 'IC', trecho: 'IC001' } } as any} navigation={navigation} />);
        await waitFor(() => expect(mockHistorico).toHaveBeenCalledWith('IC001'));
        expect(mockHistorico).not.toHaveBeenCalledWith('IC00');
    });

    it('a página já aberta muda de trecho quando o mapa manda outro', async () => {
        mockPraia.mockResolvedValue(detalhe({ balneabilidade: true }, ICARAI));
        const { rerender } = renderWithClient(
            <Praia route={{ params: { id: 'IC', trecho: 'IC001' } } as any} navigation={navigation} />,
        );
        await waitFor(() => expect(mockHistorico).toHaveBeenCalledWith('IC001'));
        rerender(<Praia route={{ params: { id: 'IC', trecho: 'IC00' } } as any} navigation={navigation} />);
        await waitFor(() => expect(mockHistorico).toHaveBeenCalledWith('IC00'));
    });

    it('alerta de chuva recente e dados ausentes não quebram a tela', async () => {
        mockPraia.mockResolvedValue(detalhe({ choveu_8_horas: true, balneabilidade: true }));
        mockAvaliacao.mockRejectedValue(axiosError(503, 'fora'));
        renderWithClient(<Praia route={rota} navigation={navigation} />);
        expect(await screen.findByText(/Choveu nas últimas horas/)).toBeTruthy();
        expect(screen.getByText('Própria para banho')).toBeTruthy();
        expect(await screen.findByText(/Não foi possível carregar as avaliações/)).toBeTruthy();
    });

    it('praia inexistente (404) mostra a mensagem do servidor', async () => {
        mockPraia.mockRejectedValue(axiosError(404, 'Praia não encontrada'));
        mockAvaliacao.mockRejectedValue(axiosError(404, 'Praia não encontrada'));
        renderWithClient(<Praia route={rota} navigation={navigation} />);
        expect(await screen.findByText('Praia não encontrada')).toBeTruthy();
    });

    it('praia da baía não mostra altura de onda do modelo', async () => {
        mockPraia.mockResolvedValue({
            ...detalhe({ balneabilidade: true, balneabilidade_data: '2026-11-12', wave_height: 1.02, wave_period: 9.3 }),
            mar: 'baia',
        });
        renderWithClient(<Praia route={rota} navigation={navigation} />);
        expect(await screen.findByText('Águas abrigadas')).toBeTruthy();
        expect(screen.getByText('Mar de baía')).toBeTruthy();
        expect(screen.queryByText('1,0')).toBeNull();
        expect(screen.getByText(/Boletim do INEA de 12\/11/)).toBeTruthy();
    });

    it('praia oceânica mostra a altura de onda', async () => {
        mockPraia.mockResolvedValue({ ...detalhe({ balneabilidade: true, wave_height: 1.2 }), mar: 'oceanico' });
        renderWithClient(<Praia route={rota} navigation={navigation} />);
        expect(await screen.findByText('1,2')).toBeTruthy();
        expect(screen.queryByText('Águas abrigadas')).toBeNull();
    });

    it('mostra temperatura da água e histórico', async () => {
        mockPraia.mockResolvedValue({ ...detalhe({ balneabilidade: true, sea_surface_temperature: 24.9, uv_index: 7 }), mar: 'oceanico' });
        mockHistorico.mockResolvedValue({
            codigo: 'GR000',
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
        mockPraia.mockResolvedValue(detalhe({ balneabilidade: true }));
        renderWithClient(<Praia route={rota} navigation={navigation} />);
        fireEvent.press(await screen.findByLabelText('Voltar'));
        expect(navigation.goBack).toHaveBeenCalled();
    });
});

const detalhePonto = (leitura: PontoDetalhe['leitura_atual']): PontoDetalhe => ({
    nome: ['Praia de Icaraí'],
    specific_location: ['Praça Getúlio Vargas'],
    coordenadas_terra_decimais: [-22.9, -43.1],
    leitura_atual: leitura,
    previsao: [],
});

describe('Clima', () => {
    it('renderiza temperatura, condição e UV', async () => {
        mockPonto.mockResolvedValue(
            detalhePonto({ timestamp: '2026-11-16T14:00', temperature_2m: 30.6, apparent_temperature: 33, relative_humidity_2m: 51, uv_index: 1.15, weather_code: 3 }),
        );
        renderWithClient(<Clima />);
        expect(await screen.findByText('31°')).toBeTruthy();
        expect(screen.getByText('Nublado')).toBeTruthy();
        expect(screen.getByText(/Umidade 51%/)).toBeTruthy();
        expect(screen.getByText('Baixo')).toBeTruthy();
    });

    it('mostra sol e maré', async () => {
        jest.useFakeTimers({ now: new Date(Date.UTC(2026, 10, 16, 18, 30)), doNotFake: ['setTimeout', 'setInterval', 'setImmediate', 'nextTick', 'queueMicrotask'] });
        mockPonto.mockResolvedValue(detalhePonto({ temperature_2m: 25, weather_code: 0 }));
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

    it('troca entre centro e Região Oceânica', async () => {
        mockPonto.mockImplementation(async (codigo: string) =>
            detalhePonto({ timestamp: '2026-11-16T14:00', temperature_2m: codigo === 'PR001' ? 27 : 29, weather_code: 0 }),
        );
        renderWithClient(<Clima />);
        expect(await screen.findByText('29°')).toBeTruthy();
        fireEvent.press(screen.getByText('Região Oceânica'));
        expect(await screen.findByText('27°')).toBeTruthy();
        expect(mockPonto).toHaveBeenCalledWith('PR001');
        fireEvent.press(screen.getByText('Centro e baía'));
        expect(await screen.findByText('29°')).toBeTruthy();
    });

    it('timeout mostra mensagem específica', async () => {
        mockPonto.mockRejectedValue(axiosError(undefined, undefined, 'ECONNABORTED'));
        renderWithClient(<Clima />);
        await waitFor(() => expect(screen.getByText(/não respondeu/)).toBeTruthy());
    });
});
