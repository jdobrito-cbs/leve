import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing } from '../tokens';
import { useTheme } from '../useTheme';

/** Cabeçalho com gradiente azul e cantos inferiores arredondados. */
export function HeroHeader({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[colors.heroStart, colors.heroEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: insets.top + spacing.md,
        paddingBottom: spacing.xl + spacing.md,
        paddingHorizontal: spacing.md + spacing.xs,
        borderBottomLeftRadius: radius.lg + 4,
        borderBottomRightRadius: radius.lg + 4,
        gap: spacing.xs,
      }}
    >
      {/* Transbordo: ao puxar a tela para baixo (elástico do iOS), o azul
          continua acima do cabeçalho em vez de aparecer um corte. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -600,
          left: 0,
          right: 0,
          height: 600,
          backgroundColor: colors.heroStart,
        }}
      />
      {children}
    </LinearGradient>
  );
}
