import { TextInput, TextInputProps, View } from 'react-native';
import { radius, spacing, typeScale } from '../tokens';
import { useTheme } from '../useTheme';
import { AppText } from './AppText';

interface Props extends Omit<TextInputProps, 'keyboardType'> {
  label: string;
  suffix?: string;
}

export function NumberField({ label, suffix, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.sm,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.sm + 2,
        }}
      >
        <TextInput
          keyboardType="decimal-pad"
          placeholderTextColor={colors.textMuted}
          style={{
            flex: 1,
            paddingVertical: spacing.sm + 2,
            color: colors.text,
            fontSize: typeScale.body,
          }}
          {...rest}
        />
        {suffix ? (
          <AppText variant="caption" muted>
            {suffix}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
