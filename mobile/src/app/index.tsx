import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useOnboarding } from '@/features/onboarding/useOnboarding';

export default function Index() {
  const { loading, accepted } = useOnboarding();
  if (loading) return <View />;
  return accepted ? <View /> : <Redirect href="/onboarding" />;
}
