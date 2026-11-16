import type { ImageSourcePropType } from 'react-native';

interface Foto {
    imagem: ImageSourcePropType;
    credito: string;
}

const rafael = 'Rafael Lucio Carvalho (CC BY 4.0)';
const commons = (autor: string, licenca: string) => `${autor} via Wikimedia Commons (${licenca})`;
const marinelson = commons('Marinelson Almeida', 'CC BY 2.0');
const soldon = commons('Rodrigo Soldon', 'CC BY 2.0');

// fotos pelo id da praia: em Niterói, o prefixo dos códigos (IC003 → IC)
const FOTOS: Record<string, Foto> = {
    AD: { imagem: require('../../assets/images/praias/adaoeva.jpg'), credito: 'Caroline Stabenow via Wikimedia Commons (CC BY-SA 3.0)' },
    EA: { imagem: require('../../assets/images/praias/adaoeva.jpg'), credito: 'Caroline Stabenow via Wikimedia Commons (CC BY-SA 3.0)' },
    BV: { imagem: require('../../assets/images/praias/boaviagem.jpg'), credito: rafael },
    CH: { imagem: require('../../assets/images/praias/charitas.jpg'), credito: 'Tatanya123 via Wikimedia Commons (CC BY-SA 4.0)' },
    CM: { imagem: require('../../assets/images/praias/camboinhas.jpg'), credito: 'Rodrigo Padula via Wikimedia Commons (CC BY-SA 4.0)' },
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
    recreio: { imagem: require('../../assets/images/praias/rio/recreio.jpg'), credito: commons('Cyro A. Silva', 'CC BY 2.0') },
    reserva: { imagem: require('../../assets/images/praias/rio/reserva.jpg'), credito: commons('Ursula Hille', 'CC BY-SA 3.0') },
    barra: { imagem: require('../../assets/images/praias/rio/barra.jpg'), credito: commons('Andrevruas', 'CC BY 3.0') },
    joatinga: { imagem: require('../../assets/images/praias/rio/joatinga.jpg'), credito: soldon },
    pepino: { imagem: require('../../assets/images/praias/rio/pepino.jpg'), credito: commons('Eduardo P', 'CC BY-SA 3.0') },
    'sao-conrado': { imagem: require('../../assets/images/praias/rio/sao-conrado.jpg'), credito: commons('Ricardo Haleck', 'CC BY-SA 3.0') },
    vidigal: { imagem: require('../../assets/images/praias/rio/vidigal.jpg'), credito: commons('VinnyWiki', 'CC BY-SA 4.0') },
    leblon: { imagem: require('../../assets/images/praias/rio/leblon.jpg'), credito: soldon },
    ipanema: { imagem: require('../../assets/images/praias/rio/ipanema.jpg'), credito: commons('Sandro Vox', 'CC BY-SA 4.0') },
    arpoador: { imagem: require('../../assets/images/praias/rio/arpoador.jpg'), credito: commons('Pribruder', 'CC0') },
    diabo: { imagem: require('../../assets/images/praias/rio/diabo.jpg'), credito: commons('Fatima Rodrigues', 'CC BY 3.0') },
    copacabana: { imagem: require('../../assets/images/praias/rio/copacabana.jpg'), credito: commons('Wilfredor', 'CC0') },
    leme: { imagem: require('../../assets/images/praias/rio/leme.jpg'), credito: commons('Gilberto Santa Rosa', 'CC BY 2.0') },
    vermelha: { imagem: require('../../assets/images/praias/rio/vermelha.jpg'), credito: commons('Wilfredor', 'CC0') },
    urca: { imagem: require('../../assets/images/praias/rio/urca.jpg'), credito: commons('Carnaval.com Studios', 'CC BY 2.0') },
    botafogo: { imagem: require('../../assets/images/praias/rio/botafogo.jpg'), credito: commons('Luis Rizo', 'domínio público') },
    flamengo: { imagem: require('../../assets/images/praias/rio/flamengo.jpg'), credito: commons('Haakon S. Krohn', 'CC BY-SA 3.0') },
    gloria: { imagem: require('../../assets/images/praias/rio/gloria.jpg'), credito: soldon },
};

/** Foto da praia pelo id (IC, copacabana) ou pelo código de um ponto de Niterói (IC003). */
export function getBeachPhoto(id: string): Foto | null {
    return FOTOS[id] ?? FOTOS[id.slice(0, 2).toUpperCase()] ?? null;
}
