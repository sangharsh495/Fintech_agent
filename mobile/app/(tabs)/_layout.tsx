import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { StyleSheet } from "react-native"
import { Colors, Spacing, Typography, BorderRadius, Shadows, Animation, ComponentSizes, PremiumEffects } from "../../lib/design-system"

const TAB_ICON_SIZE = 24
const TAB_LABEL_SIZE = 10

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
          paddingBottom: Spacing.sm,
          paddingTop: Spacing.xs,
          height: ComponentSizes.tabBar.mobile,
          position: "absolute",
          bottom: 0,
          left: Spacing.screenPaddingHorizontal,
          right: Spacing.screenPaddingHorizontal,
          borderRadius: BorderRadius.xl,
          marginBottom: Spacing.md,
          marginHorizontal: Spacing.screenPaddingHorizontal,
          ...Shadows.xl,
        },
        tabBarLabelStyle: {
          fontSize: TAB_LABEL_SIZE,
          fontWeight: "600",
          fontFamily: Typography.fontFamilies.semibold,
          marginTop: Spacing.xs,
        },
        tabBarIndicatorStyle: {
          backgroundColor: "transparent",
        },
        tabBarItemStyle: {
          paddingVertical: Spacing.xs,
        },
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: "700", fontFamily: Typography.fontFamilies.bold },
        animation: "slide_from_right",
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

// Premium floating tab bar alternative (if you want to use it instead)
export function PremiumTabBar({ state, descriptors, navigation }) {
  const { colors } = PremiumEffects.gradients
  const focusedOptions = descriptors[state.routes[state.index]].options

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const focused = index === state.index
          const { tabBarIcon, tabBarLabel } = route.options || {}
          const color = focused ? Colors.primary : Colors.textTertiary

          return (
            <TouchableOpacity
              key={route.key}
              style={[
                styles.tabItem,
                focused && styles.tabItemFocused,
              ]}
              onPress={() => navigation.navigate(route.name)}
              activeOpacity={0.8}
            >
              {tabBarIcon && (
                <Animated.View
                  style={[
                    styles.iconWrapper,
                    focused && styles.iconWrapperFocused,
                  ]}
                >
                  <tabBarIcon({ color, focused, size: TAB_ICON_SIZE }) />
                </Animated.View>
              )}
              {tabBarLabel && (
                <Animated.Text
                  style={[
                    styles.tabLabel,
                    focused && styles.tabLabelFocused,
                    { color },
                  ]}
                >
                  {tabBarLabel}
                </Animated.Text>
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingBottom: Spacing.md,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    ...Shadows.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  tabItemFocused: {
    // Additional focused styles if needed
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  iconWrapperFocused: {
    backgroundColor: Colors.primary + "15",
  },
  tabLabel: {
    fontSize: TAB_LABEL_SIZE,
    fontWeight: "600",
    fontFamily: Typography.fontFamilies.semibold,
    color: Colors.textTertiary,
  },
  tabLabelFocused: {
    color: Colors.primary,
  },
})