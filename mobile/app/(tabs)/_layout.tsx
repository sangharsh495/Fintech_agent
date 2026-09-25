import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { StyleSheet } from "react-native"
import { Colors, Spacing, Typography, BorderRadius, Shadows, ComponentSizes } from "../../lib/design-system"

const TAB_ICON_SIZE = 21
const TAB_LABEL_SIZE = 9

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingBottom: Spacing.xs,
          paddingTop: Spacing.xs,
          height: ComponentSizes.tabBar.height,
          position: "absolute",
          bottom: 0,
          left: 6,
          right: 6,
          borderRadius: BorderRadius.xl,
          marginBottom: Spacing.sm,
          marginHorizontal: 4,
          ...Shadows.xl,
        },
        tabBarLabelStyle: {
          fontSize: TAB_LABEL_SIZE,
          fontWeight: "600",
          fontFamily: Typography.fontFamilies.semibold,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          paddingHorizontal: 0,
        },
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: "700", fontFamily: Typography.fontFamilies.bold },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={TAB_ICON_SIZE}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "bar-chart" : "bar-chart-outline"}
              size={TAB_ICON_SIZE}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calculators"
        options={{
          title: "Calculators",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "calculator" : "calculator-outline"}
              size={TAB_ICON_SIZE}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tax"
        options={{
          title: "Tax",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "receipt" : "receipt-outline"}
              size={TAB_ICON_SIZE}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: "AI CA",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
              size={TAB_ICON_SIZE}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: "Upload",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "cloud-upload" : "cloud-upload-outline"}
              size={TAB_ICON_SIZE}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={TAB_ICON_SIZE}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  )
}