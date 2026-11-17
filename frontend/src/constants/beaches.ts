import type { ImageSourcePropType } from 'react-native';

interface Foto {
    imagem: ImageSourcePropType;
    credito: string;
}

const rafael = 'Rafael Lucio Carvalho (CC BY 4.0)';
const commons = (autor: string, licenca: string) => `${autor} via Wikimedia Commons (${licenca})`;
const marinelson = commons('Marinelson Almeida', 'CC BY 2.0');
const soldon = commons('Rodrigo Soldon', 'CC BY 2.0');
const mteixeira = commons('Mteixeira62', 'CC BY-SA 3.0');

// fotos pelo id da praia: em Niterói, o prefixo dos códigos (IC003 → IC)
const FOTOS: Record<string, Foto> = {
    AD: { imagem: require('../../assets/images/praias/adao.jpg'), credito: commons('Marcio Sette', 'CC BY-SA 3.0') },
    EA: { imagem: require('../../assets/images/praias/eva.jpg'), credito: commons('Marcio Sette', 'CC BY-SA 3.0') },
    BV: { imagem: require('../../assets/images/praias/boaviagem.jpg'), credito: rafael },
    CH: { imagem: require('../../assets/images/praias/charitas.jpg'), credito: commons('Marcusmansur', 'domínio público') },
    CM: { imagem: require('../../assets/images/praias/camboinhas.jpg'), credito: soldon },
    FC: { imagem: require('../../assets/images/praias/flechas.jpg'), credito: rafael },
    GR: { imagem: require('../../assets/images/praias/gragoata.jpg'), credito: rafael },
    IA: { imagem: require('../../assets/images/praias/itacoatiara.jpg'), credito: 'Arleyramos via Wikimedia Commons (CC BY-SA 3.0)' },
    IC: { imagem: require('../../assets/images/praias/icarai.webp'), credito: 'João Piller (CC BY 4.0)' },
    II: { imagem: require('../../assets/images/praias/itaipu.jpg'), credito: 'Maria Fátima Leite via Wikimedia Commons (CC BY-SA 4.0)' },
    JR: { imagem: require('../../assets/images/praias/jurujuba.jpg'), credito: marinelson },
    PR: { imagem: require('../../assets/images/praias/piratininga.jpg'), credito: marinelson },
    SF: { imagem: require('../../assets/images/praias/saofrancisco.jpg'), credito: marinelson },
    SG: { imagem: require('../../assets/images/praias/sossego.jpg'), credito: 'Carlos Lopes via Wikimedia Commons (CC BY 2.0)' },
    // Rio de Janeiro
    'barra-de-guaratiba': { imagem: require('../../assets/images/praias/rio/barra-de-guaratiba.jpg'), credito: commons('Matheus Caires', 'CC BY-SA 4.0') },
    grumari: { imagem: require('../../assets/images/praias/rio/grumari.jpg'), credito: marinelson },
    prainha: { imagem: require('../../assets/images/praias/rio/prainha.jpg'), credito: commons('Themium', 'CC0') },
    pontal: { imagem: require('../../assets/images/praias/rio/pontal.jpg'), credito: commons('Diego Baravelli', 'CC BY-SA 4.0') },
    recreio: { imagem: require('../../assets/images/praias/rio/recreio.jpg'), credito: commons('Halley Pacheco de Oliveira', 'CC BY-SA 4.0') },
    reserva: { imagem: require('../../assets/images/praias/rio/reserva.jpg'), credito: commons('Cresnick', 'CC BY-SA 4.0') },
    barra: { imagem: require('../../assets/images/praias/rio/barra.jpg'), credito: commons('Rafael Rabello de Barros', 'CC BY-SA 3.0') },
    joatinga: { imagem: require('../../assets/images/praias/rio/joatinga.jpg'), credito: soldon },
    pepino: { imagem: require('../../assets/images/praias/rio/pepino.jpg'), credito: commons('VinnyWiki', 'CC BY-SA 4.0') },
    'sao-conrado': { imagem: require('../../assets/images/praias/rio/sao-conrado.jpg'), credito: commons('Ricardo Haleck', 'CC BY-SA 3.0') },
    vidigal: { imagem: require('../../assets/images/praias/rio/vidigal.jpg'), credito: commons('VinnyWiki', 'CC BY-SA 4.0') },
    leblon: { imagem: require('../../assets/images/praias/rio/leblon.jpg'), credito: soldon },
    ipanema: { imagem: require('../../assets/images/praias/rio/ipanema.jpg'), credito: commons('Sandro Vox', 'CC BY-SA 4.0') },
    arpoador: { imagem: require('../../assets/images/praias/rio/arpoador.jpg'), credito: commons('VinnyWiki', 'CC BY-SA 4.0') },
    diabo: { imagem: require('../../assets/images/praias/rio/diabo.jpg'), credito: commons('Fatima Rodrigues', 'CC BY 3.0') },
    copacabana: { imagem: require('../../assets/images/praias/rio/copacabana.jpg'), credito: mteixeira },
    leme: { imagem: require('../../assets/images/praias/rio/leme.jpg'), credito: mteixeira },
    vermelha: { imagem: require('../../assets/images/praias/rio/vermelha.jpg'), credito: commons('André Gomes de Melo', 'CC BY 2.0 BR') },
    urca: { imagem: require('../../assets/images/praias/rio/urca.jpg'), credito: commons('Diego Baravelli', 'CC BY-SA 4.0') },
    botafogo: { imagem: require('../../assets/images/praias/rio/botafogo.jpg'), credito: commons('Cornelius Kibelka', 'CC BY-SA 2.0') },
    flamengo: { imagem: require('../../assets/images/praias/rio/flamengo.jpg'), credito: commons('Haakon S. Krohn', 'CC BY-SA 3.0') },
    gloria: { imagem: require('../../assets/images/praias/rio/gloria.jpg'), credito: commons('TMbux', 'CC BY-SA 3.0') },
};

/** Foto da praia pelo id (IC, copacabana) ou pelo código de um ponto de Niterói (IC003). */
export function getBeachPhoto(id: string): Foto | null {
    return FOTOS[id] ?? FOTOS[id.slice(0, 2).toUpperCase()] ?? null;
}
