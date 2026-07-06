import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { parseDecimalBR } from '@/core/text';
import type { FoodItem, FoodLog } from '@/core/types';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  Input,
  ListRow,
  NumberField,
  Screen,
  SegmentedChips,
} from '@/design/components';
import { spacing } from '@/design/tokens';
import { db } from '@/db/client';
import { searchFoods } from '@/db/foodItemsRepo';
import { addFoodLog, foodForDay, kcalForDay } from '@/db/foodLogRepo';
import { strings } from '@/i18n/pt-BR';
import { Utensils } from 'lucide-react-native';

type Mode = 'search' | 'manual';

const MODE_OPTIONS = [
  { value: 'search' as Mode, label: strings.meal.searchTab },
  { value: 'manual' as Mode, label: strings.meal.manualTab },
];

function scaled(per100: number | null, portion: number): number | null {
  return per100 === null ? null : Math.round(((per100 * portion) / 100) * 10) / 10;
}

export function MealScreen() {
  const [mode, setMode] = useState<Mode>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [portionStr, setPortionStr] = useState('100');
  const [manualName, setManualName] = useState('');
  const [manualKcal, setManualKcal] = useState('');
  const [todayList, setTodayList] = useState<FoodLog[]>([]);
  const [todayKcal, setTodayKcal] = useState(0);

  const load = useCallback(async () => {
    setTodayList(await foodForDay(db, new Date()));
    setTodayKcal(await kcalForDay(db, new Date()));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  const portion = parseDecimalBR(portionStr);
  const kcalManual = parseDecimalBR(manualKcal);

  async function addFromTaco() {
    if (!selected || portion === null || portion <= 0) return;
    await addFoodLog(db, {
      name: selected.name,
      portionGrams: portion,
      calories: scaled(selected.calories, portion),
      proteinG: scaled(selected.proteinG, portion),
      carbsG: scaled(selected.carbsG, portion),
      fatG: scaled(selected.fatG, portion),
      at: new Date(),
    });
    setSelected(null);
    setQuery('');
    setPortionStr('100');
    await load();
  }

  async function addManual() {
    if (!manualName.trim() || kcalManual === null || kcalManual < 0) return;
    await addFoodLog(db, { name: manualName.trim(), calories: kcalManual, at: new Date() });
    setManualName('');
    setManualKcal('');
    await load();
  }

  return (
    <Screen>
      <AppText variant="display">{strings.meal.title}</AppText>
      <SegmentedChips options={MODE_OPTIONS} value={mode} onChange={setMode} />

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
                label={strings.meal.add}
                onPress={addFromTaco}
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
      ) : (
        <Card style={{ gap: spacing.md }}>
          <Input
            label={strings.meal.nameLabel}
            value={manualName}
            onChangeText={setManualName}
            placeholder={strings.meal.nameLabel}
          />
          <NumberField
            label={strings.meal.kcalLabel}
            value={manualKcal}
            onChangeText={setManualKcal}
            suffix="kcal"
            placeholder={strings.meal.kcalLabel}
          />
          <Button
            label={strings.meal.add}
            onPress={addManual}
            disabled={!manualName.trim() || kcalManual === null || kcalManual < 0}
          />
        </Card>
      )}

      {todayList.length > 0 ? (
        <Card>
          <AppText variant="title">{strings.meal.todayList}</AppText>
          {todayList.map((f) => (
            <ListRow
              key={f.id}
              title={f.name}
              subtitle={f.portionGrams ? `${f.portionGrams} g` : undefined}
              right={f.calories !== null ? `${f.calories} kcal` : undefined}
            />
          ))}
          <AppText muted style={{ marginTop: spacing.sm }}>
            {strings.meal.todayTotal}: {todayKcal.toLocaleString('pt-BR')} kcal
          </AppText>
        </Card>
      ) : null}
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
