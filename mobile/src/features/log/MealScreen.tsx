import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { formatDateBR, formatTimeHM, localDayKey, parseDateTimeBR } from '@/core/datetime';
import { parseDecimalBR } from '@/core/text';
import type { FoodItem, FoodLog, LogOrigin, MealPeriod, PortionUnit } from '@/core/types';
import { describeMeal, isDescribeConfigured } from '@/services/nutrition/describeMeal';
import { lookupFoodInfo } from '@/services/nutrition/foodInfo';
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

type Mode = 'search' | 'manual' | 'scan' | 'describe';

interface PlateItem extends DishItemInput {
  origin: LogOrigin;
}

function modeOptions(scanLocked: boolean) {
  const aiLabel = (label: string) =>
    scanLocked ? `${label} · ${strings.premium.lockedTag}` : label;
  return [
    { value: 'search' as Mode, label: strings.meal.searchTab },
    { value: 'manual' as Mode, label: strings.meal.manualTab },
    ...(isDescribeConfigured()
      ? [{ value: 'describe' as Mode, label: aiLabel(strings.meal.describe.tab) }]
      : []),
    ...(isScanConfigured()
      ? [{ value: 'scan' as Mode, label: aiLabel(strings.meal.scanTab) }]
      : []),
  ];
}

const PERIOD_ORDER: MealPeriod[] = ['cafe', 'almoco', 'lanche', 'jantar', 'ceia'];

const periodOptions = () =>
  PERIOD_ORDER.map((value) => ({
    value,
    label: strings.meal.periods[value],
  }));

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

function candidateToFoodItem(c: FoodCandidate): FoodItem {
  return {
    id: -1,
    name: c.label,
    category: null,
    referencePortion: null,
    unit: c.unit ?? 'g',
    calories: c.kcalPer100 ?? null,
    proteinG: c.proteinG ?? null,
    carbsG: c.carbsG ?? null,
    fatG: c.fatG ?? null,
    fiberG: c.fiberG ?? null,
    source: 'taco',
  };
}

function refPortionShortcut(item: FoodItem): { label: string; value: number } | null {
  const m = item.referencePortion?.match(/\((\d+(?:[.,]\d+)?)\s*(g|ml)\)/);
  if (!m) return null;
  const value = parseDecimalBR(m[1]);
  if (value === null || value <= 0 || value === 100) return null;
  return { label: item.referencePortion!, value };
}

const UNIT_OPTIONS: { value: PortionUnit; label: string }[] = [
  { value: 'g', label: 'g' },
  { value: 'ml', label: 'ml' },
];

function fmtKcal(v: number | null): string {
  return v !== null ? `${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kcal` : '—';
}

