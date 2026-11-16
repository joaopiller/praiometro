import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { getErrorMessage } from '../../api/client';
import { CRITERIOS, type Notas } from '../../api/types';
import { LoginError } from '../../auth/google';
import { useLogin } from '../../auth/LoginProvider';
import { useEnviarVoto } from '../../hooks/queries';
import { useAviso } from '../Aviso';
import { formatDate } from '../../utils/format';
import { toneColors } from '../../theme';
import StarRating from '../StarRating';
import styles from './styles';

const NOTAS_VAZIAS: Notas = { limpeza: 0, acessibilidade: 0, infraestrutura: 0, seguranca: 0, tranquilidade: 0 };

interface Props {
    visible: boolean;
    onClose: () => void;
    beachName: string;
    beachId: string;
}

export default function FeedbackModal({ visible, onClose, beachName, beachId }: Props) {
    const [notas, setNotas] = useState<Notas>(NOTAS_VAZIAS);
    const [entrando, setEntrando] = useState(false);
    const votar = useEnviarVoto(beachId);
    const { pedirLogin } = useLogin();
    const avisar = useAviso();
    const [erro, setErro] = useState<string | null>(null);
    const enviando = entrando || votar.isPending;
    const faltam = Object.values(notas).filter((n) => n <= 0).length;
    const completo = faltam === 0;

    useEffect(() => {
        if (visible) {
            setNotas(NOTAS_VAZIAS);
            setErro(null);
        }
    }, [visible, beachId]);

    const fechar = () => {
        if (!enviando) onClose();
    };

    async function enviar() {
        if (!completo || enviando) return;
        setErro(null);
        try {
            setEntrando(true);
            const idToken = await pedirLogin();
            setEntrando(false);
            if (!idToken) return;
            const resposta = await votar.mutateAsync({ notas, idToken });
            if (resposta.votou) {
                const quando = resposta.pode_votar_em
                    ? ` Você poderá avaliar de novo a partir de ${formatDate(`${resposta.pode_votar_em}T00:00`)}.`
                    : '';
                avisar(`Você já avaliou esta praia; seu voto anterior continua valendo.${quando}`, 'info');
            } else if (resposta.atualizado) {
                avisar('Avaliação atualizada! Substituímos a anterior por esta.');
            } else {
                avisar('Obrigado! Sua avaliação ajuda outros banhistas.');
            }
            onClose();
        } catch (error) {
            setEntrando(false);
            setErro(error instanceof LoginError ? error.message : getErrorMessage(error));
        }
    }

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={fechar} statusBarTranslucent>
            <Pressable style={styles.backdrop} onPress={fechar} accessibilityLabel="Fechar avaliação">
                <Pressable style={styles.container} onPress={() => {}} accessible={false}>
                    <Text style={styles.title} accessibilityRole="header">
                        Avalie a {beachName}
                    </Text>
                    <Text style={styles.subtitle}>Toque na metade da estrela para dar meia estrela</Text>
                    <View style={styles.list}>
                        {CRITERIOS.map(({ key, label }) => (
                            <View key={key} style={styles.row}>
                                <Text style={styles.criterio}>{label}</Text>
                                <StarRating
                                    value={notas[key]}
                                    size={30}
                                    emptyColor="#B8C4CE"
                                    label={label}
                                    onChange={(valor) => setNotas((n) => ({ ...n, [key]: valor }))}
                                />
                            </View>
                        ))}
                    </View>
                    {erro && (
                        <View style={styles.erro} accessibilityRole="alert">
                            <Feather name="alert-circle" size={16} color={toneColors.danger.solid} />
                            <Text style={styles.erroTexto}>{erro}</Text>
                        </View>
                    )}
                    {!completo && (
                        <Text style={styles.pending}>
                            Falta{faltam === 1 ? '' : 'm'} {faltam} {faltam === 1 ? 'critério' : 'critérios'}
                        </Text>
                    )}
                    <View style={styles.buttons}>
                        <Pressable
                            onPress={fechar}
                            disabled={enviando}
                            accessibilityRole="button"
                            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
                        >
                            <Text style={styles.secondaryText}>Cancelar</Text>
                        </Pressable>
                        <Pressable
                            onPress={enviar}
                            disabled={!completo || enviando}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: !completo || enviando, busy: enviando }}
                            style={({ pressed }) => [
                                styles.primary,
                                (!completo || enviando) && styles.disabled,
                                pressed && styles.pressed,
                            ]}
                        >
                            {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Enviar</Text>}
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
