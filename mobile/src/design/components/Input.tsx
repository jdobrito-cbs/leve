import { TextInput, TextInputProps, View } from 'react-native';
import { radius, spacing, typeScale } from '../tokens';
import { useTheme } from '../useTheme';
import { AppText } from './AppText';

interface Props extends TextInputProps {
  label: string;
}

export function Input({ label, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.sm,
          padding: spacing.sm + 2,
          color: colors.text,
          fontSize: typeScale.body,
          backgroundColor: colors.surface,
        }}
        {...rest}
      />
    </View>
  );
}
