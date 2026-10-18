import { Component, type ErrorInfo, type ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import StateView from '../StateView';

interface State {
    erro: Error | null;
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
    state: State = { erro: null };

    static getDerivedStateFromError(erro: Error): State {
        return { erro };
    }

    componentDidCatch(erro: Error, info: ErrorInfo) {
        // TODO: enviar para Sentry/Crashlytics
        console.error('Erro não tratado na interface:', erro, info.componentStack);
    }

    render() {
        if (!this.state.erro) return this.props.children;
        return (
            <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={StyleSheet.absoluteFill}>
                <StateView error="Ops! Algo deu errado nesta tela." onRetry={() => this.setState({ erro: null })} />
            </LinearGradient>
        );
    }
}
