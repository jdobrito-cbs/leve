import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { spacing } from '../tokens';
import { AppText } from './AppText';
import { IconChip } from './IconChip';

interface Props {
  title: string;
  hint: string;
  Icon: LucideIcon;
}

export function EmptyState({ title, hint, Icon }: Props) {
  return (
    <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
      <IconChip Icon={Icon} size={64} />
      <View style={{ alignItems: 'center', gap: spacing.xs }}>
        <AppText variant="title">{title}</AppText>
        <AppText muted style={{ textAlign: 'center' }}>
          {hint}
        </AppText>
      </View>
    </View>
  );
}
