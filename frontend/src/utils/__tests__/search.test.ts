import { praiaDeTeste, trecho } from '../../test/praias';
import { buscaPraia, nomeCurto, nomeDoTrecho, normalize } from '../search';

describe('busca', () => {
    it('ignora acentos e maiúsculas', () => {
        expect(normalize('  Icaraí ')).toBe('icarai');
        expect(buscaPraia(praiaDeTeste('IC', 'Praia de Icaraí', [trecho('IC00')]), 'ICARAI')).toBe(true);
    });

    it('acha a praia pelo nome de um trecho', () => {
        const p = praiaDeTeste('PR', 'Praia de Piratininga', [trecho('PR000', 'Avenida Doutor Acúrcio Torres'), trecho('PR001')]);
        expect(buscaPraia(p, 'acurcio')).toBe(true);
        expect(buscaPraia(p, 'itaipu')).toBe(false);
        expect(buscaPraia(p, '')).toBe(true);
    });

    it('acha as praias pelo bairro e pela cidade', () => {
        const adao = { ...praiaDeTeste('AD', 'Praia de Adão', [trecho('AD000')]), bairro: 'Jurujuba' };
        const leme = { ...praiaDeTeste('leme', 'Praia do Leme', [trecho('LM002')]), cidade: 'rio' as const, bairro: 'Leme' };
        expect(buscaPraia(adao, 'jurujuba')).toBe(true);
        expect(buscaPraia(adao, 'niteroi')).toBe(true);
        expect(buscaPraia(leme, 'Rio de Janeiro')).toBe(true);
        expect(buscaPraia(leme, 'rio')).toBe(true);
        expect(buscaPraia(adao, 'rio de janeiro')).toBe(false);
    });

    it('nomes curtos e de trecho', () => {
        expect(nomeCurto('Praia das Flechas')).toBe('Flechas');
        expect(nomeCurto('Praia do Sossego')).toBe('Sossego');
        expect(nomeDoTrecho(trecho('X', 'Rua X'))).toBe('Rua X');
        expect(nomeDoTrecho(trecho('X'))).toBe('Trecho principal');
    });
});
