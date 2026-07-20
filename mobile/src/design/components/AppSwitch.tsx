import { Switch, SwitchProps } from 'react-native';
import { palette } from '../tokens';
import { useTheme } from '../useTheme';

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
