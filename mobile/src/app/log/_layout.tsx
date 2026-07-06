import { Stack } from 'expo-router';

export default function LogLayout() {
  return <Stack screenOptions={{ presentation: 'modal', headerShown: false }} />;
}
