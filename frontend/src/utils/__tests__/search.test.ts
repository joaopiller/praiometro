import type { PontoResumo } from '../../api/types';
import { localEspecifico, matchesBeach, nomePrincipal, normalize } from '../search';

const ponto = (nome: string[], specific_location: string[] = ['']): PontoResumo => ({
    codigo: 'X',
    nome,
    specific_location,
    coordenadas: null,
    coordenadas_terra: null,
    ultima_leitura: null,
    balneabilidade: null,
});

describe('busca', () => {
    it('ignora acentos e maiúsculas', () => {
        expect(normalize('  Icaraí ')).toBe('icarai');
        expect(matchesBeach(ponto(['Praia de Icaraí']), 'ICARAI')).toBe(true);
    });

    it('busca em nomes alternativos e localização', () => {
        const p = ponto(['Praia de Piratininga', 'Prainha'], ['Avenida Doutor Acúrcio Torres']);
        expect(matchesBeach(p, 'prainha')).toBe(true);
        expect(matchesBeach(p, 'acurcio')).toBe(true);
        expect(matchesBeach(p, 'itaipu')).toBe(false);
        expect(matchesBeach(p, '')).toBe(true);
    });

    it('nome e local padrão', () => {
        expect(nomePrincipal(ponto([]))).toBe('Praia');
        expect(localEspecifico(ponto(['A'], ['', 'Rua X']))).toBe('Rua X');
        expect(localEspecifico(ponto(['A']))).toBe('');
    });
});
