import React, { useCallback, useMemo } from "react";
import { useTheme } from "styled-components/native";
import { IconsLegacy } from "@ledgerhq/native-ui";

import { BottomTabBarProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Web3HubTabNavigator from "LLM/features/Web3Hub/TabNavigator";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useManagerNavLockCallback } from "./CustomBlockRouterNavigator";
import { ScreenName, NavigatorName } from "~/const";
import { PortfolioTabIcon } from "~/screens/Portfolio";
import Transfer, { TransferTabIcon } from "../TabBar/Transfer";
import TabIcon from "../TabIcon";
import PortfolioNavigator from "./PortfolioNavigator";
import { hasOrderedNanoSelector, readOnlyModeEnabledSelector } from "~/reducers/settings";
import MyLedgerNavigator, { ManagerTabIcon } from "./MyLedgerNavigator";
import DiscoverNavigator from "./DiscoverNavigator";
import customTabBar from "../TabBar/CustomTabBar";
import { MainNavigatorParamList } from "./types/MainNavigator";
import { isMainNavigatorVisibleSelector } from "~/reducers/appstate";
import EarnLiveAppNavigator from "./EarnLiveAppNavigator";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";

const Tab = createBottomTabNavigator<MainNavigatorParamList>();

// NB The default behaviour is not reset route params, leading to always having the same
// search query or preselected tab after the first time (ie from Swap/Sell), that's why we
// override the navigation from tabs.
// https://github.com/react-navigation/react-navigation/issues/6674#issuecomment-562813152

export default function MainNavigator() {
  const { colors } = useTheme();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);
  const isMainNavigatorVisible = useSelector(isMainNavigatorVisibleSelector);
  const managerNavLockCallback = useManagerNavLockCallback();
  const web3hub = useFeature("web3hub");
  const earnYiedlLabel = getStakeLabelLocaleBased();
  const insets = useSafeAreaInsets();
  const tabBar = useMemo(
    () =>
      ({ ...props }: BottomTabBarProps): JSX.Element =>
        customTabBar({
          ...props,
          colors,
          insets,
          hideTabBar: !isMainNavigatorVisible,
        }),
    [colors, insets, isMainNavigatorVisible],
  );

  const managerLockAwareCallback = useCallback(
    (callback: () => void) => {
      // NB This is conditionally going to show the confirmation modal from the manager
      // in the event of having ongoing installs/uninstalls.
      managerNavLockCallback ? managerNavLockCallback(() => callback) : callback();
    },
    [managerNavLockCallback],
  );

  return (
    <Tab.Navigator
      tabBar={tabBar}
      screenOptions={{
        tabBarStyle: [
          {
            height: 300,
            borderTopColor: colors.neutral.c30,
            borderTopWidth: 1,
            elevation: 5,
            shadowColor: colors.neutral.c30,
            backgroundColor: colors.opacityDefault.c10,
          },
        ],
        unmountOnBlur: true, // Nb prevents ghost device interactions
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.palette.primary.c80,
        tabBarInactiveTintColor: colors.palette.neutral.c70,
        headerShown: false,
      }}
      sceneContainerStyle={[{ backgroundColor: colors.background.main }]}
    >
      <Tab.Screen
        name={NavigatorName.Portfolio}
        component={PortfolioNavigator}
        options={{
          headerShown: false,
          unmountOnBlur: true,
          tabBarIcon: props => <PortfolioTabIcon {...props} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            managerLockAwareCallback(() => {
              navigation.navigate(NavigatorName.Portfolio, {
                screen: ScreenName.Portfolio,
              });
            });
          },
        })}
      />
      <Tab.Screen
        name={NavigatorName.Earn}
        component={EarnLiveAppNavigator}
        options={{
          headerShown: false,
          unmountOnBlur: true,
          tabBarIcon: props => (
            <TabIcon
              Icon={IconsLegacy.LendMedium}
              i18nKey={earnYiedlLabel}
              testID="tab-bar-earn"
              {...props}
            />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            managerLockAwareCallback(() => {
              navigation.navigate(NavigatorName.Earn, {
                screen: ScreenName.Earn,
              });
            });
          },
        })}
      />

      <Tab.Screen
        name={ScreenName.Transfer}
        component={Transfer}
        options={{
          headerShown: false,
          tabBarIcon: () => <TransferTabIcon />,
        }}
      />
      {web3hub?.enabled ? (
        <Tab.Screen
          name={NavigatorName.Web3HubTab}
          component={Web3HubTabNavigator}
          options={{
            headerShown: false,
            tabBarIcon: props => (
              <TabIcon Icon={IconsLegacy.PlanetMedium} i18nKey="tabs.discover" {...props} />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: e => {
              e.preventDefault();
              managerLockAwareCallback(() => {
                navigation.navigate(NavigatorName.Web3HubTab);
              });
            },
          })}
        />
      ) : (
        <Tab.Screen
          name={NavigatorName.Discover}
          component={DiscoverNavigator}
          options={{
            headerShown: false,
            tabBarIcon: props => (
              <TabIcon Icon={IconsLegacy.PlanetMedium} i18nKey="tabs.discover" {...props} />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: e => {
              e.preventDefault();
              managerLockAwareCallback(() => {
                navigation.navigate(NavigatorName.Discover, {
                  screen: ScreenName.DiscoverScreen,
                });
              });
            },
          })}
        />
      )}
      <Tab.Screen
        name={NavigatorName.MyLedger}
        component={MyLedgerNavigator}
        options={{
          tabBarIcon: props => <ManagerTabIcon {...props} />,
          tabBarTestID: "TabBarManager",
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            managerLockAwareCallback(() => {
              if (readOnlyModeEnabled && hasOrderedNano) {
                navigation.navigate(ScreenName.PostBuyDeviceSetupNanoWallScreen);
              } else if (readOnlyModeEnabled) {
                navigation.navigate(NavigatorName.BuyDevice);
              } else {
                navigation.navigate(NavigatorName.MyLedger, {
                  screen: ScreenName.MyLedgerChooseDevice,
                  params: {
                    tab: undefined,
                    searchQuery: undefined,
                    updateModalOpened: undefined,
                  },
                });
              }
            });
          },
        })}
      />
    </Tab.Navigator>
  );
}
