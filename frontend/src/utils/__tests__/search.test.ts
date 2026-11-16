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

    it('nomes curtos e de trecho', () => {
        expect(nomeCurto('Praia das Flechas')).toBe('Flechas');
        expect(nomeCurto('Praia do Sossego')).toBe('Sossego');
        expect(nomeDoTrecho(trecho('X', 'Rua X'))).toBe('Rua X');
        expect(nomeDoTrecho(trecho('X'))).toBe('Trecho principal');
    });
});
