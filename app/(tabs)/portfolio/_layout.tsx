import { Stack } from "expo-router";

export default function PortfolioLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="savings" />
      <Stack.Screen name="loans" />
      <Stack.Screen name="upcoming-bills" />
    </Stack>
  );
}