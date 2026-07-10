import type { NavigatorScreenParams } from "@react-navigation/native";

export type TabsParamList = {
  Home: undefined;
  Menu: undefined;
  Shop: undefined;
  Cart: undefined;
  Orders: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabsParamList>;
  OrderDetail: { id: string; placed?: boolean };
  AdminDashboard: undefined;
  AdminOrders: undefined;
  AdminMenu: undefined;
  AdminProducts: undefined;
  AdminUsers: undefined;
  Pos: undefined;
};
