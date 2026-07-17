import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { formatDateBR, formatTimeHM, localDayKey, parseDateTimeBR } from '@/core/datetime';
import { parseDecimalBR } from '@/core/text';
import type { FoodItem, FoodLog, LogOrigin, MealPeriod } from '@/core/types';
import type { FoodCandidate } from '@/services/vision/VisionProvider';
import { getVisionProvider, isScanConfigured } from '@/services/vision/VisionProvider';
import {
  AppText,
  Button,
  Card,
  DateTimeField,
  EmptyState,
  Input,
  ListRow,
  NumberField,
  Screen,
  SegmentedChips,
} from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { isLocked } from '@/features/premium/gates';
import { usePremium } from '@/features/premium/usePremium';
import { Dish, DishItemInput, deleteDish, listDishes, saveDish } from '@/db/dishRepo';
import { searchFoods } from '@/db/foodItemsRepo';
import { addFoodLog, deleteFoodLog, foodForDay } from '@/db/foodLogRepo';
import { strings } from '@/i18n/pt-BR';
import { Utensils } from 'lucide-react-native';

type Mode = 'search' | 'manual' | 'scan';

interface PlateItem extends DishItemInput {
  origin: LogOrigin;
}

function modeOptions(scanLocked: boolean) {
  return [
    { value: 'search' as Mode, label: strings.meal.searchTab },
    { value: 'manual' as Mode, label: strings.meal.manualTab },
    ...(isScanConfigured()
      ? [
          {
            value: 'scan' as Mode,
            label: scanLocked
              ? `${strings.meal.scanTab} · ${strings.premium.lockedTag}`
              : strings.meal.scanTab,
          },
        ]
      : []),
  ];
}

const PERIOD_ORDER: MealPeriod[] = ['cafe', 'almoco', 'lanche', 'jantar', 'ceia'];

const PERIOD_OPTIONS = PERIOD_ORDER.map((value) => ({
  value,
  label: strings.meal.periods[value],
}));

/** Sugere o período da refeição a partir da hora do registro. */
export function suggestPeriod(hour: number): MealPeriod {
  if (hour < 10) return 'cafe';
  if (hour < 14) return 'almoco';
  if (hour < 17) return 'lanche';
  if (hour < 21) return 'jantar';
  return 'ceia';
}

function scaled(per100: number | null | undefined, portion: number): number | null {
  return per100 === null || per100 === undefined
    ? null
    : Math.round(((per100 * portion) / 100) * 10) / 10;
}

function fmtKcal(v: number | null): string {
  return v !== null ? `${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kcal` : '—';
}

