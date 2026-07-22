import { numberLocale } from '@/i18n/engine';
import { router } from 'expo-router';
import { useEffect, useMemo, type ComponentType, type PropsWithChildren } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LineChart } from 'react-native-gifted-charts';
import { Wheat } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDateBR } from '@/core/datetime';
import { AppText, Card, FitChart, IconChip, WaterRing } from '@/design/components';
import { OverflowFill } from '@/design/components/OverflowWater';
import {
  DrugstoreScaleIcon,
  FootprintsWalkIcon,
  NotesWritingIcon,
  PillRollIcon,
  SyringeInjectIcon,
  UtensilsCrossIcon,
} from '@/design/logIcons';
import {
  BalancePanda,
  DosePanda,
  HappyPanda,
  HydratedPanda,
  MedsPanda,
  SlimmerPanda,
  ThirstyPanda,
} from '@/design/pandas';
import { reportCaloricBalance, useMascot } from '@/features/today/mascotSignal';
import { fonts, spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { estimateRelativeCurve } from '@/features/pk/pharmacokinetics';
import { useTodaySummary } from '@/features/today/useTodaySummary';
import { strings } from '@/i18n/pt-BR';
import { formatVolume, mlToDisplay, volumeUnit } from '@/core/units';

const fmt = (n: number, digits = 0) =>
  n.toLocaleString(numberLocale(), { maximumFractionDigits: digits });

function Box({
  index,
  route,
  flex,
  children,
}: PropsWithChildren<{ index: number; route?: string; flex?: boolean }>) {
  const card = <Card style={{ gap: spacing.sm, flex: flex ? 1 : undefined }}>{children}</Card>;
  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(index * 70)}
      style={flex ? { flex: 1 } : undefined}
    >
      {route ? (
        <Pressable
          accessibilityRole="button"
          style={flex ? { flex: 1 } : undefined}
          onPress={() => router.push(route as never)}
        >
          {card}
        </Pressable>
      ) : (
        card
      )}
    </Animated.View>
  );
}

function TitleRow({ Anim, title }: { Anim: ComponentType<{ size?: number }>; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <IconChip size={32}>
        <Anim size={16} />
      </IconChip>
      <AppText variant="title">{title}</AppText>
    </View>
  );
}

function MiniStat({
  Anim,
  label,
  value,
  route,
  index,
}: {
  Anim: ComponentType<{ size?: number }>;
  label: string;
  value: string;
  route?: string;
  index: number;
}) {
  const card = (
    <Card style={{ gap: spacing.xs, flex: 1, justifyContent: 'center' }}>
      <IconChip size={30} wiggleKey={value}>
        <Anim size={16} />
      </IconChip>
      <AppText variant="caption" muted numberOfLines={1}>
        {label}
      </AppText>
      <AppText style={{ fontFamily: fonts.semibold }}>{value}</AppText>
    </Card>
  );
  return (
    <Animated.View entering={FadeInDown.duration(420).delay(index * 70)} style={{ flex: 1 }}>
      {route ? (
        <Pressable
          accessibilityRole="button"
          style={{ flex: 1 }}
          onPress={() => router.push(route as never)}
        >
          {card}
        </Pressable>
      ) : (
        card
      )}
    </Animated.View>
  );
}

function WheatIcon({ size = 20 }: { size?: number }) {
  const { colors } = useTheme();
  return <Wheat size={size} color={colors.primary} />;
}

function macroGoals(kcalGoal: number) {
  return {
    proteinG: Math.round((kcalGoal * 0.3) / 4),
    carbsG: Math.round((kcalGoal * 0.4) / 4),
    fatG: Math.round((kcalGoal * 0.3) / 9),
    fiberG: Math.round((kcalGoal / 1000) * 14),
  };
}

