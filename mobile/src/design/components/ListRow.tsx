import { Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { strings } from '@/i18n/pt-BR';
import { spacing } from '../tokens';
import { useTheme } from '../useTheme';
import { AppText } from './AppText';

interface Props {
  title: string;
  subtitle?: string;
  right?: string;
  onPress?: () => void;
  onDelete?: () => void;
}

export function ListRow({ title, subtitle, right, onPress, onDelete }: Props) {
  const { colors } = useTheme();
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.sm + 2,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flex: 1 }}>
        <AppText>{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" muted>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <AppText muted>{right}</AppText> : null}
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.common.deleteEntry}
          onPress={onDelete}
          hitSlop={10}
          style={{ padding: spacing.xs }}
        >
          <Trash2 size={17} color={colors.danger} />
        </Pressable>
      ) : null}
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {content}
    </Pressable>
  ) : (
    content
  );
}
