import { Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useCart } from "../store/cart";
import { colors } from "../theme";
import type { RootStackParamList, TabsParamList } from "./types";
import { HomeScreen } from "../screens/HomeScreen";
import { MenuScreen } from "../screens/MenuScreen";
import { ShopScreen } from "../screens/ShopScreen";
import { CartScreen } from "../screens/CartScreen";
import { OrdersScreen } from "../screens/OrdersScreen";
import { OrderDetailScreen } from "../screens/OrderDetailScreen";
import { AccountScreen } from "../screens/AccountScreen";
import { AdminDashboardScreen } from "../screens/admin/AdminDashboardScreen";
import { AdminOrdersScreen } from "../screens/admin/AdminOrdersScreen";
import { AdminMenuScreen } from "../screens/admin/AdminMenuScreen";
import { AdminProductsScreen } from "../screens/admin/AdminProductsScreen";
import { AdminUsersScreen } from "../screens/admin/AdminUsersScreen";
import { PosScreen } from "../screens/admin/PosScreen";

const Tab = createBottomTabNavigator<TabsParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TAB_ICONS: Record<keyof TabsParamList, string> = {
  Home: "🏠",
  Menu: "🥤",
  Shop: "🌿",
  Cart: "🛒",
  Orders: "🧾",
  Account: "👤",
};

function TabIcon({ name, focused }: { name: keyof TabsParamList; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{TAB_ICONS[name]}</Text>
  );
}

function CartBadge() {
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  if (count === 0) return null;
  return (
    <View
      style={{
        position: "absolute",
        top: -4,
        right: -10,
        backgroundColor: colors.forest,
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
      }}
    >
      <Text style={{ color: colors.cream, fontSize: 10, fontWeight: "900" }}>{count}</Text>
    </View>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.stone400,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
        tabBarIcon: ({ focused }) => (
          <View>
            <TabIcon name={route.name} focused={focused} />
            {route.name === "Cart" && <CartBadge />}
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Menu" component={MenuScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.forest,
        headerTitleStyle: { fontWeight: "800" },
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: "Order" }} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: "Dashboard" }} />
      <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} options={{ title: "Manage Orders" }} />
      <Stack.Screen name="AdminMenu" component={AdminMenuScreen} options={{ title: "Manage Menu" }} />
      <Stack.Screen name="AdminProducts" component={AdminProductsScreen} options={{ title: "Manage Products" }} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: "Users" }} />
      <Stack.Screen name="Pos" component={PosScreen} options={{ title: "POS · Walk-in Order" }} />
    </Stack.Navigator>
  );
}
