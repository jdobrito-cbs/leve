import { View } from 'react-native';
import { strings } from '@/i18n/pt-BR';
import { spacing } from '../tokens';
import { Input } from './Input';

interface Props {
  dateValue: string;
  timeValue: string;
  onChangeDate: (v: string) => void;
  onChangeTime: (v: string) => void;
}

/** Data e hora do registro (pré-preenchidas com agora; edite para lançar registros antigos). */
export function DateTimeField({ dateValue, timeValue, onChangeDate, onChangeTime }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <View style={{ flex: 1.4 }}>
        <Input
          label={strings.common.dateLabel}
          value={dateValue}
          onChangeText={onChangeDate}
          placeholder="DD/MM/AAAA"
          keyboardType="numbers-and-punctuation"
        />
      </View>
      <View style={{ flex: 1 }}>
        <Input
          label={strings.common.timeLabel}
          value={timeValue}
          onChangeText={onChangeTime}
          placeholder="HH:MM"
          keyboardType="numbers-and-punctuation"
        />
      </View>
    </View>
  );
}
