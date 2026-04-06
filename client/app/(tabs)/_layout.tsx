import { Tabs } from "expo-router";
import { Text, StyleSheet } from "react-native";

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#E8E6E1",
        tabBarInactiveTintColor: "#555555",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="H" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="S" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="⚙" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#111111",
    borderTopColor: "#1E1E1E",
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 24,
  },
  tabLabel: {
    fontSize: 18,
    color: "#555555",
    fontWeight: "300",
  },
  tabLabelActive: {
    color: "#E8E6E1",
  },
});
