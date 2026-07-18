import type { BodyReport } from '@/features/report/bodyReport';
import { strings } from '@/i18n/pt-BR';
import {
  bandZones,
  bmiZones,
  componentBandKg,
  fatMassZones,
  fatPctZones,
  idealWeightBounds,
  subcutaneousZones,
  visceralZones,
  ZONE,
  type GaugeSpec,
} from './bodyBands';

const B = strings.bodyData;
const L = strings.gauge;

/** Lista de medidores do box "Dados corporais" (e do relatório), a partir do
 *  relatório corporal já montado. Só entram itens com valor. */
export function buildBodyGauges(report: BodyReport): GaugeSpec[] {
  const sex = report.sex;
  const h = report.heightCm;
  const c = report.composition;
  const ind = report.indicators;

  const specs: GaugeSpec[] = [
    {
      key: 'weight',
      label: B.weight,
      unit: 'kg',
      value: report.weightKg,
      digits: 1,
      zones: bandZones(idealWeightBounds(h), 'high'),
    },
    { key: 'bmi', label: B.bmi, unit: '', value: report.bmi.value, digits: 1, zones: bmiZones() },
    {
      key: 'fatPct',
      label: B.fatPct,
      unit: '%',
      value: report.fatPct?.value ?? null,
      digits: 1,
      zones: fatPctZones(sex),
    },
    {
      key: 'fatKg',
      label: B.fatKg,
      unit: 'kg',
      value: c.fatKg.value,
      digits: 1,
      zones: fatMassZones(sex, h),
    },
    {
      key: 'muscle',
      label: B.muscle,
      unit: 'kg',
      value: c.muscleKg.value,
      digits: 1,
      zones: bandZones(componentBandKg(sex, h, 'muscle'), 'excellent'),
    },
    {
      key: 'skeletal',
      label: B.skeletal,
      unit: 'kg',
      value: c.skeletalKg.value,
      digits: 1,
      zones: bandZones(componentBandKg(sex, h, 'skeletal'), 'excellent'),
    },
    {
      key: 'protein',
      label: B.protein,
      unit: 'kg',
      value: c.proteinKg.value,
      digits: 1,
      zones: bandZones(componentBandKg(sex, h, 'protein'), 'excellent'),
    },
    {
      key: 'water',
      label: B.water,
      unit: 'kg',
      value: c.waterKg.value,
      digits: 1,
      zones: bandZones(componentBandKg(sex, h, 'water'), 'excellent'),
    },
    {
      key: 'bone',
      label: B.bone,
      unit: 'kg',
      value: c.boneKg.value,
      digits: 1,
      zones: bandZones(componentBandKg(sex, h, 'bone'), 'excellent'),
    },
    {
      key: 'visceral',
      label: B.visceral,
      unit: '',
      value: ind.visceralFat,
      digits: 0,
      zones: visceralZones(),
    },
    {
      key: 'subcutaneous',
      label: B.subcutaneous,
      unit: '%',
      value: ind.subcutaneousPct,
      digits: 1,
      zones: subcutaneousZones(sex),
    },
    {
      key: 'bmr',
      label: B.bmr,
      unit: 'kcal',
      value: ind.bmrKcal,
      digits: 0,
      zones: [
        { to: ind.bmrKcal, label: L.low, color: ZONE.low },
        { to: null, label: L.standard, color: ZONE.ok },
      ],
    },
  ];

  if (ind.bodyAge !== null && report.age !== null) {
    specs.push({
      key: 'metAge',
      label: B.metAge,
      unit: B.yearsSuffix,
      value: ind.bodyAge,
      digits: 0,
      zones: [
        { to: report.age, label: L.excellent, color: ZONE.good },
        { to: null, label: L.high, color: ZONE.warn },
      ],
    });
  }

  return specs.filter((s) => s.value !== null);
}