export function TodayScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const summary = useTodaySummary();
  const mascot = useMascot();
  useEffect(() => {
    if (!summary.loading) {
      reportCaloricBalance(summary.activeCalories - summary.macros.kcal >= 0);
    }
  }, [summary.loading, summary.activeCalories, summary.macros.kcal]);
  const blueEnd = Math.min(0.85, (insets.top + 128) / winH);
  const fadeEnd = Math.min(1, blueEnd + 0.4);
  const progress = summary.waterGoalMl > 0 ? summary.waterMl / summary.waterGoalMl : 0;
  const pk = useMemo(() => estimateRelativeCurve(summary.doses), [summary.doses]);
  const daysToNextDose = summary.daysToNextDose;
  const goalKcal = summary.calorieGoalEffectiveKcal;
  const goals = goalKcal ? macroGoals(goalKcal) : null;

  const nutrientBar = (label: string, value: number, goal: number | null) => {
    const ratio = goal && goal > 0 ? value / goal : 0;
    const barColor = ratio > 1 ? colors.danger : ratio >= 0.85 ? colors.warning : colors.success;
    return (
      <View style={{ gap: 5 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <AppText variant="caption">{label}</AppText>
          <AppText variant="caption" muted>
            <AppText variant="caption" style={{ color: barColor, fontFamily: fonts.semibold }}>
              {fmt(value, 1)} g
            </AppText>
            {goal && goal > 0 ? ` / ${fmt(goal)} g` : ''}
          </AppText>
        </View>
        <View
          style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' }}
        >
          <View
            style={{
              width: `${Math.min(100, ratio * 100)}%`,
              height: '100%',
              backgroundColor: barColor,
              borderRadius: 3,
            }}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        pointerEvents="none"
        colors={[colors.heroStart, colors.heroStart, colors.background, colors.background]}
        locations={[0, blueEnd, fadeEnd, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View
          style={{
            paddingTop: insets.top + spacing.md,
            paddingHorizontal: spacing.md + spacing.xs,
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: spacing.sm,
          }}
        >
          <View style={{ flex: 1, gap: spacing.xs }}>
            <AppText
              style={{
                color: colors.onHero,
                fontFamily: fonts.semibold,
                fontSize: 22,
                lineHeight: 28,
              }}
            >
              {summary.userName
                ? strings.today.greetingWithName.replace('{name}', summary.userName)
                : strings.today.greeting}
            </AppText>
            <AppText variant="display" style={{ color: colors.onHero }}>
              {strings.tabs.today}
            </AppText>
            <AppText variant="caption" style={{ color: colors.onHero, opacity: 0.85 }}>
              {strings.today.summaryLabel} {formatDateBR(new Date())}
            </AppText>
          </View>
          {mascot === 'thirsty' ? (
            <ThirstyPanda width={128} />
          ) : mascot === 'hydrated' ? (
            <HydratedPanda width={128} />
          ) : mascot === 'slimmer' ? (
            <SlimmerPanda width={128} />
          ) : mascot === 'meds' ? (
            <MedsPanda width={128} />
          ) : mascot === 'dose' ? (
            <DosePanda width={128} />
          ) : mascot === 'balance' ? (
            <BalancePanda width={128} />
          ) : (
            <HappyPanda />
          )}
        </View>

        <View style={{ padding: spacing.md, gap: spacing.md }}>
          {/* Linha 1 — água | calorias + fibras */}
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Animated.View entering={FadeInDown.duration(420)} style={{ flex: 1 }}>
              <Pressable
                accessibilityRole="button"
                style={{ flex: 1 }}
                onPress={() => router.push('/log/agua' as never)}
              >
                <Card
                  style={{ gap: spacing.sm, overflow: 'hidden', alignItems: 'center', flex: 1 }}
                >
                  <OverflowFill progress={progress} />
                  <View
                    style={{
                      alignItems: 'center',
                      gap: spacing.sm,
                      zIndex: 1,
                      paddingVertical: spacing.xs,
                    }}
                  >
                    <WaterRing progress={progress} size={104}>
                      <AppText
                        style={{ fontFamily: fonts.bold, fontSize: 22, color: colors.text }}
                      >
                        {fmt(Math.round(mlToDisplay(summary.waterMl)))}
                      </AppText>
                      <AppText variant="caption" muted style={{ fontSize: 10 }}>
                        {volumeUnit()}
                      </AppText>
                    </WaterRing>
                    <AppText variant="caption" muted style={{ textAlign: 'center' }}>
                      {formatVolume(summary.waterGoalMl)} {strings.today.ofGoal}
                    </AppText>
                  </View>
                </Card>
              </Pressable>
            </Animated.View>
            <View style={{ flex: 1, gap: spacing.md }}>
              <MiniStat
                index={1}
                Anim={UtensilsCrossIcon}
                label={strings.today.cards.kcal}
                value={`${fmt(summary.macros.kcal)} kcal`}
                route="/log/refeicao"
              />
              <MiniStat
                index={1}
                Anim={WheatIcon}
                label={strings.today.cards.fiber}
                value={`${fmt(summary.macros.fiberG, 1)} g`}
                route="/log/refeicao"
              />
            </View>
          </View>

          {/* Linha 2 — balanço calórico | atividades */}
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Box index={2} flex>
              <TitleRow Anim={DrugstoreScaleIcon} title={strings.today.balanceSection} />
              {(() => {
                const kcalIn = Math.round(summary.macros.kcal);
                const kcalOut = Math.round(summary.activeCalories);
                const diff = kcalOut - kcalIn;
                const state = diff > 100 ? 'win' : diff >= -100 ? 'even' : 'over';
                const message =
                  state === 'win'
                    ? strings.today.balanceWin
                    : state === 'even'
                      ? strings.today.balanceEven
                      : strings.today.balanceOver;
                return (
                  <>
                    <View style={{ gap: 2 }}>
                      <AppText variant="caption" muted>
                        {strings.today.balanceGained}
                      </AppText>
                      <AppText style={{ fontFamily: fonts.semibold }}>{fmt(kcalIn)} kcal</AppText>
                    </View>
                    <View style={{ gap: 2 }}>
                      <AppText variant="caption" muted>
                        {strings.today.balanceBurned}
                      </AppText>
                      <AppText style={{ fontFamily: fonts.semibold }}>{fmt(kcalOut)} kcal</AppText>
                    </View>
                    <AppText variant="caption" muted>
                      {message}
                    </AppText>
                  </>
                );
              })()}
            </Box>
            <Box index={2} flex route="/progresso">
              <TitleRow Anim={FootprintsWalkIcon} title={strings.today.activitySection} />
              {summary.steps !== null || summary.activeCalories > 0 ? (
                <>
                  <View style={{ gap: 2 }}>
                    <AppText variant="caption" muted>
                      {strings.today.burnedLabel}
                    </AppText>
                    <AppText style={{ fontFamily: fonts.semibold }}>
                      {fmt(summary.activeCalories)} kcal
                    </AppText>
                  </View>
                  <View style={{ gap: 2 }}>
                    <AppText variant="caption" muted>
                      {strings.today.stepsLabel}
                    </AppText>
                    <AppText style={{ fontFamily: fonts.semibold }}>
                      {summary.steps !== null ? fmt(summary.steps) : '—'}
                    </AppText>
                  </View>
                </>
              ) : (
                <AppText variant="caption" muted>
                  {strings.today.activityHint}
                </AppText>
              )}
            </Box>
          </View>

          {/* Linha 3 — saúde */}
          <Box index={3} route="/progresso">
            <TitleRow Anim={NotesWritingIcon} title={strings.today.healthSection} />
            {summary.healthLatest.sleepHours !== null ||
            summary.healthLatest.restingHr !== null ||
            summary.healthLatest.spo2 !== null ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
                {summary.healthLatest.sleepHours !== null ? (
                  <Metric
                    label={strings.today.healthLabels.sleep}
                    value={`${fmt(summary.healthLatest.sleepHours, 1)} h`}
                  />
                ) : null}
                {summary.healthLatest.sleepEfficiencyPct !== null ? (
                  <Metric
                    label={strings.today.healthLabels.sleepQuality}
                    value={`${fmt(summary.healthLatest.sleepEfficiencyPct)}%`}
                  />
                ) : null}
                {summary.healthLatest.breathingDisturbances !== null ? (
                  <Metric
                    label={strings.today.healthLabels.breathing}
                    value={`${fmt(summary.healthLatest.breathingDisturbances, 1)}/h`}
                  />
                ) : null}
                {summary.healthLatest.restingHr !== null ? (
                  <Metric
                    label={strings.today.healthLabels.restingHr}
                    value={`${fmt(summary.healthLatest.restingHr)} bpm`}
                  />
                ) : null}
                {summary.healthLatest.spo2 !== null ? (
                  <Metric
                    label={strings.today.healthLabels.spo2}
                    value={`${fmt(summary.healthLatest.spo2)}%`}
                  />
                ) : null}
                {summary.healthLatest.respiratoryRate !== null ? (
                  <Metric
                    label={strings.today.healthLabels.respiratoryRate}
                    value={`${fmt(summary.healthLatest.respiratoryRate)} rpm`}
                  />
                ) : null}
              </View>
            ) : (
              <AppText variant="caption" muted>
                {strings.today.healthEmpty}
              </AppText>
            )}
          </Box>

          {/* Linha 4 — refeição diária (barras) */}
          <Box index={4} route="/log/refeicao">
            <TitleRow Anim={UtensilsCrossIcon} title={strings.today.mealsSection} />
            <AppText style={{ fontFamily: fonts.bold, fontSize: 26, color: colors.text }}>
              {fmt(summary.macros.kcal)}{' '}
              <AppText variant="caption" muted>
                {strings.today.totalKcal}
                {goalKcal ? ` · ${strings.today.goalLabel}: ${fmt(goalKcal)}` : ''}
              </AppText>
            </AppText>
            <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
              {nutrientBar(
                strings.today.nutrition.protein,
                summary.macros.proteinG,
                goals?.proteinG ?? null,
              )}
              {nutrientBar(
                strings.today.nutrition.carbs,
                summary.macros.carbsG,
                goals?.carbsG ?? null,
              )}
              {nutrientBar(strings.today.nutrition.fat, summary.macros.fatG, goals?.fatG ?? null)}
              {nutrientBar(
                strings.today.nutrition.fiber,
                summary.macros.fiberG,
                goals?.fiberG ?? null,
              )}
            </View>
          </Box>

          {/* Linha 5 — nível estimado da medicação */}
          <Box index={5} route="/medicacao">
            <TitleRow Anim={SyringeInjectIcon} title={strings.today.medicationSection} />
            {pk ? (
              <>
                <FitChart>
                  {(width) => (
                    <LineChart
                      data={pk.points.map((p, i, arr) => ({
                        value: Math.round(p.level * 100),
                        hideDataPoint: i !== pk.peakIndex && i !== arr.length - 1,
                        dataPointText:
                          i === pk.peakIndex
                            ? `${fmt(pk.latestDoseMg, 1)} mg`
                            : i === arr.length - 1
                              ? `≈ ${fmt(pk.endMgEstimate, 1)} mg`
                              : undefined,
                        textShiftY: -6,
                        textShiftX: i === arr.length - 1 ? -30 : -16,
                      }))}
                      color={colors.primary}
                      thickness={3}
                      height={110}
                      width={width - 40}
                      initialSpacing={8}
                      endSpacing={40}
                      maxValue={125}
                      areaChart
                      startFillColor={colors.primary}
                      startOpacity={0.16}
                      endFillColor={colors.primary}
                      endOpacity={0.01}
                      dataPointsColor={colors.primary}
                      dataPointsRadius={4}
                      textColor={colors.text}
                      textFontSize={11}
                      hideAxesAndRules
                      hideYAxisText
                      adjustToWidth
                      curved
                      disableScroll
                    />
                  )}
                </FitChart>
                <AppText variant="caption" muted>
                  {strings.progress.pkLastDose}: {fmt(pk.latestDoseMg, 1)} mg ·{' '}
                  {strings.progress.pkIn7Days}: ≈ {fmt(pk.endMgEstimate, 1)} mg
                </AppText>
              </>
            ) : (
              <AppText variant="caption" muted>
                {strings.today.noDoseYet}
              </AppText>
            )}
            <AppText variant="caption" muted>
              {strings.progress.pkDisclaimer}
            </AppText>
          </Box>

          {/* Linha 6 — próxima dose | sintomas */}
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <MiniStat
              index={6}
              Anim={SyringeInjectIcon}
              label={strings.today.cards.nextDose}
              value={
                summary.nextDoseAt
                  ? `${new Date(summary.nextDoseAt).toLocaleDateString('pt-BR')} · ${daysToNextDose}d`
                  : (summary.lastDoseLabel ?? strings.today.noDose)
              }
              route="/log/dose"
            />
            <MiniStat
              index={6}
              Anim={NotesWritingIcon}
              label={strings.today.cards.symptoms}
              value={summary.symptomsCount > 0 ? String(summary.symptomsCount) : strings.today.none}
              route="/log/sintoma"
            />
          </View>

          {/* Linha 7 — lembretes de medicação */}
          <Box index={7} route="/remedios">
            <TitleRow Anim={PillRollIcon} title={strings.today.medRemindersSection} />
            {summary.intakes.length > 0 ? (
              <>
                {summary.intakes.slice(0, 4).map((i) => (
                  <View
                    key={i.intakeId}
                    style={{ flexDirection: 'row', justifyContent: 'space-between' }}
                  >
                    <AppText variant="caption">
                      {i.time} · {i.name}
                    </AppText>
                    <AppText
                      variant="caption"
                      style={{ color: i.takenAt ? colors.success : colors.textMuted }}
                    >
                      {i.takenAt ? strings.meds.takenDone : strings.meds.taken}
                    </AppText>
                  </View>
                ))}
                {summary.medsToday ? (
                  <AppText variant="caption" muted>
                    {strings.meds.cardLabel}: {summary.medsToday.taken}/{summary.medsToday.total}
                  </AppText>
                ) : null}
              </>
            ) : (
              <AppText variant="caption" muted>
                {strings.today.medRemindersEmpty}
              </AppText>
            )}
          </Box>

          {/* Linha 8 — observações */}
          {summary.insights.length > 0 ? (
            <Box index={8}>
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
            </Box>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexBasis: '45%', flexGrow: 1 }}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <AppText style={{ fontFamily: fonts.semibold }}>{value}</AppText>
    </View>
  );
}
