import { router } from 'expo-router';
import { useMemo, type ComponentType, type PropsWithChildren } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LineChart } from 'react-native-gifted-charts';
import { Scale, TrendingUp, Trophy } from 'lucide-react-native';
import { formatDateTimeShort } from '@/core/datetime';
import { AppText, Card, FitChart, HeroHeader, IconChip, WaterRing } from '@/design/components';
import { OverflowDrips, OverflowFill } from '@/design/components/OverflowWater';
import {
  FootprintsWalkIcon,
  NotesWritingIcon,
  PillRollIcon,
  SyringeInjectIcon,
  UtensilsCrossIcon,
} from '@/design/logIcons';
import { fonts, spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { estimateRelativeCurve } from '@/features/pk/pharmacokinetics';
import { useTodaySummary } from '@/features/today/useTodaySummary';
import { strings } from '@/i18n/pt-BR';

const fmt = (n: number, digits = 0) =>
  n.toLocaleString('pt-BR', { maximumFractionDigits: digits });

function Box({
  index,
  route,
  children,
}: PropsWithChildren<{ index: number; route?: string }>) {
  const card = <Card style={{ gap: spacing.sm }}>{children}</Card>;
  return (
    <Animated.View entering={FadeInDown.duration(420).delay(index * 70)}>
      {route ? (
        <Pressable accessibilityRole="button" onPress={() => router.push(route as never)}>
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

function StatCard({
  Anim,
  label,
  value,
  route,
  index,
}: {
  Anim: ComponentType<{ size?: number }>;
  label: string;
  value: string;
  route: string;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(index * 70)}
      style={{ flexBasis: '47%', flexGrow: 1 }}
    >
      <Pressable accessibilityRole="button" onPress={() => router.push(route as never)}>
        <Card style={{ gap: spacing.sm }}>
          <IconChip size={36} wiggleKey={value}>
            <Anim size={18} />
          </IconChip>
          <AppText variant="caption" muted>
            {label}
          </AppText>
          <AppText style={{ fontFamily: fonts.semibold }} numberOfLines={1}>
            {value}
          </AppText>
        </Card>
      </Pressable>
    </Animated.View>
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

export function TodayScreen() {
  const { colors } = useTheme();
  const summary = useTodaySummary();
  const progress = summary.waterGoalMl > 0 ? summary.waterMl / summary.waterGoalMl : 0;
  const pk = useMemo(() => estimateRelativeCurve(summary.doses), [summary.doses]);
  const daysToNextDose = summary.nextDoseAt
    ? Math.max(0, Math.ceil((new Date(summary.nextDoseAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: spacing.xl }}
    >
      <HeroHeader>
        <AppText
          style={{ color: colors.onHero, fontFamily: fonts.semibold, fontSize: 22, lineHeight: 28 }}
        >
          {summary.userName
            ? strings.today.greetingWithName.replace('{name}', summary.userName)
            : strings.today.greeting}
        </AppText>
        <AppText variant="display" style={{ color: colors.onHero }}>
          {strings.tabs.today}
        </AppText>
        <AppText variant="caption" style={{ color: colors.onHero, opacity: 0.85 }}>
          {strings.today.summaryLabel}
        </AppText>
      </HeroHeader>
      <View style={{ padding: spacing.md, gap: spacing.md, marginTop: -spacing.lg, zIndex: 1 }}>
        {/* 1 — Água (transborda quando passa de 100%) */}
        <Animated.View entering={FadeInDown.duration(420)}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/log/agua' as never)}>
            <Card style={{ gap: spacing.sm, overflow: 'hidden' }}>
              <OverflowFill progress={progress} />
              <View
                style={{
                  alignItems: 'center',
                  gap: spacing.md,
                  paddingVertical: spacing.sm,
                  zIndex: 1,
                }}
              >
                <View>
                  <WaterRing progress={progress} size={148}>
                    <AppText style={{ fontFamily: fonts.bold, fontSize: 34, color: colors.text }}>
                      {fmt(summary.waterMl)}
                    </AppText>
                    <AppText variant="caption" muted>
                      {strings.today.waterRing}
                    </AppText>
                  </WaterRing>
                  <OverflowDrips active={progress > 1} />
                </View>
                <AppText variant="caption" muted>
                  {fmt(summary.waterGoalMl)} ml {strings.today.ofGoal}
                </AppText>
              </View>
            </Card>
          </Pressable>
        </Animated.View>

        {/* 2 — Peso */}
        <Box index={1} route="/log/peso">
          <AppText variant="title">{strings.today.weightSection}</AppText>
          {summary.weightSeries.length >= 2 ? (
            <FitChart>
              {(width) => {
                // Escala na faixa real dos pesos (senão a linha fica achatada).
                const values = summary.weightSeries.map((w) => w.weightKg);
                const minV = Math.min(...values);
                const maxV = Math.max(...values);
                const pad = Math.max(1, (maxV - minV) * 0.35);
                return (
                  <LineChart
                    data={summary.weightSeries.map((w, i, arr) => ({
                      value: w.weightKg,
                      dataPointText: w.weightKg.toLocaleString('pt-BR', {
                        maximumFractionDigits: 1,
                      }),
                      // Rótulos alternam acima/abaixo da linha para não se sobrepor;
                      // o último é puxado para dentro para não cortar na borda.
                      textShiftY: i % 2 === 0 ? -8 : 20,
                      textShiftX: i === arr.length - 1 ? -24 : -8,
                    }))}
                    color={colors.primary}
                    thickness={3}
                    height={120}
                    width={width - 64}
                    yAxisOffset={minV - pad}
                    maxValue={maxV - minV + 2 * pad}
                    initialSpacing={16}
                    endSpacing={48}
                    dataPointsColor={colors.primary}
                    dataPointsRadius={3.5}
                    textColor={colors.text}
                    textFontSize={11}
                    textShiftY={-8}
                    textShiftX={-8}
                    hideAxesAndRules
                    hideYAxisText
                    adjustToWidth
                    curved
                    disableScroll
                  />
                );
              }}
            </FitChart>
          ) : (
            <AppText variant="caption" muted>
              {strings.progress.empty}
            </AppText>
          )}
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <AppText style={{ fontFamily: fonts.bold, fontSize: 34, lineHeight: 40 }}>
              {summary.lastWeightKg !== null
                ? `${fmt(summary.lastWeightKg, 1)} kg`
                : strings.today.noWeight}
            </AppText>
            {summary.goalWeightKg !== null ? (
              <AppText variant="caption" muted>
                {strings.today.goalLabel}: {fmt(summary.goalWeightKg, 1)} kg
              </AppText>
            ) : null}
          </View>
        </Box>

        {/* 3 — Cards rápidos: calorias, próxima dose e sintomas */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          <StatCard
            index={2}
            Anim={UtensilsCrossIcon}
            label={strings.today.cards.kcal}
            value={`${fmt(summary.macros.kcal)} kcal`}
            route="/log/refeicao"
          />
          <StatCard
            index={2}
            Anim={SyringeInjectIcon}
            label={strings.today.cards.nextDose}
            value={
              summary.nextDoseAt
                ? `${new Date(summary.nextDoseAt).toLocaleDateString('pt-BR')} · ${daysToNextDose}d`
                : (summary.lastDoseLabel ?? strings.today.noDose)
            }
            route="/log/dose"
          />
          {/* Sintomas: contador à esquerda, últimos 7 com data e hora na lateral */}
          <Animated.View
            entering={FadeInDown.duration(420).delay(3 * 70)}
            style={{ flexBasis: '47%', flexGrow: 1 }}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/log/sintoma' as never)}
            >
              <Card style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ gap: spacing.sm }}>
                  <IconChip size={36} wiggleKey={String(summary.symptomsCount)}>
                    <NotesWritingIcon size={18} />
                  </IconChip>
                  <AppText variant="caption" muted>
                    {strings.today.cards.symptoms}
                  </AppText>
                  <AppText style={{ fontFamily: fonts.semibold }}>
                    {summary.symptomsCount > 0
                      ? String(summary.symptomsCount)
                      : strings.today.none}
                  </AppText>
                </View>
                {summary.recentSymptoms.length > 0 ? (
                  <View style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
                    {summary.recentSymptoms.map((s) => (
                      <View
                        key={s.id}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          gap: spacing.sm,
                        }}
                      >
                        <AppText variant="caption" numberOfLines={1} style={{ flexShrink: 1 }}>
                          {strings.symptom.kinds[s.kind as keyof typeof strings.symptom.kinds] ??
                            s.kind}{' '}
                          {s.intensity}/5
                        </AppText>
                        <AppText variant="caption" muted>
                          {formatDateTimeShort(s.loggedAt)}
                        </AppText>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Card>
            </Pressable>
          </Animated.View>
        </View>

        {/* 4 — Nível estimado da medicação */}
        <Box index={3} route="/log/dose">
          <TitleRow Anim={SyringeInjectIcon} title={strings.today.medicationSection} />
          {pk ? (
            <>
              <FitChart>
                {(width) => (
                  <LineChart
                    data={pk.points.map((p, i, arr) => ({
                      value: Math.round(p.level * 100),
                      // Só o pico da última dose e o fim da projeção têm ponto e rótulo.
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
                    height={96}
                    width={width - 64}
                    initialSpacing={4}
                    endSpacing={48}
                    maxValue={118}
                    dataPointsColor={colors.primary}
                    dataPointsRadius={3.5}
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
              <AppText variant="caption" muted>
                {pk.medKey} · {strings.progress.pkRelative} · {strings.progress.pkProjection}
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

        {/* 4 — Refeição diária */}
        <Box index={3} route="/log/refeicao">
          <TitleRow Anim={UtensilsCrossIcon} title={strings.today.mealsSection} />
          <AppText style={{ fontFamily: fonts.bold, fontSize: 26, color: colors.text }}>
            {fmt(summary.macros.kcal)}{' '}
            <AppText variant="caption" muted>
              {strings.today.totalKcal}
              {summary.calorieGoalKcal ? ` · ${strings.today.goalLabel}: ${fmt(summary.calorieGoalKcal)}` : ''}
            </AppText>
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <Metric label={strings.today.nutrition.protein} value={`${fmt(summary.macros.proteinG, 1)} g`} />
            <Metric label={strings.today.nutrition.carbs} value={`${fmt(summary.macros.carbsG, 1)} g`} />
            <Metric label={strings.today.nutrition.fat} value={`${fmt(summary.macros.fatG, 1)} g`} />
            <Metric label={strings.today.nutrition.fiber} value={`${fmt(summary.macros.fiberG, 1)} g`} />
          </View>
        </Box>

        {/* 5 — Atividades */}
        <Box index={4} route="/perfil">
          <TitleRow Anim={FootprintsWalkIcon} title={strings.today.activitySection} />
          {summary.steps !== null || summary.activeCalories > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <Metric label={strings.today.burnedLabel} value={`${fmt(summary.activeCalories)} kcal`} />
              <Metric
                label={strings.today.stepsLabel}
                value={summary.steps !== null ? fmt(summary.steps) : '—'}
              />
            </View>
          ) : (
            <AppText variant="caption" muted>
              {strings.today.activityHint}
            </AppText>
          )}
        </Box>

        {/* 5b — Balanço calórico: consumidas × queimadas */}
        <Box index={4}>
          <AppText variant="title">{strings.today.balanceSection}</AppText>
          {(() => {
            const kcalIn = Math.round(summary.macros.kcal);
            const kcalOut = Math.round(summary.activeCalories);
            const diff = kcalOut - kcalIn;
            const state = diff > 100 ? 'win' : diff >= -100 ? 'even' : 'over';
            const Icon = state === 'win' ? Trophy : state === 'even' ? Scale : TrendingUp;
            const iconColor =
              state === 'win' ? colors.success : state === 'even' ? colors.primary : colors.warning;
            const message =
              state === 'win'
                ? strings.today.balanceWin
                : state === 'even'
                  ? strings.today.balanceEven
                  : strings.today.balanceOver;
            return (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    <Metric label={strings.today.balanceGained} value={`${fmt(kcalIn)} kcal`} />
                    <Metric label={strings.today.balanceBurned} value={`${fmt(kcalOut)} kcal`} />
                  </View>
                  <IconChip size={44}>
                    <Icon size={22} color={iconColor} />
                  </IconChip>
                </View>
                <AppText variant="caption" muted>
                  {message}
                </AppText>
              </>
            );
          })()}
        </Box>

        {/* 6 — Lembretes de medicações */}
        <Box index={5} route="/remedios">
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

        {/* 7 — Saúde (sono, FC, oxigênio, FR) */}
        <Box index={6} route="/perfil">
          <TitleRow Anim={NotesWritingIcon} title={strings.today.healthSection} />
          {summary.healthLatest.sleepHours !== null ||
          summary.healthLatest.restingHr !== null ||
          summary.healthLatest.spo2 !== null ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {summary.healthLatest.sleepHours !== null ? (
                <Metric
                  label={strings.today.healthLabels.sleep}
                  value={`${fmt(summary.healthLatest.sleepHours, 1)} h`}
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

        {/* 8 — Observações (por último) */}
        {summary.insights.length > 0 ? (
          <Box index={7}>
            <AppText variant="title">{strings.insights.section}</AppText>
            {summary.insights.map((insight) => (
              <View key={insight.id} style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    marginTop: 6,
                    backgroundColor: insight.kind === 'positivo' ? colors.success : colors.warning,
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
  );
}
