import type { PaidPlan, PlanPrices, PurchasesProvider } from './PurchasesProvider';

const ENTITLEMENT_ID = 'premium';

interface RcPackage {
  identifier: string;
  packageType: string;
  product: { priceString: string };
}

interface RcModule {
  default: {
    configure(opts: { apiKey: string }): void;
    getOfferings(): Promise<{ current: { availablePackages: RcPackage[] } | null }>;
    purchasePackage(pkg: RcPackage): Promise<{
      customerInfo: { entitlements: { active: Record<string, unknown> } };
    }>;
    restorePurchases(): Promise<{ entitlements: { active: Record<string, unknown> } }>;
  };
}

/** Assinaturas via loja (App Store/Play) — carregado só quando há chave configurada. */
export class RevenueCatProvider implements PurchasesProvider {
  private configured = false;

  constructor(private apiKey: string) {}

  private rc(): RcModule['default'] {
    const mod = require('react-native-purchases') as RcModule;
    if (!this.configured) {
      mod.default.configure({ apiKey: this.apiKey });
      this.configured = true;
    }
    return mod.default;
  }

  private async findPackage(plan: PaidPlan): Promise<RcPackage | null> {
    const offerings = await this.rc().getOfferings();
    const packages = offerings.current?.availablePackages ?? [];
    const wanted = plan === 'monthly' ? 'MONTHLY' : 'ANNUAL';
    return packages.find((p) => p.packageType === wanted) ?? null;
  }

  async getPrices(): Promise<PlanPrices> {
    try {
      const [monthly, annual] = await Promise.all([
        this.findPackage('monthly'),
        this.findPackage('annual'),
      ]);
      return {
        monthly: monthly?.product.priceString ?? null,
        annual: annual?.product.priceString ?? null,
      };
    } catch {
      return { monthly: null, annual: null };
    }
  }

  async purchase(plan: PaidPlan): Promise<boolean> {
    const pkg = await this.findPackage(plan);
    if (!pkg) throw new Error('plan-unavailable');
    const result = await this.rc().purchasePackage(pkg);
    return Boolean(result.customerInfo.entitlements.active[ENTITLEMENT_ID]);
  }

  async restore(): Promise<boolean> {
    const info = await this.rc().restorePurchases();
    return Boolean(info.entitlements.active[ENTITLEMENT_ID]);
  }
}
