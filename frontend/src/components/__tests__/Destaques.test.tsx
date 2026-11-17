import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Destaque } from '../../api/types';
import Destaques, { ICONE_PADRAO, ICONES } from '../Destaques';

// ícones que a página da praia já usa em outros cartões (medidas, relatos, trechos, avaliação)
const JA_NA_PAGINA = [
    'waves',
    'weather-windy',
    'weather-pouring',
    'coolant-temperature',
    'navigation',
    'map-marker-multiple-outline',
    'bullhorn-outline',
    'account-voice',
    'account-group',
    'jellyfish',
    'flag-variant',
    'beach',
    'trash-can-outline',
    'water-check',
    'water-opacity',
    'information',
    'star-plus',
    'star-shooting-outline',
    'check-circle',
    'close-circle',
    'help-circle',
    'alert-circle',
];

const aviso: Destaque = { tipo: 'atencao', icone: 'mar-forte', texto: 'Mar forte, com correnteza.' };
const curiosidade: Destaque = { tipo: 'curiosidade', icone: 'trilha', texto: 'A trilha do Costão sai da ponta da praia.' };
const dica: Destaque = { tipo: 'dica', icone: 'surfe', texto: 'Um dos picos de surfe mais conhecidos do estado.' };

describe('Destaques', () => {
    afterEach(() => jest.restoreAllMocks());

    it('cada desenho existe e nenhum repete um ícone que a página já usa', () => {
        const usados = [...Object.values(ICONES), ICONE_PADRAO];
        for (const icone of usados) expect(MaterialCommunityIcons.glyphMap).toHaveProperty(icone);
        expect(usados.filter((i) => JA_NA_PAGINA.includes(i))).toEqual([]);
        // um desenho para cada assunto: dois destaques na mesma praia não ficam com o mesmo ícone
        expect(new Set(usados).size).toBe(usados.length);
    });

    it('praia sem destaque não mostra nada', () => {
        expect(render(<Destaques destaques={[]} />).toJSON()).toBeNull();
    });

    it('o aviso aparece sempre, junto com uma curiosidade', () => {
        render(<Destaques destaques={[aviso, curiosidade]} />);
        expect(screen.getByText('ATENÇÃO')).toBeTruthy();
        expect(screen.getByText(aviso.texto)).toBeTruthy();
        expect(screen.getByText('VOCÊ SABIA?')).toBeTruthy();
        expect(screen.queryByText('Toque para ver outra')).toBeNull();
    });

    it('com várias curiosidades mostra uma por vez e troca ao toque; o aviso continua', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0);
        render(<Destaques destaques={[aviso, curiosidade, dica]} />);
        expect(screen.getByText(curiosidade.texto)).toBeTruthy();
        expect(screen.queryByText(dica.texto)).toBeNull();
        fireEvent.press(screen.getByText('Toque para ver outra'));
        expect(screen.getByText(dica.texto)).toBeTruthy();
        expect(screen.getByText('DICA')).toBeTruthy();
        expect(screen.queryByText(curiosidade.texto)).toBeNull();
        expect(screen.getByText(aviso.texto)).toBeTruthy();
    });

    it('começa por uma curiosidade sorteada', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.99);
        render(<Destaques destaques={[curiosidade, dica]} />);
        expect(screen.getByText(dica.texto)).toBeTruthy();
    });

    it('desenho desconhecido usa o ícone padrão em vez de quebrar', () => {
        render(<Destaques destaques={[{ ...curiosidade, icone: 'algo-novo' }]} />);
        expect(screen.getByText(curiosidade.texto)).toBeTruthy();
    });
});
