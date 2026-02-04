import { Tabs } from "expo-router";
import CustomTabBar from "../../src/components/QSTabBar"; // Trigger reload

export default function RootLayout() {
  return (
    <Tabs
      tabBar={(props) => {
        const { key, ...rest } = props;
        return <CustomTabBar key={key} {...rest} />;
      }}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarLabel: "Home",
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarLabel: "Analytics",
        }}
      />

      <Tabs.Screen
        name="accounts"
        options={{
          title: "Accounts",
          tabBarLabel: "Accounts",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
        }}
      />
    </Tabs>
  );
}
