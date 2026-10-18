import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCondicao, isNoite } from '../../utils/weather';

interface Props {
    code?: number | null;
    size: number;
    color?: string;
    /** 0-23, para os ícones noturnos */
    hour?: number;
}

export default function WeatherIcon({ code, size, color, hour }: Props) {
    const condicao = getCondicao(code);
    const noite = hour !== undefined && isNoite(hour);
    const nome = noite && condicao.iconeNoite ? condicao.iconeNoite : condicao.icone;
    const cor = color ?? (noite && condicao.iconeNoite ? '#DDEBFA' : condicao.cor);
    return <MaterialCommunityIcons name={nome} size={size} color={cor} accessibilityLabel={condicao.descricao} />;
}
