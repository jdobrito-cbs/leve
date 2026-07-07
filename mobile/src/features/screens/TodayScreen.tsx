import { router } from 'expo-router';
import { ClipboardList, Footprints, Syringe, Utensils } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { AppText, Card, HeroHeader, IconChip, ProgressRing } from '@/design/components';
import { fonts, spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { useTodaySummary } from '@/features/today/useTodaySummary';
import { strings } from '@/i18n/pt-BR';

function StatCard({
  Icon,
  label,
  value,
  route,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  route: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(route as never)}
      style={{ flexBasis: '47%', flexGrow: 1 }}
    >
      <Card style={{ gap: spacing.sm }}>
        <IconChip Icon={Icon} size={36} />
        <AppText variant="caption" muted>
          {label}
        </AppText>
        <AppText style={{ fontFamily: fonts.semibold }} numberOfLines={1}>
          {value}
        </AppText>
      </Card>
    </Pressable>
  );
}

export function TodayScreen() {
  const { colors } = useTheme();
  const summary = useTodaySummary();
  const progress = summary.waterGoalMl > 0 ? summary.waterMl / summary.waterGoalMl : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader>
        <AppText variant="caption" style={{ color: colors.onHero, opacity: 0.85 }}>
          {strings.today.greeting}
        </AppText>
        <AppText variant="display" style={{ color: colors.onHero }}>
          {strings.tabs.today}
        </AppText>
        <AppText variant="caption" style={{ color: colors.onHero, opacity: 0.85 }}>
          {strings.today.summaryLabel}
        </AppText>
      </HeroHeader>
      <ScrollView
        style={{ marginTop: -spacing.lg }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl }}
      >
        <Pressable accessibilityRole="button" onPress={() => router.push('/log/agua' as never)}>
          <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg }}>
            <ProgressRing progress={progress} size={148}>
              <AppText style={{ fontFamily: fonts.bold, fontSize: 34, color: colors.text }}>
                {summary.waterMl.toLocaleString('pt-BR')}
              </AppText>
              <AppText variant="caption" muted>
                {strings.today.waterRing}
              </AppText>
            </ProgressRing>
            <AppText variant="caption" muted>
              {summary.waterGoalMl.toLocaleString('pt-BR')} ml {strings.today.ofGoal}
            </AppText>
          </Card>
        </Pressable>
        {summary.insights.length > 0 ? (
          <Card style={{ gap: spacing.sm }}>
            <AppText variant="title">{strings.insights.section}</AppText>
            {summary.insights.map((insight) => (
              <View key={insight.id} style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    marginTop: 6,
                    backgroundColor:
                      insight.kind === 'positivo' ? colors.success : colors.warning,
                  }}
                />
                <AppText variant="caption" style={{ flex: 1 }}>
                  {insight.text}
                </AppText>
              </View>
            ))}
            <AppText variant="caption" muted>
              {strings.insights.disclaimer}
            </AppText>
          </Card>
        ) : null}
        <Pressable accessibilityRole="button" onPress={() => router.push('/log/peso' as never)}>
          <Card style={{ gap: spacing.sm }}>
            <AppText variant="title">{strings.today.weightSection}</AppText>
            {summary.weights30.length >= 2 ? (
              <LineChart
                data={summary.weights30.map((w) => ({ value: w.weightKg }))}
                color={colors.primary}
                thickness={3}
                height={90}
                hideDataPoints
                hideAxesAndRules
                hideYAxisText
                adjustToWidth
                curved
                disableScroll
              />
            ) : (
              <AppText variant="caption" muted>
                {strings.progress.empty}
              </AppText>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText style={{ fontFamily: fonts.semibold }}>
                {summary.lastWeightKg !== null
                  ? `${summary.lastWeightKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`
                  : strings.today.noWeight}
              </AppText>
              {summary.goalWeightKg !== null ? (
                <AppText variant="caption" muted>
                  {strings.today.goalLabel}:{' '}
                  {summary.goalWeightKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg
                </AppText>
              ) : null}
            </View>
          </Card>
        </Pressable>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          <StatCard
            Icon={Utensils}
            label={strings.today.cards.kcal}
            value={
              summary.calorieGoalKcal
                ? `${summary.kcal.toLocaleString('pt-BR')} / ${summary.calorieGoalKcal.toLocaleString('pt-BR')}`
                : `${summary.kcal.toLocaleString('pt-BR')} kcal`
            }
            route="/log/refeicao"
          />
          <StatCard
            Icon={Syringe}
            label={strings.today.cards.nextDose}
            value={
              summary.nextDoseAt
                ? new Date(summary.nextDoseAt).toLocaleDateString('pt-BR')
                : (summary.lastDoseLabel ?? strings.today.noDose)
            }
            route="/log/dose"
          />
          {summary.steps !== null ? (
            <StatCard
              Icon={Footprints}
              label={strings.today.cards.steps}
              value={summary.steps.toLocaleString('pt-BR')}
              route="/perfil"
            />
          ) : null}
          <StatCard
            Icon={ClipboardList}
            label={strings.today.cards.symptoms}
            value={
              summary.symptomsCount > 0 ? String(summary.symptomsCount) : strings.today.none
            }
            route="/log/sintoma"
          />
        </View>
      </ScrollView>
    </View>
  );
}
