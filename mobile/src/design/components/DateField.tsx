import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { formatDateBR, parseDateTimeBR } from '@/core/datetime';
import { radius, spacing } from '../tokens';
import { useTheme } from '../useTheme';
import { maskDateBR } from './DateTimeField';
import { Input } from './Input';
import { PickerSheet } from './PickerSheet';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onFieldFocus?: () => void;
}

export function DateField({ label, value, onChange, onFieldFocus }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const pickerValue =
    parseDateTimeBR(/^\d{2}\/\d{2}\/\d{4}$/.test(value) ? value : formatDateBR(new Date()), '00:00') ??
    new Date();

  function onPicked(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed' || !selected) return;
    onChange(formatDateBR(selected));
  }

  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <View style={{ flex: 1 }}>
          <Input
            label={label}
            value={value}
            onChangeText={(v) => onChange(maskDateBR(v))}
            onFocus={onFieldFocus}
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>
        {Platform.OS !== 'web' ? (
          <View style={{ justifyContent: 'flex-end' }}>
            <Pressable
              onPress={() => setOpen((v) => !v)}
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
              <Calendar size={18} color={colors.primary} />
            </Pressable>
          </View>
        ) : null}
      </View>
      {open ? (
        Platform.OS === 'ios' ? (
          <PickerSheet visible onConfirm={() => setOpen(false)} onCancel={() => setOpen(false)}>
            <DateTimePicker
              value={pickerValue}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={onPicked}
            />
          </PickerSheet>
        ) : (
          <DateTimePicker
            value={pickerValue}
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            onChange={onPicked}
          />
        )
      ) : null}
    </View>
  );
}
