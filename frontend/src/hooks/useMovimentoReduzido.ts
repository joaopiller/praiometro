import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Verdadeiro quando a pessoa pediu ao sistema para reduzir animações. */
export function useMovimentoReduzido(): boolean {
    const [reduzido, setReduzido] = useState(false);
    useEffect(() => {
        AccessibilityInfo.isReduceMotionEnabled()
            .then(setReduzido)
            .catch(() => {});
        const ouvinte = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzido);
        return () => ouvinte.remove();
    }, []);
    return reduzido;
}
