import { Platform, Switch, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  DisclaimerBanner,
  Input,
  NumberField,
  Screen,
} from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { useHealthConnection } from '@/features/health/useHealthConnection';
import { useProfileForm } from '@/features/profile/useProfileForm';
import { strings } from '@/i18n/pt-BR';

function HealthSection() {
  const { colors } = useTheme();
  const health = useHealthConnection();
  const platformName = Platform.OS === 'ios' ? strings.health.iosName : strings.health.androidName;

  return (
    <Card style={{ gap: spacing.md }}>
      <AppText variant="title">
        {strings.health.section} — {platformName}
      </AppText>
      {!health.available ? (
        <AppText variant="caption" muted>
          {strings.health.unavailable}
        </AppText>
      ) : health.connected ? (
        <>
          <AppText variant="caption" style={{ color: colors.success }}>
            {strings.health.connected}
          </AppText>
          <Button
            label={strings.health.importNow}
            onPress={health.importNow}
            disabled={health.importing}
          />
          {health.lastImported !== null ? (
            <AppText variant="caption" muted>
              {health.lastImported} {strings.health.importedSuffix}
            </AppText>
          ) : null}
          <Button
            label={strings.health.disconnect}
            variant="secondary"
            onPress={health.disconnect}
          />
        </>
      ) : (
        <Button label={strings.health.connect} onPress={health.connect} />
      )}
      <AppText variant="caption" muted>
        {strings.health.privacyNote}
      </AppText>
    </Card>
  );
}

export function ProfileScreen() {
  const { colors } = useTheme();
  const { loading, form, setField, save, saved, permissionError } = useProfileForm();

  if (loading) return <Screen />;

  return (
    <Screen>
      <AppText variant="display">{strings.profile.title}</AppText>
      <DisclaimerBanner />

      <Card style={{ gap: spacing.md }}>
        <AppText variant="title">{strings.profile.editSection}</AppText>
        <Input
          label={strings.profile.nameLabel}
          value={form.name}
          onChangeText={(v) => setField('name', v)}
        />
        <NumberField
          label={strings.profile.heightLabel}
          value={form.heightStr}
          onChangeText={(v) => setField('heightStr', v)}
          suffix="cm"
        />
        <Input
          label={strings.profile.medicationLabel}
          value={form.medication}
          onChangeText={(v) => setField('medication', v)}
        />
        <NumberField
          label={strings.profile.goalWeightLabel}
          value={form.goalWeightStr}
          onChangeText={(v) => setField('goalWeightStr', v)}
          suffix="kg"
        />
        <NumberField
          label={strings.profile.waterGoalLabel}
          value={form.waterGoalStr}
          onChangeText={(v) => setField('waterGoalStr', v)}
          suffix="ml"
        />
        <NumberField
          label={strings.profile.calorieGoalLabel}
          value={form.calorieGoalStr}
          onChangeText={(v) => setField('calorieGoalStr', v)}
          suffix="kcal"
        />
        <AppText variant="caption" muted>
          {strings.profile.calorieGoalHint}
        </AppText>
      </Card>

      <Card style={{ gap: spacing.md }}>
        <AppText variant="title">{strings.profile.remindersSection}</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText>{strings.profile.doseReminder}</AppText>
            <AppText variant="caption" muted>
              {strings.profile.doseReminderHint}
            </AppText>
          </View>
          <Switch
            value={form.doseEnabled}
            onValueChange={(v) => setField('doseEnabled', v)}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText>{strings.profile.waterReminder}</AppText>
          </View>
          <Switch
            value={form.waterEnabled}
            onValueChange={(v) => setField('waterEnabled', v)}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
        {form.waterEnabled ? (
          <Input
            label={strings.profile.waterTimesLabel}
            value={form.waterTimesStr}
            onChangeText={(v) => setField('waterTimesStr', v)}
            placeholder="09:00, 13:00, 17:00"
          />
        ) : null}
        {permissionError ? (
          <AppText variant="caption" style={{ color: colors.danger }}>
            {strings.profile.permissionDenied}
          </AppText>
        ) : null}
      </Card>

      <Button label={strings.profile.save} onPress={save} />
      {saved ? (
        <AppText variant="caption" style={{ color: colors.success, textAlign: 'center' }}>
          {strings.profile.saved}
        </AppText>
      ) : null}

      <HealthSection />

      <Card style={{ gap: spacing.sm }}>
        <AppText variant="title">{strings.profile.privacySection}</AppText>
        <View style={{ gap: spacing.xs }}>
          <AppText muted>{strings.profile.exportData}</AppText>
          <AppText variant="caption" muted>
            {strings.profile.comingSoon}
          </AppText>
        </View>
        <View style={{ gap: spacing.xs }}>
          <AppText muted>{strings.profile.deleteData}</AppText>
          <AppText variant="caption" muted>
            {strings.profile.comingSoon}
          </AppText>
        </View>
      </Card>
    </Screen>
  );
}
