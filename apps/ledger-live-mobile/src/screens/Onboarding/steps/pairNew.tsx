import React, { useCallback, useMemo, memo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { NavigatorName, ScreenName } from "~/const";
import BaseStepperView, { PairNew, ConnectNano } from "./setupDevice/scenes";
import { TrackScreen } from "~/analytics";
import SeedWarning from "../shared/SeedWarning";
import Illustration from "~/images/illustration/Illustration";
import { completeOnboarding, setHasBeenRedirectedToPostOnboarding } from "~/actions/settings";
import { useNavigationInterceptor } from "../onboardingContext";
import useNotifications from "~/logic/notifications";
import {
  RootComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { BaseOnboardingNavigatorParamList } from "~/components/RootNavigator/types/BaseOnboardingNavigator";
import { Step } from "./setupDevice/scenes/BaseStepperView";

const images = {
  light: {
    Intro: require("~/images/illustration/Light/_076.png"),
  },
  dark: {
    Intro: require("~/images/illustration/Dark/_076.png"),
  },
};

type Metadata = {
  id: string;
  illustration: JSX.Element | null;
  drawer: null | { route: string; screen: string };
};

type NavigationProps = RootComposite<
  StackNavigatorProps<OnboardingNavigatorParamList, ScreenName.OnboardingPairNew>
>;

const scenes = [PairNew, ConnectNano] as Step[];

export default memo(function () {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const route = useRoute<NavigationProps["route"]>();

  const dispatch = useDispatch();
  const { triggerJustFinishedOnboardingNewDevicePushNotificationModal } = useNotifications();
  const { resetCurrentStep } = useNavigationInterceptor();

  const { deviceModelId, showSeedWarning, next, isProtectFlow } = route.params;

  const metadata: Array<Metadata> = useMemo(
    () => [
      {
        id: PairNew.id,
        illustration: (
          <Illustration
            size={150}
            darkSource={images.dark.Intro}
            lightSource={images.light.Intro}
          />
        ),
        drawer: {
          route: ScreenName.OnboardingBluetoothInformation,
          screen: ScreenName.OnboardingBluetoothInformation,
        },
      },
      {
        id: ConnectNano.id,
        illustration: null,
        drawer: isProtectFlow
          ? {
              route: ScreenName.OnboardingProtectionConnectionInformation,
              screen: ScreenName.OnboardingProtectionConnectionInformation,
            }
          : {
              route: ScreenName.OnboardingBluetoothInformation,
              screen: ScreenName.OnboardingBluetoothInformation,
            },
      },
    ],
    [isProtectFlow],
  );

  const onFinish = useCallback(() => {
    if (next && deviceModelId) {
      // only used for protect for now
      navigation.navigate(next, {
        deviceModelId,
      });
      return;
    }
    dispatch(completeOnboarding());
    resetCurrentStep();

    const parentNav =
      navigation.getParent<
        StackNavigatorNavigation<BaseOnboardingNavigatorParamList, NavigatorName.Onboarding>
      >();
    if (parentNav) {
      parentNav.popToTop();
    }

    navigation.replace(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });

    dispatch(setHasBeenRedirectedToPostOnboarding(false));

    triggerJustFinishedOnboardingNewDevicePushNotificationModal();
  }, [
    dispatch,
    resetCurrentStep,
    navigation,
    deviceModelId,
    triggerJustFinishedOnboardingNewDevicePushNotificationModal,
    next,
  ]);

  const nextPage = useCallback(() => {
    onFinish();
  }, [onFinish]);

  return (
    <>
      <TrackScreen category="Onboarding" name="PairNew" />
      <BaseStepperView
        onNext={nextPage}
        steps={scenes}
        metadata={metadata}
        deviceModelId={deviceModelId}
      />
      {showSeedWarning && deviceModelId ? <SeedWarning deviceModelId={deviceModelId} /> : null}
    </>
  );
});