function fmtFiber(v: number | null | undefined): string | null {
  return v != null ? `Fib ${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} g` : null;
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
  const [manualUnit, setManualUnit] = useState<PortionUnit>('g');
  const [manualBase, setManualBase] = useState<FoodItem | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupNote, setLookupNote] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanCandidates, setScanCandidates] = useState<FoodCandidate[]>([]);
  const [candPortions, setCandPortions] = useState<Record<string, string>>({});
  const [describeText, setDescribeText] = useState('');
  const [describing, setDescribing] = useState(false);
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
  const plateFiber = plate.reduce((acc, i) => acc + (i.fiberG ?? 0), 0);

  function pushToPlate(item: PlateItem) {
    setPlate((p) => [...p, item]);
    setPlateSaved(false);
  }

  function addSelectedToPlate() {
    if (!selected || portion === null || portion <= 0) return;
    pushToPlate({
      name: selected.name,
      grams: portion,
      unit: selected.unit,
      calories: scaled(selected.calories, portion),
      proteinG: scaled(selected.proteinG, portion),
      carbsG: scaled(selected.carbsG, portion),
      fatG: scaled(selected.fatG, portion),
      fiberG: scaled(selected.fiberG, portion),
      origin: 'manual',
    });
    setSelected(null);
    setQuery('');
    setPortionStr('100');
  }

  async function addManualToPlate() {
    if (!manualName.trim() || manualGrams === null || manualGrams <= 0) return;
    let base: Pick<FoodItem, 'calories' | 'proteinG' | 'carbsG' | 'fatG' | 'fiberG'> | null =
      manualBase;
    let unit = manualUnit;
    setLookupNote(false);
    if (!base && !scanLocked && !lookingUp) {
      setLookingUp(true);
      const info = await lookupFoodInfo(manualName.trim()).catch(() => null);
      setLookingUp(false);
      if (info) {
        base = {
          calories: info.kcalPer100,
          proteinG: info.proteinG,
          carbsG: info.carbsG,
          fatG: info.fatG,
          fiberG: info.fiberG,
        };
        if (info.unit === 'ml' || info.unit === 'g') unit = info.unit;
        setLookupNote(true);
      }
    }
    pushToPlate({
      name: manualName.trim(),
      grams: manualGrams,
      unit,
      calories: base ? scaled(base.calories, manualGrams) : null,
      proteinG: base ? scaled(base.proteinG, manualGrams) : null,
      carbsG: base ? scaled(base.carbsG, manualGrams) : null,
      fatG: base ? scaled(base.fatG, manualGrams) : null,
      fiberG: base ? scaled(base.fiberG, manualGrams) : null,
      origin: 'manual',
    });
    setManualName('');
    setManualWeightStr('');
    setManualUnit('g');
  }

  async function addPlateToMeal() {
    if (plate.length === 0 || !at) return;
    for (const item of plate) {
      await addFoodLog(db, {
        name: item.name,
        portionGrams: item.grams,
        portionUnit: item.unit,
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
      const small = await manipulateAsync(
        picked.assets[0].uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.7, format: SaveFormat.JPEG },
      ).catch(() => null);
      const result = await getVisionProvider().recognizeFood(small?.uri ?? picked.assets[0].uri);
      showCandidates(result.candidates);
    } catch (e) {
      setScanError(e instanceof Error ? e.message : strings.meal.scanFailed);
    } finally {
      setScanning(false);
    }
  }

  function showCandidates(cands: FoodCandidate[]) {
    setScanCandidates(cands);
    setCandPortions(
      Object.fromEntries(cands.map((c) => [c.label, String(Math.round(c.portionGrams ?? 100))])),
    );
  }

  async function addCandidateToPlate(c: FoodCandidate) {
    const grams = parseDecimalBR(candPortions[c.label] ?? '');
    if (grams === null || grams <= 0) return;
    const matches = await searchFoods(db, c.label);
    const base = matches[0] ?? candidateToFoodItem(c);
    pushToPlate({
      name: matches[0]?.name ?? c.label,
      grams,
      unit: matches[0]?.unit ?? c.unit ?? 'g',
      calories: scaled(base.calories, grams),
      proteinG: scaled(base.proteinG, grams),
      carbsG: scaled(base.carbsG, grams),
      fatG: scaled(base.fatG, grams),
      fiberG: scaled(base.fiberG, grams),
      origin: 'scan',
    });
    setScanCandidates((cs) => cs.filter((x) => x.label !== c.label));
  }

  async function addAllCandidates() {
    for (const c of scanCandidates) await addCandidateToPlate(c);
  }

  async function interpretMeal() {
    setScanError(null);
    setScanCandidates([]);
    setDescribing(true);
    try {
      const cands = await describeMeal(describeText);
      if (cands.length === 0) setScanError(strings.meal.describe.failed);
      else showCandidates(cands);
    } catch {
      setScanError(strings.meal.describe.failed);
    } finally {
      setDescribing(false);
    }
  }

  function candidatesList() {
    if (scanCandidates.length === 0) return null;
    return (
      <View style={{ gap: spacing.sm }}>
        <AppText variant="title">{strings.meal.scanPick}</AppText>
        {scanCandidates.map((c) => {
          const grams = parseDecimalBR(candPortions[c.label] ?? '');
          const kcal =
            c.kcalPer100 != null && grams !== null && grams > 0
              ? scaled(c.kcalPer100, grams)
              : null;
          return (
            <Card key={c.label} style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <AppText variant="title" style={{ flex: 1 }}>
                  {c.label}
                </AppText>
                <AppText variant="caption" muted>
                  {Math.round(c.confidence * 100)}% {strings.meal.scanConfidence}
                </AppText>
              </View>
              <NumberField
                label={strings.meal.portionLabel}
                value={candPortions[c.label] ?? ''}
                onChangeText={(t) => setCandPortions((p) => ({ ...p, [c.label]: t }))}
                suffix={c.unit ?? 'g'}
              />
              {kcal != null ? (
                <AppText variant="caption" muted>{`~${Math.round(kcal)} kcal`}</AppText>
              ) : null}
              <Button label={strings.meal.addToPlate} onPress={() => addCandidateToPlate(c)} />
            </Card>
          );
        })}
        {scanCandidates.length > 1 ? (
          <Button label={strings.meal.scanAddAll} onPress={addAllCandidates} />
        ) : null}
      </View>
    );
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
  const dayFiber = dayList.reduce((acc, f) => acc + (f.fiberG ?? 0), 0);

  return (
    <Screen>
      <AppText variant="display">{strings.meal.title}</AppText>
      <Card style={{ gap: spacing.md }}>
        <AppText variant="caption" muted>
          {strings.meal.periodLabel}
        </AppText>
        <SegmentedChips
          options={periodOptions()}
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
          if ((v === 'scan' || v === 'describe') && scanLocked) {
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
                {selected.carbsG ?? '—'} g · G {selected.fatG ?? '—'} g · Fib{' '}
                {selected.fiberG ?? '—'} g (
                {strings.meal.per100.replace('{unit}', selected.unit)})
              </AppText>
              <NumberField
                label={strings.meal.portionLabel}
                value={portionStr}
                onChangeText={setPortionStr}
                suffix={selected.unit}
              />
              {refPortionShortcut(selected) ? (
                <Button
                  label={refPortionShortcut(selected)!.label}
                  variant="secondary"
                  onPress={() => setPortionStr(String(refPortionShortcut(selected)!.value))}
                />
              ) : null}
              {portion !== null && portion > 0 ? (
                <AppText>
                  {scaled(selected.calories, portion) ?? '—'} kcal · P{' '}
                  {scaled(selected.proteinG, portion) ?? '—'} g · C{' '}
                  {scaled(selected.carbsG, portion) ?? '—'} g · G{' '}
                  {scaled(selected.fatG, portion) ?? '—'} g · Fib{' '}
                  {scaled(selected.fiberG, portion) ?? '—'} g
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
          {candidatesList()}
        </Card>
      ) : mode === 'describe' ? (
        <Card style={{ gap: spacing.md }}>
          <Input
            label={strings.meal.describe.tab}
            value={describeText}
            onChangeText={setDescribeText}
            placeholder={strings.meal.describe.hint}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <Button
            label={strings.meal.describe.button}
            onPress={interpretMeal}
            disabled={describeText.trim().length < 3 || describing}
          />
          {describing ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <ActivityIndicator />
              <AppText muted>{strings.meal.describe.loading}</AppText>
            </View>
          ) : null}
          {scanError ? (
            <AppText variant="caption" muted>
              {scanError}
            </AppText>
          ) : null}
          {candidatesList()}
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
            suffix={manualUnit}
            placeholder="0"
          />
          <SegmentedChips
            options={UNIT_OPTIONS}
            value={manualUnit}
            onChange={setManualUnit}
          />
          {manualBase ? (
            <AppText variant="caption" muted>
              {strings.meal.baseLabel}: {manualBase.name} · {manualBase.calories ?? '—'} kcal{' '}
              {strings.meal.per100.replace('{unit}', manualBase.unit)}
            </AppText>
          ) : manualName.trim().length >= 2 ? (
            <AppText variant="caption" muted>
              {scanLocked ? strings.meal.noBase : strings.meal.noBaseWillLookup}
            </AppText>
          ) : null}
          {lookingUp ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <ActivityIndicator />
              <AppText variant="caption" muted>
                {strings.meal.lookupSearching}
              </AppText>
            </View>
          ) : null}
          {lookupNote ? (
            <AppText variant="caption" muted>
              {strings.meal.lookupNote}
            </AppText>
          ) : null}
          {manualBase && manualGrams !== null && manualGrams > 0 ? (
            <AppText>
              {fmtKcal(scaled(manualBase.calories, manualGrams))} · P{' '}
              {scaled(manualBase.proteinG, manualGrams) ?? '—'} g · C{' '}
              {scaled(manualBase.carbsG, manualGrams) ?? '—'} g · G{' '}
              {scaled(manualBase.fatG, manualGrams) ?? '—'} g · Fib{' '}
              {scaled(manualBase.fiberG, manualGrams) ?? '—'} g
            </AppText>
          ) : null}
          <Button
            label={strings.meal.addToPlate}
            onPress={addManualToPlate}
            disabled={!manualName.trim() || manualGrams === null || manualGrams <= 0 || lookingUp}
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
              subtitle={
                [item.grams !== null ? `${item.grams} ${item.unit}` : null, fmtFiber(item.fiberG)]
                  .filter(Boolean)
                  .join(' · ') || undefined
              }
              right={fmtKcal(item.calories)}
              onDelete={() => setPlate((p) => p.filter((_, i) => i !== index))}
            />
          ))}
          <AppText>
            {strings.meal.plateTotal}: {fmtKcal(plateKcal)}
            {plateFiber > 0 ? ` · ${fmtFiber(plateFiber)}` : ''}
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
                  subtitle={
                    [
                      f.portionGrams ? `${f.portionGrams} ${f.portionUnit ?? 'g'}` : null,
                      fmtFiber(f.fiberG),
                    ]
                      .filter(Boolean)
                      .join(' · ') || undefined
                  }
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
            {dayFiber > 0 ? ` · ${fmtFiber(dayFiber)}` : ''}
          </AppText>
        </Card>
      ) : null}
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
