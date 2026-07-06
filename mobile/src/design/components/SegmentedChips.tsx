import { Pressable, View } from 'react-native';
import { fonts, spacing } from '../tokens';
import { useTheme } from '../useTheme';
import { AppText } from './AppText';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  sublabel?: string;
}

interface Props<T extends string> {
  options: readonly ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
}

export function SegmentedChips<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={{
              backgroundColor: selected ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: selected ? colors.primary : colors.border,
              borderRadius: 999,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              alignItems: 'center',
            }}
          >
            <AppText
              variant="caption"
              style={{
                fontFamily: fonts.semibold,
                color: selected ? colors.onPrimary : colors.text,
              }}
            >
              {option.label}
            </AppText>
            {option.sublabel ? (
              <AppText
                variant="caption"
                style={{
                  fontSize: 10,
                  color: selected ? colors.onPrimary : colors.textMuted,
                }}
              >
                {option.sublabel}
              </AppText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
