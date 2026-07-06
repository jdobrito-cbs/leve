import { AppText, EmptyState, Screen } from '@/design/components';
import { strings } from '@/i18n/pt-BR';

export function ProgressScreen() {
  return (
    <Screen>
      <AppText variant="display">{strings.tabs.progress}</AppText>
      <EmptyState title={strings.progress.emptyTitle} hint={strings.progress.emptyHint} icon="📈" />
    </Screen>
  );
}
