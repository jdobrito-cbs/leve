import { View } from 'react-native';
import { spacing } from '../tokens';
import { AppText } from './AppText';

interface Props {
  title: string;
  hint: string;
  icon?: string;
}

export function EmptyState({ title, hint, icon = '🌿' }: Props) {
  return (
    <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
      <AppText variant="display">{icon}</AppText>
      <AppText variant="title">{title}</AppText>
      <AppText muted style={{ textAlign: 'center' }}>
        {hint}
      </AppText>
    </View>
  );
}
