import type { PaidPlan, PlanPrices, PurchasesProvider } from './PurchasesProvider';

interface RcPackage {
  identifier: string;
  packageType: string;
  product: { priceString: string };
}

interface RcEntitlements {
  active: Record<string, { productIdentifier?: string }>;
}

interface RcModule {
  default: {
    configure(opts: { apiKey: string }): void;
    getOfferings(): Promise<{ current: { availablePackages: RcPackage[] } | null }>;
    purchasePackage(pkg: RcPackage): Promise<{ customerInfo: { entitlements: RcEntitlements } }>;
    restorePurchases(): Promise<{ entitlements: RcEntitlements }>;
  };
}

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
    try {
      const result = await this.rc().purchasePackage(pkg);
      return Object.keys(result.customerInfo.entitlements.active).length > 0;
    } catch (e) {
      const err = e as {
        userCancelled?: boolean;
        readableErrorCode?: string;
        code?: string | number;
        message?: string;
        underlyingErrorMessage?: string;
      };
      if (err.userCancelled) throw new Error('cancelled');
      const label = err.readableErrorCode || String(err.code ?? 'erro');
      const extra = err.underlyingErrorMessage || err.message || '';
      throw new Error(extra ? `${label}: ${extra}` : label);
    }
  }

  private planFrom(active: RcEntitlements['active']): PaidPlan | null {
    const ent = Object.values(active)[0];
    if (!ent) return null;
    const pid = (ent.productIdentifier ?? '').toLowerCase();
    return pid.includes('annual') || pid.includes('year') ? 'annual' : 'monthly';
  }

  async restore(): Promise<PaidPlan | null> {
    const info = await this.rc().restorePurchases();
    return this.planFrom(info.entitlements.active);
  }
}
