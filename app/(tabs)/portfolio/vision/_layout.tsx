import { Stack } from "expo-router";

export default function VisionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create-goal" />
      <Stack.Screen name="scenarios" />
      <Stack.Screen name="goal/[id]" />
    </Stack>
  );
}
