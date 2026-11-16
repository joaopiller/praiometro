// Paleta: azul da marca (#015486) + tons de mar e areia
export const colors = {
    brand: '#015486',
    headerTop: '#01436C',
    bgTop: '#0A639E',
    bgMid: '#015486',
    bgBottom: '#013B60',
    tabBar: '#013B60',
    // tinta do vidro (iOS 26): azul da marca translúcido
    vidroMarca: 'rgba(1,67,108,0.82)',
    sand: '#F5D9A8',
    sandSoft: 'rgba(245,217,168,0.18)',
    foam: '#E6F6FF',

    surface: 'rgba(255,255,255,0.09)',
    surfaceStrong: 'rgba(255,255,255,0.16)',
    border: 'rgba(255,255,255,0.18)',
    overlay: 'rgba(8,24,44,0.55)',

    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.72)',
    textSubtle: 'rgba(255,255,255,0.5)',
    label: '#A9D2FF',
    accent: '#8FD8FF',

    success: '#5EE38A',
    successBg: 'rgba(94,227,138,0.16)',
    successSolid: '#2FA35A',
    warning: '#FFD45C',
    warningBg: 'rgba(255,212,92,0.16)',
    warningSolid: '#E2A72E',
    danger: '#FF8A80',
    dangerBg: 'rgba(255,138,128,0.18)',
    dangerSolid: '#D9483B',
    neutral: '#CFD8E3',
    neutralBg: 'rgba(207,216,227,0.14)',
    neutralSolid: '#5D7690',

    sun: '#FFC83D',
    star: '#FFC83D',
    starEmpty: 'rgba(255,255,255,0.25)',
    uvGradient: ['#FFE15C', '#FF9F43', '#E8453C', '#9B2FAE'] as const,
} as const;

export type Tone = 'success' | 'warning' | 'danger' | 'neutral';

export const toneColors: Record<Tone, { fg: string; bg: string; solid: string }> = {
    success: { fg: colors.success, bg: colors.successBg, solid: colors.successSolid },
    warning: { fg: colors.warning, bg: colors.warningBg, solid: colors.warningSolid },
    danger: { fg: colors.danger, bg: colors.dangerBg, solid: colors.dangerSolid },
    neutral: { fg: colors.neutral, bg: colors.neutralBg, solid: colors.neutralSolid },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 32 } as const;
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const;

// includeFontPadding: false evita o espaço extra que o Android põe acima de fontes grandes
export const typography = {
    display: { fontSize: 88, fontWeight: '200' as const, color: colors.text, lineHeight: 96, includeFontPadding: false },
    value: { fontSize: 36, fontWeight: '700' as const, color: colors.text, lineHeight: 40, includeFontPadding: false },
    unit: { fontSize: 16, fontWeight: '600' as const, color: colors.textMuted },
    title: { fontSize: 19, fontWeight: '700' as const, color: colors.text, lineHeight: 24 },
    label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.9, color: colors.label },
    body: { fontSize: 15, color: colors.textMuted, lineHeight: 21 },
    caption: { fontSize: 12, color: colors.textSubtle, lineHeight: 16 },
};

// números grandes não crescem além disso com fonte do sistema aumentada (evita quebrar o layout)
export const MAX_FONT_SCALE_NUMEROS = 1.25;

export const CONTENT_MAX_WIDTH = 560;

// logo-header.png é recortado rente ao desenho; o espaço em volta vem do layout
export const LOGO_PROPORCAO = 600 / 228;
