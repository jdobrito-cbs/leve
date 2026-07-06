import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { useTheme } from '../useTheme';

interface Props {
  Icon: LucideIcon;
  size?: number;
}

/** Ícone flat dentro de um chip arredondado com fundo teal suave — motivo visual do Leve. */
export function IconChip({ Icon, size = 40 }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.35,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon color={colors.primary} size={size * 0.5} strokeWidth={1.9} />
    </View>
  );
}
