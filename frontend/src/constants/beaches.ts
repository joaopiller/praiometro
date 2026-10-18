import type { ImageSourcePropType } from 'react-native';

interface Foto {
    imagem: ImageSourcePropType;
    credito: string;
}

const rafael = 'Rafael Lucio Carvalho (CC BY 4.0)';
const marinelson = 'Marinelson Almeida via Wikimedia Commons (CC BY 2.0)';

// fotos por prefixo do código do ponto (IC003 → IC)
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
};

export function getBeachPhoto(codigo: string): Foto | null {
    return FOTOS[codigo.slice(0, 2).toUpperCase()] ?? null;
}

export const MAPA_INICIAL = { centro: [-43.0835, -22.944] as [number, number], zoom: 11.1 };
