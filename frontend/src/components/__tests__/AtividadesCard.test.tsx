import { MaterialCommunityIcons } from '@expo/vector-icons';
import { render, screen } from '@testing-library/react-native';
import { readFileSync } from 'fs';
import { join } from 'path';
import AtividadesCard, { ICONES_DE_ATIVIDADE } from '../AtividadesCard';

describe('AtividadesCard', () => {
    it('cada desenho existe, inclusive os que o arquivo de atividades do servidor usa', () => {
        for (const icone of Object.values(ICONES_DE_ATIVIDADE)) expect(MaterialCommunityIcons.glyphMap).toHaveProperty(icone);
        const arquivo = join(__dirname, '../../../../backend/praiometro/dados/atividades.json');
        const dados: Record<string, { atividades: { icone: string }[] }> = JSON.parse(readFileSync(arquivo, 'utf-8'));
        for (const { atividades } of Object.values(dados)) {
            for (const { icone } of atividades) expect(ICONES_DE_ATIVIDADE).toHaveProperty(icone);
        }
    });

    it('lista as atividades e diz por que a praia é boa para crianças', () => {
        render(
            <AtividadesCard
                atividades={[
                    { nome: 'Surfe', icone: 'surfe' },
                    { nome: 'Canoa havaiana', icone: 'remo' },
                ]}
                criancas="Mar calmo no canto da praia."
            />,
        );
        expect(screen.getByText('ATIVIDADES')).toBeTruthy();
        expect(screen.getByText('Surfe')).toBeTruthy();
        expect(screen.getByText('Canoa havaiana')).toBeTruthy();
        expect(screen.getByText('Boa para crianças')).toBeTruthy();
        expect(screen.getByText('Mar calmo no canto da praia.')).toBeTruthy();
    });

    it('sem indicação para crianças, mostra só as atividades', () => {
        render(<AtividadesCard atividades={[{ nome: 'Surfe', icone: 'surfe' }]} criancas={null} />);
        expect(screen.getByText('Surfe')).toBeTruthy();
        expect(screen.queryByText('Boa para crianças')).toBeNull();
    });

    it('praia sem nada que se destaque não ganha o cartão', () => {
        const { toJSON } = render(<AtividadesCard atividades={[]} criancas={null} />);
        expect(toJSON()).toBeNull();
    });
});
