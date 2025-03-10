import { useIsFocused, useRoute } from "@react-navigation/native";
import React, { useContext, useCallback } from "react";
import { Dimensions, Animated, StatusBar, FlatList, FlatListProps } from "react-native";
import SafeAreaView from "../SafeAreaView";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";
import AnimatedProps = Animated.AnimatedProps;

function CollapsibleHeaderFlatList<T>({
  children,
  contentContainerStyle,
  ...otherProps
}: AnimatedProps<FlatListProps<T>>) {
  const { scrollY, onGetRef, syncScrollOffset, tabBarHeight, headerHeight } = useContext(
    WalletTabNavigatorScrollContext,
  );
  const windowHeight = Dimensions.get("window").height;
  const route = useRoute();
  const isFocused = useIsFocused();

  const onMomentumScrollEnd = useCallback(() => {
    syncScrollOffset(route.name);
  }, [route.name, syncScrollOffset]);

  return (
    <SafeAreaView isFlex>
      <Animated.FlatList<T>
        {...otherProps}
        scrollToOverflowEnabled={true}
        ref={(ref: FlatList) => onGetRef({ key: route.name, value: ref })}
        scrollEventThrottle={16}
        onScroll={
          isFocused
            ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                useNativeDriver: true,
              })
            : undefined
        }
        onScrollEndDrag={onMomentumScrollEnd}
        onMomentumScrollEnd={onMomentumScrollEnd}
        contentContainerStyle={[
          {
            paddingTop: headerHeight,
            minHeight: windowHeight + (StatusBar.currentHeight || 0),
            paddingBottom: tabBarHeight + (StatusBar.currentHeight || 0),
          },
          contentContainerStyle,
        ]}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </Animated.FlatList>
    </SafeAreaView>
  );
}

export default CollapsibleHeaderFlatList;
