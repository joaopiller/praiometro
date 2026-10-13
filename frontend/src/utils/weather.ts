import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface CondicaoClima {
    descricao: string;
    icone: IconName;
    iconeNoite?: IconName;
    cor: string;
    arriscado: boolean;
}

const nuvem = '#DDEBFA';
const chuva = '#8FD0FF';

// códigos WMO (Open-Meteo)
const CONDICOES: { codigos: number[]; condicao: CondicaoClima }[] = [
    { codigos: [0], condicao: { descricao: 'Céu limpo', icone: 'weather-sunny', iconeNoite: 'weather-night', cor: colors.sun, arriscado: false } },
    { codigos: [1], condicao: { descricao: 'Poucas nuvens', icone: 'weather-partly-cloudy', iconeNoite: 'weather-night-partly-cloudy', cor: colors.sun, arriscado: false } },
    { codigos: [2], condicao: { descricao: 'Parcialmente nublado', icone: 'weather-partly-cloudy', iconeNoite: 'weather-night-partly-cloudy', cor: colors.sun, arriscado: false } },
    { codigos: [3], condicao: { descricao: 'Nublado', icone: 'weather-cloudy', cor: nuvem, arriscado: false } },
    { codigos: [45, 48], condicao: { descricao: 'Neblina', icone: 'weather-fog', cor: nuvem, arriscado: true } },
    { codigos: [51, 53, 55, 56, 57], condicao: { descricao: 'Garoa', icone: 'weather-partly-rainy', cor: chuva, arriscado: false } },
    { codigos: [61], condicao: { descricao: 'Chuva fraca', icone: 'weather-rainy', cor: chuva, arriscado: true } },
    { codigos: [63, 66], condicao: { descricao: 'Chuva', icone: 'weather-rainy', cor: chuva, arriscado: true } },
    { codigos: [65, 67], condicao: { descricao: 'Chuva forte', icone: 'weather-pouring', cor: chuva, arriscado: true } },
    { codigos: [71, 73, 75, 77, 85, 86], condicao: { descricao: 'Neve', icone: 'weather-snowy', cor: nuvem, arriscado: true } },
    { codigos: [80, 81, 82], condicao: { descricao: 'Pancadas de chuva', icone: 'weather-pouring', cor: chuva, arriscado: true } },
    { codigos: [95], condicao: { descricao: 'Trovoadas', icone: 'weather-lightning-rainy', cor: colors.warning, arriscado: true } },
    { codigos: [96, 99], condicao: { descricao: 'Trovoadas com granizo', icone: 'weather-hail', cor: colors.warning, arriscado: true } },
];

const DESCONHECIDA: CondicaoClima = { descricao: 'Sem informação', icone: 'weather-cloudy-alert', cor: nuvem, arriscado: false };

export function getCondicao(codigo?: number | null): CondicaoClima {
    if (codigo === null || codigo === undefined) return DESCONHECIDA;
    return CONDICOES.find((c) => c.codigos.includes(codigo))?.condicao ?? DESCONHECIDA;
}

export function isNoite(hora: number): boolean {
    return hora < 6 || hora >= 18;
}

export function getHumidityMessage(umidade?: number | null): string {
    if (umidade === null || umidade === undefined) return 'Sem informação';
    if (umidade >= 80) return 'Ar muito úmido, prefira roupas leves.';
    if (umidade >= 60) return 'Confortável, mas não esqueça de se hidratar.';
    if (umidade >= 40) return 'Risco moderado, hidrate-se!';
    if (umidade >= 20) return 'Ar seco: hidrate-se e procure sombra.';
    return 'Ar extremamente seco, hidrate-se ao máximo!';
}

export function getSensationMessage(temperatura?: number | null): string {
    if (temperatura === null || temperatura === undefined) return 'Sem informação';
    if (temperatura >= 36) return 'Calor extremo, evite o sol forte.';
    if (temperatura >= 26) return 'Calor, hidrate-se e use protetor solar!';
    if (temperatura >= 18) return 'Clima agradável, aproveite!';
    return 'Friozinho, leve um casaco.';
}
