import { numberLocale } from '@/i18n/engine';
import { Ruler } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import { parseDecimalBR } from '@/core/text';
import { fonts, radius, spacing } from '../tokens';
import { useTheme } from '../useTheme';
import { AppText } from './AppText';
import { NumberField } from './NumberField';
import { PickerSheet } from './PickerSheet';
import { ValueRuler } from './ValueRuler';

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  suffix?: string;
  placeholder?: string;
  min: number;
  max: number;
  step: number;
  majorEvery?: number;
  labelEvery?: number;
  decimals?: number;
  fallback: number;
}

export function RulerField({
  label,
  value,
  onChangeText,
  suffix,
  placeholder,
  min,
  max,
  step,
  majorEvery,
  labelEvery,
  decimals = 1,
  fallback,
}: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState(fallback);

  const fmt = (v: number) =>
    v.toLocaleString(numberLocale(), { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  function openSheet() {
    Keyboard.dismiss();
    setTemp(parseDecimalBR(value) ?? fallback);
    setOpen(true);
  }

  function confirm() {
    onChangeText(fmt(temp));
    setOpen(false);
  }

  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      <View style={{ flex: 1 }}>
        <NumberField
          label={label}
          value={value}
          onChangeText={onChangeText}
          suffix={suffix}
          placeholder={placeholder}
        />
      </View>
      <View style={{ justifyContent: 'flex-end' }}>
        <Pressable
          onPress={openSheet}
          hitSlop={8}
          accessibilityLabel={label}
          style={{
            borderWidth: 1,
            borderColor: open ? colors.primary : colors.border,
            borderRadius: radius.sm,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.sm + 2,
            paddingVertical: spacing.sm + 2,
            justifyContent: 'center',
          }}
        >
          <Ruler size={18} color={colors.primary} />
        </Pressable>
      </View>
      <PickerSheet visible={open} onConfirm={confirm} onCancel={() => setOpen(false)}>
        <AppText variant="caption" muted>
          {label}
        </AppText>
        <AppText style={{ fontFamily: fonts.bold, fontSize: 34, textAlign: 'center' }}>
          {fmt(temp)}
          {suffix ? (
            <AppText variant="caption" muted>
              {' '}
              {suffix}
            </AppText>
          ) : null}
        </AppText>
        <ValueRuler
          value={temp}
          onChange={setTemp}
          min={min}
          max={max}
          step={step}
          majorEvery={majorEvery}
          labelEvery={labelEvery}
          decimals={decimals}
        />
      </PickerSheet>
    </View>
  );
}
