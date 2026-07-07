import { Pressable, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { AppText } from '@/design/components';
import { fonts, spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { strings } from '@/i18n/pt-BR';
import { INJECTION_SITES, InjectionSite } from './rotation';

interface Props {
  value: InjectionSite | null;
  onChange: (site: InjectionSite) => void;
  lastSite: InjectionSite | null;
  suggested: InjectionSite | null;
}

const W = 200;
const H = 290;

// Vista em espelho (como você se vê): lado esquerdo do corpo à esquerda da tela.
const POS: Record<InjectionSite, { x: number; y: number }> = {
  abdomen_sup_e: { x: 88, y: 100 },
  abdomen_sup_d: { x: 112, y: 100 },
  abdomen_meio_e: { x: 88, y: 122 },
  abdomen_meio_d: { x: 112, y: 122 },
  abdomen_inf_e: { x: 88, y: 144 },
  abdomen_inf_d: { x: 112, y: 144 },
  braco_e: { x: 52, y: 70 },
  braco_d: { x: 148, y: 70 },
  coxa_e: { x: 84, y: 198 },
  coxa_d: { x: 116, y: 198 },
};

// Contorno único do corpo (braços abertos, pernas com vão), estilo linha fina.
const BODY_OUTLINE =
  'M 80 52 L 32 72 A 7 7 0 0 1 38 86 L 76 70 L 76 150 L 68 256 A 8 8 0 0 1 84 258 ' +
  'L 96 168 L 104 168 L 116 258 A 8 8 0 0 1 132 256 L 124 150 L 124 70 L 162 86 ' +
  'A 7 7 0 0 1 168 72 L 120 52 Q 100 44 80 52 Z';

function LegendDot({ color, dashed, label }: { color: string; dashed?: boolean; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: color,
          borderStyle: dashed ? 'dashed' : 'solid',
        }}
      />
      <AppText variant="caption" muted>
        {label}
      </AppText>
    </View>
  );
}

/** Bonequinho com os pontos de aplicação: toque em uma bolinha para escolher. */
export function BodyMapPicker({ value, onChange, lastSite, suggested }: Props) {
  const { colors } = useTheme();
  const outline = {
    stroke: colors.textMuted,
    strokeWidth: 3,
    fill: 'none' as const,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
  };

  return (
    <View style={{ alignItems: 'center', gap: spacing.sm }}>
      <View style={{ width: W, height: H }}>
        <Svg width={W} height={H}>
          <Circle cx={100} cy={26} r={16} {...outline} />
          <Path d={BODY_OUTLINE} {...outline} />
        </Svg>
        {INJECTION_SITES.map((site) => {
          const p = POS[site];
          const isSelected = site === value;
          const isSuggested = site === suggested;
          const isLast = site === lastSite;
          return (
            <Pressable
              key={site}
              accessibilityRole="button"
              accessibilityLabel={strings.dose.sites[site]}
              onPress={() => onChange(site)}
              hitSlop={8}
              style={{
                position: 'absolute',
                left: p.x - 9,
                top: p.y - 9,
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: isSelected ? colors.primary : colors.surface,
                borderWidth: 2,
                borderColor: isSelected
                  ? colors.primary
                  : isSuggested
                    ? colors.primary
                    : isLast
                      ? colors.warning
                      : colors.textMuted,
                borderStyle: isSuggested && !isSelected ? 'dashed' : 'solid',
              }}
            />
          );
        })}
      </View>
      <AppText style={{ fontFamily: fonts.semibold }}>
        {value ? strings.dose.sites[value] : strings.dose.siteLabel}
      </AppText>
      <View style={{ flexDirection: 'row', gap: spacing.lg }}>
        <LegendDot color={colors.primary} dashed label={strings.dose.suggestedLabel} />
        {lastSite ? <LegendDot color={colors.warning} label={strings.dose.lastSiteLabel} /> : null}
      </View>
    </View>
  );
}
