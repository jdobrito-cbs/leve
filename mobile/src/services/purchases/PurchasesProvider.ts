import { Platform } from 'react-native';

export type PaidPlan = 'monthly' | 'annual';

export interface PlanPrices {
  monthly: string | null;
  annual: string | null;
}

export interface PurchasesProvider {
  getPrices(): Promise<PlanPrices>;
  purchase(plan: PaidPlan): Promise<boolean>;
  restore(): Promise<PaidPlan | null>;
}

class UnconfiguredPurchasesProvider implements PurchasesProvider {
  async getPrices(): Promise<PlanPrices> {
    return { monthly: null, annual: null };
  }

  async purchase(): Promise<boolean> {
    throw new Error('unconfigured');
  }

  async restore(): Promise<PaidPlan | null> {
    return null;
  }
}

function storeApiKey(): string | undefined {
  return Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
}

export function isStoreConfigured(): boolean {
  return Boolean(storeApiKey()) && Platform.OS !== 'web';
}

export function getPurchasesProvider(): PurchasesProvider {
  const apiKey = storeApiKey();
  if (apiKey && Platform.OS !== 'web') {
    const { RevenueCatProvider } =
      require('./RevenueCatProvider') as typeof import('./RevenueCatProvider');
    return new RevenueCatProvider(apiKey);
  }
  return new UnconfiguredPurchasesProvider();
}
