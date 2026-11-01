import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../../components/ui";
const icons = {
  index: "grid-outline",
  explore: "compass-outline",
  record: "radio-button-on-outline",
  activities: "stats-chart-outline",
  profile: "person-outline",
} as const;
export default function TabLayout() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: c.bg },
        headerTintColor: c.text,
        headerTitle: "STRAVAKINDA",
        headerTitleStyle: { fontSize: 14, fontWeight: "800", letterSpacing: 3 },
        tabBarStyle: {
          backgroundColor: c.bg,
          borderTopColor: c.border,
          height: 80,
          paddingTop: 8,
          paddingBottom: 16,
        },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
        tabBarIcon: ({ focused, size }) => (
          <Ionicons
            name={icons[route.name as keyof typeof icons]}
            color={focused ? c.accent : c.muted}
            size={size}
          />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="record" options={{ title: "Record" }} />
      <Tabs.Screen name="activities" options={{ title: "Activities" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