export function MealScreen() {
  const { colors } = useTheme();
  const { premium } = usePremium();
  const scanLocked = isLocked('scanFood', premium);
  const [mode, setMode] = useState<Mode>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [portionStr, setPortionStr] = useState('100');
  const [manualName, setManualName] = useState('');
  const [manualWeightStr, setManualWeightStr] = useState('');
  const [manualBase, setManualBase] = useState<FoodItem | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanCandidates, setScanCandidates] = useState<FoodCandidate[]>([]);
  const [fromScan, setFromScan] = useState(false);
  const [plate, setPlate] = useState<PlateItem[]>([]);
  const [dishName, setDishName] = useState('');
  const [plateSaved, setPlateSaved] = useState(false);
  const [savedDishes, setSavedDishes] = useState<Dish[]>([]);
  const [period, setPeriod] = useState<MealPeriod>(suggestPeriod(new Date().getHours()));
  const [periodTouched, setPeriodTouched] = useState(false);
  const [dayList, setDayList] = useState<FoodLog[]>([]);
  const [dateStr, setDateStr] = useState(formatDateBR(new Date()));
  const [timeStr, setTimeStr] = useState(formatTimeHM(new Date()));
  const at = parseDateTimeBR(dateStr, timeStr);
  const dayKey = at ? localDayKey(at) : '';

  const loadDay = useCallback(async (day: Date) => {
    setDayList(await foodForDay(db, day));
  }, []);

  const loadDishes = useCallback(async () => {
    setSavedDishes(await listDishes(db));
  }, []);

  useEffect(() => {
    loadDay(parseDateTimeBR(dateStr, timeStr) ?? new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDay, dayKey]);

  useEffect(() => {
    loadDishes();
  }, [loadDishes]);

  // Hora editada sugere o período, até o usuário escolher manualmente.
  useEffect(() => {
    if (periodTouched) return;
    const parsed = parseDateTimeBR(dateStr, timeStr);
    if (parsed) setPeriod(suggestPeriod(parsed.getHours()));
  }, [dateStr, timeStr, periodTouched]);

  useEffect(() => {
    let active = true;
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    searchFoods(db, query).then((r) => {
      if (active) setResults(r);
    });
    return () => {
      active = false;
    };
  }, [query]);

  // Modo manual: procura a base nutricional pelo nome digitado.
  useEffect(() => {
    let active = true;
    if (manualName.trim().length < 2) {
      setManualBase(null);
      return;
    }
    searchFoods(db, manualName).then((r) => {
      if (active) setManualBase(r[0] ?? null);
    });
    return () => {
      active = false;
    };
  }, [manualName]);

  const portion = parseDecimalBR(portionStr);
  const manualGrams = parseDecimalBR(manualWeightStr);
  const plateKcal = plate.reduce((acc, i) => acc + (i.calories ?? 0), 0);

  function pushToPlate(item: PlateItem) {
    setPlate((p) => [...p, item]);
    setPlateSaved(false);
  }

  function addSelectedToPlate() {
    if (!selected || portion === null || portion <= 0) return;
    pushToPlate({
      name: selected.name,
      grams: portion,
      calories: scaled(selected.calories, portion),
      proteinG: scaled(selected.proteinG, portion),
      carbsG: scaled(selected.carbsG, portion),
      fatG: scaled(selected.fatG, portion),
      fiberG: scaled(selected.fiberG, portion),
      origin: fromScan ? 'scan' : 'manual',
    });
    setSelected(null);
    setQuery('');
    setPortionStr('100');
    setFromScan(false);
  }

  function addManualToPlate() {
    if (!manualName.trim() || manualGrams === null || manualGrams <= 0) return;
    pushToPlate({
      name: manualName.trim(),
      grams: manualGrams,
      calories: manualBase ? scaled(manualBase.calories, manualGrams) : null,
      proteinG: manualBase ? scaled(manualBase.proteinG, manualGrams) : null,
      carbsG: manualBase ? scaled(manualBase.carbsG, manualGrams) : null,
      fatG: manualBase ? scaled(manualBase.fatG, manualGrams) : null,
      fiberG: manualBase ? scaled(manualBase.fiberG, manualGrams) : null,
      origin: fromScan ? 'scan' : 'manual',
    });
    setManualName('');
    setManualWeightStr('');
    setFromScan(false);
  }

  async function addPlateToMeal() {
    if (plate.length === 0 || !at) return;
    for (const item of plate) {
      await addFoodLog(db, {
        name: item.name,
        portionGrams: item.grams,
        calories: item.calories,
        proteinG: item.proteinG,
        carbsG: item.carbsG,
        fatG: item.fatG,
        fiberG: item.fiberG,
        origin: item.origin,
        period,
        at,
      });
    }
    setPlate([]);
    setDishName('');
    await loadDay(at);
  }

  async function savePlate() {
    if (plate.length === 0 || !dishName.trim()) return;
    await saveDish(
      db,
      dishName.trim(),
      plate.map(({ origin: _origin, ...item }) => item),
      at ?? new Date(),
    );
    setDishName('');
    setPlateSaved(true);
    await loadDishes();
  }

  function loadDishIntoPlate(dish: Dish) {
    setPlate((p) => [
      ...p,
      ...dish.items.map(({ id: _id, dishId: _dishId, ...item }) => ({
        ...item,
        origin: 'manual' as LogOrigin,
      })),
    ]);
    setPlateSaved(false);
  }

  async function scanPhoto(fromCamera: boolean) {
    setScanError(null);
    const picked = fromCamera
      ? await (async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) return null;
          return ImagePicker.launchCameraAsync({ quality: 0.6 });
        })()
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, mediaTypes: 'images' });
    if (!picked || picked.canceled || !picked.assets?.[0]?.uri) return;
    setScanning(true);
    setScanCandidates([]);
    try {
      const result = await getVisionProvider().recognizeFood(picked.assets[0].uri);
      setScanCandidates(result.candidates);
    } catch (e) {
      setScanError(e instanceof Error ? e.message : strings.meal.scanFailed);
    } finally {
      setScanning(false);
    }
  }

  async function chooseCandidate(candidate: FoodCandidate) {
    setFromScan(true);
    const matches = await searchFoods(db, candidate.label);
    if (matches.length > 0) {
      setSelected(matches[0]);
      setPortionStr(String(Math.round(candidate.portionGrams ?? 100)));
      setMode('search');
    } else {
      setManualName(candidate.label);
      setManualWeightStr(String(Math.round(candidate.portionGrams ?? 100)));
      setMode('manual');
    }
  }

  const dayGroups = useMemo(() => {
    const keys: (MealPeriod | 'none')[] = [...PERIOD_ORDER, 'none'];
    return keys
      .map((key) => ({
        key,
        label: key === 'none' ? strings.meal.noPeriod : strings.meal.periods[key],
        items: dayList.filter((f) => (f.period ?? 'none') === key),
      }))
      .filter((g) => g.items.length > 0);
  }, [dayList]);

  const dayKcal = dayList.reduce((acc, f) => acc + (f.calories ?? 0), 0);

  return (
    <Screen>
      <AppText variant="display">{strings.meal.title}</AppText>
      <Card style={{ gap: spacing.md }}>
        <AppText variant="caption" muted>
          {strings.meal.periodLabel}
        </AppText>
        <SegmentedChips
          options={PERIOD_OPTIONS}
          value={period}
          onChange={(v) => {
            setPeriodTouched(true);
            setPeriod(v);
          }}
        />
        <DateTimeField
          dateValue={dateStr}
          timeValue={timeStr}
          onChangeDate={setDateStr}
          onChangeTime={setTimeStr}
        />
      </Card>
      <SegmentedChips
        options={modeOptions(scanLocked)}
        value={mode}
        onChange={(v) => {
          if (v === 'scan' && scanLocked) {
            router.push('/assinatura' as never);
            return;
          }
          setMode(v);
        }}
      />

      {mode === 'search' ? (
        <Card style={{ gap: spacing.md }}>
          <Input
            label={strings.meal.searchTab}
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setSelected(null);
            }}
            placeholder={strings.meal.searchPlaceholder}
          />
          {selected ? (
            <View style={{ gap: spacing.md }}>
              <AppText variant="title">{selected.name}</AppText>
              <AppText variant="caption" muted>
                {selected.calories ?? '—'} kcal · P {selected.proteinG ?? '—'} g · C{' '}
                {selected.carbsG ?? '—'} g · G {selected.fatG ?? '—'} g ({strings.meal.per100g})
              </AppText>
              <NumberField
                label={strings.meal.portionLabel}
                value={portionStr}
                onChangeText={setPortionStr}
                suffix="g"
              />
              {portion !== null && portion > 0 ? (
                <AppText>
                  {scaled(selected.calories, portion) ?? '—'} kcal · P{' '}
                  {scaled(selected.proteinG, portion) ?? '—'} g · C{' '}
                  {scaled(selected.carbsG, portion) ?? '—'} g · G{' '}
                  {scaled(selected.fatG, portion) ?? '—'} g
                </AppText>
              ) : null}
              <Button
                label={strings.meal.addToPlate}
                onPress={addSelectedToPlate}
                disabled={portion === null || portion <= 0}
              />
            </View>
          ) : query.trim().length >= 2 && results.length === 0 ? (
            <View style={{ gap: spacing.sm }}>
              <EmptyState title={strings.meal.noResults} hint="" Icon={Utensils} />
              <Button
                label={strings.meal.manualFallback}
                variant="secondary"
                onPress={() => setMode('manual')}
              />
            </View>
          ) : (
            results.map((item) => (
              <ListRow
                key={item.id}
                title={item.name}
                subtitle={item.category ?? undefined}
                right={item.calories !== null ? `${item.calories} kcal` : undefined}
                onPress={() => setSelected(item)}
              />
            ))
          )}
        </Card>
      ) : mode === 'scan' ? (
        <Card style={{ gap: spacing.md }}>
          <Button label={strings.meal.scanButton} onPress={() => scanPhoto(true)} />
          <Button
            label={strings.meal.scanGallery}
            variant="secondary"
            onPress={() => scanPhoto(false)}
          />
          <AppText variant="caption" muted>
            {strings.meal.scanPrivacy}
          </AppText>
          {scanning ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <ActivityIndicator />
              <AppText muted>{strings.meal.scanning}</AppText>
            </View>
          ) : null}
          {scanError ? (
            <AppText variant="caption" muted>
              {scanError}
            </AppText>
          ) : null}
          {scanCandidates.length > 0 ? (
            <View>
              <AppText variant="title">{strings.meal.scanPick}</AppText>
              {scanCandidates.map((c) => (
                <ListRow
                  key={c.label}
                  title={c.label}
                  subtitle={c.portionGrams ? `≈ ${Math.round(c.portionGrams)} g` : undefined}
                  right={`${Math.round(c.confidence * 100)}% ${strings.meal.scanConfidence}`}
                  onPress={() => chooseCandidate(c)}
                />
              ))}
            </View>
          ) : null}
        </Card>
      ) : (
        <Card style={{ gap: spacing.md }}>
          <Input
            label={strings.meal.nameLabel}
            value={manualName}
            onChangeText={setManualName}
            placeholder={strings.meal.nameLabel}
          />
          <NumberField
            label={strings.meal.weightLabel}
            value={manualWeightStr}
            onChangeText={setManualWeightStr}
            suffix="g"
            placeholder="0"
          />
          {manualBase ? (
            <AppText variant="caption" muted>
              {strings.meal.baseLabel}: {manualBase.name} · {manualBase.calories ?? '—'} kcal{' '}
              {strings.meal.per100g}
            </AppText>
          ) : manualName.trim().length >= 2 ? (
            <AppText variant="caption" muted>
              {strings.meal.noBase}
            </AppText>
          ) : null}
          {manualBase && manualGrams !== null && manualGrams > 0 ? (
            <AppText>
              {fmtKcal(scaled(manualBase.calories, manualGrams))} · P{' '}
              {scaled(manualBase.proteinG, manualGrams) ?? '—'} g · C{' '}
              {scaled(manualBase.carbsG, manualGrams) ?? '—'} g · G{' '}
              {scaled(manualBase.fatG, manualGrams) ?? '—'} g
            </AppText>
          ) : null}
          <Button
            label={strings.meal.addToPlate}
            onPress={addManualToPlate}
            disabled={!manualName.trim() || manualGrams === null || manualGrams <= 0}
          />
        </Card>
      )}

      {plate.length > 0 ? (
        <Card style={{ gap: spacing.sm }}>
          <AppText variant="title">{strings.meal.plateSection}</AppText>
          {plate.map((item, index) => (
            <ListRow
              key={`${item.name}-${index}`}
              title={item.name}
              subtitle={item.grams !== null ? `${item.grams} g` : undefined}
              right={fmtKcal(item.calories)}
              onDelete={() => setPlate((p) => p.filter((_, i) => i !== index))}
            />
          ))}
          <AppText>
            {strings.meal.plateTotal}: {fmtKcal(plateKcal)}
          </AppText>
          <Button label={strings.meal.addToMeal} onPress={addPlateToMeal} disabled={!at} />
          <Input
            label={strings.meal.plateNameLabel}
            value={dishName}
            onChangeText={setDishName}
            placeholder={strings.meal.plateNameLabel}
          />
          <Button
            label={strings.meal.savePlate}
            variant="secondary"
            onPress={savePlate}
            disabled={!dishName.trim()}
          />
          {plateSaved ? (
            <AppText variant="caption" style={{ color: colors.success }}>
              {strings.meal.plateSaved}
            </AppText>
          ) : null}
        </Card>
      ) : null}

      {savedDishes.length > 0 ? (
        <Card>
          <AppText variant="title">{strings.meal.savedPlates}</AppText>
          {savedDishes.map((dish) => (
            <ListRow
              key={dish.id}
              title={dish.name}
              subtitle={`${dish.items.length} ${strings.meal.itemsSuffix}`}
              right={fmtKcal(dish.items.reduce((acc, i) => acc + (i.calories ?? 0), 0))}
              onPress={() => loadDishIntoPlate(dish)}
              onDelete={async () => {
                await deleteDish(db, dish.id);
                await loadDishes();
              }}
            />
          ))}
        </Card>
      ) : null}

      {dayGroups.length > 0 ? (
        <Card>
          <AppText variant="title">{strings.meal.dayList}</AppText>
          {dayGroups.map((group) => (
            <View key={group.key} style={{ marginTop: spacing.sm }}>
              <AppText variant="caption" muted>
                {group.label} · {fmtKcal(group.items.reduce((acc, f) => acc + (f.calories ?? 0), 0))}
              </AppText>
              {group.items.map((f) => (
                <ListRow
                  key={f.id}
                  title={f.name}
                  subtitle={f.portionGrams ? `${f.portionGrams} g` : undefined}
                  right={f.calories !== null ? fmtKcal(f.calories) : undefined}
                  onDelete={async () => {
                    await deleteFoodLog(db, f.id);
                    await loadDay(at ?? new Date());
                  }}
                />
              ))}
            </View>
          ))}
          <AppText muted style={{ marginTop: spacing.sm }}>
            {strings.meal.todayTotal}: {fmtKcal(dayKcal)}
          </AppText>
        </Card>
      ) : null}
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
