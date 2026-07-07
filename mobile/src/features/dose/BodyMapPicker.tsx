import { Pressable, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
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
  abdomen_sup_e: { x: 86, y: 102 },
  abdomen_sup_d: { x: 114, y: 102 },
  abdomen_meio_e: { x: 86, y: 124 },
  abdomen_meio_d: { x: 114, y: 124 },
  abdomen_inf_e: { x: 86, y: 146 },
  abdomen_inf_d: { x: 114, y: 146 },
  braco_e: { x: 53, y: 96 },
  braco_d: { x: 147, y: 96 },
  coxa_e: { x: 86, y: 200 },
  coxa_d: { x: 114, y: 200 },
};

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
  const silhouette = { fill: colors.border, opacity: 0.45 };

  return (
    <View style={{ alignItems: 'center', gap: spacing.sm }}>
      <View style={{ width: W, height: H }}>
        <Svg width={W} height={H}>
          <Circle cx={100} cy={28} r={18} {...silhouette} />
          <Rect x={90} y={44} width={20} height={12} {...silhouette} />
          <Rect x={68} y={54} width={64} height={112} rx={24} {...silhouette} />
          <Rect x={44} y={60} width={18} height={86} rx={9} {...silhouette} />
          <Rect x={138} y={60} width={18} height={86} rx={9} {...silhouette} />
          <Rect x={75} y={162} width={22} height={112} rx={11} {...silhouette} />
          <Rect x={103} y={162} width={22} height={112} rx={11} {...silhouette} />
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
                left: p.x - 11,
                top: p.y - 11,
                width: 22,
                height: 22,
                borderRadius: 11,
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
