import { AppText, EmptyState, Screen } from '@/design/components';
import { strings } from '@/i18n/pt-BR';

export function TodayScreen() {
  return (
    <Screen>
      <AppText variant="display">{strings.tabs.today}</AppText>
      <EmptyState title={strings.today.emptyTitle} hint={strings.today.emptyHint} icon="🌱" />
    </Screen>
  );
}
