import { Switch, SwitchProps } from 'react-native';
import { palette } from '../tokens';
import { useTheme } from '../useTheme';

/** Switch com trilho visível nos dois temas (o desligado não pode sumir no claro). */
export function AppSwitch(props: SwitchProps) {
  const { colors } = useTheme();
  return (
    <Switch
      trackColor={{ true: colors.primary, false: palette.slate400 }}
      ios_backgroundColor={palette.slate400}
      thumbColor={palette.white}
      {...props}
    />
  );
}
