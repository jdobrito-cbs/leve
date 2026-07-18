import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar, Clock } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { formatDateBR, formatTimeHM, parseDateTimeBR } from '@/core/datetime';
import { strings } from '@/i18n/pt-BR';
import { radius, spacing } from '../tokens';
import { useTheme } from '../useTheme';
import { Input } from './Input';
import { PickerSheet } from './PickerSheet';

interface Props {
  dateValue: string;
  timeValue: string;
  onChangeDate: (v: string) => void;
  onChangeTime: (v: string) => void;
  /** Chamado quando qualquer campo interno ganha foco (fecha réguas abertas). */
  onFieldFocus?: () => void;
}

/** Máscara progressiva DD/MM/AAAA a partir só dos dígitos digitados. */
export function maskDateBR(text: string): string {
  const d = text.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** Máscara progressiva HH:MM a partir só dos dígitos digitados. */
export function maskTimeHM(text: string): string {
  const d = text.replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

/** Data e hora do registro (pré-preenchidas com agora; edite para lançar registros antigos). */
export function DateTimeField({
  dateValue,
  timeValue,
  onChangeDate,
  onChangeTime,
  onFieldFocus,
}: Props) {
  const { colors } = useTheme();
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);

  // Valor inicial do seletor: o que está digitado, senão agora.
  const pickerValue =
    parseDateTimeBR(
      /^\d{2}\/\d{2}\/\d{4}$/.test(dateValue) ? dateValue : formatDateBR(new Date()),
      /^\d{2}:\d{2}$/.test(timeValue) ? timeValue : formatTimeHM(new Date()),
    ) ?? new Date();

  function onPicked(event: DateTimePickerEvent, selected?: Date) {
    // Android abre como diálogo: qualquer evento (ok/cancelar) encerra.
    if (Platform.OS === 'android') setPicker(null);
    if (event.type === 'dismissed' || !selected) return;
    if (picker === 'date') onChangeDate(formatDateBR(selected));
    else onChangeTime(formatTimeHM(selected));
  }

  const pickerButton = (mode: 'date' | 'time') => (
    <Pressable
      onPress={() => setPicker((p) => (p === mode ? null : mode))}
      hitSlop={8}
      accessibilityLabel={mode === 'date' ? strings.common.dateLabel : strings.common.timeLabel}
      style={{
        borderWidth: 1,
        borderColor: picker === mode ? colors.primary : colors.border,
        borderRadius: radius.sm,
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: spacing.sm + 2,
        justifyContent: 'center',
      }}
    >
      {mode === 'date' ? (
        <Calendar size={18} color={colors.primary} />
      ) : (
        <Clock size={18} color={colors.primary} />
      )}
    </Pressable>
  );

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1.4, flexDirection: 'row', gap: spacing.xs }}>
          <View style={{ flex: 1 }}>
            <Input
              label={strings.common.dateLabel}
              value={dateValue}
              onChangeText={(v) => onChangeDate(maskDateBR(v))}
              onFocus={onFieldFocus}
              placeholder="DD/MM/AAAA"
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>
          {Platform.OS !== 'web' ? (
            <View style={{ justifyContent: 'flex-end' }}>{pickerButton('date')}</View>
          ) : null}
        </View>
        <View style={{ flex: 1, flexDirection: 'row', gap: spacing.xs }}>
          <View style={{ flex: 1 }}>
            <Input
              label={strings.common.timeLabel}
              value={timeValue}
              onChangeText={(v) => onChangeTime(maskTimeHM(v))}
              onFocus={onFieldFocus}
              placeholder="HH:MM"
              keyboardType="number-pad"
              maxLength={5}
            />
          </View>
          {Platform.OS !== 'web' ? (
            <View style={{ justifyContent: 'flex-end' }}>{pickerButton('time')}</View>
          ) : null}
        </View>
      </View>
      {picker !== null ? (
        Platform.OS === 'ios' ? (
          <PickerSheet
            visible
            onConfirm={() => setPicker(null)}
            onCancel={() => setPicker(null)}
          >
            <DateTimePicker
              value={pickerValue}
              mode={picker}
              display={picker === 'date' ? 'inline' : 'spinner'}
              is24Hour
              onChange={onPicked}
            />
          </PickerSheet>
        ) : (
          // Android: o seletor nativo já abre como diálogo com OK/Cancelar.
          <DateTimePicker
            value={pickerValue}
            mode={picker}
            display={picker === 'date' ? 'default' : 'spinner'}
            is24Hour
            onChange={onPicked}
          />
        )
      ) : null}
    </View>
  );
}
