import { PropsWithChildren } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../tokens';
import { useTheme } from '../useTheme';

export function Screen({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  return (
    // Sem edge inferior: a tab bar já cobre o recuo do indicador de início —
    // reservar de novo criava um retângulo vazio acima do menu.
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        // iOS: rola o conteúdo para cima quando o teclado abre — sem isto,
        // campos e botões no pé da tela ficam escondidos atrás do teclado.
        automaticallyAdjustKeyboardInsets
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
